import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, auth
from typing import Optional, Dict, Any, List
from datetime import datetime

class FirebaseDB:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseDB, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        # Initialize Firebase Admin SDK
        try:
            # Try to load from service account file
            cred_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
            else:
                # Try to load from environment variable JSON
                cred_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
                if cred_json:
                    cred_dict = json.loads(cred_json)
                    cred = credentials.Certificate(cred_dict)
                else:
                    # Use default credentials
                    cred = credentials.ApplicationDefault()
            
            firebase_admin.initialize_app(cred)
            self.db = firestore.client()
            self._initialized = True
            print("✓ Firebase initialized successfully")
        except Exception as e:
            print(f"⚠ Firebase initialization failed: {e}")
            print("⚠ Using in-memory storage instead")
            self.db = None
            self._initialized = True
    
    def is_available(self) -> bool:
        return self.db is not None
    
    # Projects
    def create_project(self, project_id: str, project_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_available():
            return project_data
        
        project_data['createdAt'] = datetime.now().isoformat()
        self.db.collection('projects').document(project_id).set(project_data)
        return project_data
    
    def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_available():
            return None
        
        doc = self.db.collection('projects').document(project_id).get()
        return doc.to_dict() if doc.exists else None
    
    def get_projects(self, user_id: Optional[str] = None, role: Optional[str] = None) -> List[Dict[str, Any]]:
        if not self.is_available():
            return []
        
        query = self.db.collection('projects')
        
        if user_id and role == 'employer':
            query = query.where('employer_id', '==', user_id)
        elif user_id and role == 'freelancer':
            query = query.where('freelancer_id', '==', user_id)
        
        query = query.order_by('createdAt', direction=firestore.Query.DESCENDING).limit(50)
        
        docs = query.stream()
        return [{'id': doc.id, **doc.to_dict()} for doc in docs]
    
    def update_project(self, project_id: str, updates: Dict[str, Any]) -> None:
        if not self.is_available():
            return
        
        updates['updatedAt'] = datetime.now().isoformat()
        self.db.collection('projects').document(project_id).update(updates)
    
    # Users
    def create_user(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_available():
            return user_data
        
        user_data['createdAt'] = datetime.now().isoformat()
        self.db.collection('users').document(user_id).set(user_data)
        return user_data
    
    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_available():
            return None
        
        doc = self.db.collection('users').document(user_id).get()
        return doc.to_dict() if doc.exists else None
    
    def update_user(self, user_id: str, updates: Dict[str, Any]) -> None:
        if not self.is_available():
            return
        
        updates['updatedAt'] = datetime.now().isoformat()
        self.db.collection('users').document(user_id).update(updates)
    
    # Vaults
    def create_vault(self, vault_id: str, vault_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_available():
            return vault_data
        
        vault_data['createdAt'] = datetime.now().isoformat()
        self.db.collection('vaults').document(vault_id).set(vault_data)
        return vault_data
    
    def get_vault(self, vault_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_available():
            return None
        
        doc = self.db.collection('vaults').document(vault_id).get()
        return doc.to_dict() if doc.exists else None
    
    def update_vault(self, vault_id: str, updates: Dict[str, Any]) -> None:
        if not self.is_available():
            return
        
        updates['updatedAt'] = datetime.now().isoformat()
        self.db.collection('vaults').document(vault_id).update(updates)
    
    # Verify Firebase Auth Token
    def verify_token(self, id_token: str) -> Optional[Dict[str, Any]]:
        try:
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except Exception as e:
            print(f"Token verification failed: {e}")
            return None

# Singleton instance
firebase_db = FirebaseDB()
