const { validationResult } = require('express-validator');

const ApiError = require('../utils/ApiError');
const { deleteUploadedFileQuietly } = require('../utils/file');

const validate = async (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    next();
    return;
  }

  await deleteUploadedFileQuietly(req.file);

  const details = result.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  next(new ApiError(400, 'Error de validacion', details));
};

module.exports = validate;
