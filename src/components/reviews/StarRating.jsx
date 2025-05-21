import { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating, onChange, interactive = false, size = 'medium' }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizes = {
    small: 'h-3 w-3',
    medium: 'h-5 w-5',
    large: 'h-6 w-6'
  };
  
  const sizeClass = sizes[size] || sizes.medium;
  
  const handleMouseEnter = (index) => {
    if (interactive) {
      setHoverRating(index);
    }
  };
  
  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };
  
  const handleClick = (index) => {
    if (interactive && onChange) {
      onChange(index);
    }
  };
  
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          className={`${sizeClass} ${
            index <= (hoverRating || rating)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          } ${interactive ? 'cursor-pointer' : ''}`}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(index)}
        />
      ))}
    </div>
  );
};

export default StarRating;