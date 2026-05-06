# CRUD Usuarios y Publicaciones

Proyecto full-stack en una sola aplicacion con Express, MySQL, Sequelize y frontend vanilla. Incluye autenticacion JWT, rutas protegidas, subida de imagenes con Multer y arquitectura por capas.

## Tecnologias

- Backend: Express.js
- Base de datos: MySQL
- ORM: Sequelize + Sequelize CLI
- Auth: JWT + bcrypt
- Uploads: Multer
- Frontend: HTML, CSS y JavaScript vanilla

## Estructura

```txt
src/
  app.js
  server.js
  config/
  controllers/
  db/
    migrations/
    models/
  middlewares/
  repositories/
  routes/
  services/
  utils/
  validators/
public/
  index.html
  css/
  js/
uploads/
  publicaciones/
```

## Modelo de datos

`usuarios`

- `id_usuario`
- `nombre`
- `email`
- `password_hash`
- `created_at`
- `updated_at`

`publicaciones`

- `id_post`
- `contenido`
- `imagen`
- `id_usuario`
- `created_at`
- `updated_at`

Relacion: un usuario tiene muchas publicaciones y una publicacion pertenece a un usuario.

## Instalacion

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo `.env` desde el ejemplo:

```bash
cp .env.example .env
```

En Windows PowerShell puedes usar:

```powershell
Copy-Item .env.example .env
```

3. Ajusta las variables de MySQL en `.env`.

Variables principales:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_ISSUER`, `JWT_AUDIENCE`
- `UPLOAD_MAX_SIZE_MB`

4. Crea la base de datos y ejecuta migraciones:

```bash
npm run db:create
npm run db:migrate
```

5. Inicia el servidor:

```bash
npm run dev
```

La app queda disponible en `http://localhost:3000`.

## Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` protegido

### Usuarios

- `POST /api/usuarios`
- `GET /api/usuarios` protegido
- `GET /api/usuarios/:id` protegido
- `PUT /api/usuarios/:id` protegido, solo el propio usuario
- `DELETE /api/usuarios/:id` protegido, solo el propio usuario

### Publicaciones

- `GET /api/publicaciones`
- `GET /api/publicaciones/:id`
- `POST /api/publicaciones` protegido, `multipart/form-data` con `contenido` e `imagen`
- `PUT /api/publicaciones/:id` protegido, solo el dueno
- `DELETE /api/publicaciones/:id` protegido, solo el dueno

## Decisiones de buenas practicas

- Controladores pequenos, sin reglas de negocio.
- Servicios con reglas de negocio y autorizacion de propietario.
- Repositorios para aislar Sequelize.
- Validadores separados con `express-validator`.
- Middleware global de errores.
- Middleware de imagenes con filtro por MIME y limite de tamano.
- Validacion de firma del archivo para rechazar imagenes falsas.
- Passwords hasheados con bcrypt.
- JWT para rutas protegidas.
- No se expone `password_hash` en respuestas.
- Las imagenes se eliminan del disco al actualizar o borrar publicaciones.
- `DB_SYNC` queda bloqueado en produccion para favorecer migraciones.
