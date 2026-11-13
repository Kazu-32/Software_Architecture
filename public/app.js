const state = {
  restaurants: [],
  activeRestaurant: null,
  dishes: [],
  token: localStorage.getItem('easyfood_token') || null,
  user: null,
};

// DOM References
const restaurantGrid = document.getElementById('restaurantGrid');
const restaurantCount = document.getElementById('restaurantCount');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');

const headerAuthBtn = document.getElementById('headerAuthBtn');
const openNewRestaurantBtn = document.getElementById('openNewRestaurantBtn');
const openAccountNavBtn = document.getElementById('openAccountNavBtn');

// Dialogs
const menuDialog = document.getElementById('menuDialog');
const closeMenuDialogBtn = document.getElementById('closeMenuDialogBtn');
const menuDialogTitle = document.getElementById('menuDialogTitle');
const menuRestaurantMeta = document.getElementById('menuRestaurantMeta');
const menuAlert = document.getElementById('menuAlert');
const dishList = document.getElementById('dishList');
const dishForm = document.getElementById('dishForm');
const dishAuthNotice = document.getElementById('dishAuthNotice');
const dishLoginPromptBtn = document.getElementById('dishLoginPromptBtn');

const restaurantDialog = document.getElementById('restaurantDialog');
const closeRestaurantDialogBtn = document.getElementById('closeRestaurantDialogBtn');
const restaurantAlert = document.getElementById('restaurantAlert');
const restaurantForm = document.getElementById('restaurantForm');
const restaurantAuthNotice = document.getElementById('restaurantAuthNotice');
const restaurantLoginPromptBtn = document.getElementById('restaurantLoginPromptBtn');

const accountDialog = document.getElementById('accountDialog');
const closeAccountDialogBtn = document.getElementById('closeAccountDialogBtn');
const accountAlert = document.getElementById('accountAlert');
const authFormsWrapper = document.getElementById('authFormsWrapper');
const profileWrapper = document.getElementById('profileWrapper');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const profileAvatarPreview = document.getElementById('profileAvatarPreview');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileImageForm = document.getElementById('profileImageForm');
const profileImageInput = document.getElementById('profileImageInput');
const logoutBtn = document.getElementById('logoutBtn');

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getInitials(name) {
  const parts = String(name || 'U').trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

function showAlert(el, message, type = 'danger') {
  el.className = `alert show alert-${type}`;
  el.textContent = message;
}

function clearAlert(el) {
  el.className = 'alert';
  el.textContent = '';
}

function formatPriceBRL(value) {
  const num = Number(value);
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function authHeaders(extra = {}) {
  const headers = { ...extra };
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  return headers;
}

// --- Auth & Session ---

async function hydrateSession() {
  if (!state.token) {
    state.user = null;
    syncAuthUI();
    return;
  }

  try {
    const res = await fetch('/auth/me', {
      headers: authHeaders(),
    });
    if (!res.ok) {
      throw new Error('Sessão expirada');
    }
    state.user = await res.json();
  } catch {
    state.token = null;
    state.user = null;
    localStorage.removeItem('easyfood_token');
  }
  syncAuthUI();
}

function syncAuthUI() {
  const isLoggedIn = Boolean(state.token && state.user);

  if (isLoggedIn) {
    const avatarHtml = state.user.imageUrl
      ? `<img src="${escapeHtml(state.user.imageUrl)}" alt="Foto de ${escapeHtml(state.user.name)}" referrerpolicy="no-referrer">`
      : escapeHtml(getInitials(state.user.name));

    headerAuthBtn.className = 'user-pill-btn';
    headerAuthBtn.innerHTML = `<span class="mini-avatar">${avatarHtml}</span><span>${escapeHtml(state.user.name)}</span>`;
    const miniImg = headerAuthBtn.querySelector('img');
    if (miniImg) {
      miniImg.addEventListener('error', () => {
        miniImg.parentElement.textContent = getInitials(state.user.name);
      });
    }
  } else {
    headerAuthBtn.className = 'btn btn-primary';
    headerAuthBtn.textContent = 'Entrar';
  }

  // Sincroniza blocos dentro dos modais
  if (isLoggedIn) {
    authFormsWrapper.classList.add('hidden');
    profileWrapper.classList.remove('hidden');
    profileName.textContent = state.user.name;
    profileEmail.textContent = state.user.email;
    profileAvatarPreview.innerHTML = state.user.imageUrl
      ? `<img src="${escapeHtml(state.user.imageUrl)}" alt="Avatar de ${escapeHtml(state.user.name)}" referrerpolicy="no-referrer">`
      : escapeHtml(getInitials(state.user.name));
    const profileImg = profileAvatarPreview.querySelector('img');
    if (profileImg) {
      profileImg.addEventListener('error', () => {
        profileAvatarPreview.textContent = getInitials(state.user.name);
      });
    }

    restaurantAuthNotice.classList.add('hidden');
    restaurantForm.classList.remove('hidden');

    dishAuthNotice.classList.add('hidden');
    dishForm.classList.remove('hidden');
  } else {
    authFormsWrapper.classList.remove('hidden');
    profileWrapper.classList.add('hidden');

    restaurantAuthNotice.classList.remove('hidden');
    restaurantForm.classList.add('hidden');

    dishAuthNotice.classList.remove('hidden');
    dishForm.classList.add('hidden');
  }

  if (menuDialog.open && state.activeRestaurant) {
    renderDishes();
  }
}

// --- Restaurants ---

async function loadRestaurants() {
  try {
    const response = await fetch('/restaurants');
    if (!response.ok) throw new Error('Falha ao buscar restaurantes');
    state.restaurants = await response.json();
    updateCategories();
    renderRestaurants();
  } catch (err) {
    console.error(err);
    restaurantGrid.innerHTML = `<div class="state-box">Não foi possível carregar os restaurantes do servidor.</div>`;
  }
}

function updateCategories() {
  const currentVal = categoryFilter.value;
  const categories = [...new Set(state.restaurants.map((r) => r.category))].filter(Boolean);

  categoryFilter.innerHTML = '<option value="">Todas as categorias</option>';
  categories.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    categoryFilter.appendChild(opt);
  });
  categoryFilter.value = currentVal;
}

function renderRestaurants() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedCategory = categoryFilter.value;
  const sortBy = sortFilter.value;

  const filtered = state.restaurants.filter((r) => {
    const matchesSearch =
      !searchTerm ||
      (r.name && r.name.toLowerCase().includes(searchTerm)) ||
      (r.category && r.category.toLowerCase().includes(searchTerm));
    const matchesCategory = !selectedCategory || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (sortBy === 'rating-desc') {
    filtered.sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0));
  } else if (sortBy === 'name-asc') {
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else {
    filtered.sort((a, b) => (a.id || 0) - (b.id || 0));
  }

  restaurantCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'}`;

  if (filtered.length === 0) {
    restaurantGrid.innerHTML = `<div class="state-box">Nenhum restaurante encontrado para os filtros aplicados.</div>`;
    return;
  }

  restaurantGrid.innerHTML = filtered
    .map((r) => {
      const rating = Number(r.rating ?? r.Rating ?? 0).toFixed(1);
      return `
        <article class="restaurant-card" data-restaurant-id="${r.id}">
          <div>
            <div class="card-meta-line">
              <span>${escapeHtml(r.category)}</span>
              <span aria-hidden="true">·</span>
              <span class="star-glyph" aria-hidden="true">★</span>
              <span class="tabular-nums">${rating}</span>
            </div>
            <h3 class="restaurant-title">${escapeHtml(r.name)}</h3>
          </div>
          <div class="card-footer">
            <span class="card-id-label tabular-nums">#${r.id}</span>
            <button type="button" class="btn btn-secondary open-menu-btn" data-id="${r.id}">
              Ver Cardápio
            </button>
          </div>
        </article>
      `;
    })
    .join('');

  document.querySelectorAll('.open-menu-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-id'));
      const restaurant = state.restaurants.find((item) => item.id === id);
      if (restaurant) openMenuModal(restaurant);
    });
  });
}

// --- Dishes / Menu ---

async function openMenuModal(restaurant) {
  state.activeRestaurant = restaurant;
  clearAlert(menuAlert);
  menuDialogTitle.textContent = restaurant.name;
  menuRestaurantMeta.innerHTML = `
    <span>${escapeHtml(restaurant.category)}</span>
    <span aria-hidden="true">·</span>
    <span class="star-glyph" aria-hidden="true">★</span>
    <span class="tabular-nums">${Number(restaurant.rating ?? 0).toFixed(1)}</span>
  `;
  dishList.innerHTML = `<div class="state-box">Carregando pratos...</div>`;
  syncAuthUI();
  menuDialog.showModal();
  await loadDishes(restaurant.id);
}

async function loadDishes(restaurantId) {
  try {
    const res = await fetch(`/restaurants/${restaurantId}/dishes`);
    if (!res.ok) throw new Error('Erro ao carregar pratos');
    state.dishes = await res.json();
    renderDishes();
  } catch (err) {
    dishList.innerHTML = `<div class="state-box">Erro ao carregar o cardápio deste restaurante.</div>`;
  }
}

function renderDishes() {
  if (!state.dishes.length) {
    dishList.innerHTML = `<div class="state-box">Este restaurante ainda não possui pratos cadastrados.</div>`;
    return;
  }

  const isLoggedIn = Boolean(state.token && state.user);

  dishList.innerHTML = state.dishes
    .map((dish) => {
      const mediaHtml = dish.imageUrl
        ? `<img src="${escapeHtml(dish.imageUrl)}" alt="Foto de ${escapeHtml(dish.name)}" referrerpolicy="no-referrer">`
        : `<div class="dish-placeholder">
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
               <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
               <line x1="4" y1="22" x2="4" y2="15"></line>
             </svg>
             <span>Sem foto</span>
           </div>`;

      const uploadActionHtml = isLoggedIn
        ? `<div class="dish-upload-row">
             <span class="muted-meta">${dish.imageUrl ? 'Foto atualizada' : 'Enviar imagem'}</span>
             <label class="upload-label-btn">
               ${dish.imageUrl ? 'Trocar foto' : 'Enviar foto'}
               <input type="file" class="sr-only dish-image-input" data-dish-id="${dish.id}" accept="image/jpeg,image/png,image/webp">
             </label>
           </div>`
        : '';

      return `
        <article class="dish-card">
          <div class="dish-media">${mediaHtml}</div>
          <div class="dish-content">
            <div class="dish-head">
              <h4 class="dish-name">${escapeHtml(dish.name)}</h4>
              <span class="dish-price tabular-nums">${formatPriceBRL(dish.price)}</span>
            </div>
            <p class="dish-desc">${escapeHtml(dish.description)}</p>
            ${uploadActionHtml}
          </div>
        </article>
      `;
    })
    .join('');

  document.querySelectorAll('.dish-media img').forEach((img) => {
    img.addEventListener('error', () => {
      if (img.parentElement) {
        img.parentElement.innerHTML = `
          <div class="dish-placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
            <span>Sem foto</span>
          </div>`;
      }
    });
  });

  document.querySelectorAll('.dish-image-input').forEach((input) => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const dishId = Number(input.getAttribute('data-dish-id'));
      await uploadDishPhoto(dishId, file);
    });
  });
}

async function uploadDishPhoto(dishId, file) {
  clearAlert(menuAlert);
  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch(`/dishes/${dishId}/image`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao enviar imagem do prato');
    }

    const idx = state.dishes.findIndex((d) => d.id === dishId);
    if (idx !== -1) state.dishes[idx] = data;
    renderDishes();
    showAlert(menuAlert, `Imagem de "${data.name}" otimizada e salva com sucesso!`, 'success');
  } catch (err) {
    showAlert(menuAlert, err.message, 'danger');
  }
}

// --- Event Listeners ---

searchInput.addEventListener('input', renderRestaurants);
categoryFilter.addEventListener('change', renderRestaurants);
sortFilter.addEventListener('change', renderRestaurants);

openNewRestaurantBtn.addEventListener('click', () => {
  clearAlert(restaurantAlert);
  syncAuthUI();
  restaurantDialog.showModal();
});

closeRestaurantDialogBtn.addEventListener('click', () => restaurantDialog.close());
closeMenuDialogBtn.addEventListener('click', () => menuDialog.close());
closeAccountDialogBtn.addEventListener('click', () => accountDialog.close());

headerAuthBtn.addEventListener('click', () => {
  clearAlert(accountAlert);
  syncAuthUI();
  accountDialog.showModal();
});

openAccountNavBtn.addEventListener('click', () => {
  clearAlert(accountAlert);
  syncAuthUI();
  accountDialog.showModal();
});

restaurantLoginPromptBtn.addEventListener('click', () => {
  restaurantDialog.close();
  clearAlert(accountAlert);
  accountDialog.showModal();
});

dishLoginPromptBtn.addEventListener('click', () => {
  menuDialog.close();
  clearAlert(accountAlert);
  accountDialog.showModal();
});

// Auth tabs
tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  tabLogin.setAttribute('aria-selected', 'true');
  tabRegister.setAttribute('aria-selected', 'false');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
  clearAlert(accountAlert);
});

tabRegister.addEventListener('click', () => {
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  tabRegister.setAttribute('aria-selected', 'true');
  tabLogin.setAttribute('aria-selected', 'false');
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
  clearAlert(accountAlert);
});

// Login submit
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert(accountAlert);

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Falha no login');

    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('easyfood_token', data.token);
    loginForm.reset();
    syncAuthUI();
    showAlert(accountAlert, 'Login realizado com sucesso!', 'success');
  } catch (err) {
    showAlert(accountAlert, err.message, 'danger');
  }
});

// Register submit
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert(accountAlert);

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  try {
    const regRes = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const regData = await regRes.json().catch(() => ({}));
    if (!regRes.ok) throw new Error(regData.error || 'Falha ao cadastrar conta');

    // Autentica automaticamente após registro
    const loginRes = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const loginData = await loginRes.json().catch(() => ({}));
    if (loginRes.ok) {
      state.token = loginData.token;
      state.user = loginData.user;
      localStorage.setItem('easyfood_token', loginData.token);
    }

    registerForm.reset();
    syncAuthUI();
    showAlert(accountAlert, 'Conta criada e autenticada com sucesso!', 'success');
  } catch (err) {
    showAlert(accountAlert, err.message, 'danger');
  }
});

// Profile image upload
profileImageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert(accountAlert);

  const file = profileImageInput.files?.[0];
  if (!file) {
    showAlert(accountAlert, 'Selecione uma imagem antes de enviar.', 'danger');
    return;
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch('/auth/me/image', {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar foto de perfil');

    state.user = data;
    profileImageForm.reset();
    syncAuthUI();
    showAlert(accountAlert, 'Foto de perfil otimizada e atualizada com sucesso!', 'success');
  } catch (err) {
    showAlert(accountAlert, err.message, 'danger');
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  state.token = null;
  state.user = null;
  localStorage.removeItem('easyfood_token');
  syncAuthUI();
  clearAlert(accountAlert);
});

// Create restaurant submit
restaurantForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert(restaurantAlert);

  const name = document.getElementById('restName').value.trim();
  const category = document.getElementById('restCategory').value.trim();
  const rating = parseFloat(document.getElementById('restRating').value);

  if (!name || !category || isNaN(rating)) {
    showAlert(restaurantAlert, 'Preencha todos os campos corretamente.', 'danger');
    return;
  }

  try {
    const res = await fetch('/restaurants', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, category, rating }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar restaurante');

    state.restaurants.push(data);
    updateCategories();
    renderRestaurants();
    restaurantForm.reset();
    showAlert(restaurantAlert, `Restaurante "${data.name}" cadastrado com sucesso!`, 'success');
  } catch (err) {
    showAlert(restaurantAlert, err.message, 'danger');
  }
});

// Create dish submit
dishForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert(menuAlert);
  if (!state.activeRestaurant) return;

  const name = document.getElementById('dishName').value.trim();
  const price = parseFloat(document.getElementById('dishPrice').value);
  const description = document.getElementById('dishDescription').value.trim();

  if (!name || !description || isNaN(price) || price < 0) {
    showAlert(menuAlert, 'Informe nome, descrição e preço válido para o prato.', 'danger');
    return;
  }

  try {
    const res = await fetch(`/restaurants/${state.activeRestaurant.id}/dishes`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, description, price }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar prato');

    state.dishes.push(data);
    dishForm.reset();
    renderDishes();
    showAlert(menuAlert, `Prato "${data.name}" adicionado ao cardápio!`, 'success');
  } catch (err) {
    showAlert(menuAlert, err.message, 'danger');
  }
});

// Boot
hydrateSession();
loadRestaurants();
