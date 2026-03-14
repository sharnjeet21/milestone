from datetime import datetime, timedelta
from database.firebase import firebase_db


def load_sample_data(projects_db: dict, freelancers_db: dict, payment_agent):
    """Load sample demo data into Firestore (and in-memory fallback)."""

    use_firestore = firebase_db.is_available()

    def _save_project(pid, data):
        projects_db[pid] = data
        if use_firestore:
            try:
                # Use set with merge so re-runs don't duplicate
                firebase_db.db.collection("projects").document(pid).set(data, merge=True)
            except Exception as e:
                print(f"  Firestore seed project failed: {e}")

    def _save_freelancer(fid, data):
        freelancers_db[fid] = data
        if use_firestore:
            try:
                firebase_db.db.collection("users").document(fid).set(data, merge=True)
            except Exception as e:
                print(f"  Firestore seed freelancer failed: {e}")

    # ── Freelancers ───────────────────────────────────────────────────────────
    _save_freelancer("demo-freelancer-1", {
        "id": "demo-freelancer-1",
        "name": "Alex Rivera",
        "email": "alex@demo.dev",
        "pfi_score": 750.0,
        "tier": "EXCELLENT",
        "total_projects": 5,
        "completed_projects": 5,
        "on_time_deliveries": 94,
        "total_earnings": 24000,
        "completed_milestones": 12,
    })

    _save_freelancer("demo-freelancer-2", {
        "id": "demo-freelancer-2",
        "name": "Jordan Kim",
        "email": "jordan@demo.dev",
        "pfi_score": 650.0,
        "tier": "GOOD",
        "total_projects": 3,
        "completed_projects": 3,
        "on_time_deliveries": 80,
        "total_earnings": 9000,
        "completed_milestones": 7,
    })

    # ── Project 1 ─────────────────────────────────────────────────────────────
    vault1 = payment_agent.escrow.create_vault(
        project_id="demo-project-1",
        total_amount=5000.0,
        employer_id="demo-employer-1",
    )

    _save_project("demo-project-1", {
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
        "status": "IN_PROGRESS",
        "created_at": (datetime.now() - timedelta(days=10)).isoformat(),
        "project_summary": "Full-stack e-commerce platform with AI-verified milestone payments.",
        "risk_factors": ["Payment integration complexity", "Timeline pressure"],
        "success_criteria": "Functional store with live payments",
        "recommended_tech_stack": ["React", "Node.js", "MongoDB"],
        "success_fee": 750.0,
        "milestones": [
            {
                "id": "demo-project-1_m1",
                "title": "Setup & Architecture",
                "description": "Initial project setup, repo structure, and architecture design.",
                "deliverable_type": "code",
                "checklist": [
                    {"item": "Repo initialized", "is_completed": True, "weight": 30},
                    {"item": "Architecture documented", "is_completed": True, "weight": 40},
                    {"item": "CI/CD pipeline", "is_completed": False, "weight": 30},
                ],
                "deadline_days": 7,
                "payment_amount": 1000.0,
                "status": "PARTIALLY_COMPLETED",
                "completion_score": 70,
                "feedback": "Good foundation. CI/CD pipeline still needs to be wired up.",
                "submitted_work": "",
            },
            {
                "id": "demo-project-1_m2",
                "title": "Frontend Development",
                "description": "Build all UI components and product pages.",
                "deliverable_type": "code",
                "checklist": [
                    {"item": "Product listing page", "is_completed": False, "weight": 35},
                    {"item": "Cart & checkout flow", "is_completed": False, "weight": 40},
                    {"item": "Responsive design", "is_completed": False, "weight": 25},
                ],
                "deadline_days": 20,
                "payment_amount": 2000.0,
                "status": "IN_PROGRESS",
                "completion_score": 0,
                "feedback": "",
                "submitted_work": "",
            },
            {
                "id": "demo-project-1_m3",
                "title": "Payment Integration & Launch",
                "description": "Integrate Stripe, run QA, and deploy to production.",
                "deliverable_type": "code",
                "checklist": [
                    {"item": "Stripe integration", "is_completed": False, "weight": 50},
                    {"item": "QA pass", "is_completed": False, "weight": 30},
                    {"item": "Production deploy", "is_completed": False, "weight": 20},
                ],
                "deadline_days": 18,
                "payment_amount": 2000.0,
                "status": "PENDING",
                "completion_score": 0,
                "feedback": "",
                "submitted_work": "",
            },
        ],
    })

    # ── Project 2 ─────────────────────────────────────────────────────────────
    vault2 = payment_agent.escrow.create_vault(
        project_id="demo-project-2",
        total_amount=3000.0,
        employer_id="demo-employer-2",
    )

    _save_project("demo-project-2", {
        "id": "demo-project-2",
        "employer_id": "demo-employer-2",
        "freelancer_id": "demo-freelancer-2",
        "title": "Mobile App UI/UX Design",
        "description": "Design a fitness tracking app interface with full component library.",
        "total_budget": 3000.0,
        "timeline_days": 30,
        "deliverable_type": "design",
        "tech_stack": ["Figma", "Adobe XD"],
        "vault_id": vault2["vault_id"],
        "status": "IN_PROGRESS",
        "created_at": (datetime.now() - timedelta(days=5)).isoformat(),
        "project_summary": "Complete UI/UX design system for a fitness tracking mobile app.",
        "risk_factors": ["Design revision cycles"],
        "success_criteria": "Pixel-perfect Figma handoff with component library",
        "recommended_tech_stack": ["Figma"],
        "success_fee": 450.0,
        "milestones": [
            {
                "id": "demo-project-2_m1",
                "title": "Research & Wireframes",
                "description": "User research, competitive analysis, and low-fi wireframes.",
                "deliverable_type": "design",
                "checklist": [
                    {"item": "User research complete", "is_completed": True, "weight": 40},
                    {"item": "Wireframes approved", "is_completed": False, "weight": 60},
                ],
                "deadline_days": 10,
                "payment_amount": 900.0,
                "status": "IN_PROGRESS",
                "completion_score": 40,
                "feedback": "",
                "submitted_work": "",
            },
            {
                "id": "demo-project-2_m2",
                "title": "High-Fidelity Designs",
                "description": "Full hi-fi screens with design system and component library.",
                "deliverable_type": "design",
                "checklist": [
                    {"item": "All screens designed", "is_completed": False, "weight": 50},
                    {"item": "Component library built", "is_completed": False, "weight": 50},
                ],
                "deadline_days": 20,
                "payment_amount": 2100.0,
                "status": "PENDING",
                "completion_score": 0,
                "feedback": "",
                "submitted_work": "",
            },
        ],
    })

    print("✓ Sample data loaded: 2 projects, 2 freelancers")
    if use_firestore:
        print("✓ Sample data synced to Firestore")
