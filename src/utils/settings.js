const TEMPLATES_KEY = 'app_templates'
const ACTIVE_KEY = 'app_active_template'

export const DEFAULT_SETTINGS = {
  companyName: 'AUTO SERVICE BASHKIMI',
  companySlogan: 'C H I P T U N I N G',
  companyAddress: 'Livoq i Poshtëm, Gjilan',
  companyPhone: '+383 44 955 389 / 044 577 311',
  invoiceFooterMessage: 'Faleminderit që zgjedhët',
}

// ── Templates ────────────────────────────────────────────────────────────────

export function getTemplates() {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

function persistTemplates(templates) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
}

export function saveTemplate(template) {
  // template must have { id, name, ...fields }
  const templates = getTemplates()
  const idx = templates.findIndex(t => t.id === template.id)
  if (idx >= 0) templates[idx] = template
  else templates.push(template)
  persistTemplates(templates)
}

export function deleteTemplate(id) {
  const templates = getTemplates().filter(t => t.id !== id)
  persistTemplates(templates)
  // if deleted template was active, clear active
  if (getActiveTemplateId() === id) {
    localStorage.removeItem(ACTIVE_KEY)
  }
}

// ── Active template ───────────────────────────────────────────────────────────

export function getActiveTemplateId() {
  return localStorage.getItem(ACTIVE_KEY) || null
}

export function setActiveTemplate(id) {
  localStorage.setItem(ACTIVE_KEY, id)
}

// ── Current settings (active template or fallback) ────────────────────────────

export function getSettings() {
  const activeId = getActiveTemplateId()
  if (activeId) {
    const tpl = getTemplates().find(t => t.id === activeId)
    if (tpl) {
      const { id, name, ...fields } = tpl
      return { ...DEFAULT_SETTINGS, ...fields }
    }
  }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings) {
  const activeId = getActiveTemplateId()
  if (activeId) {
    const templates = getTemplates()
    const idx = templates.findIndex(t => t.id === activeId)
    if (idx >= 0) {
      templates[idx] = { ...templates[idx], ...settings }
      persistTemplates(templates)
      return
    }
  }
  // No active template — just persist as a standalone "active" settings blob
  // (legacy path, creates a template automatically)
  const id = Date.now().toString()
  saveTemplate({ id, name: 'Parazgjedhja', ...settings })
  setActiveTemplate(id)
}
