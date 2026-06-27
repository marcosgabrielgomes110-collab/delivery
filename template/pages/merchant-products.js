import { navigate } from '../core/router.js'
import { api } from '../core/api.js'
import { showToast } from '../core/functions.js'
import config from '../configs.js'
import Cookies from 'js-cookie'

let currentProductId = null
let allProducts = []
let allAccompaniments = []
let selectedAccompaniments = new Set()

export function merchantProductsPage(container) {
  const userStr = Cookies.get(config.COOKIE_KEYS.USER)
  const user = userStr ? JSON.parse(userStr) : {}

  container.innerHTML = `
    <div class="dashboard">
      <nav class="sidebar">
        <div class="sidebar-header">
          <h2>PySupa</h2>
          <span class="badge badge-merchant">Lojista</span>
        </div>
        <ul class="sidebar-menu">
          <li><a href="#/home/merchant">Inicio</a></li>
          <li class="active"><a href="#/home/merchant/products">Produtos</a></li>
          <li><a href="#/home/merchant/orders">Pedidos</a></li>
          <li><a href="#/home/merchant/customers">Clientes</a></li>
          <li><a href="#/home/merchant/settings">Configurações</a></li>
        </ul>
        <button id="logout-btn" class="btn btn-sidebar-logout">Sair</button>
      </nav>
      <main class="main-content">
        <div class="topbar">
          <h1>Meus Produtos</h1>
          <button id="btn-novo-produto" class="btn btn-primary">+ Novo Produto</button>
        </div>
        <div id="products-container" class="products-grid"></div>
      </main>
    </div>
    <div id="product-modal" class="modal-overlay hidden">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modal-title">Novo Produto</h2>
          <button id="btn-close-modal" class="btn-close">&times;</button>
        </div>
        <form id="product-form">
          <div class="form-group">
            <label>Foto do Produto</label>
            <div class="photo-upload">
              <div id="photo-preview" class="photo-preview">
                <span>+</span>
              </div>
              <input type="file" id="product-photo" accept="image/*" class="hidden-input">
              <button type="button" id="btn-select-photo" class="btn btn-secondary btn-small">Selecionar Foto</button>
            </div>
          </div>
          <div class="form-group">
            <label for="product-name">Nome</label>
            <input type="text" id="product-name" placeholder="Ex: Pizza Margherita" required>
          </div>
          <div class="form-group">
            <label for="product-price">Preço (Kz)</label>
            <input type="number" id="product-price" placeholder="Ex: 5000" step="0.01" min="0" required>
          </div>
          <div class="form-group">
            <label for="product-description">Descrição</label>
            <textarea id="product-description" placeholder="Descreva o produto..." rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Acompanhamentos</label>
            <div id="accompaniments-list" class="accompaniments-grid">
              <p class="empty-state">Carregando...</p>
            </div>
          </div>
          <button type="submit" id="btn-save-product" class="btn btn-primary">Salvar</button>
        </form>
      </div>
    </div>
    <div id="delete-confirm-modal" class="modal-overlay hidden">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h2>Confirmar Exclusão</h2>
        </div>
        <p style="color: rgba(255,255,255,0.7); margin-bottom: 24px;">
          Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
        </p>
        <div class="modal-actions">
          <button id="btn-cancel-delete" class="btn btn-secondary">Cancelar</button>
          <button id="btn-confirm-delete" class="btn btn-danger">Excluir</button>
        </div>
      </div>
    </div>
  `

  loadProducts(user)

  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      await api.post(config.ENDPOINTS.AUTH.LOGOUT)
    } catch (err) {}
    Cookies.remove(config.COOKIE_KEYS.USER)
    Cookies.remove(config.COOKIE_KEYS.USER_TYPE)
    navigate('/login')
  })

  document.getElementById('btn-novo-produto').addEventListener('click', () => openModal(null, user))
  document.getElementById('btn-close-modal').addEventListener('click', closeModal)
  document.getElementById('btn-select-photo').addEventListener('click', () => {
    document.getElementById('product-photo').click()
  })
  document.getElementById('product-photo').addEventListener('change', handlePhotoPreview)
  document.getElementById('product-form').addEventListener('submit', (e) => handleSave(e, user))
  document.getElementById('btn-cancel-delete').addEventListener('click', closeDeleteModal)
  document.getElementById('btn-confirm-delete').addEventListener('click', () => handleDelete(user))

  document.getElementById('product-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal()
  })
  document.getElementById('delete-confirm-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDeleteModal()
  })
}

async function loadProducts(user) {
  const container = document.getElementById('products-container')
  container.innerHTML = '<p class="empty-state">Carregando produtos...</p>'

  try {
    allProducts = await api.get(config.ENDPOINTS.PRODUCTS.LIST(user.id))
  } catch (err) {
    container.innerHTML = `<p class="empty-state">Erro ao carregar: ${err.message}</p>`
    return
  }

  if (allProducts.length === 0) {
    container.innerHTML = `
      <p class="empty-state">Nenhum produto cadastrado.</p>
      <p class="empty-state" style="padding-top:0">
        <a href="#/home/merchant/products" id="btn-empty-create" style="color:#e94560">Criar primeiro produto</a>
      </p>
    `
    const emptyBtn = document.getElementById('btn-empty-create')
    if (emptyBtn) {
      emptyBtn.addEventListener('click', (e) => {
        e.preventDefault()
        openModal(null, user)
      })
    }
    return
  }

  container.innerHTML = allProducts.map(p => renderProductCard(p)).join('')

  allProducts.forEach(p => {
    const editBtn = document.getElementById(`edit-${p.id}`)
    const deleteBtn = document.getElementById(`delete-${p.id}`)
    if (editBtn) editBtn.addEventListener('click', () => openModal(p, user))
    if (deleteBtn) deleteBtn.addEventListener('click', () => openDeleteModal(p.id))
  })
}

function renderProductCard(product) {
  const photoUrl = product.photo
    ? `${config.API_URL}${config.ENDPOINTS.MEDIA.GET('products', product.photo)}`
    : null
  const hasAcc = product.accompaniments && product.accompaniments.length > 0

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
        ${product.description
          ? `<p class="product-card-desc">${escapeHtml(product.description)}</p>`
          : ''
        }
        ${hasAcc
          ? `<div class="product-card-acc-tags">
              ${product.accompaniments.map(aId => {
                const acc = allProducts.find(p => p.id === aId)
                return acc
                  ? `<span class="acc-tag">${escapeHtml(acc.name)}</span>`
                  : ''
              }).join('')}
             </div>`
          : ''
        }
      </div>
      <div class="product-card-actions">
        <button id="edit-${product.id}" class="btn-icon btn-icon-edit" title="Editar">✏️</button>
        <button id="delete-${product.id}" class="btn-icon btn-icon-delete" title="Excluir">🗑️</button>
      </div>
    </div>
  `
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function openModal(product, user) {
  currentProductId = product ? product.id : null
  selectedAccompaniments = new Set(product ? (product.accompaniments || []) : [])

  document.getElementById('modal-title').textContent = product ? 'Editar Produto' : 'Novo Produto'
  document.getElementById('product-name').value = product ? product.name : ''
  document.getElementById('product-price').value = product ? product.price : ''
  document.getElementById('product-description').value = product ? product.description : ''

  const preview = document.getElementById('photo-preview')
  if (product && product.photo) {
    preview.innerHTML = `<img src="${config.API_URL}${config.ENDPOINTS.MEDIA.GET('products', product.photo)}" alt="Preview">`
  } else {
    preview.innerHTML = '<span>+</span>'
  }

  loadAccompanimentsCheckboxes(user, product)

  document.getElementById('product-modal').classList.remove('hidden')
}

function closeModal() {
  document.getElementById('product-modal').classList.add('hidden')
  document.getElementById('product-form').reset()
  currentProductId = null
  selectedAccompaniments = new Set()
}

async function loadAccompanimentsCheckboxes(user, product) {
  const container = document.getElementById('accompaniments-list')
  let products
  try {
    products = await api.get(config.ENDPOINTS.PRODUCTS.LIST(user.id))
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Erro ao carregar acompanhamentos</p>'
    return
  }

  const currentId = product ? product.id : null
  const filtered = products.filter(p => p.id !== currentId)

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhum outro produto disponível</p>'
    return
  }

  allAccompaniments = filtered
  container.innerHTML = filtered.map(p => `
    <label class="acc-checkbox">
      <input type="checkbox" value="${p.id}" ${selectedAccompaniments.has(p.id) ? 'checked' : ''}>
      <span>${escapeHtml(p.name)} — ${Number(p.price).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
    </label>
  `).join('')

  container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        selectedAccompaniments.add(cb.value)
      } else {
        selectedAccompaniments.delete(cb.value)
      }
    })
  })
}

function handlePhotoPreview(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const preview = document.getElementById('photo-preview')
    preview.innerHTML = `<img src="${ev.target.result}" alt="Preview">`
  }
  reader.readAsDataURL(file)
}

async function handleSave(e, user) {
  e.preventDefault()

  const name = document.getElementById('product-name').value.trim()
  const price = document.getElementById('product-price').value
  const description = document.getElementById('product-description').value.trim()
  const photoFile = document.getElementById('product-photo').files[0]

  if (!name) {
    showToast('Nome é obrigatório', 'error')
    return
  }
  if (!price || isNaN(price)) {
    showToast('Preço é obrigatório', 'error')
    return
  }

  const formData = new FormData()

  if (currentProductId) {
    formData.append('name', name)
    formData.append('price', price)
    formData.append('description', description)
    formData.append('accompaniments', JSON.stringify([...selectedAccompaniments]))
    if (photoFile) {
      formData.append('photo', photoFile)
    }

    try {
      await api.uploadPut(config.ENDPOINTS.PRODUCTS.UPDATE(currentProductId), formData)
      showToast('Produto atualizado com sucesso!', 'success')
      closeModal()
      loadProducts(user)
    } catch (err) {
      showToast(err.message, 'error')
    }
  } else {
    if (!photoFile) {
      showToast('Selecione uma foto para o produto', 'error')
      return
    }

    formData.append('name', name)
    formData.append('price', price)
    formData.append('description', description)
    formData.append('proprietor', user.id)
    formData.append('photo', photoFile)
    formData.append('accompaniments', JSON.stringify([...selectedAccompaniments]))

    try {
      await api.upload(config.ENDPOINTS.PRODUCTS.REGISTER, formData)
      showToast('Produto criado com sucesso!', 'success')
      closeModal()
      loadProducts(user)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }
}

function openDeleteModal(productId) {
  currentProductId = productId
  document.getElementById('delete-confirm-modal').classList.remove('hidden')
}

function closeDeleteModal() {
  document.getElementById('delete-confirm-modal').classList.add('hidden')
  currentProductId = null
}

async function handleDelete(user) {
  if (!currentProductId) return
  try {
    await api.delete(config.ENDPOINTS.PRODUCTS.DELETE(currentProductId))
    showToast('Produto excluído!', 'success')
    closeDeleteModal()
    loadProducts(user)
  } catch (err) {
    showToast(err.message, 'error')
  }
}
