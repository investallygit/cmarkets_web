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

/**
 * What a problem says to the user: its detail, or else its first field's error ("10 MB at most.",
 * "Between 0% and 100%."), or else its title. A refused form has field errors and no detail: its
 * title alone ("Invalid request") said nothing of what to change (B49, B55, B58, B69).
 */
export function problemMessage(problem: ProblemDetails): string {
  const firstError = Object.values(problem.errors ?? {})
    .flat()
    .find((message) => message.trim() !== '')
  return problem.detail ?? firstError ?? problem.title
}

export class ApiError extends Error {
  readonly problem: ProblemDetails

  constructor(problem: ProblemDetails) {
    super(problemMessage(problem))
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
