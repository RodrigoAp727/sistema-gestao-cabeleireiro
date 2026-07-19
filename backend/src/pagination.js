const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const getPaginationParams = (query = {}) => {
  const paginated = query.page !== undefined || query.limit !== undefined;
  if (!paginated) {
    return {
      paginated: false,
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      offset: 0,
    };
  }

  const page = parsePositiveInt(query.page, DEFAULT_PAGE);
  const limit = Math.min(parsePositiveInt(query.limit, DEFAULT_LIMIT), MAX_LIMIT);

  return {
    paginated: true,
    page,
    limit,
    offset: (page - 1) * limit,
  };
};

const clampPagination = ({ page, limit, total }) => {
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / limit));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  return {
    page: currentPage,
    limit,
    total,
    totalPages,
    offset: (currentPage - 1) * limit,
  };
};

const formatPaginatedResponse = ({ items, pagination }) => ({
  items,
  total: pagination.total,
  page: pagination.page,
  limit: pagination.limit,
  totalPages: pagination.totalPages,
});

module.exports = {
  getPaginationParams,
  clampPagination,
  formatPaginatedResponse,
};
