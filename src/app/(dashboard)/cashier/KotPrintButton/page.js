'use client'

// ============================================
// KotPrintButton.js
// Path: components/cashier/KotPrintButton.jsx
// ============================================
// Usage: <KotPrintButton orderId={order._id} orderNumber={order.orderNumber} />
// ============================================

import { useState } from 'react'
import { Printer, Loader2 } from 'lucide-react'
import { apiRequest } from '@/services/api'

export default function KotPrintButton({ orderId, orderNumber }) {
  const [printing, setPrinting] = useState(false)

  const handlePrintKOT = async () => {
    setPrinting(true)
    try {
      const res = await apiRequest(`/pos/orders/${orderId}/kot`)
      const kot = res.data

      const printWindow = window.open('', '_blank', 'width=400,height=600')
      if (!printWindow) {
        alert('Popup blocked! Browser mein popup allow karo.')
        return
      }

      printWindow.document.write(generateKOTHtml(kot))
      printWindow.document.close()

      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
        printWindow.onafterprint = () => printWindow.close()
      }
    } catch (err) {
      console.error('KOT print error:', err)
      alert('KOT print failed: ' + (err.message || 'Unknown error'))
    } finally {
      setPrinting(false)
    }
  }

  return (
    <button
      onClick={handlePrintKOT}
      disabled={printing}
      className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg w-full"
    >
      {printing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Printer className="h-4 w-4" />
      )}
      {printing ? 'Printing...' : 'Print KOT'}
    </button>
  )
}

// ============================================
// KOT HTML Generator — 80mm thermal optimized
// ✅ Hotel branding + pricing (Swiggy-style)
// ============================================
function generateKOTHtml(kot) {
  const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  }

  const fmtAmt = (n) => `Rs.${Number(n || 0).toLocaleString('en-IN')}`

  const locationLine = () => {
    if (kot.orderType === 'dine-in' && kot.tableNumber) return `Table: ${kot.tableNumber}`
    if (kot.orderType === 'room-service' && kot.roomNumber) return `Room: ${kot.roomNumber}`
    return 'Takeaway'
  }

  const itemsHtml = kot.items.map(item => `
    <tr>
      <td style="padding: 4px 2px; font-size: 13px; font-weight: bold; vertical-align: top; white-space:nowrap;">
        ${item.quantity}x
      </td>
      <td style="padding: 4px 2px; font-size: 13px; vertical-align: top; width: 100%;">
        ${item.name}
        ${item.variant ? `<div style="font-size: 11px; color: #555;">(${item.variant})</div>` : ''}
        ${item.specialInstructions ? `<div style="font-size: 11px; font-style: italic; color: #333;">⚠ ${item.specialInstructions}</div>` : ''}
      </td>
      <td style="padding: 4px 2px; font-size: 13px; text-align:right; vertical-align: top; white-space:nowrap;">
        ${fmtAmt(item.subtotal ?? item.price * item.quantity)}
      </td>
    </tr>
    <tr><td colspan="3"><div style="border-bottom: 1px dashed #ccc; margin: 2px 0;"></div></td></tr>
  `).join('')

  const p = kot.pricing || {}
  const extraChargesRows = (p.extraCharges || [])
    .filter(c => c.label && Number(c.amount) > 0)
    .map(c => `
      <div style="display:flex; justify-content:space-between; font-size:12px; margin: 2px 0;">
        <span>${c.label}</span>
        <span>+${fmtAmt(c.amount)}</span>
      </div>
    `).join('')

  const paymentLine = kot.paymentStatus === 'PAID'
    ? `<div style="text-align:center; font-size:13px; font-weight:900; border:2px solid #000; padding:4px; margin-top:6px;">PAID${kot.paymentMode ? ' — ' + kot.paymentMode : ''}</div>`
    : `<div style="text-align:center; font-size:13px; font-weight:900; border:2px dashed #000; padding:4px; margin-top:6px;">UNPAID</div>`

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>KOT - ${kot.kotNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page {
          size: 80mm auto;
          margin: 4mm 4mm;
        }

        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
          color: #000;
          width: 72mm;
          background: #fff;
        }

        .center { text-align: center; }
        .bold { font-weight: bold; }
        .divider { border-top: 2px dashed #000; margin: 6px 0; }
        .divider-solid { border-top: 2px solid #000; margin: 6px 0; }

        .hotel-name {
          font-size: 19px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .hotel-meta {
          font-size: 10px;
          color: #333;
          margin-top: 2px;
        }

        .kot-tag {
          font-size: 11px;
          letter-spacing: 2px;
          font-weight: bold;
          margin-top: 4px;
        }

        .kot-number {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 1px;
          margin-top: 4px;
        }

        .location-badge {
          font-size: 14px;
          font-weight: bold;
          border: 2px solid #000;
          padding: 2px 8px;
          display: inline-block;
          margin: 4px 0;
        }

        table { width: 100%; border-collapse: collapse; }

        .totals-row {
          display:flex; justify-content:space-between; font-size:12px; padding: 2px 0;
        }
        .grand-row {
          display:flex; justify-content:space-between; font-size:15px; font-weight:900; padding: 4px 0;
        }

        .footer {
          font-size: 10px;
          color: #555;
          margin-top: 8px;
        }

        @media print {
          body { width: 72mm; }
          button { display: none; }
        }
      </style>
    </head>
    <body>

      <!-- ✅ Hotel Header -->
      <div class="center">
        <div class="hotel-name">${kot.hotelName || 'HOTEL'}</div>
        ${kot.hotelAddress ? `<div class="hotel-meta">${kot.hotelAddress}</div>` : ''}
        ${kot.hotelPhone ? `<div class="hotel-meta">Ph: ${kot.hotelPhone}</div>` : ''}
        <div class="kot-tag">KITCHEN ORDER TICKET (KOT)</div>
      </div>

      <div class="divider-solid"></div>

      <!-- Order Number & Location -->
      <div class="center">
        <div class="kot-number">#${kot.kotNumber}</div>
        <div class="location-badge">${locationLine()}</div>
        ${kot.customerName ? `<div style="font-size:12px; margin-top:3px;">Customer: ${kot.customerName}</div>` : ''}
      </div>

      <div class="divider"></div>

      <!-- Time -->
      <div style="font-size: 11px; margin-bottom: 4px;">
        <span class="bold">Placed:</span> ${formatTime(kot.placedAt)}
      </div>
      <div style="font-size: 11px; margin-bottom: 4px;">
        <span class="bold">Printed:</span> ${formatTime(kot.printedAt)}
      </div>

      <div class="divider-solid"></div>

      <!-- Items with pricing -->
      <div style="display:flex; justify-content:space-between; font-size: 11px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">
        <span>Qty / Item</span>
        <span>Amt</span>
      </div>
      <table>
        ${itemsHtml}
      </table>

      <!-- ✅ Totals -->
      <div class="divider-solid"></div>
      <div class="totals-row"><span>Item Total</span><span>${fmtAmt(p.subtotal)}</span></div>
      ${extraChargesRows}
      ${p.discount > 0 ? `<div class="totals-row"><span>Discount</span><span>-${fmtAmt(p.discount)}</span></div>` : ''}
      <div class="totals-row"><span>Taxes (GST)</span><span>${fmtAmt(p.tax)}</span></div>
      <div class="divider"></div>
      <div class="grand-row"><span>Grand Total</span><span>${fmtAmt(p.total)}</span></div>

      ${paymentLine}

      <!-- Special Instructions -->
      ${kot.specialInstructions ? `
        <div class="divider"></div>
        <div style="font-size: 12px;">
          <div class="bold" style="text-transform: uppercase;">⚠ Special Instructions:</div>
          <div style="font-style: italic; margin-top: 3px;">${kot.specialInstructions}</div>
        </div>
      ` : ''}

      <div class="divider-solid"></div>

      <!-- Footer -->
      <div class="center footer">
        <div>${kot.orderType?.toUpperCase()} ORDER</div>
        <div style="margin-top: 4px; font-size: 9px;">*** Kitchen Copy ***</div>
      </div>

      <div style="height: 20px;"></div>

    </body>
    </html>
  `
}