import axios from "axios";

import { fsGetProject, fsGetProjects, fsGetFreelancer } from "@/lib/firestore";
import type {
  CreateProjectPayload,
  FreelancerProfile,
  PFIUpdate,
  Project,
  ProjectClarification,
} from "@/lib/types";

const backendApi = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
    "http://localhost:9001/api",
});

// ── Writes always go through the backend (which syncs to Firestore) ──────────

export async function createProject(data: CreateProjectPayload): Promise<Project> {
  const response = await backendApi.post<{ project: Project } | Project>(
    "/projects/create",
    data,
  );
  // backend returns { project, vault, message } — unwrap if needed
  const body = response.data as { project?: Project } & Partial<Project>;
  return body.project ?? (body as Project);
}

export async function clarifyProject(description: string) {
  try {
    const response = await backendApi.get<ProjectClarification>("/projects/clarify", {
      params: { description },
    });
    return response.data;
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response &&
      [404, 405, 415, 422].includes(error.response.status)
    ) {
      const fallback = await backendApi.post<ProjectClarification>(
        "/projects/clarify",
        { description },
      );
      return fallback.data;
    }
    throw error;
  }
}

export async function submitMilestone<T>(data: T) {
  const response = await backendApi.post("/milestones/submit", data);
  return response.data;
}

// ── Reads: Firestore first, backend as fallback ───────────────────────────────

export async function getProject(id: string): Promise<Project> {
  try {
    const doc = await fsGetProject(id);
    if (doc) return doc;
  } catch {
    // Firestore unavailable — fall through to backend
  }
  const response = await backendApi.get<Project>(`/projects/${id}`);
  return response.data;
}

export async function getProjects(): Promise<Project[]> {
  try {
    const docs = await fsGetProjects();
    if (docs.length > 0) return docs;
  } catch {
    // fall through
  }
  const response = await backendApi.get<Project[]>("/projects");
  return response.data;
}

export async function getEscrow(vaultId: string) {
  const response = await backendApi.get(`/escrow/${vaultId}`);
  return response.data;
}

export async function getFreelancerPFI(
  id: string,
): Promise<PFIUpdate | FreelancerProfile> {
  try {
    const doc = await fsGetFreelancer(id);
    if (doc) {
      // Normalise Firestore user doc into FreelancerProfile shape
      return {
        id: doc.id,
        name: doc.name ?? "Freelancer",
        email: doc.email ?? "",
        pfi_score: doc.pfi_score ?? 500,
        tier: doc.tier ?? "AVERAGE",
        total_projects: doc.total_projects ?? 0,
        completed_projects: doc.completed_projects ?? 0,
        on_time_deliveries: doc.on_time_deliveries ?? 0,
        total_earnings: doc.total_earnings ?? 0,
      } as FreelancerProfile;
    }
  } catch {
    // fall through
  }
  const response = await backendApi.get<PFIUpdate | FreelancerProfile>(
    `/freelancer/${id}/pfi`,
  );
  return response.data;
}

export default backendApi;

export async function assessMilestoneRisk(projectId: string, milestoneId: string, freelancerId: string) {
  const response = await backendApi.post('/escrow/assess-risk', { project_id: projectId, milestone_id: milestoneId, freelancer_id: freelancerId });
  return response.data;
}

export async function optimizePaymentSchedule(projectId: string, freelancerId: string) {
  const response = await backendApi.post('/escrow/optimize-schedule', { project_id: projectId, freelancer_id: freelancerId });
  return response.data;
}
