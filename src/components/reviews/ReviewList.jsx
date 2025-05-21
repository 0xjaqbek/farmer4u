import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getProductReviews, deleteReview } from '@/firebase/reviews';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2, AlertCircle } from 'lucide-react';

const ReviewList = ({ productId, productName }) => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  
  const loadReviews = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await getProductReviews(productId);
      setReviews(data);
    } catch (err) {
      console.error('Error loading reviews:', err);
      // Handle permission errors gracefully
      if (err.code === 'permission-denied') {
        setError('Reviews are temporarily unavailable. Please try again later.');
      } else {
        setError('Failed to load reviews. Please try again.');
      }
      // Still set an empty array so UI doesn't break
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadReviews();
  }, [productId]);
  
  const handleEdit = (review) => {
    setEditingReview(review);
  };
  
  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }
    
    try {
      await deleteReview(reviewId);
      loadReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Failed to delete review. Please try again.');
    }
  };
  
  const handleReviewSuccess = () => {
    loadReviews();
    setEditingReview(null);
  };
  
  // Check if current user has already reviewed
  const userReview = currentUser ? reviews.find(review => review.userId === currentUser.uid) : null;
  const canAddReview = currentUser && !userReview && !editingReview;
  
  if (loading && reviews.length === 0) {
    return <div className="text-center py-6">Loading reviews...</div>;
  }
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Customer Reviews</h2>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* User can add a review if not already reviewed */}
      {canAddReview && (
        <div className="mb-6">
          <ReviewForm 
            productId={productId} 
            productName={productName}
            onSuccess={handleReviewSuccess} 
          />
        </div>
      )}
      
      {/* Edit form */}
      {editingReview && (
        <div className="mb-6">
          <ReviewForm 
            productId={productId}
            productName={productName}
            existingReview={editingReview}
            onSuccess={handleReviewSuccess}
          />
          <div className="mt-2 text-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setEditingReview(null)}
            >
              Cancel Editing
            </Button>
          </div>
        </div>
      )}
      
      {/* Reviews list */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map(review => (
            <Card key={review.id} className={userReview?.id === review.id ? 'border-green-200' : ''}>
              <CardContent className="p-4">
                <div className="flex justify-between mb-2">
                  <div className="flex items-center">
                    <StarRating rating={review.rating} />
                    <span className="ml-2 font-medium">{review.userName}</span>
                    {userReview?.id === review.id && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        Your Review
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                <p className="text-gray-700">{review.text}</p>
                
                {/* Edit/Delete buttons for user's own review */}
                {currentUser && currentUser.uid === review.userId && !editingReview && (
                  <div className="flex justify-end mt-2 space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-blue-600"
                      onClick={() => handleEdit(review)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDelete(review.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
            <p className="text-gray-600">
              No reviews yet for this product. Be the first to leave a review!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReviewList;