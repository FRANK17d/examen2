const buildPagination = (query, defaults = { page: 1, limit: 10, maxLimit: 50 }) => {
  const page = Math.max(Number.parseInt(query.page, 10) || defaults.page, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || defaults.limit, 1), defaults.maxLimit);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const formatPagination = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

module.exports = { buildPagination, formatPagination };
