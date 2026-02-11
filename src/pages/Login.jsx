import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { Gauge } from 'lucide-react'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await signIn(email, password); navigate('/') }
    catch (err) { setError(err.message || 'Hyrja dështoi') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-dark-500 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-primary-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Gauge className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-display text-dark-500 tracking-wider mb-1">AUTO SERVICE BASHKIMI</h1>
            <p className="text-sm text-primary-400 font-bold tracking-[3px]">CHIPTUNING</p>
            <p className="text-xs text-gray-400 mt-3">Livoq i Poshtëm, Gjilan</p>
            <p className="text-xs text-gray-400">+383 44 955 389 / 044 577 311</p>
            <p className="text-xs text-gray-500 mt-3">Hyni në llogarinë tuaj</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="stafi@example.com" required />
            <Input label="Fjalëkalimi" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? 'Duke hyrë...' : 'Hyr'}</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
