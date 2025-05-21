import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from './config.jsx';

// Find nearby rolniks based on postal code
export const findNearbyRolniks = async (postalCode) => {
  // This is a simple implementation that just matches the first 2 digits
  // A more sophisticated approach would use a geolocation service
  const postalPrefix = postalCode.substring(0, 2);
  
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'rolnik'),
    where('postalCode', '>=', postalPrefix),
    where('postalCode', '<', postalPrefix + '\uf8ff')
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Get all rolniks
export const getAllRolniks = async () => {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'rolnik')
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Get all clients
export const getAllClients = async () => {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'klient')
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Get user by ID
export const getUserById = async (userId) => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } else {
    throw new Error('User not found');
  }
};