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

// Create a new order
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
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    } else {
      throw new Error('Order not found');
    }
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
};

// Get order by tracking ID
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

// Update order status
export const updateOrderStatus = async (orderId, status, note = '') => {
  try {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Order not found');
    }
    
    const statusHistory = docSnap.data().statusHistory || [];
    
    // Add new status to history
    const newStatusEntry = {
      status,
      timestamp: new Date().toISOString(),
      note
    };
    
    await updateDoc(docRef, {
      status,
      statusHistory: [...statusHistory, newStatusEntry],
      updatedAt: serverTimestamp()
    });
    
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