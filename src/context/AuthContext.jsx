import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config.jsx';
import { getUserProfile } from '../firebase/auth.jsx';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Funkcja testowa do sprawdzenia, czy Firebase jest dostępny
  useEffect(() => {
    console.log('Testing Firebase connection...');
    try {
      console.log('Auth instance exists:', !!auth);
      console.log('Auth currentUser:', auth.currentUser ? auth.currentUser.uid : 'No user');
    } catch (error) {
      console.error('Firebase Auth test failed:', error);
    }
  }, []);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed. User:', user ? `${user.uid} (${user.email})` : 'No user');
      setCurrentUser(user);
      
      if (user) {
        try {
          console.log('Fetching user profile for uid:', user.uid);
          const profile = await getUserProfile(user.uid);
          console.log('User profile fetched:', profile);
          
          // Check for localStorage backup (only for development)
          const savedData = localStorage.getItem('userRegistrationData');
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (parsedData.uid === user.uid) {
              console.log('Found registration data in localStorage:', parsedData);
              // We could use this as a backup if needed
            }
          }
          
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Create a basic profile with auth info
          const basicProfile = {
            uid: user.uid,
            email: user.email,
            firstName: user.displayName?.split(' ')[0] || 'User',
            lastName: user.displayName?.split(' ')[1] || '',
            role: 'klient', // Default role
            postalCode: '00-000'
          };
          console.log('Using basic profile:', basicProfile);
          setUserProfile(basicProfile);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    refreshUserProfile: async () => {
      if (currentUser) {
        try {
          console.log('Manually refreshing user profile...');
          const profile = await getUserProfile(currentUser.uid);
          console.log('Refreshed profile:', profile);
          setUserProfile(profile);
          return profile;
        } catch (error) {
          console.error('Error refreshing user profile:', error);
          return null;
        }
      }
      return null;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
