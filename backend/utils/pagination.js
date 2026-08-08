const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;

function parsePagination(query = {}) {
  const rawPage = Number(query.page);
  const rawPageSize = Number(query.pageSize);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const requested = Number.isFinite(rawPageSize) && rawPageSize > 0
    ? Math.floor(rawPageSize)
    : DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(requested, MAX_PAGE_SIZE);

  const skip = (page - 1) * pageSize;
  const limit = pageSize;
  return { page, pageSize, skip, limit };
}

function paginatedResponse({ data, total, page, pageSize }) {
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  return {
    data,
    page,
    pageSize,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

module.exports = {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  parsePagination,
  paginatedResponse,
};
