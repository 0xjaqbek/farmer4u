import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { addReview, updateReview } from '@/firebase/reviews';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StarRating from './StarRating';
import { Loader2 } from 'lucide-react';

const ReviewForm = ({ productId, productName, existingReview = null, onSuccess }) => {
  const { currentUser, userProfile } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [text, setText] = useState(existingReview?.text || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const isEditing = !!existingReview;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (!text.trim()) {
      setError('Please enter a review');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const reviewData = {
        productId,
        productName,
        rating,
        text,
        userId: currentUser.uid,
        userName: `${userProfile.firstName} ${userProfile.lastName}`,
        userRole: userProfile.role
      };
      
      if (isEditing) {
        await updateReview(existingReview.id, reviewData);
        setSuccess('Your review has been updated');
      } else {
        await addReview(reviewData);
        setSuccess('Your review has been submitted');
        setText('');
        setRating(0);
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Your Review' : 'Write a Review'}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Rating
            </label>
            <StarRating 
              rating={rating} 
              onChange={setRating} 
              interactive={true}
              size="large" 
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Review
            </label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
              className="w-full"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={loading || !rating}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              isEditing ? 'Update Review' : 'Submit Review'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;