import { useState } from 'react'
import {
  Save, RotateCcw, Building2, Phone, MapPin, FileText,
  MessageSquare, Plus, Trash2, Check, BookTemplate, ChevronRight
} from 'lucide-react'
import {
  getSettings, saveSettings, DEFAULT_SETTINGS,
  getTemplates, saveTemplate, deleteTemplate,
  getActiveTemplateId, setActiveTemplate
} from '../utils/settings'

export const Settings = () => {
  const [templates, setTemplates] = useState(getTemplates)
  const [activeId, setActiveId] = useState(getActiveTemplateId)
  const [form, setForm] = useState(getSettings)
  const [saved, setSaved] = useState(false)

  // New-template creation state
  const [creatingNew, setCreatingNew] = useState(false)
  const [newName, setNewName] = useState('')

  const refreshTemplates = () => {
    setTemplates(getTemplates())
    setActiveId(getActiveTemplateId())
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  // Activate an existing template and load its fields into the form
  const handleSelectTemplate = (tpl) => {
    setActiveTemplate(tpl.id)
    const { id, name, ...fields } = tpl
    setForm({ ...DEFAULT_SETTINGS, ...fields })
    setActiveId(tpl.id)
    setSaved(false)
    setCreatingNew(false)
  }

  // Save current form into the active template
  const handleSave = () => {
    saveSettings(form)
    refreshTemplates()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // Save current form as a brand-new named template
  const handleSaveAsNew = () => {
    if (!newName.trim()) return
    const id = Date.now().toString()
    const tpl = { id, name: newName.trim(), ...form }
    saveTemplate(tpl)
    setActiveTemplate(id)
    refreshTemplates()
    setCreatingNew(false)
    setNewName('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleDelete = (id, e) => {
    e.stopPropagation()
    if (templates.length === 1) return // don't delete the last one
    deleteTemplate(id)
    const remaining = getTemplates()
    if (remaining.length > 0) {
      handleSelectTemplate(remaining[0])
    }
    refreshTemplates()
  }

  const handleReset = () => {
    setForm({ ...DEFAULT_SETTINGS })
    saveSettings({ ...DEFAULT_SETTINGS })
    refreshTemplates()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const activeTemplate = templates.find(t => t.id === activeId)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-100">Cilësimet</h1>
        <p className="text-gray-400 text-sm mt-1">Personalizo dhe menaxho templates e faturave</p>
      </div>

      {/* ── Templates list ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-400" />
            <h2 className="font-semibold text-gray-800">Templates e Ruajtura</h2>
          </div>
          <button
            onClick={() => { setCreatingNew(true); setNewName('') }}
            className="flex items-center gap-1.5 text-xs font-medium text-primary-400 hover:text-primary-500 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Template i Ri
          </button>
        </div>

        {templates.length === 0 && !creatingNew && (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            Nuk ka templates të ruajtura. Krijo një të ri.
          </div>
        )}

        {templates.length > 0 && (
          <div className="divide-y divide-gray-50">
            {templates.map(tpl => {
              const isActive = tpl.id === activeId
              return (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`w-full flex items-center justify-between px-6 py-3.5 text-left transition hover:bg-gray-50 ${isActive ? 'bg-primary-400/5' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-primary-400 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-semibold truncate ${isActive ? 'text-primary-400' : 'text-dark-100'}`}>
                        {tpl.name}
                        {isActive && <span className="ml-2 text-[10px] font-medium bg-primary-400/10 text-primary-400 px-1.5 py-0.5 rounded-full">AKTIV</span>}
                      </div>
                      <div className="text-xs text-gray-400 truncate mt-0.5">{tpl.companyName} — {tpl.companyAddress}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {templates.length > 1 && (
                      <span
                        onClick={(e) => handleDelete(tpl.id, e)}
                        className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-primary-400' : 'text-gray-300'}`} />
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Inline new-template name input */}
        {creatingNew && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center gap-3">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveAsNew(); if (e.key === 'Escape') setCreatingNew(false) }}
              placeholder="Emri i templateit (p.sh. Fatura Kryesore)"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400"
            />
            <button
              onClick={handleSaveAsNew}
              disabled={!newName.trim()}
              className="px-4 py-2 bg-primary-400 text-white text-sm font-medium rounded-lg hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Krijo
            </button>
            <button
              onClick={() => setCreatingNew(false)}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Anulo
            </button>
          </div>
        )}
      </div>

      {/* ── Edit form (only shown when a template is active) ── */}
      {(activeTemplate || templates.length === 0) && (
        <>
          {activeTemplate && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Duke edituar:</span>
              <span className="font-semibold text-dark-100">{activeTemplate.name}</span>
            </div>
          )}

          {/* Company info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-400" />
              <h2 className="font-semibold text-gray-800">Informacioni i Biznesit</h2>
            </div>
            <div className="p-6 space-y-5">
              <Field label="Emri i Biznesit" name="companyName" value={form.companyName} onChange={handleChange}
                placeholder="p.sh. AUTO SERVICE BASHKIMI" icon={<Building2 className="w-4 h-4 text-gray-400" />} />
              <Field label="Slogani / Nëntitulli" name="companySlogan" value={form.companySlogan} onChange={handleChange}
                placeholder="p.sh. C H I P T U N I N G" icon={<FileText className="w-4 h-4 text-gray-400" />} />
              <Field label="Adresa" name="companyAddress" value={form.companyAddress} onChange={handleChange}
                placeholder="p.sh. Livoq i Poshtëm, Gjilan" icon={<MapPin className="w-4 h-4 text-gray-400" />} />
              <Field label="Telefoni" name="companyPhone" value={form.companyPhone} onChange={handleChange}
                placeholder="p.sh. +383 44 955 389 / 044 577 311" icon={<Phone className="w-4 h-4 text-gray-400" />} />
            </div>
          </div>

          {/* Footer message */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-400" />
              <h2 className="font-semibold text-gray-800">Mesazhi i Fundit të Faturës</h2>
            </div>
            <div className="p-6">
              <p className="text-xs text-gray-400 mb-3">
                Shfaqet në fund të faturës. Emri i biznesit shtohet automatikisht pas tij.
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
                <span className="font-medium text-gray-700">Pamje: </span>
                {form.invoiceFooterMessage} <span className="text-primary-400 font-semibold">{form.companyName}</span>!
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-400" />
              <h2 className="font-semibold text-gray-800">Pamje paraprake e Faturës</h2>
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
                <div className="text-center text-xs text-gray-400 border-t pt-3">
                  {form.invoiceFooterMessage} <span className="font-semibold text-orange-500">{form.companyName}</span>!
                  <div className="text-[10px] mt-1">{form.companyAddress} | Tel: {form.companyPhone}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-400 text-white rounded-lg text-sm font-semibold hover:bg-primary-500 transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saved ? 'U ruajt!' : `Ruaj në "${activeTemplate?.name || 'Template'}"`}
            </button>
            <button
              onClick={() => { setCreatingNew(true); setNewName('') }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              <Plus className="w-4 h-4" />
              Ruaj si Template të Ri
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-gray-600 text-sm transition"
            >
              <RotateCcw className="w-4 h-4" />
              Rikthe Parazgjedhjet
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Field({ label, name, value, onChange, placeholder, icon }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-1.5">{label}</label>
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
