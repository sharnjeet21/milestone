from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database.firebase import firebase_db
from typing import Optional, Dict, Any

security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Optional[Dict[str, Any]]:
    """
    Verify Firebase Auth token and return user info.
    Returns None if no token provided (for optional auth).
    Raises HTTPException if token is invalid.
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    user = firebase_db.verify_token(token)
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

async def require_auth(
    user: Optional[Dict[str, Any]] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Require authentication. Raises 401 if not authenticated.
    """
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def require_role(required_role: str):
    """
    Require specific role (employer or freelancer).
    """
    async def role_checker(user: Dict[str, Any] = Depends(require_auth)) -> Dict[str, Any]:
        user_data = firebase_db.get_user(user['uid'])
        if not user_data or user_data.get('role') != required_role:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. {required_role.capitalize()} role required."
            )
        return user
    return role_checker
