// frontend/app/(dashboard)/hotel-admin/qr-code/page.js

'use client';

import { useState } from 'react';
import QRCodeGenerator from '@/components/admin/QRCodeGenerator';

export default function QRCodePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">QR Code Menu</h1>
          <p className="text-gray-600 mt-2">
            Generate and download QR code for contactless ordering
          </p>
        </div>

        {/* QR Code Generator Component */}
        <QRCodeGenerator />

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How it works</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">1️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Generate QR Code</h3>
              <p className="text-sm text-gray-600">
                Click the button to generate a unique QR code for your restaurant
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">2️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Print & Display</h3>
              <p className="text-sm text-gray-600">
                Download and print the QR code, then place it on tables or at the entrance
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">3️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Customers Order</h3>
              <p className="text-sm text-gray-600">
                Customers scan and place orders directly from their phones
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-4">Benefits of QR Ordering</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-semibold">Contactless Ordering</p>
                <p className="text-sm text-orange-100">Safe and hygienic ordering experience</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-semibold">Faster Service</p>
                <p className="text-sm text-orange-100">Reduce wait times and serve more customers</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-semibold">No App Required</p>
                <p className="text-sm text-orange-100">Works with any smartphone camera</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-semibold">Reduce Order Errors</p>
                <p className="text-sm text-orange-100">Customers enter their own orders accurately</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}