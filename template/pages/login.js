import { navigate } from '../core/router.js'
import { api } from '../core/api.js'
import { showToast, validateEmail } from '../core/functions.js'
import config from '../configs.js'
import Cookies from 'js-cookie'

export function loginPage(container) {
  container.innerHTML = `
    <div class="auth-container">
      <div class="card">
        <div class="card-header">
          <h2>Entrar</h2>
          <p>Bem-vindo de volta!</p>
        </div>
        <form id="login-form">
          <div class="form-group">
            <label>Tipo de Conta</label>
            <div class="toggle-group">
              <button type="button" class="toggle-btn active" data-type="client">Cliente</button>
              <button type="button" class="toggle-btn" data-type="merchant">Lojista</button>
            </div>
          </div>
          <div class="form-group">
            <label for="login-email">Email</label>
            <input type="email" id="login-email" placeholder="seu@email.com" required>
          </div>
          <div class="form-group">
            <label for="login-password">Senha</label>
            <input type="password" id="login-password" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-login">Entrar</button>
        </form>
        <div class="auth-footer">
          <p>Não tem conta? <a href="#/register">Registrar</a></p>
        </div>
      </div>
    </div>
  `

  let userType = 'client'

  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      userType = btn.dataset.type
    })
  })

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('login-email').value
    const password = document.getElementById('login-password').value

    if (!validateEmail(email)) {
      showToast('Email inválido', 'error')
      return
    }

    try {
      const endpoint = userType === 'client'
        ? config.ENDPOINTS.AUTH.LOGIN_CLIENT
        : config.ENDPOINTS.AUTH.LOGIN_MERCHANT

      const data = await api.post(endpoint, { email, password })
      Cookies.set(config.COOKIE_KEYS.USER, JSON.stringify(data.user), { expires: 1 })
      Cookies.set(config.COOKIE_KEYS.USER_TYPE, userType, { expires: 1 })

      showToast('Login realizado com sucesso!', 'success')
      navigate(`/home/${userType}`)
    } catch (err) {
      showToast(err.message, 'error')
    }
  })
}
