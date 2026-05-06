const { Router } = require('express');

const publicacionController = require('../controllers/publicacion.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { uploadPostImage } = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createPublicacionValidator,
  listPublicacionesValidator,
  publicacionIdValidator,
  updatePublicacionValidator,
} = require('../validators/publicacion.validator');

const router = Router();

router.get('/', listPublicacionesValidator, validate, publicacionController.list);
router.get('/:id', publicacionIdValidator, validate, publicacionController.getById);
router.post('/', authenticate, uploadPostImage, createPublicacionValidator, validate, publicacionController.create);
router.put('/:id', authenticate, uploadPostImage, publicacionIdValidator, updatePublicacionValidator, validate, publicacionController.update);
router.delete('/:id', authenticate, publicacionIdValidator, validate, publicacionController.remove);

module.exports = router;
