def compute_penalty(days_late: int, payment_amount: float) -> dict:
    """Pure function: compute penalty based on days late."""
    if days_late <= 0:
        rate = 0.0
    elif days_late <= 3:
        rate = 0.05
    elif days_late <= 7:
        rate = 0.10
    else:
        rate = 0.20
    penalty_amount = round(payment_amount * rate, 2)
    return {
        "penalty_rate": rate,
        "penalty_amount": penalty_amount,
        "releasable_amount": round(payment_amount - penalty_amount, 2),
    }
