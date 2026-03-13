import axios from "axios";

import type {
  CreateProjectPayload,
  FreelancerProfile,
  PFIUpdate,
  Project,
  ProjectClarification,
} from "@/lib/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000/api",
});

export async function createProject(data: CreateProjectPayload) {
  const response = await api.post<Project>("/projects/create", data);
  return response.data;
}

export async function clarifyProject(description: string) {
  try {
    const response = await api.get<ProjectClarification>("/projects/clarify", {
      params: { description },
    });

    return response.data;
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response &&
      [404, 405, 415, 422].includes(error.response.status)
    ) {
      const fallbackResponse = await api.post<ProjectClarification>(
        "/projects/clarify",
        { description },
      );

      return fallbackResponse.data;
    }

    throw error;
  }
}

export async function submitMilestone<T>(data: T) {
  const response = await api.post("/milestones/submit", data);
  return response.data;
}

export async function getProject(id: string) {
  const response = await api.get<Project>(`/projects/${id}`);
  return response.data;
}

export async function getEscrow(vaultId: string) {
  const response = await api.get(`/escrow/${vaultId}`);
  return response.data;
}

export async function getFreelancerPFI(id: string) {
  const response = await api.get<PFIUpdate | FreelancerProfile>(
    `/freelancer/${id}/pfi`,
  );
  return response.data;
}

export default api;
