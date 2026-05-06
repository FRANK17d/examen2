const { body, param, query } = require('express-validator');

const publicacionIdValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El id de la publicacion debe ser un entero positivo')
    .toInt(),
];

const listPublicacionesValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('La pagina debe ser un entero positivo').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('El limite debe estar entre 1 y 50').toInt(),
  query('id_usuario').optional().isInt({ min: 1 }).withMessage('El id_usuario debe ser un entero positivo').toInt(),
];

const createPublicacionValidator = [
  body('contenido')
    .trim()
    .notEmpty()
    .withMessage('El contenido es requerido')
    .isLength({ max: 5000 })
    .withMessage('El contenido no puede superar 5000 caracteres'),
];

const updatePublicacionValidator = [
  body('contenido')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('El contenido debe tener entre 1 y 5000 caracteres'),
];

module.exports = {
  publicacionIdValidator,
  listPublicacionesValidator,
  createPublicacionValidator,
  updatePublicacionValidator,
};
