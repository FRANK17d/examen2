const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  sendSuccess(res, { statusCode: 201, message: 'Usuario registrado', data });
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  sendSuccess(res, { message: 'Sesion iniciada', data });
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: req.user });
});

module.exports = { register, login, me };
