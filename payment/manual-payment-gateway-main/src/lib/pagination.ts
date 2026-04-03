import { AppError } from './errors';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type PaginationInput = {
  page?: unknown;
  pageSize?: unknown;
};

export type PaginationParams = {
  page: number;
  pageSize: number;
  offset: number;
};

function parsePositiveInt(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return Number.isInteger(value) ? value : NaN;
  if (typeof value === 'string' && value.trim() !== '') {
    return /^\d+$/.test(value) ? Number(value) : NaN;
  }

  return NaN;
}

export function parsePagination(input: PaginationInput): PaginationParams {
  const parsedPage = parsePositiveInt(input.page);
  const parsedPageSize = parsePositiveInt(input.pageSize);

  const page = parsedPage ?? DEFAULT_PAGE;
  const pageSize = parsedPageSize ?? DEFAULT_PAGE_SIZE;

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError(400, 'BAD_REQUEST', 'page must be an integer greater than or equal to 1');
  }

  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new AppError(400, 'BAD_REQUEST', 'pageSize must be an integer greater than or equal to 1');
  }

  if (pageSize > MAX_PAGE_SIZE) {
    throw new AppError(400, 'BAD_REQUEST', `pageSize must be less than or equal to ${MAX_PAGE_SIZE}`);
  }

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize
  };
}

export function buildPaginationMeta(totalCount: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize)
  };
}
