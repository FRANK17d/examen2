const path = require('path');

require('dotenv').config();

const rootDir = path.resolve(__dirname, '..', '..');
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const defaultJwtSecret = 'cambia_este_secreto_largo_en_produccion';
const databaseUrl = process.env.DATABASE_URL || process.env.JAWSDB_URL || process.env.CLEARDB_DATABASE_URL;

const toNumber = (value, fallback) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes', 'si'].includes(String(value).toLowerCase());
};

const parseDatabaseUrl = (value) => {
  if (!value) return null;

  try {
    const url = new URL(value);

    return {
      host: url.hostname,
      port: toNumber(url.port, 3306),
      database: url.pathname.replace(/^\//, ''),
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password || ''),
    };
  } catch (error) {
    throw new Error('La URL de base de datos no es valida. Revisa DATABASE_URL, JAWSDB_URL o CLEARDB_DATABASE_URL.');
  }
};

const parsedDatabaseUrl = parseDatabaseUrl(databaseUrl);
const requiredEnv = parsedDatabaseUrl ? ['JWT_SECRET'] : ['DB_NAME', 'DB_USER', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  throw new Error(`Faltan variables de entorno requeridas: ${missingEnv.join(', ')}. Copia .env.example a .env y configuralas.`);
}

if (isProduction && (process.env.JWT_SECRET === defaultJwtSecret || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET debe ser unico y tener al menos 32 caracteres en produccion.');
}

if (isProduction && toBoolean(process.env.DB_SYNC, false)) {
  throw new Error('DB_SYNC no debe usarse en produccion. Ejecuta migraciones con sequelize-cli.');
}

const env = {
  nodeEnv,
  isProduction,
  port: toNumber(process.env.PORT, 3000),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  rateLimit: {
    windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toNumber(process.env.RATE_LIMIT_MAX, 100),
  },
  db: {
    host: process.env.DB_HOST || parsedDatabaseUrl?.host || '127.0.0.1',
    port: toNumber(process.env.DB_PORT, parsedDatabaseUrl?.port || 3306),
    database: process.env.DB_NAME || parsedDatabaseUrl?.database,
    username: process.env.DB_USER || parsedDatabaseUrl?.username,
    password: process.env.DB_PASSWORD || parsedDatabaseUrl?.password || null,
    dialect: 'mysql',
    logging: toBoolean(process.env.DB_LOGGING, false),
    sync: toBoolean(process.env.DB_SYNC, false),
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    issuer: process.env.JWT_ISSUER || 'crud-social-api',
    audience: process.env.JWT_AUDIENCE || 'crud-social-client',
  },
  upload: {
    maxFileSize: toNumber(process.env.UPLOAD_MAX_SIZE_MB, 3) * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  paths: {
    rootDir,
    publicDir: path.join(rootDir, 'public'),
    uploadsDir: path.join(rootDir, 'uploads'),
    publicacionesUploadDir: path.join(rootDir, 'uploads', 'publicaciones'),
  },
};

module.exports = { env };
