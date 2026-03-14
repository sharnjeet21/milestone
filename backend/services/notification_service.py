from database.firebase import firebase_db
from datetime import datetime
import uuid


def send(user_id: str, event_type: str, message: str, metadata: dict = None) -> dict:
    """Write a notification to users/{user_id}/notifications subcollection."""
    notif_data = {
        "id": str(uuid.uuid4()),
        "event_type": event_type,
        "message": message,
        "read": False,
        "metadata": metadata or {},
        "created_at": datetime.utcnow().isoformat(),
    }
    return firebase_db.create_notification(user_id, notif_data)
