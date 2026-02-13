import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'

export const useClients = () => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('clients').select('*').order('full_name')
      if (error) throw error
      setClients(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])
  return { clients, loading, error, refetch: fetchClients }
}

export const useCars = () => {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCars = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('cars').select('*, clients(full_name, phone)').order('created_at', { ascending: false })
      if (error) throw error
      setCars(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCars() }, [fetchCars])
  return { cars, loading, error, refetch: fetchCars }
}

export const useOrders = (includeArchived = false) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      // Always fetch ALL orders - filter client-side for reliability (NULL is_archived safe)
      const { data, error } = await supabase
        .from('orders')
        .select(`*, clients(full_name, phone, email), cars(make, model, license_plate, vin), order_items(*)`)
        .order('created_at', { ascending: false })

      if (error) throw error

      let result = data || []
      if (!includeArchived) {
        // Client-side filter: exclude only where is_archived === true
        // This correctly keeps NULL and false records
        result = result.filter(o => o.is_archived !== true)
      }
      setOrders(result)
    } catch (err) {
      setError(err.message)
      console.error('useOrders error:', err)
    } finally {
      setLoading(false)
    }
  }, [includeArchived])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  return { orders, loading, error, refetch: fetchOrders }
}

export const useLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('daily_logs').select('*').order('log_date', { ascending: false })
      if (error) throw error
      setLogs(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])
  return { logs, loading, error, refetch: fetchLogs }
}

export const useServices = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('services').select('*').order('name')
      if (error) throw error
      setServices(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchServices() }, [fetchServices])
  return { services, loading, error, refetch: fetchServices }
}

export const useEmployees = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('employees').select('*').order('name')
      if (error) throw error
      setEmployees(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])
  return { employees, loading, error, refetch: fetchEmployees }
}

// Helper: get local date string YYYY-MM-DD
const getLocalDate = (ts) => {
  const d = new Date(ts)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

// Auto-archive old orders (runs from App.jsx on load)
export const autoArchiveOldOrders = async () => {
  try {
    const today = getLocalDate(new Date())

    // Fetch ALL orders (no server-side filter - avoids NULL issues)
    const { data: allOrders, error: fetchErr } = await supabase
      .from('orders')
      .select('id, created_at, is_archived')
    if (fetchErr) throw fetchErr
    if (!allOrders || allOrders.length === 0) return 0

    // Find non-archived orders from previous days
    const idsToArchive = allOrders
      .filter(o => o.is_archived !== true && getLocalDate(o.created_at) < today)
      .map(o => o.id)

    if (idsToArchive.length === 0) return 0

    const { error: updateErr } = await supabase
      .from('orders')
      .update({ is_archived: true, archived_at: new Date().toISOString() })
      .in('id', idsToArchive)
    if (updateErr) throw updateErr

    console.log('Auto-archived', idsToArchive.length, 'orders')
    return idsToArchive.length
  } catch (err) {
    console.error('Auto-archive failed:', err)
    return 0
  }
}
