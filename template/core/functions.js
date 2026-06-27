export function $(selector) {
  return document.querySelector(selector)
}

export function $$(selector) {
  return document.querySelectorAll(selector)
}

export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag)
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value
    } else if (key === 'textContent') {
      el.textContent = value
    } else if (key.startsWith('on')) {
      el.addEventListener(key.slice(2).toLowerCase(), value)
    } else {
      el.setAttribute(key, value)
    }
  })
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child))
    } else {
      el.appendChild(child)
    }
  })
  return el
}

export function showToast(message, type = 'info') {
  const toast = createElement('div', {
    className: `toast toast-${type}`,
    textContent: message
  })
  document.body.appendChild(toast)
  setTimeout(() => toast.classList.add('show'), 10)
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
