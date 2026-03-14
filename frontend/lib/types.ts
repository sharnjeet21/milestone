export type DeliverableType = "code" | "content" | "design" | "data";

export interface Checklist {
  item: string;
  is_completed: boolean;
  weight: number;
}

export interface ChecklistEvaluation extends Checklist {
  evidence?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  deliverable_type: DeliverableType | string;
  checklist: Checklist[];
  deadline_days: number;
  payment_amount: number;
  status:
    | "PENDING"
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "FULLY_COMPLETED"
    | "PARTIALLY_COMPLETED"
    | "UNMET";
  completion_score: number;
  feedback: string;
  submitted_work: string;
}

export interface Project {
  id: string;
  employer_id: string;
  freelancer_id: string;
  title: string;
  description: string;
  total_budget: number;
  timeline_days: number;
  deliverable_type: DeliverableType | string;
  tech_stack: string[];
  milestones: Milestone[];
  status: string;
  vault_id: string;
  success_fee: number;
  created_at: string;
  project_summary: string;
  risk_factors: string[];
  paypal_capture_id?: string;
  paypal_order_id?: string;
}

export interface FreelancerProfile {
  id: string;
  name: string;
  email: string;
  pfi_score: number;
  tier: string;
  total_projects: number;
  completed_projects: number;
  on_time_deliveries: number;
  total_earnings: number;
}

export interface EvaluationResult {
  completion_score: number;
  status: Milestone["status"];
  checklist_results: ChecklistEvaluation[];
  strengths: string[];
  gaps: string[];
  detailed_feedback: string;
  payout_amount: number;
  payout_percentage: number;
  pfi_update?: PFIUpdate;
}

export interface SubmitMilestonePayload {
  project_id: string;
  milestone_id: string;
  submission_type: "text" | "code" | "design";
  submission_content: string;
  days_taken: number;
  revision_count: number;
}

export interface PFIUpdate {
  previous_score: number;
  new_score: number;
  score_change: number;
  tier: string;
  tier_color: string;
  perks: string[];
  component_breakdown: Record<string, number>;
  improvement_tips: string[];
}

export interface ProjectClarification {
  clarity_score: number;
  ambiguous_areas: string[];
  clarification_questions: string[];
  is_clear_enough: boolean;
}

export interface CreateProjectPayload {
  employer_id: string;
  title: string;
  description: string;
  total_budget: number;
  timeline_days: number;
  deliverable_type: DeliverableType;
  tech_stack: string[];
}

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  required_skills: string[];
  budget_min: number;
  budget_max: number;
  timeline_days: number;
  status: 'OPEN' | 'FILLED' | 'CLOSED';
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  freelancer_id: string;
  cover_note: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  pfi_score_at_apply: number;
  created_at: string;
}

export interface VaultTransaction {
  type: 'DEPOSIT' | 'MILESTONE_PAYMENT' | 'PENALTY' | 'REFUND' | 'SUCCESS_FEE';
  amount: number;
  milestone_id?: string;
  freelancer_id?: string;
  timestamp: string;
  paypal_payout_id?: string;
}

export interface Vault {
  vault_id: string;
  project_id: string;
  employer_id: string;
  total_amount: number;
  locked_amount: number;
  released_amount: number;
  refunded_amount: number;
  status: 'UNFUNDED' | 'FUNDED' | 'CLOSED';
  paypal_capture_id?: string;
  funded_at?: string;
  transactions: VaultTransaction[];
  created_at: string;
}

export interface Signature {
  user_id: string;
  role: 'employer' | 'freelancer';
  signed_at: string;
  ip_address?: string;
}

export interface Contract {
  id: string;
  project_id: string;
  employer_id: string;
  freelancer_id: string;
  status: 'DRAFT' | 'EMPLOYER_SIGNED' | 'FREELANCER_SIGNED' | 'EXECUTED';
  party_names: { employer: string; freelancer: string };
  project_title: string;
  scope_of_work: string;
  plain_text: string;
  signatures: Signature[];
  executed_at?: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  project_id: string;
  milestone_id: string;
  raised_by: string;
  reason: string;
  evidence_url?: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  resolution?: 'EMPLOYER_WINS' | 'FREELANCER_WINS';
  resolved_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  event_type: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface PFIHistoryEntry {
  project_id: string;
  milestone_id: string;
  previous_score: number;
  new_score: number;
  score_change: number;
  component_breakdown: {
    quality: number;
    deadline: number;
    revision_rate: number;
    completion: number;
  };
  recorded_at: string;
}
