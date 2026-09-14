import { Link } from 'react-router-dom'

const LINK_CLASS = 'text-left hover:text-primary-500 hover:underline transition-colors'

export const ClientLink = ({ id, name, className = '' }) => {
  const label = name || 'N/A'
  if (!id) return <span className={className}>{label}</span>
  return <Link to={'/clients/' + id} className={LINK_CLASS + ' ' + className} title="Shiko klientin">{label}</Link>
}

export const VehicleLink = ({ id, car, showPlate = true, className = '' }) => {
  const name = [car?.make, car?.model].filter(Boolean).join(' ') || 'N/A'
  const plate = car?.license_plate
  const content = (
    <>
      {name}
      {showPlate && plate && <span className="block text-xs text-gray-400 font-mono">{plate}</span>}
    </>
  )
  if (!id) return <span className={className}>{content}</span>
  return <Link to={'/vehicles/' + id} className={LINK_CLASS + ' ' + className} title="Shiko automjetin">{content}</Link>
}
