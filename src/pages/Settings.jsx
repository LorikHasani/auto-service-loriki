import { useState } from 'react'
import { Save, RotateCcw, Building2, Phone, MapPin, FileText, MessageSquare } from 'lucide-react'
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '../utils/settings'

export const Settings = () => {
  const [form, setForm] = useState(getSettings)
  const [saved, setSaved] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  const handleSave = () => {
    saveSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    setForm({ ...DEFAULT_SETTINGS })
    saveSettings({ ...DEFAULT_SETTINGS })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-100">Cilësimet</h1>
        <p className="text-gray-400 text-sm mt-1">Personalizo informacionin e biznesit dhe faturave</p>
      </div>

      {/* Company info card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary-400" />
          <h2 className="font-semibold text-dark-100">Informacioni i Biznesit</h2>
        </div>

        <div className="p-6 space-y-5">
          <Field
            label="Emri i Biznesit"
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            placeholder="p.sh. AUTO SERVICE BASHKIMI"
            icon={<Building2 className="w-4 h-4 text-gray-400" />}
          />
          <Field
            label="Slogani / Nëntitulli"
            name="companySlogan"
            value={form.companySlogan}
            onChange={handleChange}
            placeholder="p.sh. C H I P T U N I N G"
            icon={<FileText className="w-4 h-4 text-gray-400" />}
          />
          <Field
            label="Adresa"
            name="companyAddress"
            value={form.companyAddress}
            onChange={handleChange}
            placeholder="p.sh. Livoq i Poshtëm, Gjilan"
            icon={<MapPin className="w-4 h-4 text-gray-400" />}
          />
          <Field
            label="Telefoni"
            name="companyPhone"
            value={form.companyPhone}
            onChange={handleChange}
            placeholder="p.sh. +383 44 955 389 / 044 577 311"
            icon={<Phone className="w-4 h-4 text-gray-400" />}
          />
        </div>
      </div>

      {/* Invoice customization card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary-400" />
          <h2 className="font-semibold text-dark-100">Personalizimi i Faturës</h2>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mesazhi i Fundit të Faturës
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Ky tekst shfaqet në fund të faturës. Emri i biznesit shtohet automatikisht pas tij.
            </p>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                name="invoiceFooterMessage"
                value={form.invoiceFooterMessage}
                onChange={handleChange}
                placeholder="p.sh. Faleminderit që zgjedhët"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition"
              />
            </div>
            <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-500 border border-dashed border-gray-200">
              <span className="font-medium text-gray-700">Pamje paraprake: </span>
              {form.invoiceFooterMessage} <span className="text-primary-400 font-semibold">{form.companyName}</span>!
            </div>
          </div>
        </div>
      </div>

      {/* Invoice header preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-400" />
          <h2 className="font-semibold text-dark-100">Pamje paraprake e Faturës</h2>
        </div>
        <div className="p-6">
          <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
            <div className="flex justify-between items-start border-b-2 border-orange-400 pb-4 mb-4">
              <div>
                <div className="text-lg font-extrabold text-orange-500 tracking-widest">{form.companyName || '—'}</div>
                <div className="text-xs font-bold tracking-[3px] text-dark-100 mt-1">{form.companySlogan || '—'}</div>
                <div className="text-xs text-gray-500 mt-1">{form.companyAddress || '—'}</div>
                <div className="text-xs text-gray-500">Tel: {form.companyPhone || '—'}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-dark-100">POROSI</div>
                <div className="text-sm text-gray-400">#1234</div>
              </div>
            </div>
            <div className="text-center text-xs text-gray-400 border-t pt-3 mt-2">
              {form.invoiceFooterMessage} <span className="font-semibold text-orange-500">{form.companyName}</span>!
              <div className="text-[10px] mt-1">{form.companyAddress} | Tel: {form.companyPhone}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-400 text-white rounded-lg text-sm font-semibold hover:bg-primary-500 transition shadow-sm"
        >
          <Save className="w-4 h-4" />
          {saved ? 'U ruajt!' : 'Ruaj Ndryshimet'}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Rikthe Parazgjedhjet
        </button>
      </div>
    </div>
  )
}

function Field({ label, name, value, onChange, placeholder, icon }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition"
        />
      </div>
    </div>
  )
}
