const routes = {}
let currentRoute = null

export function registerRoute(path, handler) {
  routes[path] = handler
}

export function navigate(path) {
  window.location.hash = path
}

export function getCurrentRoute() {
  return currentRoute
}

function handleRoute() {
  const hash = window.location.hash.slice(1) || '/login'
  const handler = routes[hash]

  if (handler) {
    currentRoute = hash
    const app = document.getElementById('app')
    if (app) {
      app.innerHTML = ''
      handler(app)
    }
  } else {
    navigate('/login')
  }
}

export function initRouter() {
  window.addEventListener('hashchange', handleRoute)
  handleRoute()
}
