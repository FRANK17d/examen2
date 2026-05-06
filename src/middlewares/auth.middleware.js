const jwt = require('jsonwebtoken');

const { env } = require('../config/env');
const usuarioRepository = require('../repositories/usuario.repository');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Token de autenticacion requerido');
  }

  const token = authHeader.split(' ')[1];
  let payload;

  try {
    payload = jwt.verify(token, env.jwt.secret, {
      algorithms: ['HS256'],
      audience: env.jwt.audience,
      issuer: env.jwt.issuer,
    });
  } catch (error) {
    throw new ApiError(401, 'Token invalido o expirado');
  }

  const usuario = await usuarioRepository.findById(payload.id_usuario);

  if (!usuario) {
    throw new ApiError(401, 'Usuario del token no existe');
  }

  req.user = {
    id_usuario: usuario.id_usuario,
    nombre: usuario.nombre,
    email: usuario.email,
  };

  next();
});

module.exports = { authenticate };
