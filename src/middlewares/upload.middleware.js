const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const multer = require('multer');

const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');
const { deleteUploadedFileQuietly } = require('../utils/file');

const mimeExtensions = Object.freeze({
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
});

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const hasValidImageSignature = (mimeType, buffer) => {
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    return buffer.compare(Buffer.from([0x89, 0x50, 0x4e, 0x47]), 0, 4, 0, 4) === 0;
  }

  if (mimeType === 'image/gif') {
    const header = buffer.toString('ascii', 0, 6);
    return header === 'GIF87a' || header === 'GIF89a';
  }

  if (mimeType === 'image/webp') {
    return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  }

  return false;
};

const readFileHeader = async (filePath, length = 12) => {
  const handle = await fs.open(filePath, 'r');
  const buffer = Buffer.alloc(length);

  try {
    await handle.read(buffer, 0, length, 0);
  } finally {
    await handle.close();
  }

  return buffer;
};

const validateUploadedImage = async (file) => {
  if (!file) return;

  const buffer = await readFileHeader(file.path);

  if (!hasValidImageSignature(file.mimetype, buffer)) {
    await deleteUploadedFileQuietly(file);
    throw new ApiError(400, 'El archivo subido no es una imagen valida');
  }
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, env.paths.publicacionesUploadDir);
  },
  filename: (req, file, callback) => {
    const extension = mimeExtensions[file.mimetype];
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`;
    callback(null, safeName);
  },
});

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (!env.upload.allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.has(extension)) {
    callback(new ApiError(400, 'Formato de imagen no permitido. Usa jpg, png, webp o gif.'));
    return;
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.upload.maxFileSize,
  },
});

const uploadPostImage = (req, res, next) => {
  upload.single('imagen')(req, res, (error) => {
    if (!error) {
      validateUploadedImage(req.file).then(() => next()).catch(next);
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(new ApiError(400, 'La imagen supera el tamano maximo permitido'));
        return;
      }

      next(new ApiError(400, error.message));
      return;
    }

    next(error);
  });
};

module.exports = { uploadPostImage };
