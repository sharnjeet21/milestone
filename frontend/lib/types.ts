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
