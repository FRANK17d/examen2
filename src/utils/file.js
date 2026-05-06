const fs = require('fs/promises');
const path = require('path');
const { env } = require('../config/env');

const toPublicUploadPath = (filename) => `uploads/publicaciones/${filename}`;

const toPublicUrl = (storedPath) => {
  if (!storedPath) return null;
  return `/${storedPath.replace(/\\/g, '/')}`;
};

const deleteFileByPath = async (filePath) => {
  if (!filePath) return;

  await fs.unlink(filePath).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
};

const isInsideDirectory = (targetPath, directoryPath) => {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedDirectory = path.resolve(directoryPath);
  const relativePath = path.relative(resolvedDirectory, resolvedTarget);

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const resolveStoredUpload = (storedPath) => {
  const cleanPath = storedPath.replace(/^[/\\]+/, '');
  const absolutePath = path.resolve(env.paths.rootDir, cleanPath);

  if (!isInsideDirectory(absolutePath, env.paths.publicacionesUploadDir)) {
    throw new Error('Ruta de archivo almacenado no permitida');
  }

  return absolutePath;
};

const deleteStoredUpload = async (storedPath) => {
  if (!storedPath) return;

  const absolutePath = resolveStoredUpload(storedPath);
  await deleteFileByPath(absolutePath);
};

const deleteUploadedFile = async (file) => {
  if (!file || !file.path) return;
  await deleteFileByPath(file.path);
};

const runQuietly = async (operation) => {
  try {
    await operation();
  } catch (error) {
    console.warn(`No se pudo limpiar archivo: ${error.message}`);
  }
};

const deleteStoredUploadQuietly = (storedPath) => runQuietly(() => deleteStoredUpload(storedPath));

const deleteUploadedFileQuietly = (file) => runQuietly(() => deleteUploadedFile(file));

const ensureUploadDirectories = async () => {
  await fs.mkdir(env.paths.publicacionesUploadDir, { recursive: true });
};

module.exports = {
  deleteStoredUpload,
  deleteStoredUploadQuietly,
  deleteUploadedFile,
  deleteUploadedFileQuietly,
  ensureUploadDirectories,
  toPublicUploadPath,
  toPublicUrl,
};
