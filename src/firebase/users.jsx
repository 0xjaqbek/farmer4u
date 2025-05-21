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
  try {
    // Get the postal prefix for filtering
    const postalPrefix = postalCode.substring(0, 2);
    
    // Use a simpler query that just filters by role
    // This avoids requiring a composite index
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'rolnik')
    );
    
    const querySnapshot = await getDocs(q);
    
    // Filter the results by postal code in JavaScript
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(user => {
        // Check if user has a postalCode and it starts with the same prefix
        return user.postalCode && 
               user.postalCode.substring(0, 2) === postalPrefix;
      });
  } catch (error) {
    console.error('Error finding nearby rolniks:', error);
    throw error;
  }
};

// Get all rolniks
export const getAllRolniks = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'rolnik')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all rolniks:', error);
    throw error;
  }
};

// Get all clients
export const getAllClients = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'klient')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all clients:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
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
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};