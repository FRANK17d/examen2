const { Router } = require('express');

const usuarioController = require('../controllers/usuario.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { registerValidator } = require('../validators/auth.validator');
const { updateUsuarioValidator, usuarioIdValidator } = require('../validators/usuario.validator');

const router = Router();

router.post('/', registerValidator, validate, usuarioController.create);

router.use(authenticate);
router.get('/', usuarioController.list);
router.get('/:id', usuarioIdValidator, validate, usuarioController.getById);
router.put('/:id', usuarioIdValidator, updateUsuarioValidator, validate, usuarioController.update);
router.delete('/:id', usuarioIdValidator, validate, usuarioController.remove);

module.exports = router;
