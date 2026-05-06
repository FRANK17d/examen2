const { body, param } = require('express-validator');

const usuarioIdValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El id del usuario debe ser un entero positivo')
    .toInt(),
];

const updateUsuarioValidator = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('El email no es valido')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8, max: 72 })
    .withMessage('La contraseña debe tener entre 8 y 72 caracteres'),
];

module.exports = { usuarioIdValidator, updateUsuarioValidator };
