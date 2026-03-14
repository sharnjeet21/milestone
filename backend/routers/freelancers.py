from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from database.firebase import firebase_db
from services.search_service import extract_keywords, rank_freelancers

router = APIRouter(prefix="/api/freelancers", tags=["freelancers"])


# ── Request Models ────────────────────────────────────────────────────────────

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    hourly_rate: Optional[float] = None
    availability: Optional[bool] = None
    portfolio_url: Optional[str] = None


# ── Helper Functions ──────────────────────────────────────────────────────────

def compute_tier(score: float) -> tuple:
    """Return (tier_label, tier_color) based on PFI score."""
    if score < 400:
        return ("POOR", "#ef4444")
    elif score < 500:
        return ("AVERAGE", "#f97316")
    elif score < 650:
        return ("GOOD", "#eab308")
    elif score < 800:
        return ("EXCELLENT", "#22c55e")
    else:
        return ("ELITE", "#8b5cf6")


def compute_completeness(profile: dict) -> int:
    """Compute profile completeness percentage based on 7 required fields."""
    filled = 0

    if profile.get("name") and isinstance(profile["name"], str) and profile["name"].strip():
        filled += 1
    if profile.get("email") and isinstance(profile["email"], str) and profile["email"].strip():
        filled += 1
    if profile.get("skills") and isinstance(profile["skills"], list) and len(profile["skills"]) > 0:
        filled += 1
    if profile.get("bio") and isinstance(profile["bio"], str) and profile["bio"].strip():
        filled += 1
    if profile.get("hourly_rate") and isinstance(profile["hourly_rate"], (int, float)) and profile["hourly_rate"] > 0:
        filled += 1
    if profile.get("availability") is not None:
        filled += 1
    if profile.get("portfolio_url") and isinstance(profile["portfolio_url"], str) and profile["portfolio_url"].strip():
        filled += 1

    return int((filled / 7) * 100)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("")
async def list_freelancers():
    """Return all users with role='freelancer'."""
    try:
        if firebase_db.is_available():
            docs = (
                firebase_db.db.collection("users")
                .where("role", "==", "freelancer")
                .stream()
            )
            freelancers = []
            for doc in docs:
                data = {"id": doc.id, **doc.to_dict()}
                freelancers.append({
                    "id": data.get("id"),
                    "name": data.get("name"),
                    "email": data.get("email"),
                    "pfi_score": data.get("pfi_score", 500),
                    "skills": data.get("skills", []),
                    "hourly_rate": data.get("hourly_rate"),
                    "availability": data.get("availability"),
                })
            return freelancers
    except Exception as e:
        print(f"Firestore list_freelancers failed: {e}")

    return []


@router.get("/search")
async def search_freelancers(q: str = Query(..., min_length=3, description="Natural language search query")):
    """Search freelancers by natural language query. Returns ranked results."""
    # Fetch all freelancer profiles from Firestore
    all_profiles = []
    try:
        if firebase_db.is_available():
            docs = (
                firebase_db.db.collection("users")
                .where("role", "==", "freelancer")
                .stream()
            )
            for doc in docs:
                data = {"id": doc.id, **doc.to_dict()}
                all_profiles.append(data)
    except Exception as e:
        print(f"Firestore search_freelancers failed: {e}")

    keywords = extract_keywords(q)
    results = rank_freelancers(keywords, all_profiles)
    return results


@router.get("/{freelancer_id}/pfi/history")
async def get_pfi_history(freelancer_id: str):
    """Return PFI history for a freelancer, ordered by recorded_at descending."""
    profile = firebase_db.get_user(freelancer_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Freelancer not found")
    return firebase_db.get_pfi_history(freelancer_id)


@router.get("/{freelancer_id}/profile")
async def get_freelancer_profile(freelancer_id: str):
    """Return full profile including PFI score, tier, and completeness."""
    profile = firebase_db.get_user(freelancer_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Freelancer not found")

    score = profile.get("pfi_score", 500)
    tier_label, tier_color = compute_tier(score)
    completeness = compute_completeness(profile)

    return {
        **profile,
        "id": freelancer_id,
        "pfi_score": score,
        "tier": tier_label,
        "tier_color": tier_color,
        "profile_completeness": completeness,
    }


@router.put("/{freelancer_id}/profile")
async def update_freelancer_profile(freelancer_id: str, body: ProfileUpdateRequest):
    """Update profile fields and recompute completeness."""
    existing = firebase_db.get_user(freelancer_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Freelancer not found")

    updates = body.model_dump(exclude_none=True)
    merged = {**existing, **updates}

    completeness = compute_completeness(merged)
    merged["profile_completeness"] = completeness

    firebase_db.upsert_user(freelancer_id, merged)

    score = merged.get("pfi_score", 500)
    tier_label, tier_color = compute_tier(score)

    return {
        **merged,
        "id": freelancer_id,
        "pfi_score": score,
        "tier": tier_label,
        "tier_color": tier_color,
        "profile_completeness": completeness,
    }
