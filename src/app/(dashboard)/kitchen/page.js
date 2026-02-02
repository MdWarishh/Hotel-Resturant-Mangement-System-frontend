'use client';

import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-hot-toast'; // agar install nahi to comment kar dena aur alert use kar lena
import OrderDetailModal from './OrderDetailModal';
import OrderTimer from './OrderTimer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // same base

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, preparing
  const [socketConnected, setSocketConnected] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true); // default on
const audioRef = useRef(null);
const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'

  // Fetch initial active orders
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No auth token found. Please login again.');
        return;
      }

      console.log('Fetching kitchen orders from:', `${API_URL}/pos/orders/kitchen`);

      const res = await fetch(`${API_URL}/pos/orders/kitchen`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Fetch status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log('Fetched orders:', data);

      const activeOrders = data?.data?.orders || [];
      // Sort oldest first (FIFO for kitchen)
      activeOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setOrders(activeOrders);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const toggleSound = () => {
  const newValue = !soundEnabled;
  setSoundEnabled(newValue);
  localStorage.setItem('kitchenSoundEnabled', newValue.toString());
  toast(newValue ? 'Sound notifications ON' : 'Sound notifications OFF');
};


  useEffect(() => {
  // Load saved preference
  const saved = localStorage.getItem('kitchenSoundEnabled');
  if (saved !== null) {
    setSoundEnabled(saved === 'true');
  }

  // Create audio element
  audioRef.current = new Audio('/beep.mp3'); // ya 'https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-buzzer-988.mp3'
  audioRef.current.preload = 'auto';
}, []);

// Autoplay policy handle: pehli click pe resume
useEffect(() => {
  const handleFirstInteraction = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
      audioRef.current.pause(); // turant stop
    }
    document.removeEventListener('click', handleFirstInteraction);
  };

  document.addEventListener('click', handleFirstInteraction, { once: true });

  return () => {
    document.removeEventListener('click', handleFirstInteraction);
  };
}, []);

  // Socket setup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(`${SOCKET_URL}/pos`, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      transports: ['polling', 'websocket'],
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected to /pos namespace');
      setSocketConnected(true);
    });

   socket.on('order:created', (newOrder) => {
  console.log('New order received:', newOrder);
  if (['pending', 'preparing'].includes(newOrder.status)) {
    setOrders((prev) => {
      if (prev.some((o) => o._id === newOrder._id)) return prev;
      const updated = [...prev, newOrder];
      updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return updated;
    });

    toast.success(`New order #${newOrder.orderNumber} arrived!`);

    // Sound play karo agar enabled hai
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0; // shuru se bajao
      audioRef.current.play().catch((err) => {
        console.log('Sound play error:', err);
        toast('Click anywhere on page to enable sound');
      });
    }
  }
});

    socket.on('order:updated', (updatedOrder) => {
      console.log('Order updated:', updatedOrder);
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );
      if (!['pending', 'preparing'].includes(updatedOrder.status)) {
        setOrders((prev) => prev.filter((o) => o._id !== updatedOrder._id));
      }
    });

    socket.on('order:completed', (completedOrder) => {
      console.log('Order completed:', completedOrder);
      setOrders((prev) => prev.filter((o) => o._id !== completedOrder._id));
      toast('Order completed – removed from queue');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
      toast.error('Socket connection issue – real-time updates may not work');
    });

    // Cleanup
    return () => {
      socket.disconnect();
      setSocketConnected(false);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, []);


  // Tab ke hisaab se orders filter karo
const displayedOrders = orders.filter((order) => {
  if (activeTab === 'completed') {
    return ['ready', 'served', 'completed'].includes(order.status?.toLowerCase());
  }
  // Active tab
  if (filter === 'all') return ['pending', 'preparing'].includes(order.status?.toLowerCase());
  return order.status?.toLowerCase() === filter;
});

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  // Status update
 const handleStatusUpdate = async (orderId, newStatus) => {
  const originalOrders = [...orders];

  // Optimistic UI update
  setOrders((prev) =>
    prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
  );

  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Token missing – please login again');

    const url = `${API_URL}/pos/orders/${orderId}/status`;
    console.log('[PATCH] URL:', url);
    console.log('[PATCH] Body:', { status: newStatus });
    console.log('[PATCH] Token (first 20 chars):', token.substring(0, 20) + '...');

    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    console.log('[PATCH] Status code:', res.status);
    console.log('[PATCH] Headers:', [...res.headers.entries()]);

    if (!res.ok) {
      let errorBody;
      try {
        errorBody = await res.json();
      } catch {
        errorBody = await res.text();
      }
      console.log('[PATCH] Error response:', errorBody);
      throw new Error(
        `Failed: ${res.status} - ${errorBody.message || errorBody || 'Unknown error'}`
      );
    }

    const data = await res.json();
    console.log('[PATCH] Success:', data);

    toast.success(`Order status updated to ${newStatus}`);
  } catch (err) {
    console.error('[PATCH] Full error:', err);
    toast.error(`Update failed: ${err.message}`);
    setOrders(originalOrders); // revert
    fetchOrders(); // refresh
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Loading kitchen queue...
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">

          <label className="text-sm text-gray-300">Sound Alerts:</label>
      <button
        onClick={toggleSound}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          soundEnabled 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
      >
        {soundEnabled ? 'ON' : 'OFF'}
      </button>


        <h1 className="text-3xl font-bold">Kitchen Queue</h1>

        {/* Tabs */}
  <div className="flex gap-3 bg-gray-800 p-1 rounded-lg">
    <button
      onClick={() => setActiveTab('active')}
      className={`px-6 py-2 rounded-md font-medium transition ${
        activeTab === 'active'
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      Active Queue
    </button>
    <button
      onClick={() => setActiveTab('completed')}
      className={`px-6 py-2 rounded-md font-medium transition ${
        activeTab === 'completed'
          ? 'bg-green-600 text-white shadow-md'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      Completed
    </button>
  </div>
  {/* Filters – sirf active tab pe dikhao */}
  {activeTab === 'active' && (
    <div className="flex gap-3">
      <button
        onClick={() => setFilter('all')}
        className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
      >
        All
      </button>
      <button
        onClick={() => setFilter('pending')}
        className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'}`}
      >
        Pending
      </button>
      <button
        onClick={() => setFilter('preparing')}
        className={`px-4 py-2 rounded-lg ${filter === 'preparing' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}
      >
        Preparing
      </button>
    </div>
  )}
</div>
        
        {/* <div className="flex gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2 rounded-lg font-medium ${
              filter === 'all' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-5 py-2 rounded-lg font-medium ${
              filter === 'pending' ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('preparing')}
            className={`px-5 py-2 rounded-lg font-medium ${
              filter === 'preparing' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Preparing
          </button>
        </div>
      </div> */}

      {displayedOrders.length === 0 ? (
  <div className="text-center py-20 text-gray-400 text-xl">
    {activeTab === 'completed'
      ? 'No completed orders yet (ready/served/completed)'
      : 'No active orders in queue right now (Pending/Preparing)'}
    <br />
    <span className="text-sm mt-2 block text-gray-500">
      {activeTab === 'completed' ? 'Orders move here after marking Ready/Served' : 'Create orders from POS to see them here'}
    </span>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {displayedOrders.map((order) => (
      <div
        key={order._id}
        className="bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700 hover:border-gray-500 transition-all cursor-pointer"
        onClick={() => setSelectedOrderId(order._id)}
      >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">#{order.orderNumber}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(order.createdAt).toLocaleString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    • {order.orderType.toUpperCase()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    order.status === 'pending'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      : order.status === 'preparing'
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      : 'bg-green-500/20 text-green-300 border border-green-500/30'
                  }`}
                >
                  {order.status}
                </span>
              </div>

              {/* Location */}
              <div className="text-sm mb-3 space-y-1">
                {order.tableNumber && <p>Table: {order.tableNumber}</p>}
                {order.room?.roomNumber && <p>Room: {order.room.roomNumber}</p>}
                {order.customer?.name && (
                  <p>
                    Customer: {order.customer.name}
                    {order.customer.phone && ` • ${order.customer.phone}`}
                  </p>
                )}
              </div>

              {/* Items */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2 text-gray-300">Items:</h4>
                <ul className="space-y-1.5 text-sm">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between">
                      <span>
                        {item.quantity} × {item.name}
                        {item.variant && ` (${item.variant})`}
                      </span>
                      <span className="text-gray-400">₹{item.subtotal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ← YAHAN TIMER ADD KAR DO – items ke neeche */}
{activeTab === 'active' && <OrderTimer order={order} />}

              {/* Notes */}
              {(order.specialInstructions || order.notes) && (
                <div className="mb-4 p-3 bg-gray-700/50 rounded-lg text-sm text-yellow-200 border border-yellow-500/20">
                  Note: {order.specialInstructions || order.notes}
                </div>
              )}

              {/* Total & Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                <div className="text-xl font-bold">₹{order.pricing.total}</div>

                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(order._id, 'preparing')}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Start Preparing
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleStatusUpdate(order._id, 'ready')}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Mark Ready
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      

      {/* Socket status indicator (optional) */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-500">
        {socketConnected ? 'Live updates: Connected' : 'Live updates: Connecting...'}
      </div>

      <OrderDetailModal
        orderId={selectedOrderId}
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}