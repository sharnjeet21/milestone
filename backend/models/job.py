from pydantic import BaseModel
from typing import Optional
from enum import Enum


class JobStatus(str, Enum):
    OPEN = "OPEN"
    FILLED = "FILLED"
    CLOSED = "CLOSED"


class Job(BaseModel):
    id: str
    employer_id: str
    title: str
    description: str
    required_skills: list[str]
    budget_min: float
    budget_max: float
    timeline_days: int
    status: JobStatus = JobStatus.OPEN
    created_at: str


class ApplicationStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class Application(BaseModel):
    id: str
    job_id: str
    freelancer_id: str
    cover_note: str
    status: ApplicationStatus = ApplicationStatus.PENDING
    pfi_score_at_apply: float = 500
    created_at: str
