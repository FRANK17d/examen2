const app = require('./app');
const { env } = require('./config/env');
const { connectDatabase } = require('./db/models');
const { ensureUploadDirectories } = require('./utils/file');

const startServer = async () => {
  await ensureUploadDirectories();
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`Servidor iniciado en ${env.appUrl}`);
  });
};

startServer().catch((error) => {
  console.error('No se pudo iniciar la aplicacion:', error.message);
  process.exit(1);
});
