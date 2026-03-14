import os
import json
import uuid
import firebase_admin
from firebase_admin import credentials, firestore, auth
from typing import Optional, Dict, Any, List
from datetime import datetime

# Resolve service account path relative to this file's directory
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_DEFAULT_SA_PATH = os.path.join(_THIS_DIR, "..", "..", "firebase-service-account.json")


class FirebaseDB:
    _instance = None

    # In-memory fallback stores
    _jobs: Dict[str, Dict] = {}
    _applications: Dict[str, Dict] = {}   # key: "{job_id}/{app_id}"
    _contracts: Dict[str, Dict] = {}
    _disputes: Dict[str, Dict] = {}
    _notifications: Dict[str, Dict] = {}  # key: "{user_id}/{notif_id}"
    _pfi_history: Dict[str, Dict] = {}    # key: "{freelancer_id}/{entry_id}"

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

    def update_vault_status(self, vault_id: str, status: str) -> None:
        """Update only the vault status field."""
        self.update_vault(vault_id, {"status": status})

    def append_vault_transaction(self, vault_id: str, transaction: dict) -> None:
        """Append a transaction entry to the vault's transactions array."""
        vault = self.get_vault(vault_id)
        if vault is None:
            return
        transactions = vault.get("transactions", []) + [transaction]
        self.update_vault(vault_id, {"transactions": transactions})

    def freeze_milestone(self, vault_id: str, milestone_id: str) -> None:
        """Add milestone_id to the vault's frozen_milestones array."""
        vault = self.get_vault(vault_id)
        if vault is None:
            return
        frozen = vault.get("frozen_milestones", [])
        if milestone_id not in frozen:
            frozen = frozen + [milestone_id]
        self.update_vault(vault_id, {"frozen_milestones": frozen})

    def unfreeze_milestone(self, vault_id: str, milestone_id: str) -> None:
        """Remove milestone_id from the vault's frozen_milestones array."""
        vault = self.get_vault(vault_id)
        if vault is None:
            return
        frozen = [m for m in vault.get("frozen_milestones", []) if m != milestone_id]
        self.update_vault(vault_id, {"frozen_milestones": frozen})

    # ── Auth ──────────────────────────────────────────────────────────────────

    def verify_token(self, id_token: str) -> Optional[Dict[str, Any]]:
        try:
            return auth.verify_id_token(id_token)
        except Exception as e:
            print(f"Token verification failed: {e}")
            return None

    # ── Jobs ──────────────────────────────────────────────────────────────────

    def create_job(self, job_data: dict) -> dict:
        job_id = job_data.get("id") or str(uuid.uuid4())
        job_data["id"] = job_id
        job_data.setdefault("created_at", datetime.utcnow().isoformat())
        if self.is_available():
            try:
                self.db.collection("jobs").document(job_id).set(job_data)
                return job_data
            except Exception as e:
                print(f"Firestore create_job failed: {e}")
        FirebaseDB._jobs[job_id] = job_data
        return job_data

    def get_jobs(self, status: str = None) -> list:
        if self.is_available():
            try:
                query = self.db.collection("jobs")
                if status:
                    query = query.where("status", "==", status)
                docs = query.order_by("created_at", direction=firestore.Query.DESCENDING).stream()
                return [{"id": d.id, **d.to_dict()} for d in docs]
            except Exception as e:
                print(f"Firestore get_jobs failed: {e}")
        jobs = list(FirebaseDB._jobs.values())
        if status:
            jobs = [j for j in jobs if j.get("status") == status]
        jobs.sort(key=lambda j: j.get("created_at", ""), reverse=True)
        return jobs

    def get_job(self, job_id: str) -> Optional[dict]:
        if self.is_available():
            try:
                doc = self.db.collection("jobs").document(job_id).get()
                return {"id": doc.id, **doc.to_dict()} if doc.exists else None
            except Exception as e:
                print(f"Firestore get_job failed: {e}")
        return FirebaseDB._jobs.get(job_id)

    def update_job(self, job_id: str, updates: dict) -> dict:
        updates["updated_at"] = datetime.utcnow().isoformat()
        if self.is_available():
            try:
                self.db.collection("jobs").document(job_id).update(updates)
                doc = self.db.collection("jobs").document(job_id).get()
                return {"id": doc.id, **doc.to_dict()} if doc.exists else updates
            except Exception as e:
                print(f"Firestore update_job failed: {e}")
        if job_id in FirebaseDB._jobs:
            FirebaseDB._jobs[job_id].update(updates)
        return FirebaseDB._jobs.get(job_id, updates)

    # ── Applications ──────────────────────────────────────────────────────────

    def create_application(self, job_id: str, app_data: dict) -> dict:
        app_id = app_data.get("id") or str(uuid.uuid4())
        app_data["id"] = app_id
        app_data["job_id"] = job_id
        app_data.setdefault("created_at", datetime.utcnow().isoformat())
        if self.is_available():
            try:
                self.db.collection("jobs").document(job_id).collection("applications").document(app_id).set(app_data)
                return app_data
            except Exception as e:
                print(f"Firestore create_application failed: {e}")
        FirebaseDB._applications[f"{job_id}/{app_id}"] = app_data
        return app_data

    def get_applications(self, job_id: str) -> list:
        if self.is_available():
            try:
                docs = self.db.collection("jobs").document(job_id).collection("applications").stream()
                return [{"id": d.id, **d.to_dict()} for d in docs]
            except Exception as e:
                print(f"Firestore get_applications failed: {e}")
        prefix = f"{job_id}/"
        return [v for k, v in FirebaseDB._applications.items() if k.startswith(prefix)]

    def get_application(self, job_id: str, app_id: str) -> Optional[dict]:
        if self.is_available():
            try:
                doc = self.db.collection("jobs").document(job_id).collection("applications").document(app_id).get()
                return {"id": doc.id, **doc.to_dict()} if doc.exists else None
            except Exception as e:
                print(f"Firestore get_application failed: {e}")
        return FirebaseDB._applications.get(f"{job_id}/{app_id}")

    def update_application(self, job_id: str, app_id: str, updates: dict) -> dict:
        updates["updated_at"] = datetime.utcnow().isoformat()
        if self.is_available():
            try:
                ref = self.db.collection("jobs").document(job_id).collection("applications").document(app_id)
                ref.update(updates)
                doc = ref.get()
                return {"id": doc.id, **doc.to_dict()} if doc.exists else updates
            except Exception as e:
                print(f"Firestore update_application failed: {e}")
        key = f"{job_id}/{app_id}"
        if key in FirebaseDB._applications:
            FirebaseDB._applications[key].update(updates)
        return FirebaseDB._applications.get(key, updates)

    def get_freelancer_application(self, job_id: str, freelancer_id: str) -> Optional[dict]:
        """Return existing application by this freelancer for the given job, or None."""
        if self.is_available():
            try:
                docs = (
                    self.db.collection("jobs").document(job_id)
                    .collection("applications")
                    .where("freelancer_id", "==", freelancer_id)
                    .limit(1)
                    .stream()
                )
                for doc in docs:
                    return {"id": doc.id, **doc.to_dict()}
                return None
            except Exception as e:
                print(f"Firestore get_freelancer_application failed: {e}")
        prefix = f"{job_id}/"
        for k, v in FirebaseDB._applications.items():
            if k.startswith(prefix) and v.get("freelancer_id") == freelancer_id:
                return v
        return None

    # ── Contracts ─────────────────────────────────────────────────────────────

    def create_contract(self, contract_data: dict) -> dict:
        contract_id = contract_data.get("id") or str(uuid.uuid4())
        contract_data["id"] = contract_id
        contract_data.setdefault("created_at", datetime.utcnow().isoformat())
        if self.is_available():
            try:
                self.db.collection("contracts").document(contract_id).set(contract_data)
                return contract_data
            except Exception as e:
                print(f"Firestore create_contract failed: {e}")
        FirebaseDB._contracts[contract_id] = contract_data
        return contract_data

    def get_contract(self, contract_id: str) -> Optional[dict]:
        if self.is_available():
            try:
                doc = self.db.collection("contracts").document(contract_id).get()
                return {"id": doc.id, **doc.to_dict()} if doc.exists else None
            except Exception as e:
                print(f"Firestore get_contract failed: {e}")
        return FirebaseDB._contracts.get(contract_id)

    def update_contract(self, contract_id: str, updates: dict) -> dict:
        updates["updated_at"] = datetime.utcnow().isoformat()
        if self.is_available():
            try:
                self.db.collection("contracts").document(contract_id).update(updates)
                doc = self.db.collection("contracts").document(contract_id).get()
                return {"id": doc.id, **doc.to_dict()} if doc.exists else updates
            except Exception as e:
                print(f"Firestore update_contract failed: {e}")
        if contract_id in FirebaseDB._contracts:
            FirebaseDB._contracts[contract_id].update(updates)
        return FirebaseDB._contracts.get(contract_id, updates)

    def get_contract_by_project(self, project_id: str) -> Optional[dict]:
        if self.is_available():
            try:
                docs = (
                    self.db.collection("contracts")
                    .where("project_id", "==", project_id)
                    .limit(1)
                    .stream()
                )
                for doc in docs:
                    return {"id": doc.id, **doc.to_dict()}
                return None
            except Exception as e:
                print(f"Firestore get_contract_by_project failed: {e}")
        for v in FirebaseDB._contracts.values():
            if v.get("project_id") == project_id:
                return v
        return None

    # ── Disputes ──────────────────────────────────────────────────────────────

    def create_dispute(self, dispute_data: dict) -> dict:
        dispute_id = dispute_data.get("id") or str(uuid.uuid4())
        dispute_data["id"] = dispute_id
        dispute_data.setdefault("created_at", datetime.utcnow().isoformat())
        if self.is_available():
            try:
                self.db.collection("disputes").document(dispute_id).set(dispute_data)
                return dispute_data
            except Exception as e:
                print(f"Firestore create_dispute failed: {e}")
        FirebaseDB._disputes[dispute_id] = dispute_data
        return dispute_data

    def get_dispute(self, dispute_id: str) -> Optional[dict]:
        if self.is_available():
            try:
                doc = self.db.collection("disputes").document(dispute_id).get()
                return {"id": doc.id, **doc.to_dict()} if doc.exists else None
            except Exception as e:
                print(f"Firestore get_dispute failed: {e}")
        return FirebaseDB._disputes.get(dispute_id)

    def update_dispute(self, dispute_id: str, updates: dict) -> dict:
        updates["updated_at"] = datetime.utcnow().isoformat()
        if self.is_available():
            try:
                self.db.collection("disputes").document(dispute_id).update(updates)
                doc = self.db.collection("disputes").document(dispute_id).get()
                return {"id": doc.id, **doc.to_dict()} if doc.exists else updates
            except Exception as e:
                print(f"Firestore update_dispute failed: {e}")
        if dispute_id in FirebaseDB._disputes:
            FirebaseDB._disputes[dispute_id].update(updates)
        return FirebaseDB._disputes.get(dispute_id, updates)

    def get_disputes_by_project(self, project_id: str) -> list:
        if self.is_available():
            try:
                docs = (
                    self.db.collection("disputes")
                    .where("project_id", "==", project_id)
                    .stream()
                )
                return [{"id": d.id, **d.to_dict()} for d in docs]
            except Exception as e:
                print(f"Firestore get_disputes_by_project failed: {e}")
        return [v for v in FirebaseDB._disputes.values() if v.get("project_id") == project_id]

    # ── Notifications ─────────────────────────────────────────────────────────

    def create_notification(self, user_id: str, notif_data: dict) -> dict:
        notif_id = notif_data.get("id") or str(uuid.uuid4())
        notif_data["id"] = notif_id
        notif_data["user_id"] = user_id
        notif_data.setdefault("created_at", datetime.utcnow().isoformat())
        notif_data.setdefault("read", False)
        if self.is_available():
            try:
                self.db.collection("users").document(user_id).collection("notifications").document(notif_id).set(notif_data)
                return notif_data
            except Exception as e:
                print(f"Firestore create_notification failed: {e}")
        FirebaseDB._notifications[f"{user_id}/{notif_id}"] = notif_data
        return notif_data

    def get_notifications(self, user_id: str) -> list:
        if self.is_available():
            try:
                docs = (
                    self.db.collection("users").document(user_id)
                    .collection("notifications")
                    .order_by("created_at", direction=firestore.Query.DESCENDING)
                    .stream()
                )
                return [{"id": d.id, **d.to_dict()} for d in docs]
            except Exception as e:
                print(f"Firestore get_notifications failed: {e}")
        prefix = f"{user_id}/"
        notifs = [v for k, v in FirebaseDB._notifications.items() if k.startswith(prefix)]
        notifs.sort(key=lambda n: n.get("created_at", ""), reverse=True)
        return notifs

    # ── PFI History ───────────────────────────────────────────────────────────

    def add_pfi_history_entry(self, freelancer_id: str, entry: dict) -> dict:
        entry_id = entry.get("id") or str(uuid.uuid4())
        entry["id"] = entry_id
        if self.is_available():
            try:
                self.db.collection("users").document(freelancer_id).collection("pfi_history").document(entry_id).set(entry)
            except Exception as e:
                print(f"Firestore add_pfi_history_entry failed: {e}")
        FirebaseDB._pfi_history[f"{freelancer_id}/{entry_id}"] = entry
        return entry

    def get_pfi_history(self, freelancer_id: str) -> list:
        if self.is_available():
            try:
                docs = (
                    self.db.collection("users").document(freelancer_id)
                    .collection("pfi_history")
                    .order_by("recorded_at", direction=firestore.Query.DESCENDING)
                    .stream()
                )
                return [{"id": d.id, **d.to_dict()} for d in docs]
            except Exception as e:
                print(f"Firestore get_pfi_history failed: {e}")
        prefix = f"{freelancer_id}/"
        entries = [v for k, v in FirebaseDB._pfi_history.items() if k.startswith(prefix)]
        entries.sort(key=lambda e: e.get("recorded_at", ""), reverse=True)
        return entries

    def update_notification(self, user_id: str, notif_id: str, updates: dict) -> dict:
        updates["updated_at"] = datetime.utcnow().isoformat()
        if self.is_available():
            try:
                ref = (
                    self.db.collection("users").document(user_id)
                    .collection("notifications").document(notif_id)
                )
                ref.update(updates)
                doc = ref.get()
                return {"id": doc.id, **doc.to_dict()} if doc.exists else updates
            except Exception as e:
                print(f"Firestore update_notification failed: {e}")
        key = f"{user_id}/{notif_id}"
        if key in FirebaseDB._notifications:
            FirebaseDB._notifications[key].update(updates)
        return FirebaseDB._notifications.get(key, updates)


# Singleton
firebase_db = FirebaseDB()
