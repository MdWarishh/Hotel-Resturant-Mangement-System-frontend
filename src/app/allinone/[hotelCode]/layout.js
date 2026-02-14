// frontend/app/allinone/[hotelCode]/layout.js

'use client';

import { use } from 'react';
import { CartProvider } from '@/context/CartContext';

export default function PublicHotelLayout({ children, params }) {
  // ✅ Next.js 15: Unwrap params promise using React.use()
  const { hotelCode } = use(params);
  
  return (
    <CartProvider hotelCode={hotelCode}>
      {children}
    </CartProvider>
  );
}