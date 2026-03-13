import uuid
from datetime import datetime, timedelta
from models.project import MilestoneStatus

def get_sample_projects():
    """Generate sample projects for demo"""
    
    project1_id = "demo-project-1"
    project2_id = "demo-project-2"
    project3_id = "demo-project-3"
    
    vault1_id = "demo-vault-1"
    vault2_id = "demo-vault-2"
    vault3_id = "demo-vault-3"
    
    projects = {
        project1_id: {
            "id": project1_id,
            "employer_id": "demo-employer-1",
            "freelancer_id": "demo-freelancer-1",
            "title": "E-commerce Website Development",
            "description": "Build a modern e-commerce platform with payment integration",
            "total_budget": 5000.0,
            "timeline_days": 45,
            "deliverable_type": "code",
            "tech_stack": ["React", "Node.js", "MongoDB", "Stripe"],
            "vault_id": vault1_id,
            "status": "ACTIVE",
            "created_at": (datetime.now() - timedelta(days=10)).isoformat(),
            "project_summary": "Full-stack e-commerce platform with modern UI and secure payments",
            "risk_factors": ["Payment integration complexity", "Timeline pressure"],
            "success_criteria": "Fully functional store with payment processing",
            "recommended_tech_stack": ["React", "Node.js", "MongoDB", "Stripe"],
            "success_fee": 750.0,
            "milestones": [
                {
                    "id": "milestone-1-1",
                    "title": "Project Setup & Architecture",
                    "description": "Initial setup, database design, and project architecture",
                    "deliverable_type": "code",
                    "checklist": [
                        {"item": "Set up development environment", "weight": 1.0},
                        {"item": "Design database schema", "weight": 1.5},
                        {"item": "Create project documentation", "weight": 0.8},
                        {"item": "Set up version control", "weight": 0.5}
                    ],
                    "deadline_days": 7,
                    "payment_amount": 1000.0,
                    "status": "FULLY_COMPLETED",
                    "completion_score": 95,
                    "feedback": "Excellent setup with comprehensive documentation"
                },
                {
                    "id": "milestone-1-2",
                    "title": "Frontend Development",
                    "description": "Build responsive UI components and product catalog",
                    "deliverable_type": "code",
                    "checklist": [
                        {"item": "Create reusable components", "weight": 2.0},
                        {"item": "Implement product listing", "weight": 1.5},
                        {"item": "Build shopping cart", "weight": 1.5},
                        {"item": "Responsive design", "weight": 1.0}
                    ],
                    "deadline_days": 20,
                    "payment_amount": 2000.0,
                    "status": "PENDING"
                },
                {
                    "id": "milestone-1-3",
                    "title": "Backend & Payment Integration",
                    "description": "API development and Stripe payment integration",
                    "deliverable_type": "code",
                    "checklist": [
                        {"item": "Build REST APIs", "weight": 2.0},
                        {"item": "Integrate Stripe", "weight": 2.0},
                        {"item": "Implement authentication", "weight": 1.5},
                        {"item": "Security testing", "weight": 1.0}
                    ],
                    "deadline_days": 35,
                    "payment_amount": 1250.0,
                    "status": "PENDING"
                }
            ]
        },
        project2_id: {
            "id": project2_id,
            "employer_id": "demo-employer-2",
            "freelancer_id": "demo-freelancer-2",
            "title": "Mobile App UI/UX Design",
            "description": "Design modern mobile app interface for fitness tracking",
            "total_budget": 3000.0,
            "timeline_days": 30,
            "deliverable_type": "design",
            "tech_stack": ["Figma", "Adobe XD"],
            "vault_id": vault2_id,
            "status": "ACTIVE",
            "created_at": (datetime.now() - timedelta(days=5)).isoformat(),
            "project_summary": "Complete UI/UX design for fitness tracking mobile application",
            "risk_factors": ["Design revisions", "Client feedback cycles"],
            "success_criteria": "Pixel-perfect designs with interactive prototypes",
            "recommended_tech_stack": ["Figma", "Adobe XD", "Principle"],
            "success_fee": 450.0,
            "milestones": [
                {
                    "id": "milestone-2-1",
                    "title": "Research & Wireframes",
                    "description": "User research and low-fidelity wireframes",
                    "deliverable_type": "design",
                    "checklist": [
                        {"item": "Competitor analysis", "weight": 1.0},
                        {"item": "User personas", "weight": 1.0},
                        {"item": "Wireframe screens", "weight": 1.5},
                        {"item": "User flow diagrams", "weight": 0.8}
                    ],
                    "deadline_days": 10,
                    "payment_amount": 600.0,
                    "status": "PENDING"
                },
                {
                    "id": "milestone-2-2",
                    "title": "High-Fidelity Designs",
                    "description": "Complete visual design with branding",
                    "deliverable_type": "design",
                    "checklist": [
                        {"item": "Design system", "weight": 1.5},
                        {"item": "All screen designs", "weight": 2.0},
                        {"item": "Icon set", "weight": 1.0},
                        {"item": "Style guide", "weight": 1.0}
                    ],
                    "deadline_days": 22,
                    "payment_amount": 1200.0,
                    "status": "PENDING"
                },
                {
                    "id": "milestone-2-3",
                    "title": "Prototype & Handoff",
                    "description": "Interactive prototype and developer handoff",
                    "deliverable_type": "design",
                    "checklist": [
                        {"item": "Interactive prototype", "weight": 1.5},
                        {"item": "Animation specs", "weight": 1.0},
                        {"item": "Developer documentation", "weight": 1.0},
                        {"item": "Asset export", "weight": 0.8}
                    ],
                    "deadline_days": 30,
                    "payment_amount": 750.0,
                    "status": "PENDING"
                }
            ]
        },
