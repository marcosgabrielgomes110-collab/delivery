import config from '../configs.js'
import Cookies from 'js-cookie'

async function request(endpoint, options = {}) {
  const url = `${config.API_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    credentials: 'include'
  })

  if (response.status === 401) {
    Cookies.remove('user')
    Cookies.remove('user_type')
    window.location.hash = '/login'
    throw new Error('Sessão expirada')
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Erro na requisição')
  }

  return data
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }),
  put: (endpoint, body) => request(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  upload: async (endpoint, formData) => {
    const response = await fetch(`${config.API_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.detail || data.message || 'Erro no upload')
    }
    return data
  },
  uploadPut: async (endpoint, formData) => {
    const response = await fetch(`${config.API_URL}${endpoint}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.detail || data.message || 'Erro no upload')
    }
    return data
  }
}
