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

      // Hidden print iframe banao — page reload nahi hoga
      const printWindow = window.open('', '_blank', 'width=400,height=600')
      if (!printWindow) {
        alert('Popup blocked! Browser mein popup allow karo.')
        return
      }

      printWindow.document.write(generateKOTHtml(kot))
      printWindow.document.close()

      // Page load hone ke baad print dialog kholo
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
        // Print dialog close hone ke baad window band karo
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
// ============================================
function generateKOTHtml(kot) {
  const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  }

  const locationLine = () => {
    if (kot.orderType === 'dine-in' && kot.tableNumber) return `Table: ${kot.tableNumber}`
    if (kot.orderType === 'room-service' && kot.roomNumber) return `Room: ${kot.roomNumber}`
    return 'Takeaway'
  }

  const itemsHtml = kot.items.map(item => `
    <tr>
      <td style="padding: 4px 2px; font-size: 14px; font-weight: bold; vertical-align: top;">
        ${item.quantity}x
      </td>
      <td style="padding: 4px 2px; font-size: 14px; vertical-align: top; width: 100%;">
        ${item.name}
        ${item.variant ? `<div style="font-size: 11px; color: #555;">(${item.variant})</div>` : ''}
        ${item.specialInstructions ? `<div style="font-size: 11px; font-style: italic; color: #333;">⚠ ${item.specialInstructions}</div>` : ''}
      </td>
    </tr>
    <tr><td colspan="2"><div style="border-bottom: 1px dashed #ccc; margin: 2px 0;"></div></td></tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>KOT - ${kot.kotNumber}</title>
      <style>
        /* 80mm thermal printer optimized */
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

        .header-title {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .kot-number {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .location-badge {
          font-size: 16px;
          font-weight: bold;
          border: 2px solid #000;
          padding: 3px 8px;
          display: inline-block;
          margin: 4px 0;
        }

        table { width: 100%; border-collapse: collapse; }

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

      <!-- KOT Header -->
      <div class="center">
        <div class="header-title">KOT</div>
        <div class="header-title" style="font-size:13px; letter-spacing:1px;">KITCHEN ORDER TICKET</div>
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

      <!-- Items -->
      <div style="font-size: 12px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">
        Items
      </div>
      <table>
        ${itemsHtml}
      </table>

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

      <!-- Extra space for paper cut -->
      <div style="height: 20px;"></div>

    </body>
    </html>
  `
}