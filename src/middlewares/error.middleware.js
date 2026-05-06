const { ForeignKeyConstraintError, UniqueConstraintError, ValidationError } = require('sequelize');

const ApiError = require('../utils/ApiError');

const mapSequelizeError = (error) => {
  if (error instanceof UniqueConstraintError) {
    return new ApiError(409, 'Ya existe un registro con esos datos');
  }

  if (error instanceof ValidationError) {
    return new ApiError(
      400,
      'Error de validacion',
      error.errors.map((item) => ({ field: item.path, message: item.message }))
    );
  }

  if (error instanceof ForeignKeyConstraintError) {
    return new ApiError(400, 'La relacion indicada no es valida');
  }

  return error;
};

const errorMiddleware = (error, req, res, next) => {
  const mappedError = mapSequelizeError(error);
  const isKnownError = mappedError instanceof ApiError || mappedError.isOperational;
  const statusCode = mappedError.statusCode || 500;
  const message = isKnownError ? mappedError.message : 'Error interno del servidor';

  if (statusCode >= 500) {
    console.error(mappedError);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(mappedError.details ? { details: mappedError.details } : {}),
  });
};

module.exports = errorMiddleware;
