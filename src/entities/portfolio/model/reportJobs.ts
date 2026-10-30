import { create } from 'zustand'

interface ReportJobsState {
  /** Jobs asked for in this session, newest first. */
  jobs: { jobId: string; portfolioId: string }[]
  add: (job: { jobId: string; portfolioId: string }) => void
}

/** The reports generated since the screen opened; the server keeps no list of them. */
export const useReportJobs = create<ReportJobsState>()((set) => ({
  jobs: [],
  add: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
}))
