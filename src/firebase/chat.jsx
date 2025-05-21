import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from './config.jsx';

// Send a message
export const sendMessage = async (messageData) => {
  await addDoc(collection(db, 'messages'), {
    ...messageData,
    createdAt: new Date().toISOString()
  });
  
  return true;
};

// Get messages for a conversation
export const getMessages = async (conversationId) => {
  const q = query(
    collection(db, 'messages'), 
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Subscribe to messages for a conversation
export const subscribeToMessages = (conversationId, callback) => {
  const q = query(
    collection(db, 'messages'), 
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};

// Create a new conversation
export const createConversation = async (conversationData) => {
  const docRef = await addDoc(collection(db, 'conversations'), {
    ...conversationData,
    createdAt: new Date().toISOString()
  });
  
  return docRef.id;
};

// Get conversations for a user
export const getConversations = async (userId) => {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
