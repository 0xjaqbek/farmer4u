import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  where,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config.jsx';

// Add a new product
export const addProduct = async (productData, images) => {
  // Upload images first and get URLs
  const imageUrls = [];
  
  for (const image of images) {
    const storageRef = ref(storage, `products/${Date.now()}_${image.name}`);
    const snapshot = await uploadBytes(storageRef, image);
    const url = await getDownloadURL(snapshot.ref);
    imageUrls.push(url);
  }
  
  // Add product to Firestore
  const docRef = await addDoc(collection(db, 'products'), {
    ...productData,
    images: imageUrls,
    createdAt: new Date().toISOString(),
    blockchainPDA: "string", // Product PDA address
    blockchainSynced: true,
    lastBlockchainUpdate: "timestamp",
    actualQuantity: 0 // Actual harvested quantity
  });
  
  return docRef.id;
};

// Get products by rolnik ID
export const getProductsByRolnik = async (rolnikId) => {
  const q = query(collection(db, 'products'), where('rolnikId', '==', rolnikId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Get all products
export const getAllProducts = async () => {
  const querySnapshot = await getDocs(collection(db, 'products'));
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Get product by ID
export const getProductById = async (productId) => {
  const docRef = doc(db, 'products', productId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } else {
    throw new Error('Product not found');
  }
};

// Update product
export const updateProduct = async (productId, productData) => {
  const docRef = doc(db, 'products', productId);
  await updateDoc(docRef, {
    ...productData,
    updatedAt: new Date().toISOString()
  });
  
  return true;
};

// Delete product
export const deleteProduct = async (productId) => {
  await deleteDoc(doc(db, 'products', productId));
  return true;
};
