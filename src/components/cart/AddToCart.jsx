import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

const AddToCart = ({ product, showQuantity = true }) => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    setLoading(true);
    addToCart(product, quantity);
    setLoading(false);
  };

  const incrementQuantity = () => {
    if (quantity < product.stockQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= product.stockQuantity) {
      setQuantity(value);
    }
  };

  if (product.stockQuantity <= 0) {
    return (
      <Button variant="outline" disabled className="w-full opacity-60">
        Out of Stock
      </Button>
    );
  }

  return (
    <div>
      {showQuantity && (
        <div className="flex items-center mb-4">
          <span className="mr-2 text-sm font-medium">Quantity:</span>
          <div className="flex items-center border border-gray-300 rounded-md">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={decrementQuantity}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              min="1"
              max={product.stockQuantity}
              className="w-16 h-9 text-center border-0 focus-visible:ring-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={incrementQuantity}
              disabled={quantity >= product.stockQuantity}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <span className="ml-2 text-sm text-gray-500">
            {product.stockQuantity} {product.unit} available
          </span>
        </div>
      )}

      <Button
        type="button"
        className="w-full"
        onClick={handleAddToCart}
        disabled={loading || product.stockQuantity <= 0}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Add to Cart
      </Button>
    </div>
  );
};

export default AddToCart;