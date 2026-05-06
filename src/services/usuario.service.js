const bcrypt = require('bcrypt');
const { UniqueConstraintError } = require('sequelize');

const publicacionRepository = require('../repositories/publicacion.repository');
const usuarioRepository = require('../repositories/usuario.repository');
const ApiError = require('../utils/ApiError');
const { deleteStoredUploadQuietly } = require('../utils/file');

const SALT_ROUNDS = 12;

class UsuarioService {
  async create({ nombre, email, password }) {
    const existingUser = await usuarioRepository.findByEmail(email);

    if (existingUser) {
      throw new ApiError(409, 'Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      return await usuarioRepository.create({
        nombre,
        email,
        password_hash: passwordHash,
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async list() {
    return usuarioRepository.findAll();
  }

  async getById(id) {
    const usuario = await usuarioRepository.findById(id);

    if (!usuario) {
      throw new ApiError(404, 'Usuario no encontrado');
    }

    return usuario;
  }

  async update(id, authUserId, data) {
    this.ensureSameUser(id, authUserId);

    const usuario = await usuarioRepository.findById(id);

    if (!usuario) {
      throw new ApiError(404, 'Usuario no encontrado');
    }

    const payload = {};

    if (data.nombre !== undefined) payload.nombre = data.nombre;

    if (data.email !== undefined) {
      const existingUser = await usuarioRepository.findByEmail(data.email);

      if (existingUser && existingUser.id_usuario !== usuario.id_usuario) {
        throw new ApiError(409, 'Ya existe un usuario con ese email');
      }

      payload.email = data.email;
    }

    if (data.password !== undefined) {
      payload.password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    if (Object.keys(payload).length === 0) {
      throw new ApiError(400, 'No hay datos para actualizar');
    }

    try {
      return await usuarioRepository.update(usuario, payload);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async delete(id, authUserId) {
    this.ensureSameUser(id, authUserId);

    const usuario = await usuarioRepository.findById(id);

    if (!usuario) {
      throw new ApiError(404, 'Usuario no encontrado');
    }

    const publicaciones = await publicacionRepository.findByUserId(id);

    await usuarioRepository.delete(usuario);
    await Promise.all(publicaciones.map((publicacion) => deleteStoredUploadQuietly(publicacion.imagen)));
  }

  ensureSameUser(targetUserId, authUserId) {
    if (Number(targetUserId) !== Number(authUserId)) {
      throw new ApiError(403, 'No tienes permisos para modificar este usuario');
    }
  }

  handleDatabaseError(error) {
    if (error instanceof UniqueConstraintError) {
      throw new ApiError(409, 'Ya existe un usuario con ese email');
    }

    throw error;
  }
}

module.exports = new UsuarioService();
