import { formatCurrency, formatDate } from './helpers'
import { getSettings } from './settings'

async function getCompany() {
  const s = await getSettings()
  return {
    name: s.companyName,
    slogan: s.companySlogan,
    address: s.companyAddress,
    phone: s.companyPhone,
    footerMessage: s.invoiceFooterMessage,
  }
}

const PRINT_STYLES = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#1a1a2e;line-height:1.6}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #FF6B35}
.company{font-size:24px;font-weight:800;color:#FF6B35;letter-spacing:2px}
.company-slogan{font-size:14px;color:#1a1a2e;margin-top:4px;font-weight:700;letter-spacing:3px}
.company-info{font-size:12px;color:#666;margin-top:6px;line-height:1.5}
.invoice-title{text-align:right}
.invoice-title h2{font-size:24px;color:#1a1a2e;margin-bottom:8px}
.invoice-title p{color:#666;font-size:14px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px}
.info-box{background:#f8f9fa;border-radius:8px;padding:16px}
.info-box h3{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#FF6B35;margin-bottom:10px;font-weight:700}
.info-box p{font-size:14px;margin-bottom:4px;color:#333}
.info-box .label{color:#888;font-size:12px}
table{width:100%;border-collapse:collapse;margin:20px 0}
th{padding:12px 16px;text-align:left;background:#1a1a2e;color:white;font-size:12px;text-transform:uppercase;letter-spacing:1px}
td{padding:10px 16px;border-bottom:1px solid #eee;font-size:14px}
tr:last-child td{border-bottom:none}
.total-section{margin-top:20px;border-top:2px solid #1a1a2e;padding-top:16px}
.total-row{display:flex;justify-content:space-between;padding:6px 16px;font-size:14px}
.total-row.grand{font-size:20px;font-weight:800;color:#FF6B35;border-top:2px solid #FF6B35;padding-top:12px;margin-top:8px}
.status-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
.status-paid{background:#d4edda;color:#155724}
.status-unpaid{background:#f8d7da;color:#721c24}
.footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #eee;color:#888;font-size:13px}
.date-line{font-size:13px;color:#666;margin-bottom:20px}
.page-break{page-break-before:always}
@media print{body{padding:20px}}
`

function buildProductRows(items, showPrices) {
  let productRows = ''
  let rowNum = 0
  const colCount = showPrices ? 5 : 3

  items.forEach(item => {
    const parts = item.parts_json || []
    const laborCost = parseFloat(item.labor_cost) || 0

    if (parts.length > 0 || laborCost > 0) {
      // Service name as subtitle row spanning full width
      productRows += '<tr><td colspan="' + colCount + '" style="background:#f8f9fa;padding:10px 16px;border-bottom:2px solid #FF6B35">' +
        '<strong style="font-size:15px;color:#1a1a2e">' + item.service_name + '</strong>' +
        (showPrices ? '<span style="float:right;font-weight:700;color:#FF6B35">' + formatCurrency(item.unit_price) + '</span>' : '') +
        '</td></tr>'

      parts.forEach(part => {
        if (!part.name) return
        rowNum++
        const qty = parseFloat(part.quantity) || 1
        const price = parseFloat(part.sell_price) || 0
        productRows += '<tr><td style="padding-left:24px;color:#888">' + rowNum + '</td><td style="padding-left:8px">' + part.name + '</td><td style="text-align:center">' + qty + '</td>' +
          (showPrices ? '<td style="text-align:right">' + formatCurrency(price) + '</td><td style="text-align:right"><strong>' + formatCurrency(qty * price) + '</strong></td>' : '') + '</tr>'
      })
    } else {
      // Service without parts — single row with number
      rowNum++
      productRows += '<tr><td>' + rowNum + '</td><td><strong>' + item.service_name + '</strong>' +
        (item.description ? '<div style="color:#888;font-size:13px;margin-top:2px">' + item.description + '</div>' : '') +
        '</td><td style="text-align:center">1</td>' +
        (showPrices ? '<td style="text-align:right">' + formatCurrency(item.unit_price) + '</td><td style="text-align:right"><strong>' + formatCurrency(item.quantity * item.unit_price) + '</strong></td>' : '') + '</tr>'
    }
  })
  return productRows
}

function companyHeader(COMPANY) {
  return '<div><div class="company">' + COMPANY.name + '</div><div class="company-slogan">' + COMPANY.slogan + '</div>' +
    '<div class="company-info">' + COMPANY.address + '<br/>Tel: ' + COMPANY.phone + '</div></div>'
}

function buildOrderPage(order, COMPANY, { showPrices, showOrderNo }) {
  const items = order.order_items || []
  const total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const productRows = buildProductRows(items, showPrices)
  const todayStr = formatDate(new Date())

  return `<div class="header">
  ${companyHeader(COMPANY)}
  <div class="invoice-title">
    ${showOrderNo ? '<h2>POROSI</h2><p>#' + order.id + '</p>' : '<h2>RAPORT SH\u00CBRBIMI</h2>'}
    <p>${formatDate(order.created_at)}</p>
  </div>
</div>

<p class="date-line"><strong>Data e printimit:</strong> ${todayStr}</p>

<div class="info-grid">
  <div class="info-box">
    <h3>Klienti</h3>
    <p><strong>${order.clients?.full_name || ''}</strong></p>
    <p>${order.clients?.phone || ''}</p>
    <p>${order.clients?.email || ''}</p>
  </div>
  <div class="info-box">
    <h3>Automjeti</h3>
    <p><strong>${order.cars?.make || ''} ${order.cars?.model || ''}</strong></p>
    <p><span class="label">Targa:</span> ${order.cars?.license_plate || ''}</p>
    ${order.cars?.vin ? '<p><span class="label">VIN:</span> ' + order.cars.vin + '</p>' : ''}
    ${order.km ? '<p><span class="label">Km:</span> ' + Number(order.km).toLocaleString() + ' km</p>' : ''}
  </div>
</div>

<table>
  <thead><tr>
    <th style="width:40px">#</th><th>Produkti / Sh\u00EBrbimi</th><th style="text-align:center">Sasia</th>
    ${showPrices ? '<th style="text-align:right">\u00C7mimi</th><th style="text-align:right">Totali</th>' : ''}
  </tr></thead>
  <tbody>${productRows}</tbody>
</table>

${showPrices ? `
<div class="total-section">
  <div class="total-row grand"><span>TOTALI</span><span>${formatCurrency(total)}</span></div>
  <div style="text-align:right;margin-top:12px">
    <span class="status-badge ${order.is_paid ? 'status-paid' : 'status-unpaid'}">${order.is_paid ? '\u2713 PAGUAR' : 'PA PAGUAR'}</span>
  </div>
</div>` : ''}

<div class="footer">
  <p>${COMPANY.footerMessage} ${COMPANY.name}!</p>
  <p style="font-size:11px;margin-top:4px">${COMPANY.address} | Tel: ${COMPANY.phone}</p>
</div>`
}

export const printOrderDocument = async (order, { showPrices = true, showOrderNo = true } = {}) => {
  const COMPANY = await getCompany()
  const pw = window.open('', '', 'height=700,width=800')
  pw.document.write(`<html><head><title>${showOrderNo ? 'Porosi #' + order.id : 'Raport Shërbimi'}</title>
<style>${PRINT_STYLES}</style></head><body>
${buildOrderPage(order, COMPANY, { showPrices, showOrderNo })}
</body></html>`)
  pw.document.close()
  pw.print()
}

// Prints one full "Raport Shërbimi" per order, each on its own page, in a single print job.
export const printOrderReports = async (orders, { showPrices = true, showOrderNo = true, title = 'Raportet e Shërbimeve' } = {}) => {
  const COMPANY = await getCompany()
  const sorted = [...orders].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const pages = sorted.map((order, idx) =>
    '<div' + (idx > 0 ? ' class="page-break"' : '') + '>' + buildOrderPage(order, COMPANY, { showPrices, showOrderNo }) + '</div>'
  ).join('\n')

  const pw = window.open('', '', 'height=700,width=800')
  pw.document.write(`<html><head><title>${title}</title>
<style>${PRINT_STYLES}</style></head><body>
${pages}
</body></html>`)
  pw.document.close()
  pw.print()
}

export const printDailyReport = async (orders, dateLabel) => {
  const COMPANY = await getCompany()
  const calculateTotal = (order) => {
    return (order.order_items || []).reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  }

  const grandTotal = orders.reduce((sum, o) => sum + calculateTotal(o), 0)
  const paidTotal = orders.filter(o => o.is_paid).reduce((sum, o) => sum + calculateTotal(o), 0)
  const unpaidTotal = orders.filter(o => !o.is_paid).reduce((sum, o) => sum + calculateTotal(o), 0)
  const cogs = orders.reduce((sum, o) => sum + (o.order_items || []).reduce((s, i) => s + (parseFloat(i.parts_cost) || 0), 0), 0)
  const todayStr = formatDate(new Date())

  let orderRows = ''
  orders.forEach((order, idx) => {
    const total = calculateTotal(order)
    const items = order.order_items || []
    // Build compact service + parts detail
    let servicesHtml = ''
    items.forEach(item => {
      servicesHtml += '<div style="margin-bottom:3px"><strong>' + item.service_name + '</strong>'
      const parts = item.parts_json || []
      if (parts.length > 0) {
        const partNames = parts.filter(p => p.name).map(p => {
          return p.name + (p.quantity > 1 ? ' (' + p.quantity + 'x)' : '')
        })
        if (partNames.length > 0) {
          servicesHtml += '<span style="color:#888;font-size:10px;display:block;margin-left:6px">' + partNames.join(', ') + '</span>'
        }
      } else if (item.description) {
        servicesHtml += '<span style="color:#888;font-size:10px;display:block;margin-left:6px">' + item.description + '</span>'
      }
      servicesHtml += '</div>'
    })
    orderRows += '<tr>' +
      '<td>' + (idx + 1) + '</td>' +
      '<td><strong>#' + order.id + '</strong></td>' +
      '<td>' + (order.clients?.full_name || '') + '</td>' +
      '<td>' + (order.cars?.make || '') + ' ' + (order.cars?.model || '') +
        '<span style="font-size:11px;color:#888;display:block">' + (order.cars?.license_plate || '') + '</span></td>' +
      '<td style="font-size:11px;color:#555;max-width:220px;line-height:1.3">' + servicesHtml + '</td>' +
      '<td style="text-align:right"><strong>' + formatCurrency(total) + '</strong></td>' +
      '<td style="text-align:center"><span class="status-badge ' + (order.is_paid ? 'status-paid' : 'status-unpaid') + '">' + (order.is_paid ? 'Paguar' : 'Pa paguar') + '</span></td>' +
      '</tr>'
  })

  const pw = window.open('', '', 'height=700,width=900')
  pw.document.write(`<html><head><title>Raporti Ditor - ${dateLabel}</title>
<style>${PRINT_STYLES}
td{padding:8px 12px;font-size:13px}
th{padding:10px 12px;font-size:11px}
</style></head><body>

<div class="header">
  ${companyHeader(COMPANY)}
  <div class="invoice-title">
    <h2>RAPORTI DITOR</h2>
    <p>${dateLabel}</p>
  </div>
</div>

<p class="date-line"><strong>Data e printimit:</strong> ${todayStr}</p>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;margin-bottom:24px">
  <div style="background:#f0f9ff;border-radius:8px;padding:14px;text-align:center;border:1px solid #bae6fd">
    <div style="font-size:22px;font-weight:800;color:#0284c7">${orders.length}</div>
    <div style="font-size:11px;color:#666;margin-top:4px">POROSI</div>
  </div>
  <div style="background:#f0fdf4;border-radius:8px;padding:14px;text-align:center;border:1px solid #bbf7d0">
    <div style="font-size:22px;font-weight:800;color:#16a34a">${formatCurrency(grandTotal)}</div>
    <div style="font-size:11px;color:#666;margin-top:4px">T\u00CB ARDHURA</div>
  </div>
  <div style="background:#fefce8;border-radius:8px;padding:14px;text-align:center;border:1px solid #fef08a">
    <div style="font-size:22px;font-weight:800;color:#ca8a04">${formatCurrency(cogs)}</div>
    <div style="font-size:11px;color:#666;margin-top:4px">KOSTO</div>
  </div>
  <div style="background:#fdf2f8;border-radius:8px;padding:14px;text-align:center;border:1px solid #fbcfe8">
    <div style="font-size:22px;font-weight:800;color:#db2777">${formatCurrency(grandTotal - cogs)}</div>
    <div style="font-size:11px;color:#666;margin-top:4px">FITIMI</div>
  </div>
</div>

<table>
  <thead><tr>
    <th>#</th><th>ID</th><th>Klienti</th><th>Automjeti</th><th>Sh\u00EBrbimet</th><th style="text-align:right">Totali</th><th style="text-align:center">Statusi</th>
  </tr></thead>
  <tbody>${orderRows}</tbody>
</table>

<div class="total-section">
  <div class="total-row"><span>Paguar:</span><span style="color:#16a34a;font-weight:700">${formatCurrency(paidTotal)}</span></div>
  <div class="total-row"><span>Pa paguar:</span><span style="color:#dc2626;font-weight:700">${formatCurrency(unpaidTotal)}</span></div>
  <div class="total-row grand"><span>TOTALI I DIT\u00CBS</span><span>${formatCurrency(grandTotal)}</span></div>
</div>

<div class="footer">
  <p>${COMPANY.name} | ${COMPANY.address} | Tel: ${COMPANY.phone}</p>
</div>
</body></html>`)
  pw.document.close()
  pw.print()
}

export const printServiceHistory = async (orders, { client, car, showPrices = true } = {}) => {
  const COMPANY = await getCompany()
  const calculateTotal = (order) => (order.order_items || []).reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

  const sorted = [...orders].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const grandTotal = sorted.reduce((sum, o) => sum + calculateTotal(o), 0)
  const paidTotal = sorted.filter(o => o.is_paid).reduce((sum, o) => sum + calculateTotal(o), 0)
  const unpaidTotal = grandTotal - paidTotal
  const todayStr = formatDate(new Date())

  const firstDate = sorted.length > 0 ? formatDate(sorted[0].created_at) : '—'
  const lastDate = sorted.length > 0 ? formatDate(sorted[sorted.length - 1].created_at) : '—'

  let orderRows = ''
  sorted.forEach((order, idx) => {
    const items = order.order_items || []
    let servicesHtml = ''
    items.forEach(item => {
      servicesHtml += '<div style="margin-bottom:3px"><strong>' + item.service_name + '</strong>'
      const parts = (item.parts_json || []).filter(p => p.name)
      if (parts.length > 0) {
        const partNames = parts.map(p => p.name + (p.quantity > 1 ? ' (' + p.quantity + 'x)' : ''))
        servicesHtml += '<span style="color:#888;font-size:10px;display:block;margin-left:6px">' + partNames.join(', ') + '</span>'
      } else if (item.description) {
        servicesHtml += '<span style="color:#888;font-size:10px;display:block;margin-left:6px">' + item.description + '</span>'
      }
      servicesHtml += '</div>'
    })
    orderRows += '<tr>' +
      '<td>' + (idx + 1) + '</td>' +
      '<td><strong>#' + order.id + '</strong></td>' +
      '<td>' + formatDate(order.created_at) + '</td>' +
      (car ? '' : '<td>' + (order.cars?.make || '') + ' ' + (order.cars?.model || '') +
        '<span style="font-size:11px;color:#888;display:block">' + (order.cars?.license_plate || '') + '</span></td>') +
      '<td style="text-align:right">' + (order.km ? Number(order.km).toLocaleString() + ' km' : '—') + '</td>' +
      '<td style="font-size:11px;color:#555;max-width:260px;line-height:1.3">' + servicesHtml + '</td>' +
      (showPrices ? '<td style="text-align:right"><strong>' + formatCurrency(calculateTotal(order)) + '</strong></td>' : '') +
      '<td style="text-align:center"><span class="status-badge ' + (order.is_paid ? 'status-paid' : 'status-unpaid') + '">' + (order.is_paid ? 'Paguar' : 'Pa paguar') + '</span></td>' +
      '</tr>'
  })

  const carLabel = car ? (car.make || '') + ' ' + (car.model || '') + ' (' + (car.license_plate || '') + ')' : ''

  const pw = window.open('', '', 'height=700,width=900')
  pw.document.write(`<html><head><title>Historia e Shërbimeve - ${client?.full_name || carLabel}</title>
<style>${PRINT_STYLES}
td{padding:8px 12px;font-size:13px}
th{padding:10px 12px;font-size:11px}
</style></head><body>

<div class="header">
  ${companyHeader(COMPANY)}
  <div class="invoice-title">
    <h2>HISTORIA E SHËRBIMEVE</h2>
    <p>${sorted.length} servisime</p>
  </div>
</div>

<p class="date-line"><strong>Data e printimit:</strong> ${todayStr}</p>

<div class="info-grid">
  <div class="info-box">
    <h3>Klienti</h3>
    <p><strong>${client?.full_name || '—'}</strong></p>
    <p>${client?.phone || ''}</p>
    <p>${client?.email || ''}</p>
    ${client?.address ? '<p>' + client.address + '</p>' : ''}
  </div>
  <div class="info-box">
    <h3>${car ? 'Automjeti' : 'Përmbledhje'}</h3>
    ${car
      ? '<p><strong>' + (car.make || '') + ' ' + (car.model || '') + '</strong></p>' +
        '<p><span class="label">Targa:</span> ' + (car.license_plate || '') + '</p>' +
        (car.vin ? '<p><span class="label">VIN:</span> ' + car.vin + '</p>' : '') +
        (car.year ? '<p><span class="label">Viti:</span> ' + car.year + '</p>' : '')
      : '<p><span class="label">Automjete:</span> të gjitha</p>'}
    <p><span class="label">Periudha:</span> ${firstDate} — ${lastDate}</p>
  </div>
</div>

<table>
  <thead><tr>
    <th>#</th><th>ID</th><th>Data</th>${car ? '' : '<th>Automjeti</th>'}<th style="text-align:right">Km</th><th>Shërbimet</th>
    ${showPrices ? '<th style="text-align:right">Totali</th>' : ''}<th style="text-align:center">Pagesa</th>
  </tr></thead>
  <tbody>${orderRows}</tbody>
</table>

${showPrices ? `
<div class="total-section">
  <div class="total-row"><span>Paguar:</span><span style="color:#16a34a;font-weight:700">${formatCurrency(paidTotal)}</span></div>
  <div class="total-row"><span>Pa paguar:</span><span style="color:#dc2626;font-weight:700">${formatCurrency(unpaidTotal)}</span></div>
  <div class="total-row grand"><span>TOTALI</span><span>${formatCurrency(grandTotal)}</span></div>
</div>` : ''}

<div class="footer">
  <p>${COMPANY.footerMessage} ${COMPANY.name}!</p>
  <p style="font-size:11px;margin-top:4px">${COMPANY.address} | Tel: ${COMPANY.phone}</p>
</div>
</body></html>`)
  pw.document.close()
  pw.print()
}
