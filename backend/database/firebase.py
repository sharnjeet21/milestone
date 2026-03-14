import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, auth
from typing import Optional, Dict, Any, List
from datetime import datetime

# Resolve service account path relative to this file's directory
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_DEFAULT_SA_PATH = os.path.join(_THIS_DIR, "..", "..", "firebase-service-account.json")


class FirebaseDB:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.db = None
        self._initialized = True

        try:
            # 1. Explicit env var path
            cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
            if cred_path:
                cred_path = os.path.abspath(cred_path)

            # 2. Fall back to default relative location
            if not cred_path or not os.path.exists(cred_path):
                cred_path = os.path.abspath(_DEFAULT_SA_PATH)

            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                print(f"✓ Using service account: {cred_path}")
            else:
                # 3. Try JSON from env
                cred_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
                if cred_json:
                    cred = credentials.Certificate(json.loads(cred_json))
                    print("✓ Using service account from env JSON")
                else:
                    print("⚠ No Firebase credentials found — using in-memory storage")
                    return

            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)

            self.db = firestore.client()
            print("✓ Firestore connected")

        except Exception as e:
            print(f"⚠ Firebase init failed: {e}")
            print("⚠ Falling back to in-memory storage")
            self.db = None

    def is_available(self) -> bool:
        return self.db is not None

    # ── Projects ──────────────────────────────────────────────────────────────

    def create_project(self, project_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_available():
            return data
        data["createdAt"] = datetime.now().isoformat()
        self.db.collection("projects").document(project_id).set(data)
        return data

    def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_available():
            return None
        doc = self.db.collection("projects").document(project_id).get()
        return doc.to_dict() if doc.exists else None

    def get_all_projects(self) -> List[Dict[str, Any]]:
        if not self.is_available():
            return []
        docs = self.db.collection("projects").order_by(
            "createdAt", direction=firestore.Query.DESCENDING
        ).limit(100).stream()
        return [{"id": d.id, **d.to_dict()} for d in docs]

    def get_projects_by_employer(self, employer_id: str) -> List[Dict[str, Any]]:
        if not self.is_available():
            return []
        docs = (
            self.db.collection("projects")
            .where("employer_id", "==", employer_id)
            .order_by("createdAt", direction=firestore.Query.DESCENDING)
            .stream()
        )
        return [{"id": d.id, **d.to_dict()} for d in docs]

    def update_project(self, project_id: str, updates: Dict[str, Any]) -> None:
        if not self.is_available():
            return
        updates["updatedAt"] = datetime.now().isoformat()
        self.db.collection("projects").document(project_id).update(updates)

    # ── Users / Freelancers ───────────────────────────────────────────────────

    def create_user(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_available():
            return data
        data["createdAt"] = datetime.now().isoformat()
        self.db.collection("users").document(user_id).set(data)
        return data

    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_available():
            return None
        doc = self.db.collection("users").document(user_id).get()
        return doc.to_dict() if doc.exists else None

    def upsert_user(self, user_id: str, data: Dict[str, Any]) -> None:
        if not self.is_available():
            return
        data["updatedAt"] = datetime.now().isoformat()
        self.db.collection("users").document(user_id).set(data, merge=True)

    # ── Vaults ────────────────────────────────────────────────────────────────

    def create_vault(self, vault_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_available():
            return data
        data["createdAt"] = datetime.now().isoformat()
        self.db.collection("vaults").document(vault_id).set(data)
        return data

    def get_vault(self, vault_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_available():
            return None
        doc = self.db.collection("vaults").document(vault_id).get()
        return doc.to_dict() if doc.exists else None

    def update_vault(self, vault_id: str, updates: Dict[str, Any]) -> None:
        if not self.is_available():
            return
        updates["updatedAt"] = datetime.now().isoformat()
        self.db.collection("vaults").document(vault_id).update(updates)

    # ── Auth ──────────────────────────────────────────────────────────────────

    def verify_token(self, id_token: str) -> Optional[Dict[str, Any]]:
        try:
            return auth.verify_id_token(id_token)
        except Exception as e:
            print(f"Token verification failed: {e}")
            return None


# Singleton
firebase_db = FirebaseDB()
