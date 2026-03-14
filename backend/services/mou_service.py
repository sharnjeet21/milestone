from datetime import datetime


PENALTY_SCHEDULE = {
    "band_1_days": "1-3",
    "band_1_rate": 0.05,
    "band_2_days": "4-7",
    "band_2_rate": 0.10,
    "band_3_days": ">7",
    "band_3_rate": 0.20,
}

DISPUTE_CLAUSE = (
    "Any dispute arising from this agreement shall first be submitted to the platform's "
    "dispute resolution process. If unresolved within 14 days, the parties agree to binding "
    "arbitration under the rules of the American Arbitration Association."
)

GOVERNING_LAW = "This agreement shall be governed by the laws of [Jurisdiction Placeholder]."


def generate(project: dict) -> dict:
    """Generate a structured MOU JSON and plain-text version from a project dict."""
    milestones = [
        {
            "title": m.get("title", ""),
            "deadline_days": m.get("deadline_days", 0),
            "payment_amount": m.get("payment_amount", 0.0),
        }
        for m in project.get("milestones", [])
    ]

    mou_json = {
        "party_names": {
            "employer": project.get("employer_name", project.get("employer_id", "Employer")),
            "freelancer": project.get("freelancer_name", project.get("freelancer_id", "Freelancer")),
        },
        "project_title": project.get("title", ""),
        "scope_of_work": project.get("description", ""),
        "milestones": milestones,
        "penalty_schedule": PENALTY_SCHEDULE,
        "dispute_clause": DISPUTE_CLAUSE,
        "governing_law": GOVERNING_LAW,
        "generated_at": datetime.utcnow().isoformat(),
    }

    lines = [
        "MEMORANDUM OF UNDERSTANDING",
        "=" * 40,
        f"Project: {mou_json['project_title']}",
        f"Employer: {mou_json['party_names']['employer']}",
        f"Freelancer: {mou_json['party_names']['freelancer']}",
        "",
        "SCOPE OF WORK",
        mou_json["scope_of_work"],
        "",
        "MILESTONES",
    ]
    for i, m in enumerate(milestones, 1):
        lines.append(f"  {i}. {m['title']} — ${m['payment_amount']:.2f} due in {m['deadline_days']} days")
    lines += [
        "",
        "PENALTY SCHEDULE",
        "  1-3 days late: 5% penalty",
        "  4-7 days late: 10% penalty",
        "  >7 days late:  20% penalty",
        "",
        "DISPUTE RESOLUTION",
        DISPUTE_CLAUSE,
        "",
        "GOVERNING LAW",
        GOVERNING_LAW,
    ]
    mou_text = "\n".join(lines)
    return {"mou_json": mou_json, "mou_text": mou_text}
