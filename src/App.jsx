import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { autoArchiveOldOrders } from './hooks/useData'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Clients } from './pages/Clients'
import { ClientDetail } from './pages/ClientDetail'
import { Vehicles } from './pages/Vehicles'
import { Services } from './pages/Services'
import { Orders } from './pages/Orders'
import { Archive } from './pages/Archive'
import { Logs, Invoices } from './pages/LogsAndInvoices'
import { Employees } from './pages/Employees'
import { Sidebar } from './components/Sidebar'
import { Loading } from './components/Loading'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <Loading fullScreen />
  if (!user) return <Navigate to="/login" />
  return children
}

const AppLayout = ({ children }) => {
  const archiveRan = useRef(false)

  useEffect(() => {
    if (archiveRan.current) return
    archiveRan.current = true

    // Check if we already archived today (avoid loop on reload)
    const today = new Date().toISOString().split('T')[0]
    const lastArchive = sessionStorage.getItem('lastAutoArchive')
    if (lastArchive === today) return

    autoArchiveOldOrders().then((count) => {
      sessionStorage.setItem('lastAutoArchive', today)
      if (count > 0) window.location.reload()
    })
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  )
}

const P = ({ children }) => <ProtectedRoute><AppLayout>{children}</AppLayout></ProtectedRoute>

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <Loading fullScreen />

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<P><Dashboard /></P>} />
      <Route path="/clients" element={<P><Clients /></P>} />
      <Route path="/clients/:id" element={<P><ClientDetail /></P>} />
      <Route path="/vehicles" element={<P><Vehicles /></P>} />
      <Route path="/services" element={<P><Services /></P>} />
      <Route path="/employees" element={<P><Employees /></P>} />
      <Route path="/orders" element={<P><Orders /></P>} />
      <Route path="/archive" element={<P><Archive /></P>} />
      <Route path="/logs" element={<P><Logs /></P>} />
      <Route path="/invoices" element={<P><Invoices /></P>} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
