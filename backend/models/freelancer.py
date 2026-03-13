from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

class FreelancerProfile(BaseModel):
    id: str
    name: str
    email: str
    skills: List[str]
    pfi_score: float = 500.0
    total_projects: int = 0
    completed_projects: int = 0
    on_time_deliveries: int = 0
    total_earnings: float = 0.0
    joined_at: datetime = Field(default_factory=datetime.now)

class PFIHistory(BaseModel):
    freelancer_id: str
    project_id: str
    milestone_scores: List[float]
    deadline_adherence: float
    quality_score: float
    revision_count: int
    final_pfi_change: float
    recorded_at: datetime = Field(default_factory=datetime.now)
