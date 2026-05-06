const state = {
  token: localStorage.getItem('token'),
  user: null,
  users: new Map(),
  posts: new Map(),
};

const API_BASE_URL = '/api';
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const $ = (selector) => document.querySelector(selector);

const elements = {
  authSection: $('#authSection'),
  appSection: $('#appSection'),
  sessionStatus: $('#sessionStatus'),
  logoutButton: $('#logoutButton'),
  registerForm: $('#registerForm'),
  loginForm: $('#loginForm'),
  profileForm: $('#profileForm'),
  profileName: $('#profileName'),
  profileEmail: $('#profileEmail'),
  profilePassword: $('#profilePassword'),
  deleteAccountButton: $('#deleteAccountButton'),
  postForm: $('#postForm'),
  postFormTitle: $('#postFormTitle'),
  postContent: $('#postContent'),
  postImage: $('#postImage'),
  savePostButton: $('#savePostButton'),
  cancelEditPostButton: $('#cancelEditPostButton'),
  reloadUsersButton: $('#reloadUsersButton'),
  reloadPostsButton: $('#reloadPostsButton'),
  usersList: $('#usersList'),
  postsList: $('#postsList'),
  toast: $('#toast'),
};

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));

const formatDate = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const showToast = (message, type = 'info') => {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type === 'error' ? 'error' : ''}`.trim();

  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 3600);
};

const buildApiError = (message, status = 0, details = null) => {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
};

const setControlsDisabled = (target, disabled) => {
  if (!target) return;

  const controls = target.tagName === 'FORM' ? target.querySelectorAll('button, input, textarea') : [target];

  controls.forEach((control) => {
    if (disabled) {
      control.dataset.wasDisabled = String(control.disabled);
      control.disabled = true;
      return;
    }

    control.disabled = control.dataset.wasDisabled === 'true';
    delete control.dataset.wasDisabled;
  });
};

const runWithPending = async (target, operation) => {
  if (target?.dataset.pending === 'true') return null;

  if (target) {
    target.dataset.pending = 'true';
    setControlsDisabled(target, true);
  }

  try {
    return await operation();
  } finally {
    if (target) {
      setControlsDisabled(target, false);
      delete target.dataset.pending;
    }
  }
};

const validateSelectedImage = (file, { required = false } = {}) => {
  if (!file) {
    if (required) throw buildApiError('Selecciona una imagen para la publicacion.');
    return;
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw buildApiError('La imagen debe ser JPG, PNG, WEBP o GIF.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw buildApiError('La imagen no puede superar 3 MB.');
  }
};

const setToken = (token) => {
  state.token = token;

  if (token) {
    localStorage.setItem('token', token);
    return;
  }

  localStorage.removeItem('token');
};

const apiRequest = async (path, options = {}) => {
  const isFormData = options.body instanceof FormData;
  const headers = { ...(options.headers || {}) };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  if (options.body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? (isFormData ? options.body : JSON.stringify(options.body)) : undefined,
    });
  } catch (error) {
    throw buildApiError('No se pudo conectar con el servidor. Verifica que estes usando http://localhost:3000 y que npm run dev siga activo.');
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw buildApiError(payload.message || 'Error en la peticion', response.status, payload.details || null);
  }

  return payload;
};

const loadAppData = async () => {
  const results = await Promise.allSettled([loadUsers(), loadPosts()]);
  const failed = results.find((result) => result.status === 'rejected');

  if (!failed) return;

  if (failed.reason.status === 401) {
    logout();
    throw failed.reason;
  }

  showToast('Sesion iniciada, pero no se pudieron cargar todos los datos.', 'error');
};

const finishAuthentication = async (response, form, successMessage) => {
  const authData = response.data || {};

  if (!authData.token || !authData.usuario) {
    throw buildApiError('La respuesta de autenticacion no tiene token o usuario.');
  }

  setToken(authData.token);
  state.user = authData.usuario;
  form.reset();
  updateLayout();
  await loadAppData();
  showToast(successMessage);
  elements.appSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const updateLayout = () => {
  const isLogged = Boolean(state.user && state.token);

  elements.authSection.classList.toggle('hidden', isLogged);
  elements.appSection.classList.toggle('hidden', !isLogged);
  elements.logoutButton.classList.toggle('hidden', !isLogged);
  elements.sessionStatus.textContent = isLogged ? `Sesion: ${state.user.nombre}` : 'Sin sesion';

  if (isLogged) {
    elements.profileName.value = state.user.nombre || '';
    elements.profileEmail.value = state.user.email || '';
  }
};

const resetPostForm = () => {
  elements.postForm.reset();
  delete elements.postForm.dataset.editingId;
  elements.postFormTitle.textContent = 'Nueva publicacion';
  elements.savePostButton.textContent = 'Publicar';
  elements.cancelEditPostButton.classList.add('hidden');
  elements.postImage.required = true;
};

const loadSession = async () => {
  const response = await apiRequest('/auth/me');
  state.user = response.data;
  updateLayout();
  await loadAppData();
};

const loadUsers = async () => {
  const response = await apiRequest('/usuarios');
  state.users = new Map(response.data.map((user) => [user.id_usuario, user]));
  renderUsers();
};

const loadPosts = async () => {
  const response = await apiRequest('/publicaciones?limit=50');
  state.posts = new Map(response.data.map((post) => [post.id_post, post]));
  renderPosts();
};

const renderUsers = () => {
  const users = [...state.users.values()];

  if (users.length === 0) {
    elements.usersList.innerHTML = '<p class="empty-state">No hay usuarios registrados.</p>';
    return;
  }

  elements.usersList.innerHTML = users.map((user) => `
    <article class="user-card">
      <div>
        <strong>${escapeHtml(user.nombre)}</strong>
        <span>${escapeHtml(user.email)}</span>
      </div>
      <span>ID ${escapeHtml(user.id_usuario)}</span>
    </article>
  `).join('');
};

const renderPosts = () => {
  const posts = [...state.posts.values()];

  if (posts.length === 0) {
    elements.postsList.innerHTML = '<p class="empty-state">No hay publicaciones todavia.</p>';
    return;
  }

  elements.postsList.innerHTML = posts.map((post) => {
    const isOwner = state.user && Number(post.id_usuario) === Number(state.user.id_usuario);
    const postId = Number(post.id_post);

    if (!Number.isInteger(postId) || postId < 1) return '';

    return `
      <article class="post-card">
        <img src="${escapeHtml(post.imagen_url)}" alt="Imagen de publicacion" loading="lazy" />
        <div class="post-body">
          <div class="post-meta">
            <strong>${escapeHtml(post.usuario?.nombre || 'Usuario')}</strong>
            <span>${escapeHtml(formatDate(post.created_at))}</span>
          </div>
          <p class="post-content">${escapeHtml(post.contenido)}</p>
          ${isOwner ? `
            <div class="post-actions">
              <button class="button button-ghost" type="button" data-action="edit-post" data-id="${escapeHtml(postId)}">Editar</button>
              <button class="button button-danger" type="button" data-action="delete-post" data-id="${escapeHtml(postId)}">Eliminar</button>
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }).join('');
};

const handleRegister = async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const body = Object.fromEntries(formData.entries());

  await runWithPending(form, async () => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body,
    });

    await finishAuthentication(response, form, 'Cuenta creada correctamente');
  });
};

const handleLogin = async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const body = Object.fromEntries(formData.entries());

  await runWithPending(form, async () => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body,
    });

    await finishAuthentication(response, form, 'Sesion iniciada');
  });
};

const handleProfileUpdate = async (event) => {
  event.preventDefault();
  const form = event.currentTarget;

  const body = {
    nombre: elements.profileName.value.trim(),
    email: elements.profileEmail.value.trim(),
  };

  if (elements.profilePassword.value) {
    body.password = elements.profilePassword.value;
  }

  await runWithPending(form, async () => {
    const response = await apiRequest(`/usuarios/${state.user.id_usuario}`, {
      method: 'PUT',
      body,
    });

    state.user = response.data;
    elements.profilePassword.value = '';
    updateLayout();
    await loadUsers();
    showToast('Perfil actualizado');
  });
};

const handleDeleteAccount = async (event) => {
  if (!window.confirm('Esta accion eliminara tu usuario y publicaciones. Continuar?')) return;

  await runWithPending(event.currentTarget, async () => {
    await apiRequest(`/usuarios/${state.user.id_usuario}`, { method: 'DELETE' });
    logout();
    showToast('Cuenta eliminada');
  });
};

const handlePostSubmit = async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const editingId = elements.postForm.dataset.editingId;
  const selectedImage = elements.postImage.files[0];

  validateSelectedImage(selectedImage, { required: !editingId });

  const formData = new FormData();
  formData.append('contenido', elements.postContent.value.trim());

  if (selectedImage) {
    formData.append('imagen', selectedImage);
  }

  const path = editingId ? `/publicaciones/${editingId}` : '/publicaciones';
  const method = editingId ? 'PUT' : 'POST';

  await runWithPending(form, async () => {
    await apiRequest(path, { method, body: formData });
    resetPostForm();
    await loadPosts();
    showToast(editingId ? 'Publicacion actualizada' : 'Publicacion creada');
  });
};

const startPostEdit = (id) => {
  const post = state.posts.get(Number(id));
  if (!post) return;

  elements.postForm.dataset.editingId = post.id_post;
  elements.postContent.value = post.contenido;
  elements.postFormTitle.textContent = 'Editar publicacion';
  elements.savePostButton.textContent = 'Guardar cambios';
  elements.cancelEditPostButton.classList.remove('hidden');
  elements.postImage.required = false;
  elements.postContent.focus();
};

const deletePost = async (id) => {
  if (!window.confirm('Eliminar esta publicacion?')) return;

  await apiRequest(`/publicaciones/${id}`, { method: 'DELETE' });
  await loadPosts();
  showToast('Publicacion eliminada');
};

const logout = () => {
  setToken(null);
  state.user = null;
  state.users.clear();
  state.posts.clear();
  resetPostForm();
  updateLayout();
};

const withErrorHandling = (handler) => async (event) => {
  try {
    await handler(event);
  } catch (error) {
    showToast(error.message, 'error');

    if (error.status === 401) {
      logout();
    }
  }
};

const bindEvents = () => {
  elements.registerForm.addEventListener('submit', withErrorHandling(handleRegister));
  elements.loginForm.addEventListener('submit', withErrorHandling(handleLogin));
  elements.profileForm.addEventListener('submit', withErrorHandling(handleProfileUpdate));
  elements.deleteAccountButton.addEventListener('click', withErrorHandling(handleDeleteAccount));
  elements.postForm.addEventListener('submit', withErrorHandling(handlePostSubmit));
  elements.cancelEditPostButton.addEventListener('click', resetPostForm);
  elements.reloadUsersButton.addEventListener('click', withErrorHandling((event) => runWithPending(event.currentTarget, loadUsers)));
  elements.reloadPostsButton.addEventListener('click', withErrorHandling((event) => runWithPending(event.currentTarget, loadPosts)));
  elements.logoutButton.addEventListener('click', logout);

  elements.postsList.addEventListener('click', withErrorHandling(async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    if (button.dataset.action === 'edit-post') {
      startPostEdit(button.dataset.id);
      return;
    }

    if (button.dataset.action === 'delete-post') {
      await runWithPending(button, () => deletePost(button.dataset.id));
    }
  }));
};

const init = async () => {
  bindEvents();
  updateLayout();

  if (!state.token) return;

  try {
    await loadSession();
  } catch (error) {
    logout();
    showToast(error.status === 401 ? 'Sesion expirada. Inicia sesion nuevamente.' : error.message, 'error');
  }
};

init();
