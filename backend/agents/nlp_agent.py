from pydantic import BaseModel, Field
from typing import List
import json
import uuid
import os
from models.project import Milestone, Checklist, DeliverableType, MilestoneStatus

# Try to import OpenAI, but fall back to mock if not available
try:
    from langchain_openai import ChatOpenAI
    from langchain_core.prompts import ChatPromptTemplate
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

class MilestoneOutput(BaseModel):
    title: str = Field(description="Clear milestone title")
    description: str = Field(description="Detailed milestone description")
    deliverable_type: str = Field(description="Type: code/content/design/data")
    checklist: List[dict] = Field(description="List of checklist items with weights")
    deadline_days: int = Field(description="Days to complete this milestone")
    payment_percentage: float = Field(description="Percentage of total budget")
    complexity: str = Field(description="low/medium/high complexity")

class ProjectRoadmap(BaseModel):
    project_summary: str
    total_estimated_days: int
    milestones: List[MilestoneOutput]
    risk_factors: List[str]
    success_criteria: str
    recommended_tech_stack: List[str]

class NLPAgent:
    def __init__(self):
        self.use_mock = not HAS_OPENAI or not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your_openai_key_here"
        if not self.use_mock:
            self.llm = ChatOpenAI(model="gpt-4o", temperature=0.2)

    def decompose_project(self, description: str, budget: float, timeline_days: int,
                         deliverable_type: str, tech_stack: List[str] = []) -> dict:
        if self.use_mock:
            return self._mock_decompose(description, budget, timeline_days, deliverable_type, tech_stack)
        
        prompt = ChatPromptTemplate.from_template("""You are an expert AI Project Manager. Analyze the following project and create a detailed milestone roadmap.

PROJECT DETAILS:
================
Description: {description}
Total Budget: ${budget}
Timeline: {timeline_days} days
Deliverable Type: {deliverable_type}
Tech Stack: {tech_stack}

YOUR TASK:
==========
Create a structured project roadmap with 3-6 milestones.

Each milestone must have:
1. Clear, measurable title
2. Detailed description
3. Specific checklist items (5-8 items each)
4. Realistic deadline
5. Payment percentage (all must sum to 85%, reserve 15% as success fee)
6. Complexity rating

RULES:
======
- Milestones must be sequential and logical
- Checklist items must be objectively verifiable
- Deadlines must be realistic within {timeline_days} days total
- Payment percentages must sum to exactly 85%
- Include risk factors specific to this project
- Be technical and precise

Return ONLY valid JSON in this exact format:
{{
  "project_summary": "Brief technical summary",
  "total_estimated_days": number,
  "risk_factors": ["risk1", "risk2"],
  "success_criteria": "How to define overall project success",
  "recommended_tech_stack": ["tech1", "tech2"],
  "milestones": [
    {{
      "title": "Milestone title",
      "description": "Detailed description",
      "deliverable_type": "code/content/design/data",
      "deadline_days": number,
      "payment_percentage": number,
      "complexity": "low/medium/high",
      "checklist": [
        {{"item": "Specific task", "weight": 1.0}},
        {{"item": "Another task", "weight": 1.5}}
      ]
    }}
  ]
}}""")

        chain = prompt | self.llm
        response = chain.invoke({
            "description": description,
            "budget": budget,
            "timeline_days": timeline_days,
            "deliverable_type": deliverable_type,
            "tech_stack": ", ".join(tech_stack) if tech_stack else "Not specified"
        })

        raw_json = response.content
        if "```json" in raw_json:
            raw_json = raw_json.split("```json")[1].split("```")[0]
        elif "```" in raw_json:
            raw_json = raw_json.split("```")[1].split("```")[0]

        roadmap_data = json.loads(raw_json.strip())

        milestones = []
        for i, m in enumerate(roadmap_data["milestones"]):
            milestone = Milestone(
                id=str(uuid.uuid4()),
                title=m["title"],
                description=m["description"],
                deliverable_type=DeliverableType(m["deliverable_type"]),
                checklist=[Checklist(item=c["item"], weight=c.get("weight", 1.0)) 
                          for c in m["checklist"]],
                deadline_days=m["deadline_days"],
                payment_amount=round(budget * m["payment_percentage"] / 100, 2),
                status=MilestoneStatus.PENDING
            )
            milestones.append(milestone)

        return {
            "project_summary": roadmap_data["project_summary"],
            "total_estimated_days": roadmap_data["total_estimated_days"],
            "milestones": milestones,
            "risk_factors": roadmap_data["risk_factors"],
            "success_criteria": roadmap_data["success_criteria"],
            "recommended_tech_stack": roadmap_data["recommended_tech_stack"],
            "success_fee": round(budget * 0.15, 2)
        }

    def _mock_decompose(self, description: str, budget: float, timeline_days: int,
                        deliverable_type: str, tech_stack: List[str] = []) -> dict:
        """Mock project decomposition for testing without OpenAI API"""
        milestones = [
            Milestone(
                id=str(uuid.uuid4()),
                title="Project Setup & Planning",
                description="Initial setup, architecture design, and project planning",
                deliverable_type=DeliverableType(deliverable_type),
                checklist=[
                    Checklist(item="Define project architecture", weight=1.0),
                    Checklist(item="Set up development environment", weight=1.0),
                    Checklist(item="Create project documentation", weight=0.8),
                    Checklist(item="Set up version control", weight=0.5),
                ],
                deadline_days=max(3, int(timeline_days * 0.15)),
                payment_amount=round(budget * 0.20, 2),
                status=MilestoneStatus.PENDING
            ),
            Milestone(
                id=str(uuid.uuid4()),
                title="Core Development",
                description="Main feature development and implementation",
                deliverable_type=DeliverableType(deliverable_type),
                checklist=[
                    Checklist(item="Implement core features", weight=2.0),
                    Checklist(item="Write unit tests", weight=1.5),
                    Checklist(item="Code review and refactoring", weight=1.0),
                    Checklist(item="Performance optimization", weight=1.0),
                ],
                deadline_days=max(7, int(timeline_days * 0.50)),
                payment_amount=round(budget * 0.40, 2),
                status=MilestoneStatus.PENDING
            ),
            Milestone(
                id=str(uuid.uuid4()),
                title="Testing & QA",
                description="Comprehensive testing, bug fixes, and quality assurance",
                deliverable_type=DeliverableType(deliverable_type),
                checklist=[
                    Checklist(item="Integration testing", weight=1.5),
                    Checklist(item="User acceptance testing", weight=1.5),
                    Checklist(item="Bug fixes and refinements", weight=1.0),
                    Checklist(item="Performance testing", weight=0.8),
                ],
                deadline_days=max(3, int(timeline_days * 0.25)),
                payment_amount=round(budget * 0.25, 2),
                status=MilestoneStatus.PENDING
            ),
        ]

        return {
            "project_summary": f"A {deliverable_type} project requiring {len(tech_stack)} technologies",
            "total_estimated_days": timeline_days,
            "milestones": milestones,
            "risk_factors": ["Scope creep", "Resource availability", "Technical complexity"],
            "success_criteria": "All milestones completed on time with high quality standards",
            "recommended_tech_stack": tech_stack or ["Node.js", "React", "PostgreSQL"],
            "success_fee": round(budget * 0.15, 2)
        }

    def clarify_ambiguity(self, description: str) -> dict:
        if self.use_mock:
            return {
                "clarity_score": 85,
                "is_clear_enough": True,
                "ambiguous_areas": [],
                "clarification_questions": [],
                "assumptions_made": ["Project is well-defined"]
            }
        
        prompt = ChatPromptTemplate.from_template("""Analyze this project description for ambiguity and vagueness.

Description: {description}

Return JSON with:
{{
  "clarity_score": 0-100,
  "is_clear_enough": true/false,
  "ambiguous_areas": ["area1", "area2"],
  "clarification_questions": ["question1", "question2"],
  "assumptions_made": ["assumption1", "assumption2"]
}}

If clarity_score > 70, set is_clear_enough to true.""")

        chain = prompt | self.llm
        response = chain.invoke({"description": description})
        raw_json = response.content
        if "```json" in raw_json:
            raw_json = raw_json.split("```json")[1].split("```")[0]
        return json.loads(raw_json.strip())
