"""
Stripe integration for MilestoneAI escrow payments.

Flow:
  1. Employer creates project → create_payment_intent() charges their card,
     funds held in Stripe (manual capture or separate escrow account).
  2. Milestone approved → transfer_to_freelancer() sends funds to the
     freelancer's Stripe Connect account.
  3. Milestone failed  → refund_to_employer() returns funds to employer's card.
  4. Freelancer onboarding → create_connect_account() + account_link() for KYC.
"""

import os
import stripe
from typing import Optional

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

# Stripe charges in the smallest currency unit (cents for USD)
def _to_cents(amount: float) -> int:
    return int(round(amount * 100))


# ── Employer: fund a project ──────────────────────────────────────────────────

def create_payment_intent(
    amount: float,
    employer_stripe_customer_id: Optional[str],
    project_id: str,
    vault_id: str,
    currency: str = "usd",
) -> dict:
    """
    Creates a PaymentIntent for the employer to fund the escrow vault.
    capture_method='manual' means the card is authorised but NOT charged yet —
    call capture_payment_intent() once the employer confirms.
    If you want immediate charge, set capture_method='automatic'.
    """
    if not stripe.api_key or stripe.api_key.startswith("sk_test_your"):
        return _mock_payment_intent(amount, project_id, vault_id)

    intent = stripe.PaymentIntent.create(
        amount=_to_cents(amount),
        currency=currency,
        capture_method="manual",          # hold funds, don't charge yet
        customer=employer_stripe_customer_id,
        metadata={"project_id": project_id, "vault_id": vault_id},
        description=f"MilestoneAI escrow deposit — project {project_id}",
    )
    return {
        "payment_intent_id": intent.id,
        "client_secret": intent.client_secret,
        "status": intent.status,
        "amount": amount,
    }


def capture_payment_intent(payment_intent_id: str) -> dict:
    """Capture (charge) a previously authorised PaymentIntent."""
    if not stripe.api_key or stripe.api_key.startswith("sk_test_your"):
        return {"captured": True, "payment_intent_id": payment_intent_id}

    intent = stripe.PaymentIntent.capture(payment_intent_id)
    return {"captured": True, "payment_intent_id": intent.id, "status": intent.status}


# ── Freelancer: receive milestone payment ─────────────────────────────────────

def transfer_to_freelancer(
    amount: float,
    freelancer_stripe_account_id: str,
    project_id: str,
    milestone_id: str,
    currency: str = "usd",
) -> dict:
    """
    Transfers funds from the platform Stripe account to the freelancer's
    connected account. Requires the platform account to have sufficient balance
    (i.e. the employer's PaymentIntent must have been captured first).
    """
    if not stripe.api_key or stripe.api_key.startswith("sk_test_your"):
        return _mock_transfer(amount, freelancer_stripe_account_id, milestone_id)

    transfer = stripe.Transfer.create(
        amount=_to_cents(amount),
        currency=currency,
        destination=freelancer_stripe_account_id,
        metadata={
            "project_id": project_id,
            "milestone_id": milestone_id,
        },
        description=f"Milestone {milestone_id} payment",
    )
    return {
        "transfer_id": transfer.id,
        "amount": amount,
        "destination": freelancer_stripe_account_id,
        "status": "transferred",
    }


# ── Employer: refund on milestone failure ─────────────────────────────────────

def refund_to_employer(
    payment_intent_id: str,
    amount: float,
    project_id: str,
    milestone_id: str,
) -> dict:
    """
    Issues a partial or full refund on the employer's PaymentIntent.
    """
    if not stripe.api_key or stripe.api_key.startswith("sk_test_your"):
        return _mock_refund(amount, payment_intent_id, milestone_id)

    refund = stripe.Refund.create(
        payment_intent=payment_intent_id,
        amount=_to_cents(amount),
        metadata={"project_id": project_id, "milestone_id": milestone_id},
        reason="requested_by_customer",
    )
    return {
        "refund_id": refund.id,
        "amount": amount,
        "status": refund.status,
    }


# ── Freelancer onboarding (Stripe Connect) ────────────────────────────────────

def create_connect_account(email: str, freelancer_id: str) -> dict:
    """
    Creates a Stripe Express connected account for a freelancer.
    Returns the account_id to store in Firestore.
    """
    if not stripe.api_key or stripe.api_key.startswith("sk_test_your"):
        return {"account_id": f"acct_mock_{freelancer_id}", "mock": True}

    account = stripe.Account.create(
        type="express",
        email=email,
        metadata={"freelancer_id": freelancer_id},
        capabilities={"transfers": {"requested": True}},
    )
    return {"account_id": account.id}


def create_account_link(account_id: str, refresh_url: str, return_url: str) -> dict:
    """
    Generates a one-time Stripe onboarding URL for the freelancer.
    """
    if not stripe.api_key or stripe.api_key.startswith("sk_test_your"):
        return {"url": f"/freelancer/workspace?onboarding=mock&account={account_id}"}

    link = stripe.AccountLink.create(
        account=account_id,
        refresh_url=refresh_url,
        return_url=return_url,
        type="account_onboarding",
    )
    return {"url": link.url}


def get_account_status(account_id: str) -> dict:
    """Check if a freelancer's Connect account is fully onboarded."""
    if not stripe.api_key or stripe.api_key.startswith("sk_test_your"):
        return {"charges_enabled": True, "payouts_enabled": True, "mock": True}

    account = stripe.Account.retrieve(account_id)
    return {
        "charges_enabled": account.charges_enabled,
        "payouts_enabled": account.payouts_enabled,
        "details_submitted": account.details_submitted,
    }


# ── Stripe webhook verification ───────────────────────────────────────────────

def verify_webhook(payload: bytes, sig_header: str, webhook_secret: str) -> dict:
    """Verify and parse an incoming Stripe webhook event."""
    event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    return event


# ── Mock responses (when no real Stripe key is configured) ───────────────────

def _mock_payment_intent(amount: float, project_id: str, vault_id: str) -> dict:
    import uuid
    return {
        "payment_intent_id": f"pi_mock_{uuid.uuid4().hex[:16]}",
        "client_secret": f"pi_mock_secret_{uuid.uuid4().hex[:16]}",
        "status": "requires_capture",
        "amount": amount,
        "mock": True,
    }

def _mock_transfer(amount: float, destination: str, milestone_id: str) -> dict:
    import uuid
    return {
        "transfer_id": f"tr_mock_{uuid.uuid4().hex[:16]}",
        "amount": amount,
        "destination": destination,
        "status": "transferred",
        "mock": True,
    }

def _mock_refund(amount: float, payment_intent_id: str, milestone_id: str) -> dict:
    import uuid
    return {
        "refund_id": f"re_mock_{uuid.uuid4().hex[:16]}",
        "amount": amount,
        "status": "succeeded",
        "mock": True,
    }
