import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database.firebase import firebase_db
from services import notification_service

router = APIRouter(prefix="/api/disputes", tags=["disputes"])


class CreateDisputeRequest(BaseModel):
    project_id: str
    milestone_id: str
    raised_by: str
    reason: str
    evidence_url: Optional[str] = None
    vault_id: Optional[str] = None
    employer_id: Optional[str] = None
    freelancer_id: Optional[str] = None


class ResolveDisputeRequest(BaseModel):
    status: str  # RESOLVED | DISMISSED
    resolution: Optional[str] = None  # EMPLOYER_WINS | FREELANCER_WINS
    vault_id: Optional[str] = None
    payment_amount: Optional[float] = None
    freelancer_id: Optional[str] = None
    employer_id: Optional[str] = None
    paypal_capture_id: Optional[str] = None


@router.post("")
async def create_dispute(body: CreateDisputeRequest):
    dispute = {
        "id": str(uuid.uuid4()),
        "project_id": body.project_id,
        "milestone_id": body.milestone_id,
        "raised_by": body.raised_by,
        "reason": body.reason,
        "evidence_url": body.evidence_url,
        "status": "OPEN",
        "resolution": None,
        "resolved_at": None,
        "created_at": datetime.utcnow().isoformat(),
    }
    firebase_db.create_dispute(dispute)
    if body.vault_id:
        firebase_db.freeze_milestone(body.vault_id, body.milestone_id)
    msg = f"A dispute has been opened for milestone {body.milestone_id}."
    if body.employer_id:
        notification_service.send(body.employer_id, "DISPUTE_OPENED", msg, {"dispute_id": dispute["id"]})
    if body.freelancer_id:
        notification_service.send(body.freelancer_id, "DISPUTE_OPENED", msg, {"dispute_id": dispute["id"]})
    return dispute


@router.patch("/{dispute_id}")
async def resolve_dispute(dispute_id: str, body: ResolveDisputeRequest):
    dispute = firebase_db.get_dispute(dispute_id)
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    updates = {
        "status": body.status,
        "resolution": body.resolution,
        "resolved_at": datetime.utcnow().isoformat(),
    }
    firebase_db.update_dispute(dispute_id, updates)
    if body.vault_id:
        firebase_db.unfreeze_milestone(body.vault_id, dispute["milestone_id"])
        if body.resolution == "EMPLOYER_WINS" and body.paypal_capture_id and body.payment_amount:
            import paypal_service
            try:
                paypal_service.refund_capture(body.paypal_capture_id, body.payment_amount, dispute["project_id"], dispute["milestone_id"])
            except Exception as e:
                print(f"Refund failed: {e}")
        elif body.resolution == "FREELANCER_WINS" and body.payment_amount and body.freelancer_id:
            import paypal_service
            freelancer = firebase_db.get_user(body.freelancer_id)
            email = (freelancer or {}).get("paypal_email", "")
            if email:
                try:
                    paypal_service.payout_to_freelancer(body.payment_amount, email, dispute["project_id"], dispute["milestone_id"])
                except Exception as e:
                    print(f"Payout failed: {e}")
    msg = f"Dispute {dispute_id} has been {body.status.lower()}."
    if body.employer_id:
        notification_service.send(body.employer_id, "DISPUTE_RESOLVED", msg, {"dispute_id": dispute_id})
    if body.freelancer_id:
        notification_service.send(body.freelancer_id, "DISPUTE_RESOLVED", msg, {"dispute_id": dispute_id})
    dispute.update(updates)
    return dispute


@router.get("")
async def get_disputes(project_id: str):
    return firebase_db.get_disputes_by_project(project_id)
