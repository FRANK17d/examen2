const { Publicacion, Usuario } = require('../db/models');

const includeUsuario = {
  model: Usuario,
  as: 'usuario',
  attributes: ['id_usuario', 'nombre', 'email'],
};

class PublicacionRepository {
  findAndCountAll({ limit, offset, id_usuario }) {
    const where = id_usuario ? { id_usuario } : undefined;

    return Publicacion.findAndCountAll({
      where,
      include: [includeUsuario],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });
  }

  findById(id) {
    return Publicacion.findByPk(id, {
      include: [includeUsuario],
    });
  }

  findByUserId(id_usuario) {
    return Publicacion.findAll({ where: { id_usuario } });
  }

  create(data, options = {}) {
    return Publicacion.create(data, options);
  }

  update(publicacion, data, options = {}) {
    return publicacion.update(data, options);
  }

  delete(publicacion, options = {}) {
    return publicacion.destroy(options);
  }
}

module.exports = new PublicacionRepository();
