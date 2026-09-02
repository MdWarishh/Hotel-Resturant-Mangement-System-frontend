'use client'

// ============================================
// BillPrintButton.js
// Same print flow as KotPrintButton, but prints
// the full itemised bill WITH payment details.
// ============================================

import { useState } from 'react'
import { Printer, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

export default function BillPrintButton({ order, hotelName = 'HOTEL' }) {
  const [printing, setPrinting] = useState(false)

  const handlePrintBill = () => {
    if (!order) return
    setPrinting(true)
    try {
      const printWindow = window.open('', '_blank', 'width=400,height=600')
      if (!printWindow) {
        alert('Popup blocked! Browser mein popup allow karo.')
        setPrinting(false)
        return
      }

      printWindow.document.write(generateBillHtml(order, hotelName))
      printWindow.document.close()

      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
        printWindow.onafterprint = () => printWindow.close()
        setPrinting(false)
      }
    } catch (err) {
      console.error('Bill print error:', err)
      alert('Bill print failed: ' + (err.message || 'Unknown error'))
      setPrinting(false)
    }
  }

  return (
    <button
      onClick={handlePrintBill}
      disabled={printing}
      className="flex items-center justify-center gap-2 py-2.5 px-4 sm:px-5 bg-gray-700 hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow-md transition-all w-full sm:w-auto"
    >
      {printing ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <Printer className="h-4 w-4 sm:h-5 sm:w-5" />}
      <span className="text-sm sm:text-base">{printing ? 'Printing...' : 'Bill'}</span>
    </button>
  )
}

// ============================================
// Bill HTML Generator — 80mm thermal, WITH PRICE + PAYMENT
// ============================================
function generateBillHtml(order, hotelName) {
  const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  }

  const locationLine = () => {
    if (order.orderType === 'dine-in' && order.tableNumber) return `Table: ${order.tableNumber}`
    if (order.orderType === 'room-service' && order.room?.roomNumber) return `Room: ${order.room.roomNumber}`
    return 'Takeaway'
  }

  const isPaid = order.payment?.status === 'PAID'
  const paymentMode = order.payment?.mode || 'N/A'

  const itemsHtml = order.items?.map(item => `
    <tr>
      <td style="padding: 4px 2px; font-size: 13px; vertical-align: top;">
        ${item.quantity}x
      </td>
      <td style="padding: 4px 2px; font-size: 13px; vertical-align: top; width: 100%;">
        ${item.name}${item.variant ? ` <span style="font-size:11px;color:#555;">(${item.variant})</span>` : ''}
      </td>
      <td style="padding: 4px 2px; font-size: 13px; text-align: right; vertical-align: top; white-space: nowrap;">
        Rs.${(item.quantity * item.price).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('')

  const subtotal = order.pricing?.subtotal || 0
  const tax = order.pricing?.tax || 0
  const discount = order.pricing?.discount || 0
  const total = order.pricing?.total || 0
  const extraCharges = (order.extraCharges || []).filter(c => c.label && c.amount > 0)

  const extraChargesHtml = extraCharges.map(c => `
    <div style="display:flex; justify-content:space-between; font-size:13px; margin:2px 0;">
      <span>${c.label}</span>
      <span>+Rs.${Number(c.amount).toLocaleString('en-IN')}</span>
    </div>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Bill - ${order.orderNumber || order._id.slice(-6)}</title>
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
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .sub-info {
          font-size: 11px;
          margin-top: 2px;
        }

        .bill-tag {
          font-size: 11px;
          letter-spacing: 2px;
          font-weight: bold;
          margin-top: 4px;
        }

        .bill-number {
          font-size: 24px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .location-badge {
          font-size: 15px;
          font-weight: bold;
          border: 2px solid #000;
          padding: 3px 8px;
          display: inline-block;
          margin: 4px 0;
        }

        table { width: 100%; border-collapse: collapse; }

        .totals-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin: 3px 0;
        }

        .grand-row {
          display: flex;
          justify-content: space-between;
          font-size: 17px;
          font-weight: 900;
          padding: 6px 0;
        }

        .paid-stamp {
          text-align: center;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 3px;
          border: 3px solid #000;
          padding: 6px;
          margin: 8px 0;
          ${isPaid ? '' : 'border-style: dashed;'}
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

      <!-- Hotel Header -->
      <div class="center">
        <div class="hotel-name">${hotelName}</div>
        ${order.hotel?.address ? `<div class="sub-info">${order.hotel.address.street || ''}, ${order.hotel.address.city || ''}</div>` : ''}
        ${order.hotel?.contact?.phone ? `<div class="sub-info">Ph: ${order.hotel.contact.phone}</div>` : ''}
        ${order.hotel?.gst?.number ? `<div class="sub-info">GSTIN: ${order.hotel.gst.number}</div>` : ''}
        <div class="bill-tag">CUSTOMER BILL / INVOICE</div>
      </div>

      <div class="divider-solid"></div>

      <!-- Order Number & Location -->
      <div class="center">
        <div class="bill-number">#${order.orderNumber || order._id.slice(-6)}</div>
        <div class="location-badge">${locationLine()}</div>
        ${order.customer?.name ? `<div style="font-size:12px; margin-top:3px;">Customer: ${order.customer.name}</div>` : ''}
        ${order.customer?.phone ? `<div style="font-size:12px;">Ph: ${order.customer.phone}</div>` : ''}
      </div>

      <div class="divider"></div>

      <!-- Time -->
      <div style="font-size: 11px; margin-bottom: 4px;">
        <span class="bold">Date/Time:</span> ${formatTime(order.createdAt)}
      </div>

      <div class="divider-solid"></div>

      <!-- Items -->
      <div style="font-size: 12px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">
        Items
      </div>
      <table>
        ${itemsHtml}
      </table>

      <div class="divider"></div>

      <!-- Totals -->
      <div class="totals-row"><span>Subtotal</span><span>Rs.${subtotal.toLocaleString('en-IN')}</span></div>
      ${discount > 0 ? `<div class="totals-row"><span>Discount</span><span>-Rs.${discount.toLocaleString('en-IN')}</span></div>` : ''}
      ${extraChargesHtml}
      <div class="totals-row"><span>GST (5%)</span><span>Rs.${tax.toLocaleString('en-IN')}</span></div>

      <div class="divider-solid"></div>

      <div class="grand-row">
        <span>Grand Total</span>
        <span>Rs.${total.toLocaleString('en-IN')}</span>
      </div>

      <div class="divider-solid"></div>

      <!-- Payment Info -->
      <div style="font-size: 13px; margin: 4px 0;">
        <span class="bold">Payment Mode:</span> ${paymentMode}
      </div>

      <div class="paid-stamp">
        ${isPaid ? 'PAID' : 'UNPAID'}
      </div>

      <div class="divider-solid"></div>

      <!-- Footer -->
      <div class="center footer">
        <div>${(order.orderType || '').toUpperCase()} ORDER</div>
        <div style="margin-top: 4px;">Thank you for visiting us!</div>
        <div style="margin-top: 2px; font-size: 9px;">*** Customer Copy ***</div>
      </div>

      <div style="height: 20px;"></div>

    </body>
    </html>
  `
}