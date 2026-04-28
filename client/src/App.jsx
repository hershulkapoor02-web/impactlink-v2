import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { PageLoader } from './components/ui/index.jsx'
import AppLayout from './components/layout/AppLayout'
import { getDashboardPath } from './utils/helpers'

// Pages
import Landing        from './pages/Landing'
import Login          from './pages/auth/Login'
import Register       from './pages/auth/Register'

import VolunteerDash        from './pages/volunteer/Dashboard'
import VolunteerTasks       from './pages/volunteer/Tasks'
import VolunteerMyTasks     from './pages/volunteer/MyTasks'
import VolunteerMatches     from './pages/volunteer/Matches'
import VolunteerCheckin     from './pages/volunteer/Checkin'
import VolunteerCertificate from './pages/volunteer/Certificate'
import LiveMissions        from './pages/volunteer/LiveMissions'
import VolunteerLeaderboard from './pages/volunteer/Leaderboard'
import VolunteerNotifs      from './pages/volunteer/Notifications'
import VolunteerProfile     from './pages/volunteer/Profile'

import CoordDash      from './pages/coordinator/Dashboard'
import CoordTasks     from './pages/coordinator/Tasks'
import CoordAttend    from './pages/coordinator/Attendance'
import CoordVols      from './pages/coordinator/Volunteers'
import CoordNeeds     from './pages/coordinator/FlagNeeds'
import CoordNotifs    from './pages/coordinator/Notifications'

import OrgDash        from './pages/org/Dashboard'
import OrgTasks       from './pages/org/Tasks'
import OrgNeeds       from './pages/org/Needs'
import OrgVolunteers  from './pages/org/Volunteers'
import OrgImpact      from './pages/org/Impact'
import OrgProfile     from './pages/org/Profile'
import OrgNotifs      from './pages/org/Notifications'

import AdminDash      from './pages/admin/Dashboard'
import AdminUsers     from './pages/admin/Users'
import AdminOrgs      from './pages/admin/Orgs'
import AdminNeeds     from './pages/admin/NeedsHeatmap'
import AdminAnalytics from './pages/admin/Analytics'

import NotFound       from './pages/shared/NotFound'
import Unauthorized   from './pages/shared/Unauthorized'

function Guard({ roles, children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user)   return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />
  return children
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user)   return <Landing />
  return <Navigate to={getDashboardPath(user.role)} replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"            element={<RootRedirect />} />
            <Route path="/login"       element={<Login />} />
            <Route path="/register"    element={<Register />} />
            <Route path="/unauthorized"element={<Unauthorized />} />

            {/* Volunteer */}
            <Route element={<Guard roles={['volunteer']}><AppLayout /></Guard>}>
              <Route path="/volunteer"               element={<VolunteerDash />} />
              <Route path="/volunteer/tasks"         element={<VolunteerTasks />} />
              <Route path="/volunteer/my-tasks"      element={<VolunteerMyTasks />} />
              <Route path="/volunteer/matches"       element={<VolunteerMatches />} />
              <Route path="/volunteer/checkin"       element={<VolunteerCheckin />} />
              <Route path="/volunteer/certificate"   element={<VolunteerCertificate />} />
              <Route path="/volunteer/live"          element={<LiveMissions />} />
              <Route path="/volunteer/leaderboard"   element={<VolunteerLeaderboard />} />
              <Route path="/volunteer/notifications" element={<VolunteerNotifs />} />
              <Route path="/volunteer/profile"       element={<VolunteerProfile />} />
            </Route>

            {/* Coordinator */}
            <Route element={<Guard roles={['coordinator']}><AppLayout /></Guard>}>
              <Route path="/coordinator"                  element={<CoordDash />} />
              <Route path="/coordinator/tasks"            element={<CoordTasks />} />
              <Route path="/coordinator/attendance"       element={<CoordAttend />} />
              <Route path="/coordinator/volunteers"       element={<CoordVols />} />
              <Route path="/coordinator/needs"            element={<CoordNeeds />} />
              <Route path="/coordinator/notifications"    element={<CoordNotifs />} />
            </Route>

            {/* NGO Admin */}
            <Route element={<Guard roles={['ngo_admin']}><AppLayout /></Guard>}>
              <Route path="/org"                    element={<OrgDash />} />
              <Route path="/org/tasks"              element={<OrgTasks />} />
              <Route path="/org/needs"              element={<OrgNeeds />} />
              <Route path="/org/volunteers"         element={<OrgVolunteers />} />
              <Route path="/org/impact"             element={<OrgImpact />} />
              <Route path="/org/profile"            element={<OrgProfile />} />
              <Route path="/org/notifications"      element={<OrgNotifs />} />
            </Route>

            {/* Super Admin */}
            <Route element={<Guard roles={['super_admin']}><AppLayout /></Guard>}>
              <Route path="/admin"             element={<AdminDash />} />
              <Route path="/admin/users"       element={<AdminUsers />} />
              <Route path="/admin/orgs"        element={<AdminOrgs />} />
              <Route path="/admin/needs"       element={<AdminNeeds />} />
              <Route path="/admin/analytics"   element={<AdminAnalytics />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
