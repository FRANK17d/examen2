const publicacionService = require('../services/publicacion.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const list = asyncHandler(async (req, res) => {
  const { publicaciones, pagination } = await publicacionService.list(req.query);
  sendSuccess(res, { data: publicaciones, pagination });
});

const getById = asyncHandler(async (req, res) => {
  const publicacion = await publicacionService.getById(req.params.id);
  sendSuccess(res, { data: publicacion });
});

const create = asyncHandler(async (req, res) => {
  const publicacion = await publicacionService.create({
    contenido: req.body.contenido,
    file: req.file,
    authUser: req.user,
  });

  sendSuccess(res, { statusCode: 201, message: 'Publicacion creada', data: publicacion });
});

const update = asyncHandler(async (req, res) => {
  const publicacion = await publicacionService.update(req.params.id, {
    contenido: req.body.contenido,
    file: req.file,
    authUser: req.user,
  });

  sendSuccess(res, { message: 'Publicacion actualizada', data: publicacion });
});

const remove = asyncHandler(async (req, res) => {
  await publicacionService.delete(req.params.id, req.user);
  res.status(204).send();
});

module.exports = { list, getById, create, update, remove };
