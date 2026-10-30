/** Error body returned by the API, RFC 7807 ProblemDetails (spec section 10). */
export interface ProblemDetails {
  type?: string
  title: string
  status: number
  detail?: string
  instance?: string
  /** Validation errors by field (FluentValidation). */
  errors?: Record<string, string[]>
  traceId?: string
  /** Extension members of RFC 7807, such as the attempts left on a one-time code. */
  [extension: string]: unknown
}

export class ApiError extends Error {
  readonly problem: ProblemDetails

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title)
    this.name = 'ApiError'
    this.problem = problem
  }

  get status(): number {
    return this.problem.status
  }
}

export function isApiError(error: unknown, status?: number): error is ApiError {
  return error instanceof ApiError && (status === undefined || error.status === status)
}

/** The ProblemDetails of a failed response, or one made from its status line. */
export async function readProblem(response: Response): Promise<ProblemDetails> {
  try {
    const problem = (await response.json()) as Partial<ProblemDetails>
    return {
      ...problem,
      title: problem.title ?? response.statusText,
      status: problem.status ?? response.status,
    }
  } catch {
    return { title: response.statusText || 'Request failed', status: response.status }
  }
}
