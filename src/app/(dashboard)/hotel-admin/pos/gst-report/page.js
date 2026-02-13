// frontend/src/app/(dashboard)/hotel-admin/pos/gst-report/page.js

'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function POSGSTReportPage() {
  const { user } = useAuth();
  
  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Data states
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  // Quick date filters
  const setQuickFilter = (type) => {
    const today = new Date();
    let start, end;

    switch (type) {
      case 'today':
        start = end = today.toISOString().split('T')[0];
        break;
      case 'week':
        start = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        end = new Date().toISOString().split('T')[0];
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        end = new Date().toISOString().split('T')[0];
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        end = new Date().toISOString().split('T')[0];
        break;
      default:
        return;
    }

    setStartDate(start);
    setEndDate(end);
  };

  // Fetch report data
  const fetchReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/gst/pos?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch report');
      }

      setReportData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    if (!startDate || !endDate) {
      setError('Please select dates and generate report first');
      return;
    }

    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/gst/pos/excel?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export Excel');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `POS_GST_Report_${startDate}_to_${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">POS GST Report</h1>
        <p className="text-gray-600">Generate GST reports for restaurant orders</p>
      </div>

      {/* Date Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Date Range</h2>
        
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setQuickFilter('today')}
            className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 font-medium text-sm"
          >
            Today
          </button>
          <button
            onClick={() => setQuickFilter('week')}
            className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 font-medium text-sm"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setQuickFilter('month')}
            className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 font-medium text-sm"
          >
            This Month
          </button>
          <button
            onClick={() => setQuickFilter('year')}
            className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 font-medium text-sm"
          >
            This Year
          </button>
        </div>

        {/* Custom Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="flex-1 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Report Summary */}
      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <span className="text-2xl">🍽️</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {reportData.summary.totalOrders}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-3xl font-bold text-green-600">
                ₹{reportData.summary.totalRevenue.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total GST (5%)</p>
                <span className="text-2xl">📋</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                ₹{reportData.summary.totalGST.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Net Total</p>
                <span className="text-2xl">💵</span>
              </div>
              <p className="text-3xl font-bold text-orange-600">
                ₹{reportData.summary.totalNet.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Order Type Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Type Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(reportData.orderTypeBreakdown).map(([type, data]) => (
                <div key={type} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 mb-2 capitalize">
                    {type.replace('-', ' ')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {data.count}
                  </p>
                  <p className="text-sm text-gray-600">
                    Revenue: ₹{Math.round(data.revenue).toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-gray-600">
                    GST: ₹{Math.round(data.gst).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={exportToExcel}
              disabled={exporting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </button>
          </div>

          {/* Daily Breakdown Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Daily Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GST (5%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.dailyBreakdown.map((day) => (
                    <tr key={day.date} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(day.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {day.orders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        ₹{Math.round(day.revenue).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        ₹{Math.round(day.gst).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₹{Math.round(day.net).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">TOTAL</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {reportData.summary.totalOrders}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      ₹{reportData.summary.totalRevenue.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      ₹{reportData.summary.totalGST.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      ₹{reportData.summary.totalNet.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Detailed Orders Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Detailed Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GST
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.orders.map((order) => (
                    <tr key={order.orderNumber} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                        {order.orderType.replace('-', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {order.itemsCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        ₹{order.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        ₹{order.gst.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₹{order.total.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'served' ? 'bg-green-100 text-green-800' :
                          order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!reportData && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Report Generated
          </h3>
          <p className="text-gray-600">
            Select a date range and click "Generate Report" to view GST data
          </p>
        </div>
      )}
    </div>
  );
}