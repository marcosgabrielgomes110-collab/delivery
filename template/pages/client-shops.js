import { navigate } from '../core/router.js'
import { api } from '../core/api.js'
import { showToast, debounce } from '../core/functions.js'
import config from '../configs.js'
import Cookies from 'js-cookie'

let merchantsMap = {}
let productsMap = {}
let selectedProprietor = null
let currentQuery = ''

export function clientShopsPage(container) {
  const userStr = Cookies.get(config.COOKIE_KEYS.USER)
  const user = userStr ? JSON.parse(userStr) : {}

  container.innerHTML = `
    <div class="dashboard">
      <nav class="sidebar">
        <div class="sidebar-header">
          <h2>PySupa</h2>
          <span class="badge badge-client">Cliente</span>
        </div>
        <ul class="sidebar-menu">
          <li><a href="#/home/client">Inicio</a></li>
          <li class="active"><a href="#/home/client/shops">Lojas</a></li>
          <li><a href="#/home/client/orders">Pedidos</a></li>
          <li><a href="#/home/client/favorites">Favoritos</a></li>
          <li><a href="#/home/client/profile">Perfil</a></li>
        </ul>
        <button id="logout-btn" class="btn btn-sidebar-logout">Sair</button>
      </nav>
      <main class="main-content">
        <div class="topbar">
          <h1>Lojas</h1>
          <div class="user-info">
            <span>${user.email || ''}</span>
          </div>
        </div>
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" id="search-input" class="search-input" placeholder="Buscar produtos ou restaurantes..." autocomplete="off">
          ${currentQuery ? '<button id="clear-search" class="search-clear">&times;</button>' : ''}
        </div>
        <div id="restaurant-chips" class="restaurant-chips"></div>
        <div id="products-container" class="products-grid"></div>
      </main>
    </div>
  `

  selectedProprietor = null
  currentQuery = ''

  loadMerchants()
  loadProducts()

  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      await api.post(config.ENDPOINTS.AUTH.LOGOUT)
    } catch (err) {}
    Cookies.remove(config.COOKIE_KEYS.USER)
    Cookies.remove(config.COOKIE_KEYS.USER_TYPE)
    navigate('/login')
  })

  const searchInput = document.getElementById('search-input')
  const debouncedSearch = debounce(() => {
    currentQuery = searchInput.value.trim()
    selectedProprietor = null
    updateChipsActive()
    loadProducts()
  }, 300)

  searchInput.addEventListener('input', debouncedSearch)
}

async function loadMerchants() {
  const chipsContainer = document.getElementById('restaurant-chips')
  try {
    const merchants = await api.get(config.ENDPOINTS.PUBLIC.MERCHANTS())
    merchantsMap = {}
    merchants.forEach(m => { merchantsMap[m.id] = m })

    if (merchants.length === 0) {
      chipsContainer.innerHTML = ''
      return
    }

    chipsContainer.innerHTML = `
      <button class="chip chip-all active" data-id="">Todas</button>
      ${merchants.map(m => `
        <button class="chip" data-id="${m.id}">${escapeHtml(m.name)} <span class="chip-count">${m.product_count || 0}</span></button>
      `).join('')}
    `

    chipsContainer.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.dataset.id
        if (id === selectedProprietor) {
          selectedProprietor = null
        } else {
          selectedProprietor = id
        }
        currentQuery = ''
        document.getElementById('search-input').value = ''
        updateChipsActive()
        loadProducts()
      })
    })
  } catch (err) {
    chipsContainer.innerHTML = '<p class="empty-state">Erro ao carregar lojas</p>'
  }
}

function updateChipsActive() {
  document.querySelectorAll('.chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.id === (selectedProprietor || ''))
  })
}

async function loadProducts() {
  const container = document.getElementById('products-container')
  container.innerHTML = '<p class="empty-state">Carregando produtos...</p>'

  try {
    const params = {}
    if (currentQuery) params.q = currentQuery
    if (selectedProprietor) params.proprietor = selectedProprietor

    const url = config.ENDPOINTS.PUBLIC.PRODUCTS(params)
    const products = await api.get(url)

    if (products.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🍽️</div>
          <p class="empty-state">Nenhum produto encontrado.</p>
          ${currentQuery || selectedProprietor
            ? '<button class="btn btn-secondary" id="btn-clear-filters">Limpar filtros</button>'
            : ''
          }
        </div>
      `
      const clearBtn = document.getElementById('btn-clear-filters')
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          currentQuery = ''
          selectedProprietor = null
          document.getElementById('search-input').value = ''
          updateChipsActive()
          loadProducts()
        })
      }
      return
    }

    productsMap = {}
    products.forEach(p => { productsMap[p.id] = p })
    container.innerHTML = products.map(p => renderProductCard(p)).join('')
  } catch (err) {
    container.innerHTML = `<p class="empty-state">Erro ao carregar: ${err.message}</p>`
  }
}

function renderProductCard(product) {
  const photoUrl = product.photo
    ? `${config.API_URL}${config.ENDPOINTS.MEDIA.GET('products', product.photo)}`
    : null
  const hasAcc = product.accompaniments && product.accompaniments.length > 0
  const merchant = merchantsMap[product.proprietor]
  const merchantName = merchant ? merchant.name : 'Restaurante'

  return `
    <div class="product-card">
      <div class="product-card-photo">
        ${photoUrl
          ? `<img src="${photoUrl}" alt="${product.name}" loading="lazy">`
          : `<div class="product-card-photo-placeholder">📷</div>`
        }
      </div>
      <div class="product-card-body">
        <h3 class="product-card-name">${escapeHtml(product.name)}</h3>
        <p class="product-card-price">${Number(product.price).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</p>
        <p class="product-card-merchant">🏪 ${escapeHtml(merchantName)}</p>
        ${product.description
          ? `<p class="product-card-desc">${escapeHtml(product.description)}</p>`
          : ''
        }
        ${hasAcc
          ? `<div class="product-card-acc-tags">
              ${product.accompaniments.map(aId => {
                const acc = productsMap[aId]
                return acc
                  ? `<span class="acc-tag">${escapeHtml(acc.name)}</span>`
                  : ''
              }).join('')}
             </div>`
          : ''
        }
      </div>
    </div>
  `
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
