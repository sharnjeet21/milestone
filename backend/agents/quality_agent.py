import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from typing import List, Optional
import json
from models.project import Milestone, MilestoneStatus, Checklist

# Try to import OpenAI, but fall back to mock if not available
try:
    from langchain_openai import ChatOpenAI
    from langchain_core.prompts import ChatPromptTemplate
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

class QualityAgent:
    def __init__(self):
        self.use_mock = not HAS_OPENAI or not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your_openai_key_here"
        if not self.use_mock:
            self.llm = ChatOpenAI(model="gpt-4o", temperature=0.1)

    def evaluate_submission(self, milestone: Milestone, submitted_work: str,
                          submission_type: str = "text") -> dict:
        if self.use_mock:
            return self._mock_evaluate(milestone, submitted_work)
        
        checklist_items = "\n".join([f"- [{i+1}] {c.item} (weight: {c.weight})"
                                     for i, c in enumerate(milestone.checklist)])

        prompt = ChatPromptTemplate.from_template("""You are a strict but fair AI Quality Assurance Officer.

MILESTONE REQUIREMENTS:
=======================
Title: {title}
Description: {description}
Type: {deliverable_type}

CHECKLIST TO VERIFY:
====================
{checklist}

SUBMITTED WORK:
===============
{submitted_work}

YOUR EVALUATION TASK:
=====================
1. Check each checklist item against the submission
2. Calculate weighted completion score (0-100)
3. Be objective and technical
4. Identify what is done vs what is missing

SCORING RULES:
==============
- 90-100: FULLY_COMPLETED → Full payment released
- 60-89:  PARTIALLY_COMPLETED → Pro-rated payment + feedback
- 0-59:   UNMET → Refund initiated for employer

Return ONLY this JSON:
{{
  "completion_score": number (0-100),
  "status": "FULLY_COMPLETED/PARTIALLY_COMPLETED/UNMET",
  "checklist_results": [
    {{
      "item": "checklist item",
      "is_met": true/false,
      "evidence": "why it is/isn't met",
      "score": number (0-100)
    }}
  ],
  "strengths": ["what was done well"],
  "gaps": ["what is missing"],
  "detailed_feedback": "Constructive feedback for freelancer",
  "recommendation": "APPROVE/REVISE/REJECT",
  "confidence_level": "high/medium/low"
}}""")

        chain = prompt | self.llm
        response = chain.invoke({
            "title": milestone.title,
            "description": milestone.description,
            "deliverable_type": milestone.deliverable_type,
            "checklist": checklist_items,
            "submitted_work": submitted_work[:4000]
        })

        raw_json = response.content
        if "```json" in raw_json:
            raw_json = raw_json.split("```json")[1].split("```")[0]

        evaluation = json.loads(raw_json.strip())

        score = evaluation["completion_score"]
        payout_percentage = self._calculate_payout(score)
        payout_amount = milestone.payment_amount * payout_percentage

        return {
            **evaluation,
            "payout_percentage": payout_percentage,
            "payout_amount": round(payout_amount, 2),
            "milestone_id": milestone.id,
            "milestone_budget": milestone.payment_amount
        }

    def _mock_evaluate(self, milestone: Milestone, submitted_work: str) -> dict:
        """Mock evaluation for testing without OpenAI API"""
        score = 85  # Default good score
        payout_percentage = self._calculate_payout(score)
        payout_amount = milestone.payment_amount * payout_percentage

        return {
            "completion_score": score,
            "status": "FULLY_COMPLETED",
            "checklist_results": [
                {
                    "item": c.item,
                    "is_met": True,
                    "evidence": "Verified in submission",
                    "score": 100
                }
                for c in milestone.checklist
            ],
            "strengths": ["Well-executed", "Meets requirements"],
            "gaps": [],
            "detailed_feedback": "Great work! All requirements met.",
            "recommendation": "APPROVE",
            "confidence_level": "high",
            "payout_percentage": payout_percentage,
            "payout_amount": round(payout_amount, 2),
            "milestone_id": milestone.id,
            "milestone_budget": milestone.payment_amount
        }

    def _calculate_payout(self, score: float) -> float:
        if score >= 90:
            return 1.0
        elif score >= 80:
            return 0.85
        elif score >= 70:
            return 0.70
        elif score >= 60:
            return 0.50
        else:
            return 0.0
