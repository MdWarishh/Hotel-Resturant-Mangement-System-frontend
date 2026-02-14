'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Upload, Download, FileSpreadsheet, CheckCircle2, 
  XCircle, AlertCircle, ArrowLeft, Loader2, Info,
  FileText, Users, TrendingUp
} from 'lucide-react';

export default function RoomsBulkUploadPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // Download Template
  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rooms/bulk-upload/template`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Rooms_Upload_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download template: ' + error.message);
    } finally {
      setDownloading(false);
    }
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        selectedFile.type === 'application/vnd.ms-excel'
      ) {
        setFile(selectedFile);
        setUploadResult(null);
      } else {
        alert('Please select an Excel file (.xlsx or .xls)');
      }
    }
  };

  // Handle Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        droppedFile.type === 'application/vnd.ms-excel'
      ) {
        setFile(droppedFile);
        setUploadResult(null);
      } else {
        alert('Please drop an Excel file (.xlsx or .xls)');
      }
    }
  };

  // Upload File
  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rooms/bulk-upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setUploadResult(data.data);
      
      if (data.data.successCount > 0) {
        // Success message
        setTimeout(() => {
          if (data.data.errorCount === 0) {
            // All successful - redirect after 3 seconds
            setTimeout(() => {
              router.push('/hotel-admin/rooms');
            }, 3000);
          }
        }, 1000);
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Rooms</span>
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Bulk Upload Rooms</h1>
          <p className="mt-2 text-gray-600">Upload multiple rooms at once using Excel</p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-600 rounded-xl">
                <FileSpreadsheet className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Step 1</h3>
            </div>
            <p className="text-sm text-gray-700">Download the Excel template with sample data</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-600 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Step 2</h3>
            </div>
            <p className="text-sm text-gray-700">Fill in your room details in the Excel file</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-600 rounded-xl">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Step 3</h3>
            </div>
            <p className="text-sm text-gray-700">Upload the file and review results</p>
          </div>
        </div>

        {/* Template Download */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Download Template</h2>
              <p className="text-gray-600 mb-6">
                Get the Excel template with sample data and instructions
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-2">Template includes:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>Pre-formatted columns for all room details</li>
                      <li>Sample data rows for reference</li>
                      <li>Instructions sheet with valid values</li>
                      <li>Supports hourly booking configuration</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownloadTemplate}
                disabled={downloading}
                className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Download Excel Template
                  </>
                )}
              </button>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                <FileSpreadsheet className="h-16 w-16 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Filled Template</h2>

          {/* Drag & Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              dragActive
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-6 py-4">
                  <FileSpreadsheet className="h-8 w-8 text-teal-600" />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setFile(null)}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
                  >
                    Remove File
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex items-center gap-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        Upload & Process
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Drop your Excel file here
                </h3>
                <p className="text-gray-600 mb-6">or</p>
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-3 rounded-xl cursor-pointer transition-all"
                >
                  <FileSpreadsheet className="h-5 w-5" />
                  Browse Files
                </label>
                <p className="mt-4 text-sm text-gray-500">
                  Supports: .xlsx, .xls (Max 5MB)
                </p>
              </>
            )}
          </div>
        </div>

        {/* Upload Results */}
        {uploadResult && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Results</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Rows</span>
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{uploadResult.total}</p>
              </div>

              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-600">Successful</span>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">{uploadResult.successCount}</p>
              </div>

              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-600">Failed</span>
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-600">{uploadResult.errorCount}</p>
              </div>
            </div>

            {/* Success Message */}
            {uploadResult.successCount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">
                      {uploadResult.successCount} room{uploadResult.successCount > 1 ? 's' : ''} created successfully!
                    </h3>
                    <p className="text-sm text-green-800">
                      {uploadResult.errorCount === 0 
                        ? 'Redirecting to rooms page...'
                        : 'Please review errors below and fix them.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error List */}
            {uploadResult.errorCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <h3 className="font-semibold text-red-900">
                    {uploadResult.errorCount} row{uploadResult.errorCount > 1 ? 's' : ''} failed
                  </h3>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {uploadResult.errors.map((error, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-red-200">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-red-600">{error.row}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-1">
                            Row {error.row}: {error.roomNumber}
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                            {error.errors.map((err, errIndex) => (
                              <li key={errIndex}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => {
                  setFile(null);
                  setUploadResult(null);
                }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
              >
                Upload Another File
              </button>

              {uploadResult.successCount > 0 && (
                <button
                  onClick={() => router.push('/hotel-admin/rooms')}
                  className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all"
                >
                  View All Rooms
                  <TrendingUp className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}