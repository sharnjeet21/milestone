from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
from datetime import datetime

class ProjectStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    DISPUTED = "disputed"
    CANCELLED = "cancelled"

class MilestoneStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    FULLY_COMPLETED = "fully_completed"
    PARTIALLY_COMPLETED = "partially_completed"
    UNMET = "unmet"

class DeliverableType(str, Enum):
    CODE = "code"
    CONTENT = "content"
    DESIGN = "design"
    DATA = "data"
    OTHER = "other"

class Checklist(BaseModel):
    item: str
    is_completed: bool = False
    weight: float = 1.0

class Milestone(BaseModel):
    id: str
    title: str
    description: str
    deliverable_type: DeliverableType
    checklist: List[Checklist]
    deadline_days: int
    payment_amount: float
    status: MilestoneStatus = MilestoneStatus.PENDING
    completion_score: float = 0.0
    overdue: bool = False
    penalty_amount: float = 0.0
    frozen: bool = False
    feedback: Optional[str] = None
    submitted_work: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None

class ProjectCreate(BaseModel):
    employer_id: str
    freelancer_id: str
    title: str
    description: str
    total_budget: float
    deliverable_type: DeliverableType
    timeline_days: int
    tech_stack: Optional[List[str]] = []

class Project(BaseModel):
    id: str
    employer_id: str
    freelancer_id: str
    title: str
    description: str
    total_budget: float
    milestones: List[Milestone] = []
    status: ProjectStatus = ProjectStatus.PENDING
    escrow_id: Optional[str] = None
    success_fee: float = 0.0
    created_at: datetime = Field(default_factory=datetime.now)
