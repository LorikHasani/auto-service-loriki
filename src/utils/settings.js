import { supabase } from '../services/supabase'

export const DEFAULT_SETTINGS = {
  companyName: 'AUTO SERVICE BASHKIMI',
  companySlogan: 'C H I P T U N I N G',
  companyAddress: 'Livoq i Poshtëm, Gjilan',
  companyPhone: '+383 44 955 389 / 044 577 311',
  invoiceFooterMessage: 'Faleminderit që zgjedhët',
}

function fromDb(row) {
  return {
    id: row.id,
    name: row.name,
    companyName: row.company_name || '',
    companySlogan: row.company_slogan || '',
    companyAddress: row.company_address || '',
    companyPhone: row.company_phone || '',
    invoiceFooterMessage: row.invoice_footer_message || '',
    isActive: row.is_active,
  }
}

function toDb(tpl) {
  return {
    name: tpl.name,
    company_name: tpl.companyName,
    company_slogan: tpl.companySlogan,
    company_address: tpl.companyAddress,
    company_phone: tpl.companyPhone,
    invoice_footer_message: tpl.invoiceFooterMessage,
  }
}

// ── Templates ────────────────────────────────────────────────────────────────

export async function getTemplates() {
  const { data, error } = await supabase
    .from('invoice_templates')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(fromDb)
}

export async function createTemplate(tpl) {
  const { data, error } = await supabase
    .from('invoice_templates')
    .insert([{ ...toDb(tpl), is_active: false }])
    .select()
    .single()
  if (error) throw error
  return fromDb(data)
}

export async function saveTemplate(tpl) {
  const { error } = await supabase
    .from('invoice_templates')
    .update(toDb(tpl))
    .eq('id', tpl.id)
  if (error) throw error
}

export async function deleteTemplate(id) {
  const { error } = await supabase
    .from('invoice_templates')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Active template ───────────────────────────────────────────────────────────

export async function setActiveTemplate(id) {
  await supabase.from('invoice_templates').update({ is_active: false }).neq('id', id)
  const { error } = await supabase.from('invoice_templates').update({ is_active: true }).eq('id', id)
  if (error) throw error
}

// ── Current settings (active template or fallback) ────────────────────────────

export async function getSettings() {
  const { data, error } = await supabase
    .from('invoice_templates')
    .select('*')
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  if (data) {
    const { id, name, isActive, ...fields } = fromDb(data)
    return { ...DEFAULT_SETTINGS, ...fields }
  }
  return { ...DEFAULT_SETTINGS }
}

export async function saveSettings(settings) {
  const { data, error } = await supabase
    .from('invoice_templates')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error

  if (data) {
    const { error: updateError } = await supabase
      .from('invoice_templates')
      .update({
        company_name: settings.companyName,
        company_slogan: settings.companySlogan,
        company_address: settings.companyAddress,
        company_phone: settings.companyPhone,
        invoice_footer_message: settings.invoiceFooterMessage,
      })
      .eq('id', data.id)
    if (updateError) throw updateError
  } else {
    const { error: insertError } = await supabase
      .from('invoice_templates')
      .insert([{
        name: 'Parazgjedhja',
        company_name: settings.companyName,
        company_slogan: settings.companySlogan,
        company_address: settings.companyAddress,
        company_phone: settings.companyPhone,
        invoice_footer_message: settings.invoiceFooterMessage,
        is_active: true,
      }])
    if (insertError) throw insertError
  }
}
