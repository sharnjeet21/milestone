import uuid
import paypal_service
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database.firebase import firebase_db
from services import notification_service

router = APIRouter(prefix="/api/escrow", tags=["escrow"])


class FundVaultRequest(BaseModel):
    paypal_capture_id: str
    funded_at: Optional[str] = None


class ReleaseRequest(BaseModel):
    milestone_id: str
    completion_score: float
    freelancer_id: str
    payment_amount: float
    freelancer_paypal_email: Optional[str] = None
    project_id: Optional[str] = None
    project_milestones: Optional[list] = None


TERMINAL_MILESTONE_STATUSES = {"FULLY_COMPLETED", "PARTIALLY_COMPLETED", "UNMET", "APPROVED", "REJECTED"}


def _check_and_close_vault(vault_id: str, vault: dict, project_milestones: list):
    """Close the vault with a SUCCESS_FEE transaction if all milestones are in a terminal status."""
    if not project_milestones:
        return

    all_terminal = all(
        m.get("status") in TERMINAL_MILESTONE_STATUSES for m in project_milestones
    )
    if not all_terminal:
        return

    success_fee = round(vault.get("total_amount", 0) * 0.15, 2)
    fee_transaction = {
        "type": "SUCCESS_FEE",
        "amount": success_fee,
        "milestone_id": None,
        "freelancer_id": None,
        "timestamp": datetime.utcnow().isoformat(),
        "paypal_payout_id": None,
    }

    updated_transactions = vault.get("transactions", []) + [fee_transaction]
    firebase_db.update_vault(vault_id, {
        "status": "CLOSED",
        "transactions": updated_transactions,
    })


@router.get("/vault/{vault_id}")
async def get_vault(vault_id: str):
    """Return the full vault document including transactions. 404 if not found."""
    vault = firebase_db.get_vault(vault_id)
    if vault is None:
        raise HTTPException(status_code=404, detail="Vault not found")
    return vault


@router.post("/vault/{vault_id}/fund")
async def fund_vault(vault_id: str, body: FundVaultRequest):
    """Fund a vault: validate UNFUNDED, set FUNDED, record capture id and lock full amount."""
    vault = firebase_db.get_vault(vault_id)
    if vault is None:
        raise HTTPException(status_code=404, detail="Vault not found")

    if vault.get("status") != "UNFUNDED":
        raise HTTPException(status_code=409, detail="Vault is already funded")

    updates = {
        "status": "FUNDED",
        "paypal_capture_id": body.paypal_capture_id,
        "locked_amount": vault.get("total_amount", 0),
        "funded_at": body.funded_at or datetime.utcnow().isoformat(),
    }
    firebase_db.update_vault(vault_id, updates)

    vault.update(updates)
    return vault


@router.post("/vault/{vault_id}/release")
async def release_vault(vault_id: str, body: ReleaseRequest):
    """Release milestone payment from vault based on completion score tier."""
    vault = firebase_db.get_vault(vault_id)
    if vault is None:
        raise HTTPException(status_code=404, detail="Vault not found")

    # Check if milestone is frozen (open dispute)
    if body.milestone_id in vault.get("frozen_milestones", []):
        raise HTTPException(status_code=409, detail="Milestone is frozen due to an open dispute")

    # Compute release amount based on completion score tier
    if body.completion_score >= 80:
        release_amount = body.payment_amount
    elif body.completion_score >= 50:
        release_amount = round((body.completion_score / 100) * body.payment_amount, 2)
    else:
        release_amount = 0.0

    # Initiate PayPal payout if applicable
    payout_result = {}
    if release_amount > 0 and body.freelancer_paypal_email:
        payout_result = paypal_service.payout_to_freelancer(
            release_amount,
            body.freelancer_paypal_email,
            body.project_id or vault_id,
            body.milestone_id,
        )

    # Build transaction entry
    transaction = {
        "type": "MILESTONE_PAYMENT",
        "amount": release_amount,
        "milestone_id": body.milestone_id,
        "freelancer_id": body.freelancer_id,
        "timestamp": datetime.utcnow().isoformat(),
        "paypal_payout_id": payout_result.get("payout_batch_id") if release_amount > 0 else None,
    }

    # Update vault transactions and released_amount
    updated_transactions = vault.get("transactions", []) + [transaction]
    new_released_amount = vault.get("released_amount", 0) + release_amount
    firebase_db.update_vault(vault_id, {
        "transactions": updated_transactions,
        "released_amount": new_released_amount,
    })

    # Send PAYMENT_RELEASED notification to freelancer
    notification_service.send(
        body.freelancer_id,
        "PAYMENT_RELEASED",
        f"Payment of ${release_amount:.2f} released for milestone.",
        {"milestone_id": body.milestone_id, "amount": release_amount},
    )

    # Check and close vault if all milestones are terminal
    if body.project_milestones is not None:
        updated_vault = firebase_db.get_vault(vault_id) or {}
        updated_vault["transactions"] = updated_transactions
        updated_vault["released_amount"] = new_released_amount
        _check_and_close_vault(vault_id, updated_vault, body.project_milestones)

    return {"success": True, "release_amount": release_amount, "transaction": transaction}


from services.penalty_service import compute_penalty as _compute_penalty


class PenaltyRequest(BaseModel):
    milestone_id: str
    days_late: int
    payment_amount: float
    freelancer_id: str


@router.post("/vault/{vault_id}/penalty")
async def apply_penalty(vault_id: str, body: PenaltyRequest):
    """Apply a delay penalty to a milestone."""
    if body.days_late <= 0:
        raise HTTPException(status_code=422, detail="days_late must be > 0")
    vault = firebase_db.get_vault(vault_id)
    if vault is None:
        raise HTTPException(status_code=404, detail="Vault not found")
    if body.milestone_id in vault.get("frozen_milestones", []):
        raise HTTPException(status_code=409, detail="Milestone is frozen due to an open dispute")

    result = _compute_penalty(body.days_late, body.payment_amount)
    transaction = {
        "type": "PENALTY",
        "amount": result["penalty_amount"],
        "milestone_id": body.milestone_id,
        "freelancer_id": body.freelancer_id,
        "timestamp": datetime.utcnow().isoformat(),
        "paypal_payout_id": None,
    }
    updated_transactions = vault.get("transactions", []) + [transaction]
    firebase_db.update_vault(vault_id, {"transactions": updated_transactions})
    notification_service.send(
        body.freelancer_id,
        "PENALTY_APPLIED",
        f"A penalty of ${result['penalty_amount']:.2f} was applied for {body.days_late} days late.",
        {"milestone_id": body.milestone_id, "penalty_amount": result["penalty_amount"]},
    )
    return {"success": True, **result, "transaction": transaction}
