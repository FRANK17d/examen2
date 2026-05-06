const usuarioService = require('../services/usuario.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const create = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.create(req.body);
  sendSuccess(res, { statusCode: 201, message: 'Usuario creado', data: usuario });
});

const list = asyncHandler(async (req, res) => {
  const usuarios = await usuarioService.list();
  sendSuccess(res, { data: usuarios });
});

const getById = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.getById(req.params.id);
  sendSuccess(res, { data: usuario });
});

const update = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.update(req.params.id, req.user.id_usuario, req.body);
  sendSuccess(res, { message: 'Usuario actualizado', data: usuario });
});

const remove = asyncHandler(async (req, res) => {
  await usuarioService.delete(req.params.id, req.user.id_usuario);
  res.status(204).send();
});

module.exports = { create, list, getById, update, remove };
