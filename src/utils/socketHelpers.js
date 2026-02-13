// backend/src/utils/socketHelpers.js

/**
 * 🔥 EMIT ORDER UPDATE TO BOTH NAMESPACES
 * Use this function whenever you update an order status
 * It will emit to:
 * 1. /pos namespace (for authenticated staff/admin)
 * 2. /public namespace (for public order tracking)
 */

export const emitOrderUpdate = (io, eventName, orderData) => {
  if (!io) {
    console.warn('⚠️ Socket.io instance not available');
    return;
  }

  try {
    // Emit to POS namespace (authenticated users - cashier, kitchen, etc.)
    io.of('/pos').emit(eventName, orderData);
    console.log(`✅ Emitted to /pos: ${eventName}`);

    // Emit to PUBLIC namespace (public order tracking)
    io.of('/public').emit(eventName, orderData);
    console.log(`✅ Emitted to /public: ${eventName}`);

    // Optional: Emit to specific order room (for targeted updates)
    if (orderData.orderNumber) {
      io.of('/public').to(`order:${orderData.orderNumber}`).emit(eventName, orderData);
      console.log(`✅ Emitted to room: order:${orderData.orderNumber}`);
    }
  } catch (error) {
    console.error('❌ Error emitting socket event:', error);
  }
};

/**
 * 🔥 EMIT TABLE UPDATE
 */
export const emitTableUpdate = (io, tableData) => {
  if (!io) return;

  try {
    io.of('/pos').emit('table:updated', tableData);
    console.log(`✅ Emitted table update: ${tableData.tableNumber}`);
  } catch (error) {
    console.error('❌ Error emitting table update:', error);
  }
};

/**
 * 🔥 EMIT NEW PUBLIC ORDER
 */
export const emitNewPublicOrder = (io, orderData) => {
  if (!io) return;

  try {
    // Notify cashier about new public order
    io.of('/pos').emit('order:new-public', orderData);
    console.log(`✅ Emitted new public order: ${orderData.orderNumber}`);
  } catch (error) {
    console.error('❌ Error emitting new public order:', error);
  }
};