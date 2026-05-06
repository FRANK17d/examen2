const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { env } = require('../config/env');
const usuarioRepository = require('../repositories/usuario.repository');
const usuarioService = require('./usuario.service');
const ApiError = require('../utils/ApiError');

class AuthService {
  async register(data) {
    const usuario = await usuarioService.create(data);
    const token = this.signToken(usuario);

    return { usuario: this.toSafeUser(usuario), token };
  }

  async login({ email, password }) {
    const usuario = await usuarioRepository.findByEmail(email, { includePassword: true });

    if (!usuario) {
      throw new ApiError(401, 'Credenciales invalidas');
    }

    const isPasswordValid = await bcrypt.compare(password, usuario.password_hash);

    if (!isPasswordValid) {
      throw new ApiError(401, 'Credenciales invalidas');
    }

    const token = this.signToken(usuario);

    return { usuario: this.toSafeUser(usuario), token };
  }

  signToken(usuario) {
    return jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
      },
      env.jwt.secret,
      {
        algorithm: 'HS256',
        audience: env.jwt.audience,
        expiresIn: env.jwt.expiresIn,
        issuer: env.jwt.issuer,
      }
    );
  }

  toSafeUser(usuario) {
    const data = usuario.get ? usuario.get({ plain: true }) : usuario;

    return {
      id_usuario: data.id_usuario,
      nombre: data.nombre,
      email: data.email,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}

module.exports = new AuthService();
