import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDashboardPath } from '../../utils/helpers'

export function NotFound() {
  const { user } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-base-color flex items-center justify-center px-6">
      <div className="text-center animate-fade-in">
        <div className="text-[120px] font-bold leading-none text-gradient opacity-20 select-none">404</div>
        <h1 className="text-3xl font-bold text-base-color mt-2 mb-2">Page not found</h1>
        <p className="text-muted-color mb-8 max-w-sm mx-auto">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn btn-secondary btn-lg">← Go back</button>
          <Link to={user ? getDashboardPath(user.role) : '/'} className="btn btn-primary btn-lg">
            {user ? 'Dashboard' : 'Home'} →
          </Link>
        </div>
      </div>
    </div>
  )
}

export function Unauthorized() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-base-color flex items-center justify-center px-6">
      <div className="text-center animate-fade-in max-w-md">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-base-color mb-3">Access denied</h1>
        <p className="text-muted-color mb-2">You don't have permission to view this page.</p>
        {user && (
          <p className="text-faint-color text-sm mb-8">
            Signed in as <span className="text-base-color font-medium">{user.name}</span> —
            role: <span className="text-amber-500 font-medium">{user.role?.replace('_',' ')}</span>
          </p>
        )}
        <Link to={user ? getDashboardPath(user.role) : '/login'} className="btn btn-primary btn-lg">
          {user ? 'Go to my dashboard →' : 'Sign in →'}
        </Link>
      </div>
    </div>
  )
}

export default NotFound
