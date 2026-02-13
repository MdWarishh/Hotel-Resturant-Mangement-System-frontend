// frontend/components/admin/QRCodeGenerator.jsx

'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function QRCodeGenerator() {
  const { token, user } = useAuth(); // Added user for debugging
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const qrRef = useRef(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const generateQR = async () => {
    try {
      setLoading(true);
      setError('');

      // 🔥 FIX 1: Check if token exists
      if (!token) {
        throw new Error('Please login again. Session expired.');
      }

      console.log('Token:', token ? 'Present' : 'Missing'); // Debug log

      const response = await fetch(`${API_URL}/pos/qr-code`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // 🔥 FIX 2: Better error handling
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        const errorData = await response.json().catch(() => ({ message: 'Failed to generate QR code' }));
        throw new Error(errorData.message || 'Failed to generate QR code');
      }

      const data = await response.json();
      
      // 🔥 FIX 3: Validate response data
      if (!data || !data.data) {
        throw new Error('Invalid response from server');
      }

      setQrData(data.data);
    } catch (err) {
      console.error('Error generating QR:', err);
      setError(err.message || 'Failed to generate QR code');
      
      // 🔥 FIX 4: Auto-redirect on auth error
      if (err.message.includes('login') || err.message.includes('Session expired')) {
        setTimeout(() => {
          // Redirect to login page
          window.location.href = '/login';
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrData) return;

    const link = document.createElement('a');
    link.download = `${qrData.hotel.code}-menu-qr.png`;
    link.href = qrData.qrCode;
    link.click();
  };

  const printQR = () => {
    if (!qrRef.current) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${qrData.hotel.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .qr-container {
              text-align: center;
              border: 2px solid #000;
              padding: 30px;
              border-radius: 10px;
              background: white;
            }
            h1 {
              margin: 0 0 10px 0;
              font-size: 28px;
            }
            .subtitle {
              margin: 0 0 20px 0;
              color: #666;
              font-size: 16px;
            }
            img {
              width: 300px;
              height: 300px;
              margin: 20px 0;
            }
            .instructions {
              margin-top: 20px;
              font-size: 18px;
              color: #333;
              font-weight: bold;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>${qrData.hotel.name}</h1>
            <p class="subtitle">Scan to View Menu & Order</p>
            <img src="${qrData.qrCode}" alt="QR Code" />
            <p class="instructions">📱 Scan with your phone camera to order!</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const copyLink = () => {
    if (!qrData) return;
    
    navigator.clipboard.writeText(qrData.menuUrl);
    alert('Link copied to clipboard!');
  };

  // 🔥 FIX 5: Show warning if not logged in
  if (!token) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800 font-semibold">⚠️ Please login to generate QR code</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">QR Code Menu</h2>
          <p className="text-gray-600 mt-1">Generate QR code for contactless ordering</p>
        </div>
        
        {!qrData && (
          <button
            onClick={generateQR}
            disabled={loading}
            className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Generate QR Code</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <p className="font-semibold">❌ {error}</p>
          {error.includes('login') && (
            <p className="text-sm mt-2">Redirecting to login page...</p>
          )}
        </div>
      )}

      {qrData && (
        <div className="space-y-6">
          {/* QR Code Display */}
          <div ref={qrRef} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{qrData.hotel.name}</h3>
            <p className="text-gray-600 mb-6">Scan to View Menu & Order</p>
            
            <div className="bg-white inline-block p-4 rounded-lg shadow-sm">
              <img 
                src={qrData.qrCode} 
                alt="QR Code" 
                className="w-64 h-64 mx-auto"
              />
            </div>

            <p className="mt-6 text-sm text-gray-500 font-mono bg-white px-4 py-2 rounded-lg inline-block">
              {qrData.menuUrl}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={downloadQR}
              className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>

            <button
              onClick={printQR}
              className="px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>

            <button
              onClick={copyLink}
              className="px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Link
            </button>

            <button
              onClick={() => setQrData(null)}
              className="px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </button>
          </div>

          {/* Usage Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-blue-900 mb-2">How to use:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Print the QR code and place it on tables</li>
                  <li>• Customers scan with their phone camera</li>
                  <li>• They can view menu and place orders instantly</li>
                  <li>• No app installation required!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}