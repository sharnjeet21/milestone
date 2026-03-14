from pydantic import BaseModel
from enum import Enum


class NotificationEvent(str, Enum):
    MILESTONE_SUBMITTED = "MILESTONE_SUBMITTED"
    MILESTONE_APPROVED = "MILESTONE_APPROVED"
    MILESTONE_REJECTED = "MILESTONE_REJECTED"
    PAYMENT_RELEASED = "PAYMENT_RELEASED"
    PENALTY_APPLIED = "PENALTY_APPLIED"
    DISPUTE_OPENED = "DISPUTE_OPENED"
    DISPUTE_RESOLVED = "DISPUTE_RESOLVED"
    CONTRACT_SIGNED = "CONTRACT_SIGNED"
    CONTRACT_EXECUTED = "CONTRACT_EXECUTED"


class Notification(BaseModel):
    id: str
    event_type: str
    message: str
    read: bool = False
    metadata: dict = {}
    created_at: str
