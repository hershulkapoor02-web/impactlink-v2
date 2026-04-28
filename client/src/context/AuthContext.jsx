import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => { try { return JSON.parse(localStorage.getItem('il_user')) } catch { return null } })
  const [token,   setToken]   = useState(() => localStorage.getItem('il_token'))
  const [loading, setLoading] = useState(true)

  const persist = (tok, usr) => {
    localStorage.setItem('il_token', tok)
    localStorage.setItem('il_user',  JSON.stringify(usr))
    setToken(tok); setUser(usr)
  }

  const logout = useCallback(() => {
    localStorage.removeItem('il_token')
    localStorage.removeItem('il_user')
    setToken(null); setUser(null)
  }, [])

  useEffect(() => {
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
       .then(r => { setUser(r.data.user); localStorage.setItem('il_user', JSON.stringify(r.data.user)) })
       .catch(logout)
       .finally(() => setLoading(false))
  }, [token, logout])

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password })
    persist(r.data.token, r.data.user)
    return r.data.user
  }

  const register = async (payload) => {
    const r = await api.post('/auth/register', payload)
    persist(r.data.token, r.data.user)
    return r.data.user
  }

  const updateUser = (updates) => {
    const u = { ...user, ...updates }
    setUser(u)
    localStorage.setItem('il_user', JSON.stringify(u))
  }

  /**
   * Save the user's precise location coords.
   * Merges into the user's location object and POSTs to /auth/profile.
   *
   * @param {{ lat: number, lng: number, city?: string, state?: string }} coords
   */
  const saveLocation = async (coords) => {
    const location = {
      city:   coords.city  || user?.location?.city  || '',
      state:  coords.state || user?.location?.state || '',
      coords: { lat: coords.lat, lng: coords.lng },
    }
    try {
      const { data } = await api.put('/auth/profile', { location })
      updateUser(data.user)
    } catch {
      // Optimistically update locally even if API call fails
      updateUser({ location })
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, saveLocation }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const c = useContext(AuthContext)
  if (!c) throw new Error('useAuth must be used inside AuthProvider')
  return c
}