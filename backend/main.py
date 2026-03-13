from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

from agents.nlp_agent import NLPAgent
from agents.quality_agent import QualityAgent
from agents.payment_agent import PaymentAgent
from agents.pfi_agent import PFIAgent
from agents.escrow_agent import SmartEscrowAgent
from models.project import Milestone, MilestoneStatus

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

# In-memory storage
projects_db = {}
freelancers_db = {}

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
    freelancer_id: str
    submitted_work: str
    submission_type: str = "text"
    days_taken: int = 0
    revision_count: int = 0

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

@app.get("/api/projects")
async def list_projects():
    return list(projects_db.values())

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
        projects_db[project_id] = project

        if request.freelancer_id not in freelancers_db:
            freelancers_db[request.freelancer_id] = {
                "id": request.freelancer_id,
                "pfi_score": 500.0,
                "total_projects": 0,
                "completed_milestones": 0
            }

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
        project = projects_db.get(request.project_id)
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
            submitted_work=request.submitted_work,
            submission_type=request.submission_type
        )

        payment_result = get_payment_agent().process_milestone_result(
            vault_id=project["vault_id"],
            milestone=milestone,
            evaluation_result=evaluation,
            freelancer_id=request.freelancer_id,
            employer_id=project["employer_id"]
        )

        freelancer = freelancers_db.get(request.freelancer_id, {"pfi_score": 500.0})
        deadline_met = request.days_taken <= milestone_data["deadline_days"]
        days_late = max(0, request.days_taken - milestone_data["deadline_days"])

        pfi_update = get_pfi_agent().calculate_pfi(
            current_score=freelancer["pfi_score"],
            milestone_completion_score=evaluation["completion_score"],
            deadline_met=deadline_met,
            days_late=days_late,
            revision_count=request.revision_count
        )

        if request.freelancer_id in freelancers_db:
            freelancers_db[request.freelancer_id]["pfi_score"] = pfi_update["new_score"]
            freelancers_db[request.freelancer_id]["completed_milestones"] = \
                freelancers_db[request.freelancer_id].get("completed_milestones", 0) + 1

        for i, m in enumerate(project["milestones"]):
            if m["id"] == request.milestone_id:
                project["milestones"][i]["status"] = evaluation["status"]
                project["milestones"][i]["completion_score"] = evaluation["completion_score"]
                project["milestones"][i]["feedback"] = evaluation["detailed_feedback"]
                project["milestones"][i]["submitted_work"] = request.submitted_work
                break

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
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.get("/api/escrow/{vault_id}")
async def get_escrow_status(vault_id: str):
    try:
        vault = payment_agent.escrow.get_vault_status(vault_id)
        return vault
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/freelancer/{freelancer_id}/pfi")
async def get_pfi_score(freelancer_id: str):
    freelancer = freelancers_db.get(freelancer_id)
    if not freelancer:
        return {
            "freelancer_id": freelancer_id,
            "pfi_score": 500.0,
            "tier": "AVERAGE",
            "message": "New freelancer - starting score"
        }

    score = freelancer["pfi_score"]
    tier_info = pfi_agent._get_tier(score)

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
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"milestones": project["milestones"]}

@app.post("/api/escrow/assess-risk")
async def assess_milestone_risk(project_id: str, milestone_id: str, freelancer_id: str):
    """Assess risk for a milestone payment using smart escrow"""
    try:
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        milestone_data = None
        for m in project["milestones"]:
            if m["id"] == milestone_id:
                milestone_data = m
                break
        
        if not milestone_data:
            raise HTTPException(status_code=404, detail="Milestone not found")
        
        freelancer = freelancers_db.get(freelancer_id, {"pfi_score": 500.0, "completed_milestones": 0})
        
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

@app.post("/api/escrow/optimize-schedule")
async def optimize_payment_schedule(project_id: str, freelancer_id: str):
    """Get optimized payment schedule for a project"""
    try:
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        freelancer = freelancers_db.get(freelancer_id, {"pfi_score": 500.0})
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
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        freelancer = freelancers_db.get(freelancer_id, {"pfi_score": 500.0, "completed_milestones": 0})
        
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=9001, reload=True)
