const sequelize = require('../../config/database');
const { env } = require('../../config/env');
const Usuario = require('./usuario.model');
const Publicacion = require('./publicacion.model');

Usuario.hasMany(Publicacion, {
  foreignKey: 'id_usuario',
  as: 'publicaciones',
  onDelete: 'CASCADE',
  hooks: true,
});

Publicacion.belongsTo(Usuario, {
  foreignKey: 'id_usuario',
  as: 'usuario',
});

const connectDatabase = async () => {
  await sequelize.authenticate();

  if (env.db.sync) {
    await sequelize.sync();
  }

  console.log('Conexion a MySQL establecida');
};

module.exports = {
  sequelize,
  Usuario,
  Publicacion,
  connectDatabase,
};
