const publicacionRepository = require('../repositories/publicacion.repository');
const ApiError = require('../utils/ApiError');
const { buildPagination, formatPagination } = require('../utils/pagination');
const {
  deleteStoredUploadQuietly,
  deleteUploadedFile,
  deleteUploadedFileQuietly,
  toPublicUploadPath,
  toPublicUrl,
} = require('../utils/file');

class PublicacionService {
  async list(query) {
    const paginationInput = buildPagination(query);
    const { count, rows } = await publicacionRepository.findAndCountAll({
      ...paginationInput,
      id_usuario: query.id_usuario,
    });

    return {
      publicaciones: rows.map((publicacion) => this.format(publicacion)),
      pagination: formatPagination({
        page: paginationInput.page,
        limit: paginationInput.limit,
        total: count,
      }),
    };
  }

  async getById(id) {
    const publicacion = await publicacionRepository.findById(id);

    if (!publicacion) {
      throw new ApiError(404, 'Publicacion no encontrada');
    }

    return this.format(publicacion);
  }

  async create({ contenido, file, authUser }) {
    if (!file) {
      throw new ApiError(400, 'La imagen es requerida');
    }

    let publicacion;

    try {
      publicacion = await publicacionRepository.create({
        contenido,
        imagen: toPublicUploadPath(file.filename),
        id_usuario: authUser.id_usuario,
      });
    } catch (error) {
      await deleteUploadedFileQuietly(file);
      throw error;
    }

    const createdPublicacion = await publicacionRepository.findById(publicacion.id_post);
    return this.format(createdPublicacion);
  }

  async update(id, { contenido, file, authUser }) {
    const publicacion = await publicacionRepository.findById(id);

    if (!publicacion) {
      await deleteUploadedFileQuietly(file);
      throw new ApiError(404, 'Publicacion no encontrada');
    }

    try {
      this.ensureOwner(publicacion, authUser.id_usuario);
    } catch (error) {
      await deleteUploadedFileQuietly(file);
      throw error;
    }

    const payload = {};
    const oldImage = publicacion.imagen;

    if (contenido !== undefined) payload.contenido = contenido;
    if (file) payload.imagen = toPublicUploadPath(file.filename);

    if (Object.keys(payload).length === 0) {
      throw new ApiError(400, 'No hay datos para actualizar');
    }

    try {
      await publicacionRepository.update(publicacion, payload);
    } catch (error) {
      await deleteUploadedFileQuietly(file);
      throw error;
    }

    if (file) {
      await deleteStoredUploadQuietly(oldImage);
    }

    const updatedPublicacion = await publicacionRepository.findById(id);
    return this.format(updatedPublicacion);
  }

  async delete(id, authUser) {
    const publicacion = await publicacionRepository.findById(id);

    if (!publicacion) {
      throw new ApiError(404, 'Publicacion no encontrada');
    }

    this.ensureOwner(publicacion, authUser.id_usuario);

    const oldImage = publicacion.imagen;
    await publicacionRepository.delete(publicacion);
    await deleteStoredUploadQuietly(oldImage);
  }

  ensureOwner(publicacion, authUserId) {
    if (Number(publicacion.id_usuario) !== Number(authUserId)) {
      throw new ApiError(403, 'No tienes permisos para modificar esta publicacion');
    }
  }

  format(publicacion) {
    const data = publicacion.get({ plain: true });

    return {
      ...data,
      imagen_url: toPublicUrl(data.imagen),
    };
  }
}

module.exports = new PublicacionService();
