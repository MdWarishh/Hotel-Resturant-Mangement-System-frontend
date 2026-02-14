'use client';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-orange-600 mb-4">Welcome to Fusion POS</h1>
        <p className="text-lg text-gray-700">Redirect temporarily disabled for testing.</p>
        <a href="/allinone" className="mt-6 inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
          Go to Public Page
        </a>
      </div>
    </div>
  );
}