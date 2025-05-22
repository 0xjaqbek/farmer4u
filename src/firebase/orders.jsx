// Add this function to your src/firebase/orders.jsx file
// This provides better order lookup capabilities

import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config.jsx';

// Enhanced order lookup function
export const findOrderByTrackingCode = async (trackingCode) => {
  try {
    console.log('Searching for order with tracking code:', trackingCode);
    
    // Strategy 1: Try to find by trackingId field
    try {
      const q1 = query(
        collection(db, 'orders'),
        where('trackingId', '==', trackingCode)
      );
      
      const querySnapshot1 = await getDocs(q1);
      
      if (!querySnapshot1.empty) {
        const doc = querySnapshot1.docs[0];
        const data = doc.data();
        console.log('Found order by trackingId:', doc.id);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }
    } catch (error) {
      console.log('Error searching by trackingId:', error);
    }
    
    // Strategy 2: Try to find by document ID directly
    try {
      const docRef = doc(db, 'orders', trackingCode);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Found order by document ID:', trackingCode);
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }
    } catch (error) {
      console.log('Error searching by document ID:', error);
    }
    
    // Strategy 3: Search for orders where the ID starts with the tracking code
    // This handles cases where tracking code is a substring of the full ID
    try {
      const q3 = query(collection(db, 'orders'));
      const querySnapshot3 = await getDocs(q3);
      
      for (const docSnap of querySnapshot3.docs) {
        const orderId = docSnap.id;
        // Check if the order ID starts with the tracking code
        if (orderId.startsWith(trackingCode) || orderId.substring(0, 8) === trackingCode) {
          const data = docSnap.data();
          console.log('Found order by ID substring match:', orderId);
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          };
        }
      }
    } catch (error) {
      console.log('Error in substring search:', error);
    }
    
    // If no order found by any method
    console.log('No order found with tracking code:', trackingCode);
    throw new Error('Order not found');
    
  } catch (error) {
    console.error('Error in findOrderByTrackingCode:', error);
    throw error;
  }
};

// Update your existing functions to ensure they exist
export const createOrder = async (orderData) => {
  try {
    // Add status tracking
    const statusHistory = [
      {
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: 'Order created'
      }
    ];
    
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      status: 'pending', // Initial status
      statusHistory,
      trackingId: generateTrackingId(),
      createdAt: serverTimestamp()
    });
    
    console.log('Order created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get orders by client ID
export const getOrdersByClient = async (clientId) => {
  try {
    // Query without orderBy to avoid composite index requirement
    const q = query(
      collection(db, 'orders'), 
      where('clientId', '==', clientId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Map and convert dates
    const orders = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    });
    
    // Sort by createdAt in JavaScript instead
    return orders.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error getting client orders:', error);
    throw error;
  }
};

// Get orders by rolnik ID
export const getOrdersByRolnik = async (rolnikId) => {
  try {
    // Query without orderBy to avoid composite index requirement
    const q = query(
      collection(db, 'orders'), 
      where('rolnikId', '==', rolnikId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Map and convert dates
    const orders = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    });
    
    // Sort by createdAt in JavaScript instead
    return orders.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error getting rolnik orders:', error);
    throw error;
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    console.log('Getting order by ID:', orderId);
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Order data found:', data);
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    } else {
      console.error('Order not found:', orderId);
      throw new Error('Order not found');
    }
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
};

// Get order by tracking ID (original function)
export const getOrderByTrackingId = async (trackingId) => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('trackingId', '==', trackingId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Order not found');
    }
    
    const data = querySnapshot.docs[0].data();
    
    return {
      id: querySnapshot.docs[0].id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error getting order by tracking ID:', error);
    throw error;
  }
};

// Update order status with improved error handling and logging
export const updateOrderStatus = async (orderId, status, note = '') => {
  try {
    console.log('Updating order status:', { orderId, status, note });
    
    // Validate inputs
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    
    if (!status) {
      throw new Error('Status is required');
    }
    
    if (!ORDER_STATUSES[status]) {
      throw new Error(`Invalid status: ${status}`);
    }
    
    const docRef = doc(db, 'orders', orderId);
    console.log('Getting current order data...');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.error('Order not found in database:', orderId);
      throw new Error('Order not found');
    }
    
    const currentData = docSnap.data();
    console.log('Current order data:', currentData);
    
    const statusHistory = currentData.statusHistory || [];
    
    // Add new status to history
    const newStatusEntry = {
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status changed to ${status}`,
      updatedBy: 'user' // Could be enhanced to include user info
    };
    
    const updatedStatusHistory = [...statusHistory, newStatusEntry];
    
    console.log('Updating document with new status...');
    await updateDoc(docRef, {
      status,
      statusHistory: updatedStatusHistory,
      updatedAt: serverTimestamp(),
      lastStatusUpdate: newStatusEntry
    });
    
    console.log('Order status updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Generate tracking ID
const generateTrackingId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 8;
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

// Available order statuses and their descriptions
export const ORDER_STATUSES = {
  pending: {
    label: 'Pending',
    description: 'Order has been placed but not yet confirmed by the farmer',
    color: 'yellow'
  },
  confirmed: {
    label: 'Confirmed',
    description: 'Order has been confirmed by the farmer',
    color: 'blue'
  },
  preparing: {
    label: 'Preparing',
    description: 'Farmer is preparing your order',
    color: 'blue'
  },
  ready: {
    label: 'Ready for Pickup/Delivery',
    description: 'Order is ready for pickup or delivery',
    color: 'green'
  },
  in_transit: {
    label: 'In Transit',
    description: 'Order is on the way for delivery',
    color: 'purple'
  },
  delivered: {
    label: 'Delivered',
    description: 'Order has been delivered to the customer',
    color: 'green'
  },
  completed: {
    label: 'Completed',
    description: 'Order has been completed',
    color: 'green'
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Order has been cancelled',
    color: 'red'
  }
};