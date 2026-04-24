const SETTINGS_KEY = 'app_settings'

export const DEFAULT_SETTINGS = {
  companyName: 'AUTO SERVICE BASHKIMI',
  companySlogan: 'C H I P T U N I N G',
  companyAddress: 'Livoq i Poshtëm, Gjilan',
  companyPhone: '+383 44 955 389 / 044 577 311',
  invoiceFooterMessage: 'Faleminderit që zgjedhët',
}

export function getSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {}
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
