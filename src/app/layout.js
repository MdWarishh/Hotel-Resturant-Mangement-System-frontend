// src/app/layout.js

import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

// (optional but recommended)
export const metadata = {
  title: 'Amulya Resturant',
  description: 'Multi-hotel & restaurant management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
