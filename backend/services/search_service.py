"""
Search service: profile completeness, completeness gate, and freelancer ranking.
"""
from typing import List

try:
    from agents.nlp_agent import NLPAgent
except ImportError:
    NLPAgent = None  # type: ignore

# Common English stopwords to filter out during keyword extraction
_STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "i", "we", "you", "he", "she", "they", "it",
    "who", "what", "which", "that", "this", "these", "those", "not", "no",
    "need", "want", "looking", "find", "someone", "person", "developer",
    "engineer", "expert", "experienced", "good", "great", "strong",
}


def _fallback_extract_keywords(query: str) -> List[str]:
    """Simple keyword extraction: lowercase, split, filter stopwords."""
    tokens = query.lower().split()
    return [t.strip(".,!?;:") for t in tokens if t.strip(".,!?;:") not in _STOPWORDS and len(t) > 1]


def extract_keywords(query: str) -> List[str]:
    """Extract keywords from a query string using NLPAgent if available, else fallback."""
    if NLPAgent is not None:
        agent = NLPAgent()
        # NLPAgent has no extract_keywords method; use fallback
        if hasattr(agent, "extract_keywords"):
            return agent.extract_keywords(query)
    return _fallback_extract_keywords(query)


def compute_completeness(profile: dict) -> int:
    """
    Compute profile completeness percentage based on 7 required fields.

    Fields: name, email, skills (non-empty list), bio,
            hourly_rate (>0), availability (not None), portfolio_url.

    Returns int((filled / 7) * 100).
    """
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


def is_profile_complete(profile: dict) -> bool:
    """
    Return True only if the profile has both a non-empty skills list and a non-empty bio.

    Profiles failing this check are excluded from search results (Requirement 1.8).
    """
    has_skills = (
        isinstance(profile.get("skills"), list)
        and len(profile["skills"]) > 0
    )
    has_bio = (
        isinstance(profile.get("bio"), str)
        and bool(profile["bio"].strip())
    )
    return has_skills and has_bio


def rank_freelancers(query_keywords: List[str], profiles: List[dict]) -> List[dict]:
    """
    Filter and rank freelancer profiles by relevance to query_keywords.

    Filtering rules:
    - Exclude profiles where availability is False.
    - Exclude profiles where is_profile_complete() returns False.

    Scoring formula per remaining profile:
    - skill_overlap_ratio = len(matching skills) / max(len(query_keywords), 1)
    - pfi_normalized      = (pfi_score - 300) / 600   (maps 300-900 → 0-1)
    - match_score         = skill_overlap_ratio * 0.6 + pfi_normalized * 0.4

    Returns profiles sorted by match_score descending, each with match_score added.
    """
    keywords_lower = [kw.lower() for kw in query_keywords]

    eligible = [
        p for p in profiles
        if p.get("availability") is not False and is_profile_complete(p)
    ]

    scored = []
    for profile in eligible:
        profile_skills = [s.lower() for s in (profile.get("skills") or [])]
        matching = sum(1 for kw in keywords_lower if kw in profile_skills)
        skill_overlap_ratio = matching / max(len(query_keywords), 1)

        pfi_score = profile.get("pfi_score", 500)
        pfi_normalized = (pfi_score - 300) / 600

        match_score = skill_overlap_ratio * 0.6 + pfi_normalized * 0.4

        scored.append({**profile, "match_score": match_score})

    scored.sort(key=lambda p: p["match_score"], reverse=True)
    return scored
