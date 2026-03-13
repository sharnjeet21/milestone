from typing import List

class PFIAgent:
    """Professional Fidelity Index Calculator
    Score Range: 300-900 (Similar to CIBIL/Credit Score)
    """
    
    WEIGHTS = {
        "quality_score": 0.40,
        "deadline_adherence": 0.30,
        "revision_rate": 0.15,
        "completion_rate": 0.15
    }

    TIERS = {
        (800, 900): {"label": "ELITE", "color": "#FFD700", "perks": "Instant payment, Priority matching"},
        (700, 799): {"label": "EXCELLENT", "color": "#00C851", "perks": "Fast payment, Premium projects"},
        (600, 699): {"label": "GOOD", "color": "#33B5E5", "perks": "Standard payment terms"},
        (500, 599): {"label": "AVERAGE", "color": "#FF8800", "perks": "Escrow hold extended"},
        (300, 499): {"label": "POOR", "color": "#FF4444", "perks": "Restricted access, Manual review"}
    }

    def calculate_pfi(self, current_score: float, milestone_completion_score: float,
                     deadline_met: bool, days_late: int = 0, revision_count: int = 0,
                     project_completed: bool = False) -> dict:
        
        quality_component = milestone_completion_score

        if deadline_met:
            deadline_component = 100
        elif days_late <= 1:
            deadline_component = 85
        elif days_late <= 3:
            deadline_component = 70
        elif days_late <= 7:
            deadline_component = 50
        else:
            deadline_component = 20

        if revision_count == 0:
            revision_component = 100
        elif revision_count == 1:
            revision_component = 85
        elif revision_count == 2:
            revision_component = 70
        elif revision_count <= 4:
            revision_component = 50
        else:
            revision_component = 30

        completion_component = 100 if project_completed else 80

        weighted_score = (
            quality_component * self.WEIGHTS["quality_score"] +
            deadline_component * self.WEIGHTS["deadline_adherence"] +
            revision_component * self.WEIGHTS["revision_rate"] +
            completion_component * self.WEIGHTS["completion_rate"]
        )

        performance_vs_average = weighted_score - 70
        pfi_delta = performance_vs_average * 0.5

        if weighted_score < 50:
            pfi_delta = pfi_delta * 1.5

        new_score = max(300, min(900, current_score + pfi_delta))
        tier = self._get_tier(new_score)

        return {
            "previous_score": current_score,
            "new_score": round(new_score, 1),
            "score_change": round(pfi_delta, 1),
            "tier": tier["label"],
            "tier_color": tier["color"],
            "perks": tier["perks"],
            "component_breakdown": {
                "quality": {
                    "score": quality_component,
                    "weight": "40%",
                    "contribution": round(quality_component * 0.40, 1)
                },
                "deadline": {
                    "score": deadline_component,
                    "weight": "30%",
                    "contribution": round(deadline_component * 0.30, 1)
                },
                "revision_rate": {
                    "score": revision_component,
                    "weight": "15%",
                    "contribution": round(revision_component * 0.15, 1)
                },
                "completion": {
                    "score": completion_component,
                    "weight": "15%",
                    "contribution": round(completion_component * 0.15, 1)
                }
            },
            "weighted_performance": round(weighted_score, 1),
            "improvement_tips": self._get_improvement_tips(quality_component, deadline_component, revision_component)
        }

    def _get_tier(self, score: float) -> dict:
        for (low, high), tier_data in self.TIERS.items():
            if low <= score <= high:
                return tier_data
        return self.TIERS[(300, 499)]

    def _get_improvement_tips(self, quality: float, deadline: float, revision: float) -> List[str]:
        tips = []
        if quality < 80:
            tips.append("📈 Focus on meeting all checklist requirements before submission")
        if deadline < 80:
            tips.append("⏰ Communicate early if deadlines are at risk")
        if revision < 80:
            tips.append("🎯 Review requirements thoroughly before submitting to reduce revisions")
        if not tips:
            tips.append("🌟 Excellent performance! Keep maintaining this quality")
        return tips
