from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
import os
from datetime import datetime

import stripe_service

from agents.nlp_agent import NLPAgent
from agents.quality_agent import QualityAgent
from agents.payment_agent import PaymentAgent
from agents.pfi_agent import PFIAgent
from agents.escrow_agent import SmartEscrowAgent
from models.project import Milestone, MilestoneStatus
from database.firebase import firebase_db
from database.seed import load_sample_data

app = FastAPI(
    title="MilestoneAI API",
    description="Autonomous AI Project & Payment Agent",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy-load agents (instantiated on first use)
_nlp_agent = None
_quality_agent = None
_payment_agent = None
_pfi_agent = None
_escrow_agent = None

def get_nlp_agent():
    global _nlp_agent
    if _nlp_agent is None:
        _nlp_agent = NLPAgent()
    return _nlp_agent

def get_quality_agent():
    global _quality_agent
    if _quality_agent is None:
        _quality_agent = QualityAgent()
    return _quality_agent

def get_payment_agent():
    global _payment_agent
    if _payment_agent is None:
        _payment_agent = PaymentAgent()
    return _payment_agent

def get_pfi_agent():
    global _pfi_agent
    if _pfi_agent is None:
        _pfi_agent = PFIAgent()
    return _pfi_agent

def get_escrow_agent():
    global _escrow_agent
    if _escrow_agent is None:
        _escrow_agent = SmartEscrowAgent()
    return _escrow_agent

# In-memory storage (fallback when Firestore is unavailable)
projects_db = {}
freelancers_db = {}

def save_project_to_db(project_id: str, project: dict):
    projects_db[project_id] = project
    if firebase_db.is_available():
        try:
            firebase_db.create_project(project_id, project)
        except Exception as e:
            print(f"Firestore write failed (project): {e}")

def get_project_from_db(project_id: str) -> Optional[dict]:
    # Firestore is source of truth
    if firebase_db.is_available():
        try:
            doc = firebase_db.get_project(project_id)
            if doc:
                projects_db[project_id] = doc  # keep in-memory in sync
                return doc
        except Exception as e:
            print(f"Firestore read failed (project): {e}")
    return projects_db.get(project_id)

def get_all_projects_from_db() -> list:
    if firebase_db.is_available():
        try:
            docs = firebase_db.get_all_projects()
            if docs:
                for d in docs:
                    projects_db[d["id"]] = d
                return docs
        except Exception as e:
            print(f"Firestore read failed (projects list): {e}")
    return list(projects_db.values())

def update_project_in_db(project_id: str, project: dict):
    projects_db[project_id] = project
    if firebase_db.is_available():
        try:
            firebase_db.update_project(project_id, project)
        except Exception as e:
            print(f"Firestore update failed (project): {e}")

def save_vault_to_db(vault_id: str, vault: dict):
    if firebase_db.is_available():
        try:
            firebase_db.create_vault(vault_id, vault)
        except Exception as e:
            print(f"Firestore write failed (vault): {e}")

def get_freelancer_from_db(freelancer_id: str) -> Optional[dict]:
    if firebase_db.is_available():
        try:
            doc = firebase_db.get_user(freelancer_id)
            if doc:
                freelancers_db[freelancer_id] = doc
                return doc
        except Exception as e:
            print(f"Firestore read failed (freelancer): {e}")
    return freelancers_db.get(freelancer_id)

def upsert_freelancer_in_db(freelancer_id: str, data: dict):
    freelancers_db[freelancer_id] = data
    if firebase_db.is_available():
        try:
            firebase_db.upsert_user(freelancer_id, data)
        except Exception as e:
            print(f"Firestore upsert failed (freelancer): {e}")

# Request Models
class ProjectRequest(BaseModel):
    employer_id: str
    freelancer_id: Optional[str] = None
    title: str
    description: str
    total_budget: float
    deliverable_type: str
    timeline_days: int
    tech_stack: Optional[List[str]] = []

class SubmitWorkRequest(BaseModel):
    project_id: str
    milestone_id: str
    freelancer_id: Optional[str] = "demo-freelancer-1"
    submitted_work: Optional[str] = None
    submission_content: Optional[str] = None  # frontend field name
    submission_type: str = "text"
    days_taken: int = 0
    revision_count: int = 0

    def get_work(self) -> str:
        return self.submission_content or self.submitted_work or ""

class ClarifyRequest(BaseModel):
    description: str

# API Routes
@app.get("/")
def root():
    return {
        "message": "🚀 MilestoneAI - Autonomous Project & Payment Agent",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/projects")
async def list_projects():
    return get_all_projects_from_db()

@app.post("/api/projects/clarify")
async def clarify_project(request: ClarifyRequest):
    result = get_nlp_agent().clarify_ambiguity(request.description)
    return result

@app.post("/api/projects/create")
async def create_project(request: ProjectRequest):
    try:
        roadmap = get_nlp_agent().decompose_project(
            description=request.description,
            budget=request.total_budget,
            timeline_days=request.timeline_days,
            deliverable_type=request.deliverable_type,
            tech_stack=request.tech_stack
        )

        project_id = str(uuid.uuid4())
        project = {
            "id": project_id,
            "employer_id": request.employer_id,
            "freelancer_id": request.freelancer_id or "unassigned",
            "title": request.title,
            "description": request.description,
            "total_budget": request.total_budget,
            "timeline_days": request.timeline_days,
            "deliverable_type": request.deliverable_type,
            "tech_stack": request.tech_stack or [],
            "milestones": [m.dict() for m in roadmap["milestones"]],
            "project_summary": roadmap["project_summary"],
            "risk_factors": roadmap["risk_factors"],
            "success_criteria": roadmap["success_criteria"],
            "recommended_tech_stack": roadmap["recommended_tech_stack"],
            "success_fee": roadmap["success_fee"],
            "status": "ACTIVE",
            "created_at": datetime.now().isoformat()
        }

        vault = get_payment_agent().escrow.create_vault(
            project_id=project_id,
            total_amount=request.total_budget,
            employer_id=request.employer_id
        )
        project["vault_id"] = vault["vault_id"]
        
        # Save to Firestore + in-memory
        save_project_to_db(project_id, project)
        save_vault_to_db(vault["vault_id"], vault)

        if not get_freelancer_from_db(request.freelancer_id or "unassigned"):
            freelancer_data = {
                "id": request.freelancer_id or "unassigned",
                "pfi_score": 500.0,
                "total_projects": 0,
                "completed_milestones": 0,
            }
            upsert_freelancer_in_db(request.freelancer_id or "unassigned", freelancer_data)

        return {
            "success": True,
            "project": project,
            "vault": vault,
            "message": f"🎯 Project created with {len(roadmap['milestones'])} milestones"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/milestones/submit")
async def submit_milestone(request: SubmitWorkRequest):
    try:
        project = get_project_from_db(request.project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        milestone_data = None
        for m in project["milestones"]:
            if m["id"] == request.milestone_id:
                milestone_data = m
                break

        if not milestone_data:
            raise HTTPException(status_code=404, detail="Milestone not found")

        milestone = Milestone(**milestone_data)

        evaluation = get_quality_agent().evaluate_submission(
            milestone=milestone,
            submitted_work=request.get_work(),
            submission_type=request.submission_type
        )

        payment_result = get_payment_agent().process_milestone_result(
            vault_id=project["vault_id"],
            milestone=milestone,
            evaluation_result=evaluation,
            freelancer_id=request.freelancer_id,
            employer_id=project["employer_id"]
        )

        freelancer = get_freelancer_from_db(request.freelancer_id) or {"pfi_score": 500.0}
        deadline_met = request.days_taken <= milestone_data["deadline_days"]
        days_late = max(0, request.days_taken - milestone_data["deadline_days"])

        pfi_update = get_pfi_agent().calculate_pfi(
            current_score=freelancer["pfi_score"],
            milestone_completion_score=evaluation["completion_score"],
            deadline_met=deadline_met,
            days_late=days_late,
            revision_count=request.revision_count
        )

        updated_freelancer = {
            **freelancer,
            "pfi_score": pfi_update["new_score"],
            "completed_milestones": freelancer.get("completed_milestones", 0) + 1,
        }
        upsert_freelancer_in_db(request.freelancer_id, updated_freelancer)

        for i, m in enumerate(project["milestones"]):
            if m["id"] == request.milestone_id:
                project["milestones"][i]["status"] = evaluation["status"]
                project["milestones"][i]["completion_score"] = evaluation["completion_score"]
                project["milestones"][i]["feedback"] = evaluation["detailed_feedback"]
                project["milestones"][i]["submitted_work"] = request.get_work()
                break

        update_project_in_db(request.project_id, project)

        return {
            "success": True,
            "evaluation": evaluation,
            "payment_result": payment_result,
            "pfi_update": pfi_update,
            "summary": {
                "quality_score": evaluation["completion_score"],
                "status": evaluation["status"],
                "amount_released": payment_result.get("transaction", {}).get("amount_released", 0),
                "new_pfi_score": pfi_update["new_score"],
                "pfi_tier": pfi_update["tier"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    project = get_project_from_db(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.get("/api/escrow/{vault_id}")
async def get_escrow_status(vault_id: str):
    try:
        vault = get_payment_agent().escrow.get_vault_status(vault_id)
        return vault
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/freelancer/{freelancer_id}/pfi")
async def get_pfi_score(freelancer_id: str):
    freelancer = get_freelancer_from_db(freelancer_id)
    if not freelancer:
        return {
            "freelancer_id": freelancer_id,
            "pfi_score": 500.0,
            "tier": "AVERAGE",
            "message": "New freelancer - starting score"
        }

    score = freelancer["pfi_score"]
    tier_info = get_pfi_agent()._get_tier(score)

    return {
        "freelancer_id": freelancer_id,
        "pfi_score": score,
        "tier": tier_info["label"],
        "color": tier_info["color"],
        "perks": tier_info["perks"],
        "stats": freelancer
    }

@app.get("/api/projects/{project_id}/milestones")
async def get_milestones(project_id: str):
    project = get_project_from_db(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"milestones": project["milestones"]}

class AssessRiskRequest(BaseModel):
    project_id: str
    milestone_id: str
    freelancer_id: str

@app.post("/api/escrow/assess-risk")
async def assess_milestone_risk(request: AssessRiskRequest):
    project_id = request.project_id
    milestone_id = request.milestone_id
    freelancer_id = request.freelancer_id
    """Assess risk for a milestone payment using smart escrow"""
    try:
        project = get_project_from_db(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        milestone_data = None
        for m in project["milestones"]:
            if m["id"] == milestone_id:
                milestone_data = m
                break
        
        if not milestone_data:
            raise HTTPException(status_code=404, detail="Milestone not found")
        
        freelancer = get_freelancer_from_db(freelancer_id) or {"pfi_score": 500.0, "completed_milestones": 0}
        
        risk_assessment = get_escrow_agent().assess_risk(
            project_data={
                "title": project["title"],
                "total_budget": project["total_budget"],
                "timeline_days": project["timeline_days"],
                "tech_stack": project.get("tech_stack", []),
                "completed_milestones": freelancer.get("completed_milestones", 0),
                "success_rate": 85
            },
            freelancer_pfi=freelancer.get("pfi_score", 500.0),
            milestone_data={
                "title": milestone_data["title"],
                "payment_amount": milestone_data.get("payment_amount", 0),
                "deadline_days": milestone_data.get("deadline_days", 0),
                "complexity": milestone_data.get("complexity", "medium")
            }
        )
        
        return {
            "success": True,
            "project_id": project_id,
            "milestone_id": milestone_id,
            "freelancer_id": freelancer_id,
            "risk_assessment": risk_assessment
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class OptimizeScheduleRequest(BaseModel):
    project_id: str
    freelancer_id: str

@app.post("/api/escrow/optimize-schedule")
async def optimize_payment_schedule(request: OptimizeScheduleRequest):
    project_id = request.project_id
    freelancer_id = request.freelancer_id
    """Get optimized payment schedule for a project"""
    try:
        project = get_project_from_db(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        freelancer = get_freelancer_from_db(freelancer_id) or {"pfi_score": 500.0}
        vault = get_payment_agent().escrow.get_vault_status(project.get("vault_id"))
        
        optimization = get_escrow_agent().optimize_payment_schedule(
            vault_data={
                "total_amount": vault.get("total_amount", 0),
                "locked_amount": vault.get("locked_amount", 0),
                "released_amount": vault.get("released_amount", 0)
            },
            milestones=project.get("milestones", []),
            freelancer_pfi=freelancer.get("pfi_score", 500.0)
        )
        
        return {
            "success": True,
            "project_id": project_id,
            "freelancer_id": freelancer_id,
            "optimization": optimization
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/escrow/detect-fraud")
async def detect_fraud_signals(project_id: str, milestone_id: str, freelancer_id: str, submitted_work: str, days_taken: int, revision_count: int):
    """Detect potential fraud signals in a submission"""
    try:
        project = get_project_from_db(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        freelancer = get_freelancer_from_db(freelancer_id) or {"pfi_score": 500.0, "completed_milestones": 0}
        
        fraud_detection = get_escrow_agent().detect_fraud_signals(
            submission_data={
                "work": submitted_work,
                "days_taken": days_taken,
                "revision_count": revision_count
            },
            freelancer_history={
                "avg_completion_days": 7,
                "avg_revisions": 1,
                "dispute_rate": 0
            },
            project_data={
                "complexity": "medium",
                "budget": project.get("total_budget", 0)
            }
        )
        
        return {
            "success": True,
            "project_id": project_id,
            "milestone_id": milestone_id,
            "fraud_detection": fraud_detection
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Stripe Routes ─────────────────────────────────────────────────────────────

class CreatePaymentIntentRequest(BaseModel):
    project_id: str
    vault_id: str
    amount: float
    employer_stripe_customer_id: Optional[str] = None

@app.post("/api/stripe/create-payment-intent")
async def create_payment_intent(request: CreatePaymentIntentRequest):
    try:
        result = stripe_service.create_payment_intent(
            amount=request.amount,
            employer_stripe_customer_id=request.employer_stripe_customer_id,
            project_id=request.project_id,
            vault_id=request.vault_id,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CapturePaymentIntentRequest(BaseModel):
    payment_intent_id: str

@app.post("/api/stripe/capture")
async def capture_payment_intent(request: CapturePaymentIntentRequest):
    try:
        result = stripe_service.capture_payment_intent(request.payment_intent_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class FreelancerOnboardRequest(BaseModel):
    freelancer_id: str
    email: str

@app.post("/api/stripe/freelancer-onboard")
async def freelancer_onboard(request: FreelancerOnboardRequest):
    try:
        account = stripe_service.create_connect_account(
            email=request.email,
            freelancer_id=request.freelancer_id,
        )
        account_id = account["account_id"]

        base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        link = stripe_service.create_account_link(
            account_id=account_id,
            refresh_url=f"{base_url}/freelancer/workspace?onboarding=refresh",
            return_url=f"{base_url}/freelancer/workspace?onboarding=complete",
        )

        # Persist account_id to Firestore
        if firebase_db.is_available():
            try:
                firebase_db.upsert_user(request.freelancer_id, {"stripe_account_id": account_id})
            except Exception:
                pass

        return {"account_id": account_id, "onboarding_url": link["url"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stripe/account-status/{freelancer_id}")
async def get_stripe_account_status(freelancer_id: str):
    try:
        freelancer = get_freelancer_from_db(freelancer_id)
        account_id = (freelancer or {}).get("stripe_account_id")
        if not account_id:
            return {"connected": False, "charges_enabled": False, "payouts_enabled": False}
        status = stripe_service.get_account_status(account_id)
        return {"connected": True, **status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    try:
        event = stripe_service.verify_webhook(payload, sig_header, webhook_secret)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {e}")

    event_type = event.get("type", "")

    if event_type == "payment_intent.succeeded":
        pi = event["data"]["object"]
        project_id = pi.get("metadata", {}).get("project_id")
        print(f"✅ PaymentIntent succeeded for project {project_id}")

    elif event_type == "transfer.created":
        transfer = event["data"]["object"]
        print(f"💸 Transfer created: {transfer['id']} → {transfer['destination']}")

    return {"received": True}


if __name__ == "__main__":
    import uvicorn
    
    # Load sample data for demo
    print("🔄 Loading sample data...")
    load_sample_data(projects_db, freelancers_db, get_payment_agent())
    
    print("🚀 Starting MilestoneAI backend...")
    uvicorn.run("main:app", host="0.0.0.0", port=9001, reload=True)
