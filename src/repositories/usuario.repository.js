const { Usuario } = require('../db/models');

class UsuarioRepository {
  findAll() {
    return Usuario.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['id_usuario', 'ASC']],
    });
  }

  findById(id, options = {}) {
    const attributes = options.includePassword ? undefined : { exclude: ['password_hash'] };

    return Usuario.findByPk(id, { attributes });
  }

  findByEmail(email, options = {}) {
    const attributes = options.includePassword ? undefined : { exclude: ['password_hash'] };

    return Usuario.findOne({
      where: { email },
      attributes,
    });
  }

  create(data, options = {}) {
    return Usuario.create(data, options);
  }

  update(usuario, data, options = {}) {
    return usuario.update(data, options);
  }

  delete(usuario, options = {}) {
    return usuario.destroy(options);
  }
}

module.exports = new UsuarioRepository();
