import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './config.jsx';

// Send a message
export const sendMessage = async (conversationId, messageData) => {
  try {
    // Add message
    const docRef = await addDoc(collection(db, 'messages'), {
      ...messageData,
      conversationId,
      createdAt: serverTimestamp()
    });

    // Confirm conversation exists before updating
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      await updateDoc(conversationRef, {
        lastMessage: messageData.text,
        lastMessageSenderId: messageData.senderId,
        updatedAt: serverTimestamp()
      });
    } else {
      console.warn('Conversation document not found during sendMessage, skipping update.');
    }

    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Get messages for a conversation
export const getMessages = async (conversationId, messageLimit = 50) => {
  try {
    // Query without orderBy to avoid composite index requirement
    const q = query(
      collection(db, 'messages'), 
      where('conversationId', '==', conversationId)
    );
    
    const querySnapshot = await getDocs(q);
    
    const messages = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    });
    
    // Sort by createdAt in JavaScript
    messages.sort((a, b) => a.createdAt - b.createdAt);
    
    // Apply limit if needed
    return messageLimit ? messages.slice(0, messageLimit) : messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

// Subscribe to messages for a conversation
export const subscribeToMessages = (conversationId, callback) => {
  try {
    // Query without orderBy to avoid composite index requirement
    const q = query(
      collection(db, 'messages'), 
      where('conversationId', '==', conversationId)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
      
      // Sort by createdAt in JavaScript instead
      messages.sort((a, b) => a.createdAt - b.createdAt);
      
      callback(messages);
    });
  } catch (error) {
    console.error('Error subscribing to messages:', error);
    throw error;
  }
};

// Create a new conversation or get existing one
export const getOrCreateConversation = async (participants) => {
  try {
    // Check if conversation already exists between these users
    const participant1 = participants[0];
    const participant2 = participants[1];
    
    // Query for conversation where both users are participants
    const q1 = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', participant1.uid)
    );
    
    const querySnapshot = await getDocs(q1);
    
    // Find a conversation that includes the second participant
    const existingConversation = querySnapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(participant2.uid);
    });
    
    if (existingConversation) {
      return {
        id: existingConversation.id,
        ...existingConversation.data()
      };
    }
    
    // If no existing conversation, create a new one
    const conversationData = {
      participants: [participant1.uid, participant2.uid],
      participantsInfo: [
        {
          uid: participant1.uid,
          name: `${participant1.firstName} ${participant1.lastName}`,
          role: participant1.role
        },
        {
          uid: participant2.uid,
          name: `${participant2.firstName} ${participant2.lastName}`,
          role: participant2.role
        }
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: '',
      lastMessageSenderId: ''
    };
    
    const docRef = await addDoc(collection(db, 'conversations'), conversationData);
    
    return {
      id: docRef.id,
      ...conversationData
    };
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

// Get conversations for a user
export const getConversations = async (userId) => {
  try {
    // Query without orderBy to avoid requiring a composite index
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Map the data and convert timestamps
    const conversations = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date()
      };
    });
    
    // Sort by updatedAt in JavaScript instead of in the query
    return conversations.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw error;
  }
};

// Subscribe to conversations for a user
export const subscribeToConversations = (userId, callback) => {
  try {
    // Version without ordering (no composite index needed)
    // We'll sort the results in JavaScript instead
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const conversations = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          updatedAt: data.updatedAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
      
      // Sort by updatedAt in descending order in JavaScript
      conversations.sort((a, b) => b.updatedAt - a.updatedAt);
      
      callback(conversations);
    });
  } catch (error) {
    console.error('Error subscribing to conversations:', error);
    throw error;
  }
};

// Get conversation by ID
export const getConversationById = async (conversationId) => {
  try {
    // Try to get the conversation by ID
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      const data = conversationSnap.data();
      return {
        id: conversationSnap.id,
        ...data,
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date()
      };
    }

    // If conversation doesn't exist, check if it's a user ID
    const userRef = doc(db, 'users', conversationId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in to start a conversation');
      }

      const currentUserRef = doc(db, 'users', currentUser.uid);
      const currentUserSnap = await getDoc(currentUserRef);

      if (!currentUserSnap.exists()) {
        throw new Error('Current user profile not found');
      }

      const currentUserData = currentUserSnap.data();
      const otherUserData = userSnap.data();

      const conversationData = {
        participants: [currentUser.uid, conversationId],
        participantsInfo: [
          {
            uid: currentUser.uid,
            name: `${currentUserData.firstName || ''} ${currentUserData.lastName || ''}`.trim(),
            role: currentUserData.role || 'user'
          },
          {
            uid: conversationId,
            name: `${otherUserData.firstName || ''} ${otherUserData.lastName || ''}`.trim(),
            role: otherUserData.role || 'user'
          }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: '',
        lastMessageSenderId: ''
      };

      const newConversationRef = await addDoc(collection(db, 'conversations'), conversationData);

      return {
        id: newConversationRef.id,
        ...conversationData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // Neither a conversation nor a user ID
    throw new Error('Conversation not found');
  } catch (error) {
    console.error('Error getting or creating conversation:', error);
    throw error;
  }
};

// Mark conversation as read
export const markConversationAsRead = async (conversationId, userId) => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const snap = await getDoc(conversationRef);

    if (!snap.exists()) {
      console.warn('Conversation does not exist yet, skipping read mark');
      return;
    }

    await updateDoc(conversationRef, {
      [`readBy.${userId}`]: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    throw error;
  }
};