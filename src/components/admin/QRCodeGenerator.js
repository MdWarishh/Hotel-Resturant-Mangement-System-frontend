// frontend/components/admin/QRCodeGenerator.jsx
'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function QRCodeGenerator() {
  const { token, user } = useAuth();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const qrRef = useRef(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const generateQR = async () => {
    try {
      setLoading(true);
      setError('');

      if (!token) {
        throw new Error('Please login again. Session expired.');
      }

      console.log('Token:', token ? 'Present' : 'Missing');

      const response = await fetch(`${API_URL}/pos/qr-code`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        const errorData = await response.json().catch(() => ({ message: 'Failed to generate QR code' }));
        throw new Error(errorData.message || 'Failed to generate QR code');
      }

      const data = await response.json();

      if (!data || !data.data) {
        throw new Error('Invalid response from server');
      }

      setQrData(data.data);
    } catch (err) {
      console.error('Error generating QR:', err);
      setError(err.message || 'Failed to generate QR code');

      if (err.message.includes('login') || err.message.includes('Session expired')) {
        setTimeout(() => {
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
          <title>Print QR Code</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 40px;
            }
            img { 
              width: 300px; 
              height: 300px; 
              margin: 20px auto;
              display: block;
            }
            h1 { color: #333; margin-bottom: 10px; }
            p { color: #666; margin: 10px 0; }
            .url { 
              font-size: 12px; 
              color: #999; 
              margin-top: 20px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <h1>${qrData.hotel.name}</h1>
          <p style="font-size: 18px; font-weight: bold;">Scan to View Menu & Order</p>
          <img src="${qrData.qrCode}" alt="QR Code" />
          <p>📱 Scan with your phone camera to order!</p>
          <p class="url">${qrData.menuUrl}</p>
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

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center py-8">
          <p className="text-red-600 text-lg mb-4">⚠️ Please login to generate QR code</p>
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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">QR Code Menu</h2>
        <p className="text-gray-600 mt-1">Generate QR code for contactless ordering</p>
      </div>

      {!qrData && (
        <button
          onClick={generateQR}
          disabled={loading}
          className="w-full px-6 py-4 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Generating...
            </>
          ) : (
            <>
              <span className="mr-2">🎯</span>
              Generate QR Code
            </>
          )}
        </button>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">❌ {error}</p>
          {error.includes('login') && (
            <p className="text-red-500 text-sm mt-2">Redirecting to login page...</p>
          )}
        </div>
      )}

      {qrData && (
        <div className="mt-6 space-y-6">
          {/* QR Code Display */}
          <div ref={qrRef} className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-xl border-2 border-orange-200">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{qrData.hotel.name}</h3>
              <p className="text-gray-600 mb-6">Scan to View Menu & Order</p>
              <div className="bg-white p-6 rounded-xl inline-block shadow-lg">
                <img 
                  src={qrData.qrCode} 
                  alt="Menu QR Code" 
                  className="w-64 h-64 mx-auto"
                />
              </div>
              <p className="text-sm text-gray-500 mt-4 break-all px-4">{qrData.menuUrl}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={downloadQR}
              className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>⬇️</span>
              Download
            </button>
            <button
              onClick={printQR}
              className="px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>🖨️</span>
              Print
            </button>
            <button
              onClick={copyLink}
              className="px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>📋</span>
              Copy Link
            </button>
            <button
              onClick={() => setQrData(null)}
              className="px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              Regenerate
            </button>
          </div>

          {/* Usage Instructions */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-3">How to use:</h4>
            <ul className="space-y-2 text-gray-700">
              <li>• Print the QR code and place it on tables</li>
              <li>• Customers scan with their phone camera</li>
              <li>• They can view menu and place orders instantly</li>
              <li>• No app installation required!</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}