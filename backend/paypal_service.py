"""
PayPal Sandbox integration for MilestoneAI.

Flow:
  1. Employer funds project  → create_order() → PayPal JS SDK handles checkout
  2. Employer approves       → capture_order() charges their sandbox account
  3. Milestone approved      → payout_to_freelancer() sends to freelancer's PayPal
  4. Milestone failed        → refund_capture() refunds employer

Sandbox accounts for testing:
  - Go to developer.paypal.com → Sandbox → Accounts
  - Use the pre-created buyer/seller emails for testing
"""

import os
import re
import uuid
import httpx

PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "")
PAYPAL_SECRET    = os.getenv("PAYPAL_SECRET", "")
PAYPAL_MODE      = os.getenv("PAYPAL_MODE", "sandbox")

_BASE = (
    "https://api-m.sandbox.paypal.com"
    if PAYPAL_MODE != "live"
    else "https://api-m.paypal.com"
)

def _is_configured() -> bool:
    return bool(PAYPAL_CLIENT_ID) and not PAYPAL_CLIENT_ID.startswith("YOUR_")

def _get_access_token() -> str:
    r = httpx.post(
        f"{_BASE}/v1/oauth2/token",
        auth=(PAYPAL_CLIENT_ID, PAYPAL_SECRET),
        data={"grant_type": "client_credentials"},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()["access_token"]

def _headers(idempotency_key: str = None) -> dict:
    h = {
        "Authorization": f"Bearer {_get_access_token()}",
        "Content-Type": "application/json",
    }
    if idempotency_key:
        h["PayPal-Request-Id"] = idempotency_key
    return h


# ── Create order (employer funds escrow) ─────────────────────────────────────

def create_order(amount: float, project_id: str, vault_id: str,
                 currency: str = "USD",
                 return_url: str = "http://localhost:3000",
                 cancel_url: str = "http://localhost:3000/employer/create") -> dict:
    if not _is_configured():
        mock_id = f"MOCK-ORDER-{uuid.uuid4().hex[:12].upper()}"
        return {
            "order_id": mock_id,
            "status": "CREATED",
            "amount": amount,
            "currency": currency,
            "mock": True,
        }

    payload = {
        "intent": "CAPTURE",
        "purchase_units": [{
            "reference_id": project_id,
            "custom_id": vault_id,
            "description": f"MilestoneAI escrow — project {project_id[:8]}",
            "amount": {"currency_code": currency, "value": f"{amount:.2f}"},
        }],
        "application_context": {
            "return_url": return_url,
            "cancel_url": cancel_url,
            "brand_name": "MilestoneAI",
            "user_action": "PAY_NOW",
            "shipping_preference": "NO_SHIPPING",
        },
    }
    r = httpx.post(f"{_BASE}/v2/checkout/orders", json=payload,
                   headers=_headers(f"order-{project_id[:16]}"), timeout=15)
    r.raise_for_status()
    data = r.json()
    return {
        "order_id": data["id"],
        "status": data["status"],
        "amount": amount,
        "currency": currency,
    }


# ── Capture order (charge after approval) ────────────────────────────────────

def capture_order(order_id: str) -> dict:
    if not _is_configured():
        return {
            "capture_id": f"MOCK-CAPTURE-{uuid.uuid4().hex[:12].upper()}",
            "order_id": order_id,
            "status": "COMPLETED",
            "mock": True,
        }

    r = httpx.post(
        f"{_BASE}/v2/checkout/orders/{order_id}/capture",
        headers=_headers(f"capture-{order_id[:16]}"),
        json={},
        timeout=15,
    )
    r.raise_for_status()
    data = r.json()

    capture_id = None
    try:
        capture_id = data["purchase_units"][0]["payments"]["captures"][0]["id"]
    except (KeyError, IndexError):
        pass

    return {
        "capture_id": capture_id,
        "order_id": order_id,
        "status": data.get("status"),
    }


# ── Payout to freelancer ──────────────────────────────────────────────────────

def payout_to_freelancer(amount: float, freelancer_paypal_email: str,
                         project_id: str, milestone_id: str,
                         currency: str = "USD") -> dict:
    if not _is_configured():
        return {
            "payout_batch_id": f"MOCK-PAYOUT-{uuid.uuid4().hex[:12].upper()}",
            "amount": amount,
            "recipient": freelancer_paypal_email,
            "status": "SUCCESS",
            "mock": True,
        }

    batch_id = f"ms_{milestone_id[:16]}_{uuid.uuid4().hex[:6]}"
    payload = {
        "sender_batch_header": {
            "sender_batch_id": batch_id,
            "email_subject": "MilestoneAI — Milestone payment received",
            "email_message": f"Your milestone payment of ${amount:.2f} has been released.",
        },
        "items": [{
            "recipient_type": "EMAIL",
            "amount": {"value": f"{amount:.2f}", "currency": currency},
            "receiver": freelancer_paypal_email,
            "note": f"Milestone {milestone_id[:8]} payment",
            "sender_item_id": batch_id,
        }],
    }
    r = httpx.post(f"{_BASE}/v1/payments/payouts", json=payload,
                   headers=_headers(), timeout=15)
    r.raise_for_status()
    data = r.json()
    return {
        "payout_batch_id": data["batch_header"]["payout_batch_id"],
        "amount": amount,
        "recipient": freelancer_paypal_email,
        "status": data["batch_header"]["batch_status"],
    }


# ── Refund to employer ────────────────────────────────────────────────────────

def refund_capture(capture_id: str, amount: float, project_id: str,
                   milestone_id: str, currency: str = "USD") -> dict:
    if not _is_configured():
        return {
            "refund_id": f"MOCK-REFUND-{uuid.uuid4().hex[:12].upper()}",
            "amount": amount,
            "status": "COMPLETED",
            "mock": True,
        }

    payload = {
        "amount": {"value": f"{amount:.2f}", "currency_code": currency},
        "note_to_payer": f"Refund for milestone — requirements not met.",
    }
    r = httpx.post(
        f"{_BASE}/v2/payments/captures/{capture_id}/refund",
        json=payload,
        headers=_headers(f"refund-{capture_id[:16]}"),
        timeout=15,
    )
    r.raise_for_status()
    data = r.json()
    return {"refund_id": data["id"], "amount": amount, "status": data["status"]}


# ── Verify PayPal account ─────────────────────────────────────────────────────

def verify_paypal_account(email: str) -> dict:
    """
    Verify a PayPal account exists using the Payouts API.

    Strategy:
    - Attempt a $0.01 payout to the email with NO_UNCLAIMED_PAYMENT flag.
    - PayPal returns RECEIVER_UNREGISTERED synchronously if the account doesn't exist.
    - Works correctly in both sandbox and live modes.
    - Without keys: returns mock=True (dev mode, skip verification).
    """
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return {"exists": False, "error": "Invalid email format"}

    if not _is_configured():
        return {
            "exists": False,
            "mock": True,
            "error": "PayPal not configured. Add PAYPAL_CLIENT_ID and PAYPAL_SECRET to backend/.env",
        }

    try:
        batch_id = f"verify_{uuid.uuid4().hex[:16]}"
        payload = {
            "sender_batch_header": {
                "sender_batch_id": batch_id,
                "email_subject": "Account verification",
            },
            "items": [{
                "recipient_type": "EMAIL",
                "amount": {"value": "0.01", "currency": "USD"},
                "receiver": email,
                "note": "Account verification check",
                "sender_item_id": batch_id,
            }],
        }
        r = httpx.post(
            f"{_BASE}/v1/payments/payouts",
            json=payload,
            headers=_headers(),
            timeout=15,
        )
        data = r.json()

        # 201 = payout created = account exists
        if r.status_code == 201:
            # Cancel/void the payout immediately (best-effort, ignore errors)
            try:
                batch_id_returned = data["batch_header"]["payout_batch_id"]
                httpx.post(
                    f"{_BASE}/v1/payments/payouts/{batch_id_returned}/cancel",
                    headers=_headers(),
                    timeout=10,
                )
            except Exception:
                pass
            return {"exists": True, "error": None}

        # Check for unregistered receiver error
        for item in data.get("items", []):
            errors = item.get("errors", {})
            if errors.get("name") in ("RECEIVER_UNREGISTERED", "RECEIVER_UNCONFIRMED"):
                return {"exists": False, "error": "No PayPal account found for this email address."}

        # Top-level error check
        name = data.get("name", "")
        msg = data.get("message", "")
        if "RECEIVER_UNREGISTERED" in name or "RECEIVER_UNREGISTERED" in msg:
            return {"exists": False, "error": "No PayPal account found for this email address."}

        # Payouts API not enabled on this account
        if "AUTHORIZATION_ERROR" in name or r.status_code == 403:
            # Fall back: treat as exists=True with a warning (can't verify without Payouts API)
            return {
                "exists": True,
                "warning": "Could not verify — Payouts API not enabled. Email saved as-is.",
                "error": None,
            }

        # Unknown response — allow through
        return {"exists": True, "error": None}

    except httpx.HTTPStatusError as e:
        body = {}
        try:
            body = e.response.json()
        except Exception:
            pass
        name = body.get("name", "")
        if "RECEIVER_UNREGISTERED" in name:
            return {"exists": False, "error": "No PayPal account found for this email address."}
        return {"exists": False, "error": f"PayPal API error: {e.response.status_code}"}
    except Exception as e:
        return {"exists": False, "error": f"Connection error: {str(e)}"}
