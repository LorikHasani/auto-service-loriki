import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Button } from './Button'

const PIN = '1982'

export const PasswordGate = ({ children }) => {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const location = useLocation()

  // Lock again when navigating to this page
  useEffect(() => {
    setUnlocked(false)
    setPin('')
    setError(false)
  }, [location.pathname])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (pin === PIN) {
      setUnlocked(true)
      setError(false)
    } else {
      setError(true)
      setPin('')
    }
  }

  if (unlocked) return children

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-xs text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-gray-400" />
        </div>
        <div>
          <p className="text-lg font-display text-dark-500 mb-1">Faqe e mbrojtur</p>
          <p className="text-sm text-gray-500">Vendos kodin PIN për të vazhduar</p>
        </div>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(false) }}
          placeholder="••••"
          autoFocus
          className={`w-full text-center text-2xl tracking-[0.5em] font-mono py-3 px-4 border-2 rounded-xl focus:outline-none transition-colors ${
            error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-primary-400'
          }`}
        />
        {error && <p className="text-sm text-red-500 font-medium">Kodi i gabuar</p>}
        <Button type="submit" className="w-full">Hyr</Button>
      </form>
    </div>
  )
}
