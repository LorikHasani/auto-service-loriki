import { formatCurrency, formatDate } from './helpers'

export const COMPANY = {
  name: 'AUTO SERVICE BASHKIMI',
  slogan: 'CHIPTUNING',
  address: 'Livoq i Poshtëm, Gjilan',
  phone: '+383 44 955 389 / 044 577 311',
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

  items.forEach(item => {
    const parts = item.parts_json || []
    const laborCost = parseFloat(item.labor_cost) || 0

    if (parts.length > 0) {
      if (laborCost > 0) {
        rowNum++
        productRows += '<tr><td>' + rowNum + '</td><td><strong>' + item.service_name + '</strong> \u2014 Puna</td><td style="text-align:center">1</td>' +
          (showPrices ? '<td style="text-align:right">' + formatCurrency(laborCost) + '</td><td style="text-align:right"><strong>' + formatCurrency(laborCost) + '</strong></td>' : '') + '</tr>'
      }
      parts.forEach(part => {
        if (!part.name) return
        rowNum++
        const qty = parseFloat(part.quantity) || 1
        const price = parseFloat(part.sell_price) || 0
        productRows += '<tr><td>' + rowNum + '</td><td>' + part.name + '</td><td style="text-align:center">' + qty + '</td>' +
          (showPrices ? '<td style="text-align:right">' + formatCurrency(price) + '</td><td style="text-align:right"><strong>' + formatCurrency(qty * price) + '</strong></td>' : '') + '</tr>'
      })
    } else {
      rowNum++
      productRows += '<tr><td>' + rowNum + '</td><td><strong>' + item.service_name + '</strong>' +
        (item.description ? '<div style="color:#888;font-size:13px;margin-top:2px">' + item.description + '</div>' : '') +
        '</td><td style="text-align:center">1</td>' +
        (showPrices ? '<td style="text-align:right">' + formatCurrency(item.unit_price) + '</td><td style="text-align:right"><strong>' + formatCurrency(item.quantity * item.unit_price) + '</strong></td>' : '') + '</tr>'
    }
  })
  return productRows
}

function companyHeader() {
  return '<div><div class="company">' + COMPANY.name + '</div><div class="company-slogan">' + COMPANY.slogan + '</div>' +
    '<div class="company-info">' + COMPANY.address + '<br/>Tel: ' + COMPANY.phone + '</div></div>'
}

export const printOrderDocument = (order, { showPrices = true, showOrderNo = true } = {}) => {
  const items = order.order_items || []
  const total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const productRows = buildProductRows(items, showPrices)
  const todayStr = formatDate(new Date())

  const pw = window.open('', '', 'height=700,width=800')
  pw.document.write(`<html><head><title>${showOrderNo ? 'Porosi #' + order.id : 'Raport Sh\u00EBrbimi'}</title>
<style>${PRINT_STYLES}</style></head><body>

<div class="header">
  ${companyHeader()}
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
  <p>Faleminderit q\u00EB zgjedh\u00EBt ${COMPANY.name}!</p>
  <p style="font-size:11px;margin-top:4px">${COMPANY.address} | Tel: ${COMPANY.phone}</p>
</div>
</body></html>`)
  pw.document.close()
  pw.print()
}

export const printDailyReport = (orders, dateLabel) => {
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
    const services = (order.order_items || []).map(i => i.service_name).join(', ')
    orderRows += '<tr>' +
      '<td>' + (idx + 1) + '</td>' +
      '<td><strong>#' + order.id + '</strong></td>' +
      '<td>' + (order.clients?.full_name || '') + '</td>' +
      '<td>' + (order.cars?.make || '') + ' ' + (order.cars?.model || '') + '<br/><span style="font-size:12px;color:#888">' + (order.cars?.license_plate || '') + '</span></td>' +
      '<td style="font-size:13px">' + services + '</td>' +
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
  ${companyHeader()}
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
