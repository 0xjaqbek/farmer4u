import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './config.jsx';

// Register a new user
export const registerUser = async (email, password, userData) => {
  console.log('Starting registration process with userData:', userData);
  console.log('Email:', email);
  console.log('Password length:', password ? password.length : 0);
  
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('User created successfully in Firebase Auth:', user.uid);
    
    // Update display name
    await updateProfile(user, {
      displayName: `${userData.firstName} ${userData.lastName}`
    });
    console.log('Display name updated to:', `${userData.firstName} ${userData.lastName}`);
    
    // Create user profile in Firestore
    const userProfile = {
      uid: user.uid,
      email: user.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      postalCode: userData.postalCode,
      role: userData.role, // 'klient', 'rolnik', or 'admin'
      createdAt: new Date().toISOString(),
      blockchainProfilePDA: "string", // Solana PDA address
      blockchainSynced: true,
      lastBlockchainUpdate: "timestamp",
      walletAddress: "string" // Optional: user's wallet address
    };
    
    console.log('Attempting to save user profile to Firestore:', userProfile);
    
    try {
      await setDoc(doc(db, 'users', user.uid), userProfile);
      console.log('User profile created in Firestore successfully');
    } catch (firestoreError) {
      console.error('Failed to create user profile in Firestore:', firestoreError);
      console.error('Firestore error code:', firestoreError.code);
      console.error('Firestore error message:', firestoreError.message);
      // Continue anyway for now, so user can at least log in
    }
    
    return user;
  } catch (error) {
    console.error('Registration error:', error.code, error.message);
    throw error;
  }
};

// Login user
export const loginUser = async (email, password) => {
  console.log('Attempting login with email:', email);
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Login successful for uid:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error.code, error.message);
    throw error;
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('User logged out successfully');
  } catch (error) {
    console.error('Logout error:', error.code, error.message);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (uid) => {
  console.log('Getting user profile for uid:', uid);
  
  try {
    const userDocRef = doc(db, 'users', uid);
    console.log('Firestore document reference created');
    
    const userDoc = await getDoc(userDocRef);
    console.log('Firestore getDoc completed. Document exists:', userDoc.exists());
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('User profile retrieved from Firestore:', userData);
      return userData;
    } else {
      console.warn('User profile not found in Firestore, using fallback data');
      
      // Get auth user data as fallback
      const authUser = auth.currentUser;
      console.log('Current auth user:', authUser ? authUser.uid : 'No user');
      
      // Fallback data
      const fallbackData = {
        uid: uid,
        email: authUser?.email || '',
        firstName: authUser?.displayName?.split(' ')[0] || 'User',
        lastName: authUser?.displayName?.split(' ')[1] || '',
        role: 'klient', // Default role
        postalCode: '00-000'
      };
      
      console.log('Using fallback profile data:', fallbackData);
      
      // Try to save this fallback data to Firestore
      try {
        await setDoc(doc(db, 'users', uid), {
          ...fallbackData,
          createdAt: new Date().toISOString()
        });
        console.log('Fallback user profile saved to Firestore');
      } catch (setError) {
        console.error('Error saving fallback profile to Firestore:', setError);
      }
      
      return fallbackData;
    }
  } catch (error) {
    console.error('Error getting user profile:', error.code, error.message);
    
    // Fallback data
    const fallbackData = {
      uid: uid,
      email: auth.currentUser?.email || '',
      firstName: auth.currentUser?.displayName?.split(' ')[0] || 'User',
      lastName: auth.currentUser?.displayName?.split(' ')[1] || '',
      role: 'klient', // Default role
      postalCode: '00-000'
    };
    
    console.log('Using error fallback profile data:', fallbackData);
    return fallbackData;
  }
};

// Update user profile
export const updateUserProfile = async (uid, userData) => {
  console.log('Updating user profile for uid:', uid);
  console.log('Update data:', userData);
  
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      ...userData,
      updatedAt: new Date().toISOString()
    });
    console.log('User profile updated successfully');
    return true;
  } catch (error) {
    console.error('Update user profile error:', error.code, error.message);
    throw error;
  }
};
