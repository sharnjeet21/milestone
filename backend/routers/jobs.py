from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import uuid

from database.firebase import firebase_db

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


class CreateJobRequest(BaseModel):
    employer_id: str
    title: str
    description: str
    required_skills: list[str] = []
    budget_min: float
    budget_max: float
    timeline_days: int


@router.post("")
async def create_job(body: CreateJobRequest):
    """Create a new job posting with status OPEN."""
    job_data = {
        "id": str(uuid.uuid4()),
        "employer_id": body.employer_id,
        "title": body.title,
        "description": body.description,
        "required_skills": body.required_skills,
        "budget_min": body.budget_min,
        "budget_max": body.budget_max,
        "timeline_days": body.timeline_days,
        "status": "OPEN",
        "created_at": datetime.utcnow().isoformat(),
    }
    return firebase_db.create_job(job_data)


@router.get("")
async def list_jobs():
    """Return all OPEN job postings sorted by created_at descending."""
    return firebase_db.get_jobs(status="OPEN")


class ApplyRequest(BaseModel):
    freelancer_id: str
    cover_note: str = ""


@router.post("/{job_id}/apply")
async def apply_to_job(job_id: str, body: ApplyRequest):
    """Apply to a job. Validates job exists, is OPEN, and no duplicate application."""
    # 1. Get the job — 404 if not found
    job = firebase_db.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    # 2. Check job status is OPEN — 422 if FILLED or CLOSED
    if job["status"] != "OPEN":
        raise HTTPException(status_code=422, detail="Job is not open for applications")

    # 3. Check for duplicate application — 409 if already applied
    existing = firebase_db.get_freelancer_application(job_id, body.freelancer_id)
    if existing is not None:
        raise HTTPException(status_code=409, detail="You have already applied to this job")

    # 4. Get freelancer's current PFI score
    freelancer = firebase_db.get_user(body.freelancer_id)
    pfi_score = (freelancer or {}).get("pfi_score", 500)

    # 5. Create application with status PENDING
    app_data = {
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        "freelancer_id": body.freelancer_id,
        "cover_note": body.cover_note,
        "status": "PENDING",
        "pfi_score_at_apply": pfi_score,
        "created_at": datetime.utcnow().isoformat(),
    }

    # 6. Persist and return created application
    return firebase_db.create_application(job_id, app_data)


class UpdateApplicationRequest(BaseModel):
    status: str  # "ACCEPTED" or "REJECTED"


@router.patch("/{job_id}/applications/{application_id}")
async def update_application(job_id: str, application_id: str, body: UpdateApplicationRequest):
    """Accept or reject an application. On ACCEPTED: set job to FILLED and create a project record."""
    # 1. Validate status value
    if body.status not in ("ACCEPTED", "REJECTED"):
        raise HTTPException(status_code=422, detail="status must be ACCEPTED or REJECTED")

    # 2. Get job — 404 if not found
    job = firebase_db.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    # 3. Get application — 404 if not found
    application = firebase_db.get_application(job_id, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    # 4. Update application status
    updated_app = firebase_db.update_application(job_id, application_id, {"status": body.status})

    # 5. If ACCEPTED: fill the job and create a project
    if body.status == "ACCEPTED":
        firebase_db.update_job(job_id, {"status": "FILLED"})
        project_data = {
            "id": str(uuid.uuid4()),
            "employer_id": job["employer_id"],
            "freelancer_id": application["freelancer_id"],
            "title": job["title"],
            "description": job["description"],
            "total_budget": job.get("budget_max", 0),
            "status": "PENDING",
            "milestones": [],
            "created_at": datetime.utcnow().isoformat(),
            "job_id": job_id,
            "application_id": application_id,
        }
        firebase_db.create_project(project_data["id"], project_data)
        return {"application": updated_app, "job_status": "FILLED", "project": project_data}

    # 6. REJECTED
    return {"application": updated_app}


@router.get("/{job_id}/applications")
async def get_job_applications(job_id: str):
    """Return all applications for a job, enriched with applicant PFI score and name."""
    job = firebase_db.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    applications = firebase_db.get_applications(job_id)

    # Enrich each application with freelancer name and current PFI score
    enriched = []
    for app in applications:
        freelancer = firebase_db.get_user(app.get("freelancer_id", "")) or {}
        enriched.append({
            **app,
            "freelancer_name": freelancer.get("name", "Unknown"),
            "freelancer_pfi_score": freelancer.get("pfi_score", app.get("pfi_score_at_apply", 500)),
        })

    return enriched
