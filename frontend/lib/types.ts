export interface ChecklistItem {
  item: string
  is_completed: boolean
  weight: number
}

export interface Milestone {
  id: string
  title: string
  description: string
  status: string
  completion_score: number
  payment_amount: number
  deadline_days: number
  checklist: ChecklistItem[]
  feedback?: string
  submitted_work?: string
}

export interface Project {
  id: string
  employer_id: string
  freelancer_id: string
  title: string
  description: string
  total_budget: number
  timeline_days: number
  deliverable_type: string
  tech_stack?: string[]
  milestones: Milestone[]
  project_summary: string
  risk_factors: string[]
  success_criteria: string
  recommended_tech_stack: string[]
  success_fee: number
  status: string
  vault_id: string
  created_at: string
}

export interface PFIData {
  pfi_score: number
  tier: string
  tier_color: string
  perks: string
  score_change?: number
  component_breakdown?: {
    quality: { score: number; contribution: number }
    deadline: { score: number; contribution: number }
    revision_rate: { score: number; contribution: number }
    completion: { score: number; contribution: number }
  }
}

export interface EscrowVault {
  vault_id: string
  project_id: string
  total_amount: number
  locked_amount: number
  released_amount: number
  refunded_amount: number
  status: string
  transactions: Transaction[]
}

export interface Transaction {
  transaction_id: string
  type: string
  amount: number
  from_party: string
  to_party: string
  description: string
  timestamp: string
}
