import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001/api'

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const api = {
  getProjects: async () => {
    const response = await axiosInstance.get('/projects')
    return response.data
  },

  getProject: async (projectId: string) => {
    const response = await axiosInstance.get(`/projects/${projectId}`)
    return response.data
  },

  createProject: async (data: any) => {
    const response = await axiosInstance.post('/projects/create', data)
    return response.data
  },

  clarifyProject: async (description: string) => {
    const response = await axiosInstance.post('/projects/clarify', { description })
    return response.data
  },

  submitMilestone: async (data: any) => {
    const response = await axiosInstance.post('/milestones/submit', data)
    return response.data
  },

  getEscrowStatus: async (vaultId: string) => {
    const response = await axiosInstance.get(`/escrow/${vaultId}`)
    return response.data
  },

  getFreelancerPFI: async (freelancerId: string) => {
    const response = await axiosInstance.get(`/freelancer/${freelancerId}/pfi`)
    return response.data
  },

  assessMilestoneRisk: async (projectId: string, milestoneId: string, freelancerId: string) => {
    const response = await axiosInstance.post('/escrow/assess-risk', null, {
      params: { project_id: projectId, milestone_id: milestoneId, freelancer_id: freelancerId }
    })
    return response.data
  },

  optimizePaymentSchedule: async (projectId: string, freelancerId: string) => {
    const response = await axiosInstance.post('/escrow/optimize-schedule', null, {
      params: { project_id: projectId, freelancer_id: freelancerId }
    })
    return response.data
  },

  detectFraud: async (projectId: string, milestoneId: string, freelancerId: string, submittedWork: string, daysTaken: number, revisionCount: number) => {
    const response = await axiosInstance.post('/escrow/detect-fraud', null, {
      params: {
        project_id: projectId,
        milestone_id: milestoneId,
        freelancer_id: freelancerId,
        submitted_work: submittedWork,
        days_taken: daysTaken,
        revision_count: revisionCount
      }
    })
    return response.data
  },
}
