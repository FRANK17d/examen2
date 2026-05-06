const sendSuccess = (res, { statusCode = 200, message = null, data = null, pagination = null } = {}) => {
  const body = { success: true };

  if (message) body.message = message;
  if (data !== null) body.data = data;
  if (pagination) body.pagination = pagination;

  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess };
