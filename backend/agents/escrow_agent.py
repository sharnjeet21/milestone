import os
import json
from typing import Optional
from datetime import datetime

try:
    from langchain_openai import ChatOpenAI
    from langchain_core.prompts import ChatPromptTemplate
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False


class SmartEscrowAgent:
    """AI-powered escrow management with risk assessment and smart payment optimization"""
    
    def __init__(self):
        self.use_mock = not HAS_OPENAI or not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your_openai_key_here"
        if not self.use_mock:
            self.llm = ChatOpenAI(model="gpt-4o", temperature=0.3)

    def assess_risk(self, project_data: dict, freelancer_pfi: float, milestone_data: dict) -> dict:
        """Assess risk level for a milestone payment"""
        if self.use_mock:
            return self._mock_assess_risk(project_data, freelancer_pfi, milestone_data)
        
        prompt = ChatPromptTemplate.from_template("""You are an expert escrow risk analyst. Assess the risk for this milestone payment.

PROJECT INFO:
- Title: {project_title}
- Budget: ${total_budget}
- Timeline: {timeline_days} days
- Tech Stack: {tech_stack}

FREELANCER PROFILE:
- PFI Score: {pfi_score}/900
- Completed Milestones: {completed_milestones}
- Success Rate: {success_rate}%

MILESTONE DETAILS:
- Title: {milestone_title}
- Payment: ${payment_amount}
- Deadline: {deadline_days} days
- Complexity: {complexity}

Analyze and return JSON:
{{
  "risk_level": "LOW/MEDIUM/HIGH/CRITICAL",
  "risk_score": 0-100,
  "risk_factors": ["factor1", "factor2"],
  "mitigation_strategies": ["strategy1", "strategy2"],
  "recommended_hold_percentage": 0-100,
  "payment_recommendation": "FULL_RELEASE/PARTIAL_HOLD/FULL_HOLD",
  "confidence": "high/medium/low",
  "reasoning": "Brief explanation"
}}""")

        chain = prompt | self.llm
        response = chain.invoke({
            "project_title": project_data.get("title", "Unknown"),
            "total_budget": project_data.get("total_budget", 0),
            "timeline_days": project_data.get("timeline_days", 0),
            "tech_stack": ", ".join(project_data.get("tech_stack", [])),
            "pfi_score": freelancer_pfi,
            "completed_milestones": project_data.get("completed_milestones", 0),
            "success_rate": project_data.get("success_rate", 0),
            "milestone_title": milestone_data.get("title", "Unknown"),
            "payment_amount": milestone_data.get("payment_amount", 0),
            "deadline_days": milestone_data.get("deadline_days", 0),
            "complexity": milestone_data.get("complexity", "medium")
        })

        raw_json = response.content
        if "```json" in raw_json:
            raw_json = raw_json.split("```json")[1].split("```")[0]
        elif "```" in raw_json:
            raw_json = raw_json.split("```")[1].split("```")[0]

        return json.loads(raw_json.strip())

    def _mock_assess_risk(self, project_data: dict, freelancer_pfi: float, milestone_data: dict) -> dict:
        """Mock risk assessment for testing"""
        # Calculate risk based on PFI score
        if freelancer_pfi >= 750:
            risk_level = "LOW"
            risk_score = 15
            hold_percentage = 0
            recommendation = "FULL_RELEASE"
        elif freelancer_pfi >= 650:
            risk_level = "MEDIUM"
            risk_score = 35
            hold_percentage = 10
            recommendation = "PARTIAL_HOLD"
        elif freelancer_pfi >= 500:
            risk_level = "HIGH"
            risk_score = 60
            hold_percentage = 25
            recommendation = "PARTIAL_HOLD"
        else:
            risk_level = "CRITICAL"
            risk_score = 85
            hold_percentage = 50
            recommendation = "FULL_HOLD"

        return {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "risk_factors": [
                "Freelancer experience level",
                "Project complexity",
                "Timeline pressure"
            ],
            "mitigation_strategies": [
                "Staged payment releases",
                "Enhanced quality checks",
                "Regular milestone reviews"
            ],
            "recommended_hold_percentage": hold_percentage,
            "payment_recommendation": recommendation,
            "confidence": "high",
            "reasoning": f"Based on PFI score of {freelancer_pfi}, risk level is {risk_level}"
        }

    def optimize_payment_schedule(self, vault_data: dict, milestones: list, freelancer_pfi: float) -> dict:
        """Optimize payment release schedule based on risk and performance"""
        if self.use_mock:
            return self._mock_optimize_schedule(vault_data, milestones, freelancer_pfi)

        milestones_str = "\n".join([
            f"- {m['title']}: ${m['payment_amount']} ({m['deadline_days']} days)"
            for m in milestones
        ])

        prompt = ChatPromptTemplate.from_template("""You are a payment optimization expert. Create an optimal payment schedule.

VAULT STATUS:
- Total: ${total_amount}
- Locked: ${locked_amount}
- Released: ${released_amount}

FREELANCER PFI: {pfi_score}/900

MILESTONES:
{milestones}

Create optimal payment schedule JSON:
{{
  "payment_strategy": "AGGRESSIVE/BALANCED/CONSERVATIVE",
  "milestone_adjustments": [
    {{
      "milestone_index": 0,
      "original_payment": number,
      "adjusted_payment": number,
      "hold_amount": number,
      "release_condition": "condition"
    }}
  ],
  "total_immediate_release": number,
  "total_held": number,
  "success_probability": 0-100,
  "strategy_rationale": "explanation"
}}""")

        chain = prompt | self.llm
        response = chain.invoke({
            "total_amount": vault_data.get("total_amount", 0),
            "locked_amount": vault_data.get("locked_amount", 0),
            "released_amount": vault_data.get("released_amount", 0),
            "pfi_score": freelancer_pfi,
            "milestones": milestones_str
        })

        raw_json = response.content
        if "```json" in raw_json:
            raw_json = raw_json.split("```json")[1].split("```")[0]
        elif "```" in raw_json:
            raw_json = raw_json.split("```")[1].split("```")[0]

        return json.loads(raw_json.strip())

    def _mock_optimize_schedule(self, vault_data: dict, milestones: list, freelancer_pfi: float) -> dict:
        """Mock payment schedule optimization"""
        total_amount = vault_data.get("total_amount", 0)
        
        if freelancer_pfi >= 750:
            strategy = "AGGRESSIVE"
            release_ratio = 0.95
        elif freelancer_pfi >= 650:
            strategy = "BALANCED"
            release_ratio = 0.75
        else:
            strategy = "CONSERVATIVE"
            release_ratio = 0.50

        adjustments = []
        total_immediate = 0
        total_held = 0

        for i, milestone in enumerate(milestones):
            original = milestone.get("payment_amount", 0)
            adjusted = original * release_ratio
            held = original - adjusted
            
            adjustments.append({
                "milestone_index": i,
                "original_payment": original,
                "adjusted_payment": round(adjusted, 2),
                "hold_amount": round(held, 2),
                "release_condition": "Upon quality verification"
            })
            
            total_immediate += adjusted
            total_held += held

        return {
            "payment_strategy": strategy,
            "milestone_adjustments": adjustments,
            "total_immediate_release": round(total_immediate, 2),
            "total_held": round(total_held, 2),
            "success_probability": min(95, int(freelancer_pfi / 9.47)),
            "strategy_rationale": f"Using {strategy} strategy based on PFI score of {freelancer_pfi}"
        }

    def detect_fraud_signals(self, submission_data: dict, freelancer_history: dict, project_data: dict) -> dict:
        """Detect potential fraud signals in submissions"""
        if self.use_mock:
            return self._mock_detect_fraud(submission_data, freelancer_history, project_data)

        prompt = ChatPromptTemplate.from_template("""Analyze this submission for fraud signals.

SUBMISSION:
- Work: {submitted_work}
- Days Taken: {days_taken}
- Revisions: {revision_count}

FREELANCER HISTORY:
- Avg Completion Time: {avg_completion_days} days
- Revision Rate: {avg_revisions}
- Dispute Rate: {dispute_rate}%

PROJECT:
- Complexity: {complexity}
- Budget: ${budget}

Return fraud analysis JSON:
{{
  "fraud_risk": "NONE/LOW/MEDIUM/HIGH",
  "fraud_score": 0-100,
  "red_flags": ["flag1", "flag2"],
  "confidence": "high/medium/low",
  "recommendation": "APPROVE/REVIEW/REJECT",
  "reasoning": "explanation"
}}""")

        chain = prompt | self.llm
        response = chain.invoke({
            "submitted_work": submission_data.get("work", "")[:1000],
            "days_taken": submission_data.get("days_taken", 0),
            "revision_count": submission_data.get("revision_count", 0),
            "avg_completion_days": freelancer_history.get("avg_completion_days", 0),
            "avg_revisions": freelancer_history.get("avg_revisions", 0),
            "dispute_rate": freelancer_history.get("dispute_rate", 0),
            "complexity": project_data.get("complexity", "medium"),
            "budget": project_data.get("budget", 0)
        })

        raw_json = response.content
        if "```json" in raw_json:
            raw_json = raw_json.split("```json")[1].split("```")[0]
        elif "```" in raw_json:
            raw_json = raw_json.split("```")[1].split("```")[0]

        return json.loads(raw_json.strip())

    def _mock_detect_fraud(self, submission_data: dict, freelancer_history: dict, project_data: dict) -> dict:
        """Mock fraud detection"""
        return {
            "fraud_risk": "NONE",
            "fraud_score": 5,
            "red_flags": [],
            "confidence": "high",
            "recommendation": "APPROVE",
            "reasoning": "No suspicious patterns detected"
        }
