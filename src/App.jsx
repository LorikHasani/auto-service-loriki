import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
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

  if (loading) {
    return <Loading fullScreen />
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return children
}

const AppLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading fullScreen />
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Clients />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ClientDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Vehicles />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Services />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Employees />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Orders />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/archive"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Archive />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Logs />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Invoices />
            </AppLayout>
          </ProtectedRoute>
        }
      />
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
