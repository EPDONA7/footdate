export interface PaginationParams {
  page?: number
  limit?: number
  skip?: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore: boolean
  }
}

export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 20))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasMore
    }
  }
}
