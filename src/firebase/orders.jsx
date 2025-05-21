import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  doc,
  updateDoc,
  getDoc,
  orderBy
} from 'firebase/firestore';
import { db } from './config.jsx';

// Create a new order
export const createOrder = async (orderData) => {
  const docRef = await addDoc(collection(db, 'orders'), {
    ...orderData,
    status: 'pending', // Initial status
    createdAt: new Date().toISOString()
  });
  
  return docRef.id;
};

// Get orders by client ID
export const getOrdersByClient = async (clientId) => {
  const q = query(
    collection(db, 'orders'), 
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Get orders by rolnik ID
export const getOrdersByRolnik = async (rolnikId) => {
  const q = query(
    collection(db, 'orders'), 
    where('rolnikId', '==', rolnikId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Get order by ID
export const getOrderById = async (orderId) => {
  const docRef = doc(db, 'orders', orderId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } else {
    throw new Error('Order not found');
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  const docRef = doc(db, 'orders', orderId);
  await updateDoc(docRef, {
    status,
    updatedAt: new Date().toISOString()
  });
  
  return true;
};
