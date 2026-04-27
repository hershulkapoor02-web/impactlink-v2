import axios from 'axios'

const api = axios.create({ baseURL: '/api', headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('il_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('il_token')
    localStorage.removeItem('il_user')
    if (!window.location.pathname.includes('/login')) window.location.href = '/login'
  }
  return Promise.reject(err)
})

export default api
