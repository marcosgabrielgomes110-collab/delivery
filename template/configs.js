const config = {
  API_URL: import.meta.env.VITE_API_URL || '',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'PySupa',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',

  ENDPOINTS: {
    AUTH: {
      LOGIN_CLIENT: '/api/v1/auth/login/client',
      LOGIN_MERCHANT: '/api/v1/auth/login/merchant',
      REGISTER_CLIENT: '/api/v1/register/client',
      REGISTER_MERCHANT: '/api/v1/register/merchant',
      LOGOUT: '/api/v1/auth/logout',
      LOGOUT_ALL: '/api/v1/auth/logout/all',
      REFRESH: '/api/v1/auth/refresh',
      VALIDATE: '/api/v1/auth/validate'
    },
    MEDIA: {
      GET: (db, file) => `/api/v1/media/${db}/${file}`,
      DELETE: (db, file) => `/api/v1/media/${db}/${file}`
    },
    UPLOAD: {
      AVATAR: '/api/v1/upload/avatar'
    },
    PRODUCTS: {
      LIST: (proprietor) => `/api/v1/products?proprietor=${proprietor}`,
      REGISTER: '/api/v1/products/register',
      DETAIL: (id) => `/api/v1/products/${id}`,
      UPDATE: (id) => `/api/v1/products/${id}`,
      DELETE: (id) => `/api/v1/products/${id}`,
    },
    PUBLIC: {
      PRODUCTS: (params = {}) => {
        const q = params.q ? `&q=${encodeURIComponent(params.q)}` : ''
        const p = params.proprietor ? `&proprietor=${params.proprietor}` : ''
        return `/api/v1/public/products?${q}${p}`.replace('?&', '?').replace(/[?&]$/, '')
      },
      MERCHANTS: (q) => q ? `/api/v1/public/merchants?q=${encodeURIComponent(q)}` : '/api/v1/public/merchants',
      MERCHANT_DETAIL: (id) => `/api/v1/public/merchants/${id}`,
    }
  },

  COOKIE_KEYS: {
    USER: 'user',
    USER_TYPE: 'user_type'
  }
}

export default config
