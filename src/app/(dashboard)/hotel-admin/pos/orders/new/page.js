'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OrderProvider, useOrder } from '@/context/OrderContext';
import MenuSection from './MenuSection';
import CartSection from './CartSection';
import SubmitOrder from './SubmitOrder';
import PaymentModal from '@/components/cashier/PaymentModal'; // assume ye hai
import { apiRequest } from '@/services/api';
import { connectPOSSocket, disconnectPOSSocket } from '@/services/posSocket';
import { UtensilsCrossed, Users, DoorOpen, AlertCircle, Loader2, Printer, ShoppingCart } from 'lucide-react';

function NewOrderContent({ onOrderSuccess, requirePayment = true }) {
  const { order, startOrder, resetOrder } = useOrder();
  const router = useRouter();
  const [orderType, setOrderType] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [errors, setErrors] = useState({});
  const [showPayment, setShowPayment] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
const [loadingTables, setLoadingTables] = useState(false);
const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);


  // Socket connect
  useEffect(() => {
    connectPOSSocket();

    return () => disconnectPOSSocket();
  }, []);
  

  // Fetch tables when Dine-In is selected
useEffect(() => {
  if (orderType === 'dine-in') {
    const fetchAvailableTables = async () => {
      setLoadingTables(true);
      try {
        const res = await apiRequest('/tables');
        // Filter to show only 'available' tables
        const tables = res.data?.tables || res.data || [];
        setAvailableTables(tables.filter(t => t.status === 'available'));
      } catch (err) {
        setErrors(prev => ({ ...prev, general: 'Failed to load tables' }));
      } finally {
        setLoadingTables(false);
      }
    };
    fetchAvailableTables();
  }
}, [orderType]);

useEffect(() => {
    if (orderType === 'room-service') {
      const fetchAvailableRooms = async () => {
        setLoadingRooms(true);
        try {
          // Assuming your endpoint is /rooms. Update if it's different.
          const res = await apiRequest('/rooms'); 
          const rooms = res.data?.rooms || res.data || [];
          // Filtering for 'occupied' rooms is usually best for Room Service
          // since you can only deliver to someone currently in a room.
          setAvailableRooms(rooms.filter(r => r.status === 'occupied'));
        } catch (err) {
          setErrors(prev => ({ ...prev, general: 'Failed to load rooms' }));
        } finally {
          setLoadingRooms(false);
        }
      };
      fetchAvailableRooms();
    }
  }, [orderType]);

  const validateStart = () => {
    const newErrors = {};
    if (!orderType) newErrors.orderType = 'Order type is required';

    if (orderType === 'dine-in' && !tableNumber.trim()) newErrors.tableNumber = 'Table number required';

    if (orderType === 'room-service' && !roomNumber.trim()) newErrors.roomNumber = 'Room number required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartOrder = () => {
    if (!validateStart()) return;

    startOrder({
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
    room: orderType === 'room-service' ? selectedRoomId : undefined,
      // Add more if needed (booking, customer)
    });
  };

  const handleOrderSubmit = async () => {
    setLoading(true);
    setErrors({});

    try {
      const payload = {
        orderType: order.orderType,
        tableNumber: order.tableNumber,
        room: order.room,
        items: order.items.map(item => ({
          menuItem: item.menuItemId,
          variant: item.variant,
          quantity: item.quantity,
        })),
        specialInstructions: order.specialInstructions,
      };

      const res = await apiRequest('/pos/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const newOrder = res.data.order;
      setCreatedOrder(newOrder);

      // If payment required, open modal
      if (requirePayment) {
        setShowPayment(true);
      } else {
        // Direct success
        handlePaymentSuccess(newOrder);
      }
    } catch (err) {
      setErrors({ general: err.message || 'Failed to place order' });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (orderData) => {
    resetOrder();
    setShowPayment(false);
    if (onOrderSuccess) onOrderSuccess(orderData);

    // Print invoice
    window.open(`/api/pos/orders/${orderData._id}/invoice/pdf`, '_blank');
    alert('Order placed successfully! Invoice opening...');
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  // Step 1: Order Type Selection
  if (!order) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Start New Order</h2>

        {errors.general && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg w-full max-w-md">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <button
            onClick={() => setOrderType('dine-in')}
            className="flex flex-col items-center gap-4 p-8 border-2 border-gray-300 rounded-xl hover:border-[rgb(0,173,181)] hover:shadow-xl transition-all"
          >
            <UtensilsCrossed className="h-12 w-12 text-[rgb(0,173,181)]" />
            <h3 className="text-xl font-semibold">Dine-In</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Table service</p>
          </button>

          <button
            onClick={() => setOrderType('room-service')}
            className="flex flex-col items-center gap-4 p-8 border-2 border-gray-300 rounded-xl hover:border-[rgb(0,173,181)] hover:shadow-xl transition-all"
          >
            <DoorOpen className="h-12 w-12 text-[rgb(0,173,181)]" />
            <h3 className="text-xl font-semibold">Room Service</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Deliver to room</p>
          </button>

          <button
            onClick={() => setOrderType('takeaway')}
            className="flex flex-col items-center gap-4 p-8 border-2 border-gray-300 rounded-xl hover:border-[rgb(0,173,181)] hover:shadow-xl transition-all"
          >
            <ShoppingCart className="h-12 w-12 text-[rgb(0,173,181)]" />
            <h3 className="text-xl font-semibold">Takeaway</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Quick pickup</p>
          </button>
        </div>

        {orderType && (
          <div className="mt-8 w-full max-w-md">
            {orderType === 'dine-in' && (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">Select Available Table *</label>
    {loadingTables ? (
      <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin h-4 w-4" /> Loading tables...</div>
    ) : (
      <div className="grid grid-cols-3 gap-3">
        {availableTables.map((table) => (
          <button
            key={table._id}
            onClick={() => setTableNumber(table.tableNumber)}
            className={`p-3 border rounded-lg text-center transition-all ${
              tableNumber === table.tableNumber 
                ? 'border-[rgb(0,173,181)] bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)]' 
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <span className="font-bold">{table.tableNumber}</span>
            <div className="text-xs text-gray-500">Cap: {table.capacity}</div>
          </button>
        ))}
      </div>
    )}
    {errors.tableNumber && <p className="text-red-600 text-sm mt-1">{errors.tableNumber}</p>}
  </div>
)}

          {orderType === 'room-service' && (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Select Occupied Room *</label>
      {loadingRooms ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="animate-spin h-4 w-4" /> Loading rooms...
        </div>
      ) : availableRooms.length === 0 ? (
        <div className="p-4 border border-yellow-200 bg-yellow-50 text-yellow-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> No occupied rooms found for service.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
          {availableRooms.map((room) => (
          <button
  key={room._id}
  onClick={() => {
    setRoomNumber(room.roomNumber); // Sets "231" for the UI
    setSelectedRoomId(room._id);    // Sets the MongoDB ID for the Backend
  }}
  className={`p-3 border rounded-lg text-center transition-all ${
    roomNumber === room.roomNumber 
      ? 'border-[rgb(0,173,181)] bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)]' 
      : 'border-gray-200 hover:border-gray-400'
  }`}
>
  <span className="font-bold text-lg">{room.roomNumber}</span>
  <div className="text-[10px] uppercase text-gray-500">{room.type || 'Room'}</div>
</button>
          ))}
        </div>
      )}
      {errors.roomNumber && <p className="text-red-600 text-sm mt-1">{errors.roomNumber}</p>}
    </div>
  )}

            <button
              onClick={handleStartOrder}
              className="w-full py-3 bg-[rgb(0,173,181)] text-white rounded-lg font-medium hover:bg-[rgb(0,173,181)]/90 transition"
            >
              Start Order
            </button>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Active order screen (Menu + Cart)
  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Menu */}
      <div className="flex-1 overflow-auto">
        <MenuSection />
      </div>

      {/* Cart */}
      <div className="w-full md:w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-auto">
        <CartSection
          onOrderSuccess={(createdOrder) => {
            setCreatedOrder(createdOrder);
            if (!requirePayment) {
              handlePaymentSuccess(createdOrder);
            } else {
              setShowPayment(true);
            }
          }}
          requirePayment={requirePayment}
        />
      </div>

      {/* Payment Modal */}
      {showPayment && createdOrder && (
        <PaymentModal
          order={createdOrder}
          onClose={handlePaymentCancel}
          onSuccess={() => handlePaymentSuccess(createdOrder)}
        />
      )}
    </div>
  );
}

export default function NewOrderPage({ onOrderSuccess, requirePayment = true }) {
  return (
    <OrderProvider>
      <NewOrderContent onOrderSuccess={onOrderSuccess} requirePayment={requirePayment} />
    </OrderProvider>
  );
}