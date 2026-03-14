from pydantic import BaseModel
from typing import Optional
from enum import Enum


class ContractStatus(str, Enum):
    DRAFT = "DRAFT"
    EMPLOYER_SIGNED = "EMPLOYER_SIGNED"
    FREELANCER_SIGNED = "FREELANCER_SIGNED"
    EXECUTED = "EXECUTED"


class Signature(BaseModel):
    user_id: str
    role: str
    signed_at: str
    ip_address: str


class PenaltySchedule(BaseModel):
    band_1_rate: float = 0.05
    band_2_rate: float = 0.10
    band_3_rate: float = 0.20


class ContractMilestone(BaseModel):
    title: str
    deadline_days: int
    payment_amount: float


class Contract(BaseModel):
    id: str
    project_id: str
    employer_id: str
    freelancer_id: str
    status: ContractStatus = ContractStatus.DRAFT
    party_names: dict
    project_title: str
    scope_of_work: str
    milestones: list[ContractMilestone]
    penalty_schedule: PenaltySchedule
    dispute_clause: str
    governing_law: str
    plain_text: str = ""
    signatures: list[Signature] = []
    executed_at: Optional[str] = None
    created_at: str
