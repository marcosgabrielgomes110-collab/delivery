import { navigate } from '../core/router.js'
import { api } from '../core/api.js'
import { showToast, validateEmail } from '../core/functions.js'
import config from '../configs.js'

export function registerPage(container) {
  container.innerHTML = `
    <div class="auth-container">
      <div class="card">
        <div class="card-header">
          <h2>Registrar</h2>
          <p>Crie sua conta</p>
        </div>
        <form id="register-form">
          <div class="form-group">
            <label>Tipo de Conta</label>
            <div class="toggle-group">
              <button type="button" class="toggle-btn active" data-type="client">Cliente</button>
              <button type="button" class="toggle-btn" data-type="merchant">Lojista</button>
            </div>
          </div>
          <div class="form-group">
            <label>Foto de Perfil <span class="optional">(opcional)</span></label>
            <div class="avatar-upload">
              <div class="avatar-preview" id="avatar-preview">
                <span>+</span>
              </div>
              <input type="file" id="register-avatar" accept="image/*" hidden>
              <button type="button" class="btn btn-avatar" id="avatar-btn">Escolher foto</button>
            </div>
          </div>
          <div class="form-group">
            <label for="register-name">Nome</label>
            <input type="text" id="register-name" placeholder="Seu nome" required>
          </div>
          <div class="form-group">
            <label for="register-email">Email</label>
            <input type="email" id="register-email" placeholder="seu@email.com" required>
          </div>
          <div class="form-group">
            <label for="register-phone">Telefone</label>
            <input type="tel" id="register-phone" placeholder="+244 900 000 000" required>
          </div>
          <div class="form-group">
            <label for="register-password">Senha</label>
            <input type="password" id="register-password" placeholder="••••••••" required>
          </div>
          <div class="form-group">
            <label for="register-confirm">Confirmar Senha</label>
            <input type="password" id="register-confirm" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-register">Criar Conta</button>
        </form>
        <div class="auth-footer">
          <p>Já tem conta? <a href="#/login">Entrar</a></p>
        </div>
      </div>
    </div>
  `

  let userType = 'client'
  let avatarFile = null

  const avatarBtn = document.getElementById('avatar-btn')
  const avatarInput = document.getElementById('register-avatar')
  const avatarPreview = document.getElementById('avatar-preview')

  avatarBtn.addEventListener('click', () => avatarInput.click())

  avatarPreview.addEventListener('click', () => avatarInput.click())

  avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Imagem deve ter no máximo 5MB', 'error')
        return
      }
      avatarFile = file
      const reader = new FileReader()
      reader.onload = (ev) => {
        avatarPreview.innerHTML = `<img src="${ev.target.result}" alt="Preview">`
      }
      reader.readAsDataURL(file)
    }
  })

  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      userType = btn.dataset.type
    })
  })

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const name = document.getElementById('register-name').value
    const email = document.getElementById('register-email').value
    const phone = document.getElementById('register-phone').value
    const password = document.getElementById('register-password').value
    const confirm = document.getElementById('register-confirm').value

    if (!validateEmail(email)) {
      showToast('Email inválido', 'error')
      return
    }

    if (password !== confirm) {
      showToast('As senhas não coincidem', 'error')
      return
    }

    if (password.length < 6) {
      showToast('Senha deve ter no mínimo 6 caracteres', 'error')
      return
    }

    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('email', email)
      formData.append('phone', phone)
      formData.append('password', password)
      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      const endpoint = userType === 'client'
        ? config.ENDPOINTS.AUTH.REGISTER_CLIENT
        : config.ENDPOINTS.AUTH.REGISTER_MERCHANT

      await api.upload(endpoint, formData)
      showToast('Conta criada com sucesso!', 'success')
      navigate('/login')
    } catch (err) {
      showToast(err.message, 'error')
    }
  })
}
