'use client'

// ============================================
// KotPrintButton.js
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
// KOT HTML Generator — 80mm thermal, NO PRICE, EXTRA DARK
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
      <td class="qty">${item.quantity}x</td>
      <td class="item-name">
        ${item.name}
        ${item.variant ? `<div class="sub">(${item.variant})</div>` : ''}
        ${item.specialInstructions ? `<div class="sub note">⚠ ${item.specialInstructions}</div>` : ''}
      </td>
    </tr>
    <tr><td colspan="2"><div class="item-line"></div></td></tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>KOT - ${kot.kotNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          color: #000 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        @page {
          size: 80mm auto;
          margin: 3mm 3mm;
        }

        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 15px;
          font-weight: 900;
          color: #000;
          width: 74mm;
          background: #fff;
          -webkit-text-stroke: 0.6px #000;
          text-shadow: 0.4px 0 0 #000, -0.4px 0 0 #000;
        }

        .center { text-align: center; }
        .bold { font-weight: 900; }

        .divider { border-top: 3px dashed #000; margin: 8px 0; }
        .divider-solid { border-top: 4px solid #000; margin: 8px 0; }
        .item-line { border-bottom: 2px dashed #000; margin: 3px 0; }

        .hotel-name {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
          -webkit-text-stroke: 1px #000;
        }

        .kot-tag {
          font-size: 13px;
          letter-spacing: 1px;
          font-weight: 900;
          margin-top: 4px;
        }

        .kot-number {
          font-size: 34px;
          font-weight: 900;
          letter-spacing: 1px;
          -webkit-text-stroke: 1.2px #000;
        }

        .location-badge {
          font-size: 20px;
          font-weight: 900;
          border: 3px solid #000;
          padding: 4px 10px;
          display: inline-block;
          margin: 6px 0;
        }

        table { width: 100%; border-collapse: collapse; }

        .qty {
          padding: 5px 4px 5px 0;
          font-size: 20px;
          font-weight: 900;
          vertical-align: top;
          white-space: nowrap;
          -webkit-text-stroke: 1px #000;
        }

        .item-name {
          padding: 5px 2px;
          font-size: 18px;
          font-weight: 900;
          vertical-align: top;
          width: 100%;
          -webkit-text-stroke: 0.9px #000;
        }

        .sub {
          font-size: 14px;
          font-weight: 900;
          margin-top: 2px;
        }

        .note { font-style: italic; }

        .meta {
          font-size: 14px;
          font-weight: 900;
          margin-bottom: 4px;
        }

        .footer {
          font-size: 13px;
          font-weight: 900;
          margin-top: 8px;
        }

        @media print {
          body { width: 74mm; }
          button { display: none; }
        }
      </style>
    </head>
    <body>

      <!-- Hotel Header -->
      <div class="center">
        <div class="hotel-name">${kot.hotelName || 'HOTEL'}</div>
        <div class="kot-tag">KITCHEN ORDER TICKET (KOT)</div>
      </div>

      <div class="divider-solid"></div>

      <!-- Order Number & Location -->
      <div class="center">
        <div class="kot-number">#${kot.kotNumber}</div>
        <div class="location-badge">${locationLine()}</div>
        ${kot.customerName ? `<div class="meta" style="margin-top:4px;">Customer: ${kot.customerName}</div>` : ''}
      </div>

      <div class="divider"></div>

      <!-- Time -->
      <div class="meta">Placed: ${formatTime(kot.placedAt)}</div>
      <div class="meta">Printed: ${formatTime(kot.printedAt)}</div>

      <div class="divider-solid"></div>

      <!-- Items -->
      <div style="font-size: 15px; font-weight: 900; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">
        Items
      </div>
      <table>
        ${itemsHtml}
      </table>

      <!-- Special Instructions -->
      ${kot.specialInstructions ? `
        <div class="divider"></div>
        <div style="font-size: 15px; font-weight: 900;">
          <div style="text-transform: uppercase;">⚠ Special Instructions:</div>
          <div style="font-style: italic; margin-top: 3px;">${kot.specialInstructions}</div>
        </div>
      ` : ''}

      <div class="divider-solid"></div>

      <!-- Footer -->
      <div class="center footer">
        <div>${kot.orderType?.toUpperCase()} ORDER</div>
        <div style="margin-top: 4px;">*** Kitchen Copy ***</div>
      </div>

      <div style="height: 20px;"></div>

    </body>
    </html>
  `
}