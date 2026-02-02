# Amulya Resturant - Frontend

A complete, production-ready Hotel & Restaurant Management System built with Next.js, JavaScript, and Tailwind CSS.

## Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Super Admin, Hotel Admin, Manager, Cashier, Kitchen Staff)
- Secure login and session management

### Dashboard
- Role-specific dashboards
- Real-time statistics and metrics
- Quick action buttons
- Visual data representation

### Room Management
- CRUD operations for rooms
- Room status tracking (Available, Occupied, Maintenance, Cleaning)
- Real-time availability
- Room type categorization

### Booking System
- Create new bookings with guest details
- Check-in and check-out functionality
- Booking status management
- Guest information tracking

### POS (Point of Sale)
- Menu browsing by category
- Add items to cart
- Real-time order placement
- Auto inventory deduction

### Kitchen Dashboard
- Live order display for kitchen staff
- Order status updates (Pending → Preparing → Ready)
- Special instructions visibility
- Auto-refresh every 30 seconds

### Billing & Invoicing
- Combined room + food billing
- Automatic GST calculation (5%)
- Payment tracking
- Invoice generation

### Menu Management
- Category-wise menu organization
- Toggle item availability
- Item details and pricing
- Type indicators (Veg/Non-veg)

### Inventory Management
- Stock level tracking
- Low stock and out-of-stock alerts
- Category-based filtering
- Stock adjustment capabilities

### Reports & Analytics
- Revenue trend charts
- Occupancy rate visualization
- POS sales analysis
- Customizable date ranges

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript (No TypeScript)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **State Management**: React Context API

## Installation

```bash
# Install dependencies
npm install

# Create .env.local file
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Default Login Credentials

**Super Admin:**
- Email: admin@hotelmaster.com
- Password: Admin@123456

## Project Structure

```
frontend/
├── src/
│   ├── app/                      # App router pages
│   │   ├── dashboard/           # Dashboard pages
│   │   │   ├── super-admin/    # Super Admin dashboard
│   │   │   ├── admin/          # Hotel Admin dashboard
│   │   │   ├── manager/        # Manager dashboard
│   │   │   ├── cashier/        # Cashier dashboard
│   │   │   ├── kitchen/        # Kitchen staff dashboard
│   │   │   ├── rooms/          # Room management
│   │   │   ├── bookings/       # Booking management
│   │   │   ├── pos/            # POS system
│   │   │   ├── menu/           # Menu management
│   │   │   ├── inventory/      # Inventory management
│   │   │   ├── billing/        # Billing & invoices
│   │   │   └── reports/        # Reports & analytics
│   │   ├── login/              # Login page
│   │   ├── layout.js           # Root layout
│   │   └── page.js             # Home page
│   ├── components/
│   │   ├── layout/             # Layout components
│   │   │   ├── Sidebar.js
│   │   │   ├── Header.js
│   │   │   └── DashboardLayout.js
│   │   ├── modals/             # Modal components
│   │   │   └── CreateBookingModal.js
│   │   └── common/             # Common components
│   │       └── Toast.js
│   ├── context/                # React contexts
│   │   └── AuthContext.js
│   ├── lib/                    # Utilities
│   │   └── api.js             # Axios instance
│   └── styles/
│       └── globals.css
└── public/

```

## Key Features Implementation

### Role-Based Access Control
Different users see different menu items and have different permissions based on their role.

### Real-Time Updates
Kitchen dashboard auto-refreshes every 30 seconds to show latest orders.

### Responsive Design
Fully responsive layout works on desktop, tablet, and mobile devices.

### Auto Inventory Deduction
When orders are placed in POS, inventory automatically deducts stock.

### GST Calculation
All invoices automatically calculate 5% GST (2.5% CGST + 2.5% SGST) with Math.ceil rounding.

## API Integration

All API calls are centralized through `src/lib/api.js` which:
- Automatically adds JWT token to requests
- Handles 401 unauthorized responses
- Redirects to login on authentication failure

## Environment Variables

```
NEXT_PUBLIC_API_URL - Backend API base URL
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations

- Image optimization with Next.js Image
- Code splitting by route
- Lazy loading of components
- Optimized bundle size

## Development

```bash
# Run development server with hot reload
npm run dev

# Run linter
npm run lint

# Format code
npm run format
```

## Deployment

This is a Next.js application and can be deployed to:
- Vercel (recommended)
- Netlify
- AWS
- Any Node.js hosting platform

## Support

For issues or questions, please refer to the backend documentation or contact the development team.

## License

Proprietary - All rights reserved