import uuid
from datetime import datetime
from typing import Optional
from models.project import Project, Milestone, MilestoneStatus, ProjectStatus

class EscrowVault:
    def __init__(self):
        self.vaults = {}
        self.transactions = []

    def create_vault(self, project_id: str, total_amount: float, employer_id: str) -> dict:
        vault_id = str(uuid.uuid4())
        vault = {
            "vault_id": vault_id,
            "project_id": project_id,
            "employer_id": employer_id,
            "total_amount": total_amount,
            "locked_amount": total_amount,
            "released_amount": 0.0,
            "refunded_amount": 0.0,
            "status": "ACTIVE",
            "created_at": datetime.now().isoformat(),
            "transactions": []
        }
        self.vaults[vault_id] = vault

        self._log_transaction(
            vault_id=vault_id,
            type="DEPOSIT",
            amount=total_amount,
            from_party=employer_id,
            to_party="ESCROW_VAULT",
            description="Project funds locked in escrow"
        )
        return vault

    def release_payment(self, vault_id: str, milestone_id: str, amount: float,
                       freelancer_id: str, reason: str, completion_score: float) -> dict:
        vault = self.vaults.get(vault_id)
        if not vault:
            raise ValueError("Vault not found")
        if vault["locked_amount"] < amount:
            raise ValueError("Insufficient funds in vault")

        vault["locked_amount"] -= amount
        vault["released_amount"] += amount

        transaction = self._log_transaction(
            vault_id=vault_id,
            type="MILESTONE_PAYMENT",
            amount=amount,
            from_party="ESCROW_VAULT",
            to_party=freelancer_id,
            description=f"Milestone {milestone_id} payment - Score: {completion_score}%",
            milestone_id=milestone_id,
            completion_score=completion_score
        )

        return {
            "success": True,
            "transaction_id": transaction["transaction_id"],
            "amount_released": amount,
            "remaining_in_vault": vault["locked_amount"],
            "message": reason
        }

    def release_success_fee(self, vault_id: str, freelancer_id: str, success_fee: float) -> dict:
        vault = self.vaults.get(vault_id)
        if not vault:
            raise ValueError("Vault not found")

        vault["locked_amount"] -= success_fee
        vault["released_amount"] += success_fee
        vault["status"] = "COMPLETED"

        transaction = self._log_transaction(
            vault_id=vault_id,
            type="SUCCESS_FEE",
            amount=success_fee,
            from_party="ESCROW_VAULT",
            to_party=freelancer_id,
            description="Final success fee released - Project completed!"
        )

        return {
            "success": True,
            "transaction_id": transaction["transaction_id"],
            "success_fee_released": success_fee,
            "message": "🎉 Project completed! Success fee released."
        }

    def initiate_refund(self, vault_id: str, employer_id: str, amount: float,
                       milestone_id: str, reason: str) -> dict:
        vault = self.vaults.get(vault_id)
        if not vault:
            raise ValueError("Vault not found")

        vault["locked_amount"] -= amount
        vault["refunded_amount"] += amount

        transaction = self._log_transaction(
            vault_id=vault_id,
            type="REFUND",
            amount=amount,
            from_party="ESCROW_VAULT",
            to_party=employer_id,
            description=f"Refund for unmet milestone {milestone_id}: {reason}",
            milestone_id=milestone_id
        )

        return {
            "success": True,
            "transaction_id": transaction["transaction_id"],
            "amount_refunded": amount,
            "message": f"Refund of ${amount} initiated to employer"
        }

    def get_vault_status(self, vault_id: str) -> dict:
        vault = self.vaults.get(vault_id)
        if not vault:
            raise ValueError("Vault not found")
        return vault

    def _log_transaction(self, vault_id: str, type: str, amount: float,
                        from_party: str, to_party: str, description: str,
                        milestone_id: str = None, completion_score: float = None) -> dict:
        transaction = {
            "transaction_id": str(uuid.uuid4()),
            "vault_id": vault_id,
            "type": type,
            "amount": amount,
            "from_party": from_party,
            "to_party": to_party,
            "description": description,
            "milestone_id": milestone_id,
            "completion_score": completion_score,
            "timestamp": datetime.now().isoformat()
        }
        self.transactions.append(transaction)
        if vault_id in self.vaults:
            self.vaults[vault_id]["transactions"].append(transaction)
        return transaction


class PaymentAgent:
    def __init__(self):
        self.escrow = EscrowVault()

    def process_milestone_result(self, vault_id: str, milestone: Milestone,
                                 evaluation_result: dict, freelancer_id: str,
                                 employer_id: str) -> dict:
        score = evaluation_result["completion_score"]
        payout_amount = evaluation_result["payout_amount"]
        status = evaluation_result["status"]

        result = {
            "milestone_id": milestone.id,
            "score": score,
            "status": status,
            "payment_action": None,
            "transaction": None
        }

        if status == "FULLY_COMPLETED":
            transaction = self.escrow.release_payment(
                vault_id=vault_id,
                milestone_id=milestone.id,
                amount=payout_amount,
                freelancer_id=freelancer_id,
                reason="Milestone fully completed",
                completion_score=score
            )
            result["payment_action"] = "FULL_PAYMENT_RELEASED"
            result["transaction"] = transaction
            result["message"] = f"✅ ${payout_amount} released to freelancer"

        elif status == "PARTIALLY_COMPLETED":
            transaction = self.escrow.release_payment(
                vault_id=vault_id,
                milestone_id=milestone.id,
                amount=payout_amount,
                freelancer_id=freelancer_id,
                reason=f"Partial completion ({score}%)",
                completion_score=score
            )
            refund_amount = milestone.payment_amount - payout_amount
            refund = self.escrow.initiate_refund(
                vault_id=vault_id,
                employer_id=employer_id,
                amount=refund_amount,
                milestone_id=milestone.id,
                reason="Partial completion - remaining refunded"
            )
            result["payment_action"] = "PARTIAL_PAYMENT_RELEASED"
            result["transaction"] = transaction
            result["refund"] = refund
            result["message"] = f"⚠️ ${payout_amount} released, ${refund_amount} refunded to employer"

        else:  # UNMET
            refund = self.escrow.initiate_refund(
                vault_id=vault_id,
                employer_id=employer_id,
                amount=milestone.payment_amount,
                milestone_id=milestone.id,
                reason="Milestone requirements not met"
            )
            result["payment_action"] = "FULL_REFUND"
            result["transaction"] = refund
            result["message"] = f"❌ Full refund of ${milestone.payment_amount} to employer"

        return result
