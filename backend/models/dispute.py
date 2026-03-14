from pydantic import BaseModel
from typing import Optional
from enum import Enum


class DisputeStatus(str, Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class DisputeResolution(str, Enum):
    EMPLOYER_WINS = "EMPLOYER_WINS"
    FREELANCER_WINS = "FREELANCER_WINS"


class Dispute(BaseModel):
    id: str
    project_id: str
    milestone_id: str
    raised_by: str
    reason: str
    evidence_url: Optional[str] = None
    status: DisputeStatus = DisputeStatus.OPEN
    resolution: Optional[DisputeResolution] = None
    resolved_at: Optional[str] = None
    created_at: str
