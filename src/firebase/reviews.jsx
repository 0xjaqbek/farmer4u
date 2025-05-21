import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where,
    orderBy,
    doc,
    updateDoc,
    getDoc,
    deleteDoc,
    serverTimestamp
  } from 'firebase/firestore';
  import { db } from './config.jsx';
  
  // Add a new review
  export const addReview = async (reviewData) => {
    try {
      // Add the review to Firestore
      const docRef = await addDoc(collection(db, 'reviews'), {
        ...reviewData,
        createdAt: serverTimestamp()
      });
      
      // Update product's average rating
      await updateProductRatings(reviewData.productId);
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  };
  
  // Get reviews for a product
  export const getProductReviews = async (productId) => {
    try {
      const q = query(
        collection(db, 'reviews'), 
        where('productId', '==', productId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('Error getting product reviews:', error);
      throw error;
    }
  };
  
  // Get reviews by a user
  export const getUserReviews = async (userId) => {
    try {
      const q = query(
        collection(db, 'reviews'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('Error getting user reviews:', error);
      throw error;
    }
  };
  
  // Update a review
  export const updateReview = async (reviewId, updateData) => {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const reviewSnap = await getDoc(reviewRef);
      
      if (!reviewSnap.exists()) {
        throw new Error('Review not found');
      }
      
      await updateDoc(reviewRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      // Update product's average rating
      await updateProductRatings(reviewSnap.data().productId);
      
      return true;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  };
  
  // Delete a review
  export const deleteReview = async (reviewId) => {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const reviewSnap = await getDoc(reviewRef);
      
      if (!reviewSnap.exists()) {
        throw new Error('Review not found');
      }
      
      const productId = reviewSnap.data().productId;
      
      await deleteDoc(reviewRef);
      
      // Update product's average rating
      await updateProductRatings(productId);
      
      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  };
  
  // Helper to update product ratings
  const updateProductRatings = async (productId) => {
    try {
      // Get all reviews for the product
      const q = query(
        collection(db, 'reviews'), 
        where('productId', '==', productId)
      );
      
      const querySnapshot = await getDocs(q);
      const reviews = querySnapshot.docs.map(doc => doc.data());
      
      // Calculate average rating
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
      
      // Update product document
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        averageRating,
        reviewCount: reviews.length
      });
    } catch (error) {
      console.error('Error updating product ratings:', error);
      throw error;
    }
  };