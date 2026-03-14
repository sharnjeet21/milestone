"""
Razorpay integration for MilestoneAI escrow payments.

Flow:
  1. Employer creates project → create_order() creates a Razorpay order.
  2. Frontend collects payment via Razorpay checkout → verify_payment_signature() confirms it.
  3. Milestone approved → transfer_to_freelancer() sends payout to freelancer's bank/UPI.
  4. Milestone failed  → refund_to_employer() refunds the order payment.
  5. Freelancer onboarding → create_contact() + create_fund_account() for payout setup.
"""

import os
import hmac
import hashlib
import uuid
from typing import Optional

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

def _is_mock() -> bool:
    return not RAZORPAY_KEY_ID or RAZORPAY_KEY_ID.startswith("rzp_test_your")

def _to_paise(amount: float) -> int:
    """Razorpay uses smallest currency unit — paise for INR."""
    return int(round(amount * 100))

def _client():
    import razorpay
    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


# ── Employer: create order to fund escrow ────────────────────────────────────

def create_order(
    amount: float,
    project_id: str,
    vault_id: str,
    currency: str = "INR",
) -> dict:
    """
    Creates a Razorpay order. The frontend uses the order_id to open
    the Razorpay checkout and collect payment from the employer.
    """
    if _is_mock():
        return {
            "order_id": f"order_mock_{uuid.uuid4().hex[:16]}",
            "amount": amount,
            "currency": currency,
            "status": "created",
            "mock": True,
        }

    client = _client()
    order = client.order.create({
        "amount": _to_paise(amount),
        "currency": currency,
        "notes": {"project_id": project_id, "vault_id": vault_id},
        "payment_capture": 1,  # auto-capture
    })
    return {
        "order_id": order["id"],
        "amount": amount,
        "currency": currency,
        "status": order["status"],
    }


def verify_payment_signature(
    order_id: str,
    payment_id: str,
    signature: str,
) -> bool:
    """
    Verifies the Razorpay payment signature sent by the frontend after checkout.
    Returns True if the payment is genuine.
    """
    if _is_mock():
        return True

    body = f"{order_id}|{payment_id}"
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        body.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


# ── Freelancer: receive milestone payout ─────────────────────────────────────

def transfer_to_freelancer(
    amount: float,
    fund_account_id: str,
    project_id: str,
    milestone_id: str,
    currency: str = "INR",
) -> dict:
    """
    Sends a payout to the freelancer's registered fund account (bank/UPI).
    Requires Razorpay Route / Payouts to be enabled on the account.
    """
    if _is_mock():
        return {
            "payout_id": f"pout_mock_{uuid.uuid4().hex[:16]}",
            "amount": amount,
            "fund_account_id": fund_account_id,
            "status": "processed",
            "mock": True,
        }

    client = _client()
    payout = client.payout.create({
        "account_number": os.getenv("RAZORPAY_ACCOUNT_NUMBER", ""),
        "fund_account_id": fund_account_id,
        "amount": _to_paise(amount),
        "currency": currency,
        "mode": "UPI",          # or "NEFT", "IMPS", "RTGS"
        "purpose": "payout",
        "queue_if_low_balance": True,
        "notes": {"project_id": project_id, "milestone_id": milestone_id},
        "narration": f"Milestone {milestone_id} payment",
    })
    return {
        "payout_id": payout["id"],
        "amount": amount,
        "fund_account_id": fund_account_id,
        "status": payout["status"],
    }


# ── Employer: refund on milestone failure ─────────────────────────────────────

def refund_to_employer(
    payment_id: str,
    amount: float,
    project_id: str,
    milestone_id: str,
) -> dict:
    """Issues a partial or full refund on a captured Razorpay payment."""
    if _is_mock():
        return {
            "refund_id": f"rfnd_mock_{uuid.uuid4().hex[:16]}",
            "amount": amount,
            "status": "processed",
            "mock": True,
        }

    client = _client()
    refund = client.payment.refund(payment_id, {
        "amount": _to_paise(amount),
        "notes": {"project_id": project_id, "milestone_id": milestone_id},
    })
    return {
        "refund_id": refund["id"],
        "amount": amount,
        "status": refund["status"],
    }


# ── Freelancer onboarding (Razorpay Contacts + Fund Accounts) ─────────────────

def create_contact(email: str, name: str, freelancer_id: str) -> dict:
    """Creates a Razorpay Contact for the freelancer (needed before fund account)."""
    if _is_mock():
        return {"contact_id": f"cont_mock_{freelancer_id[:8]}", "mock": True}

    client = _client()
    contact = client.contact.create({
        "name": name or email,
        "email": email,
        "type": "vendor",
        "reference_id": freelancer_id,
    })
    return {"contact_id": contact["id"]}


def create_fund_account(
    contact_id: str,
    account_type: str,       # "bank_account" or "vpa" (UPI)
    account_details: dict,   # {"ifsc": ..., "account_number": ...} or {"address": "upi@bank"}
) -> dict:
    """
    Registers a bank account or UPI VPA for the freelancer.
    account_type = "bank_account": account_details = {"ifsc": "HDFC0001234", "name": "...", "account_number": "..."}
    account_type = "vpa":          account_details = {"address": "freelancer@upi"}
    """
    if _is_mock():
        return {"fund_account_id": f"fa_mock_{uuid.uuid4().hex[:8]}", "mock": True}

    client = _client()
    payload = {
        "contact_id": contact_id,
        "account_type": account_type,
        account_type: account_details,
    }
    fa = client.fund_account.create(payload)
    return {"fund_account_id": fa["id"]}


def get_fund_accounts(contact_id: str) -> list:
    """List all fund accounts for a contact."""
    if _is_mock():
        return []

    client = _client()
    result = client.fund_account.all({"contact_id": contact_id})
    return result.get("items", [])


# ── Webhook verification ──────────────────────────────────────────────────────

def verify_webhook(payload: bytes, signature: str, webhook_secret: str) -> bool:
    """Verify Razorpay webhook signature."""
    expected = hmac.new(
        webhook_secret.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
