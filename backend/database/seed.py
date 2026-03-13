from datetime import datetime, timedelta

def load_sample_data(projects_db, freelancers_db, payment_agent):
    """Load sample data for demo purposes"""
    
    # Sample freelancers
    freelancers_db["demo-freelancer-1"] = {
        "id": "demo-freelancer-1",
        "pfi_score": 750.0,
        "total_projects": 5,
        "completed_milestones": 12
    }
    
    freelancers_db["demo-freelancer-2"] = {
        "id": "demo-freelancer-2",
        "pfi_score": 650.0,
        "total_projects": 3,
        "completed_milestones": 7
    }
    
    # Sample Project 1
    vault1 = payment_agent.escrow.create_vault(
        project_id="demo-project-1",
        total_amount=5000.0,
        employer_id="demo-employer-1"
    )
    
    projects_db["demo-project-1"] = {
        "id": "demo-project-1",
        "employer_id": "demo-employer-1",
        "freelancer_id": "demo-freelancer-1",
        "title": "E-commerce Website Development",
        "description": "Build a modern e-commerce platform with payment integration",
        "total_budget": 5000.0,
        "timeline_days": 45,
        "deliverable_type": "code",
        "tech_stack": ["React", "Node.js", "MongoDB", "Stripe"],
        "vault_id": vault1["vault_id"],
        "status": "ACTIVE",
        "created_at": (datetime.now() - timedelta(days=10)).isoformat(),
        "project_summary": "Full-stack e-commerce platform",
        "risk_factors": ["Payment integration", "Timeline"],
        "success_criteria": "Functional store with payments",
        "recommended_tech_stack": ["React", "Node.js", "MongoDB"],
        "success_fee": 750.0,
        "milestones": [
            {
                "id": "m1", "title": "Setup & Architecture",
                "description": "Initial setup and design",
                "deliverable_type": "code",
                "checklist": [{"item": "Setup", "weight": 1.0}],
                "deadline_days": 7, "payment_amount": 1000.0,
                "status": "FULLY_COMPLETED"
            },
            {
                "id": "m2", "title": "Frontend Development",
                "description": "Build UI components",
                "deliverable_type": "code",
                "checklist": [{"item": "Components", "weight": 2.0}],
                "deadline_days": 20, "payment_amount": 2000.0,
                "status": "PENDING"
            }
        ]
    }
    
    # Sample Project 2
    vault2 = payment_agent.escrow.create_vault(
        project_id="demo-project-2",
        total_amount=3000.0,
        employer_id="demo-employer-2"
    )
    
    projects_db["demo-project-2"] = {
        "id": "demo-project-2",
        "employer_id": "demo-employer-2",
        "freelancer_id": "demo-freelancer-2",
        "title": "Mobile App UI/UX Design",
        "description": "Design fitness tracking app interface",
        "total_budget": 3000.0,
        "timeline_days": 30,
        "deliverable_type": "design",
        "tech_stack": ["Figma", "Adobe XD"],
        "vault_id": vault2["vault_id"],
        "status": "ACTIVE",
        "created_at": (datetime.now() - timedelta(days=5)).isoformat(),
        "project_summary": "Complete UI/UX design",
        "risk_factors": ["Design revisions"],
        "success_criteria": "Pixel-perfect designs",
        "recommended_tech_stack": ["Figma"],
        "success_fee": 450.0,
        "milestones": [
            {
                "id": "m3", "title": "Research & Wireframes",
                "description": "User research and wireframes",
                "deliverable_type": "design",
                "checklist": [{"item": "Research", "weight": 1.0}],
                "deadline_days": 10, "payment_amount": 600.0,
                "status": "PENDING"
            }
        ]
    }
    
    print("✓ Sample data loaded: 2 projects, 2 freelancers")
