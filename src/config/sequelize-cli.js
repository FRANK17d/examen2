require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL || process.env.JAWSDB_URL || process.env.CLEARDB_DATABASE_URL;

const parseDatabaseUrl = (value) => {
  if (!value) return null;

  const url = new URL(value);

  return {
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password || ''),
    database: url.pathname.replace(/^\//, ''),
    host: url.hostname,
    port: Number(url.port) || 3306,
  };
};

const parsedDatabaseUrl = parseDatabaseUrl(databaseUrl);

const baseConfig = {
  username: process.env.DB_USER || parsedDatabaseUrl?.username || 'root',
  password: process.env.DB_PASSWORD || parsedDatabaseUrl?.password || null,
  database: process.env.DB_NAME || parsedDatabaseUrl?.database || 'crud_usuarios_publicaciones',
  host: process.env.DB_HOST || parsedDatabaseUrl?.host || '127.0.0.1',
  port: Number(process.env.DB_PORT) || parsedDatabaseUrl?.port || 3306,
  dialect: 'mysql',
  logging: false,
  migrationStorageTableName: 'sequelize_meta',
};

module.exports = {
  development: baseConfig,
  test: {
    ...baseConfig,
    database: process.env.DB_TEST_NAME || `${baseConfig.database}_test`,
  },
  production: baseConfig,
};
