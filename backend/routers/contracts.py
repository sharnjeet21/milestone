import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from database.firebase import firebase_db
from services import notification_service
from services.mou_service import generate as mou_generate

router = APIRouter(prefix="/api/contracts", tags=["contracts"])


class GenerateContractRequest(BaseModel):
    project_id: str


class SignContractRequest(BaseModel):
    user_id: str
    role: str  # employer | freelancer


@router.post("/generate")
async def generate_contract(body: GenerateContractRequest):
    project = firebase_db.get_project(body.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    result = mou_generate(project)
    mou = result["mou_json"]
    contract = {
        "id": str(uuid.uuid4()),
        "project_id": body.project_id,
        "employer_id": project.get("employer_id", ""),
        "freelancer_id": project.get("freelancer_id", ""),
        "status": "DRAFT",
        "party_names": mou["party_names"],
        "project_title": mou["project_title"],
        "scope_of_work": mou["scope_of_work"],
        "milestones": mou["milestones"],
        "penalty_schedule": mou["penalty_schedule"],
        "dispute_clause": mou["dispute_clause"],
        "governing_law": mou["governing_law"],
        "plain_text": result["mou_text"],
        "signatures": [],
        "executed_at": None,
        "created_at": datetime.utcnow().isoformat(),
    }
    firebase_db.create_contract(contract)
    return contract


@router.get("/{contract_id}")
async def get_contract(contract_id: str):
    contract = firebase_db.get_contract(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


@router.post("/{contract_id}/sign")
async def sign_contract(contract_id: str, body: SignContractRequest, request: Request):
    contract = firebase_db.get_contract(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract["status"] == "EXECUTED":
        raise HTTPException(status_code=409, detail="Contract already executed")
    sigs = contract.get("signatures", [])
    if any(s["user_id"] == body.user_id for s in sigs):
        raise HTTPException(status_code=409, detail="Already signed")
    sig = {
        "user_id": body.user_id,
        "role": body.role,
        "signed_at": datetime.utcnow().isoformat(),
        "ip_address": request.client.host if request.client else "unknown",
    }
    sigs = sigs + [sig]
    roles_signed = {s["role"] for s in sigs}
    new_status = contract["status"]
    executed_at = contract.get("executed_at")
    if "employer" in roles_signed and "freelancer" in roles_signed:
        new_status = "EXECUTED"
        executed_at = datetime.utcnow().isoformat()
    elif body.role == "employer":
        new_status = "EMPLOYER_SIGNED"
    elif body.role == "freelancer":
        new_status = "FREELANCER_SIGNED"
    updates = {"signatures": sigs, "status": new_status, "executed_at": executed_at}
    firebase_db.update_contract(contract_id, updates)
    notification_service.send(body.user_id, "CONTRACT_SIGNED", f"You signed contract {contract_id}.", {"contract_id": contract_id})
    if new_status == "EXECUTED":
        for uid in [contract.get("employer_id"), contract.get("freelancer_id")]:
            if uid:
                notification_service.send(uid, "CONTRACT_EXECUTED", f"Contract {contract_id} is now fully executed.", {"contract_id": contract_id})
    contract.update(updates)
    return contract


@router.get("/{contract_id}/signatures")
async def get_signatures(contract_id: str):
    contract = firebase_db.get_contract(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return {"signatures": contract.get("signatures", []), "status": contract.get("status")}
