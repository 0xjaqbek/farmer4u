import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProductById } from '../../firebase/products';
import { createOrder } from '../../firebase/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';

const OrderCreate = () => {
  const { id: productId } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');
        
        const productData = await getProductById(productId);
        if (!productData) {
          throw new Error('Product not found');
        }
        
        setProduct(productData);
        
        // Set initial quantity to 1 (or product max if less than 1)
        setQuantity(Math.min(1, productData.stockQuantity || 0));
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userProfile) {
      setError('User profile not found');
      return;
    }
    
    if (!product) {
      setError('Product not found');
      return;
    }
    
    if (quantity <= 0 || quantity > product.stockQuantity) {
      setError(`Quantity must be between 1 and ${product.stockQuantity}`);
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // Calculate total price
      const totalPrice = product.price * quantity;
      
      // Create order items structure
      const orderItems = [{
        productId: product.id,
        productName: product.name,
        productImage: product.images && product.images.length > 0 ? product.images[0] : null,
        price: product.price,
        unit: product.unit,
        quantity,
        totalPrice: product.price * quantity
      }];
      
      // Create the order
      const orderData = {
        items: orderItems,
        subtotal: totalPrice,
        totalPrice,
        notes: notes || '',
        clientId: userProfile.uid,
        clientName: `${userProfile.firstName} ${userProfile.lastName}`,
        clientPostalCode: userProfile.postalCode,
        rolnikId: product.rolnikId,
        rolnikName: product.rolnikName,
        rolnikPostalCode: product.postalCode,
        customerInfo: {
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          email: userProfile.email,
          postalCode: userProfile.postalCode
        },
        paymentMethod: 'cash'
      };
      
      // Submit order
      await createOrder(orderData);
      
      // Show success toast
      toast({
        title: 'Order Placed',
        description: 'Your order has been successfully placed',
        variant: 'success'
      });
      
      // Redirect to orders page
      navigate('/orders');
    } catch (err) {
      console.error('Place order error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }
  
  if (error && !product) {
    return (
      <div>
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/browse">Back to Products</Link>
        </Button>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div>
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Product not found</AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/browse">Back to Products</Link>
        </Button>
      </div>
    );
  }
  
  // Check if user is a customer
  if (userProfile && userProfile.role !== 'klient') {
    return (
      <div className="p-6 bg-yellow-50 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-2">Insufficient Permissions</h2>
        <p className="mb-4">Only customers can place orders.</p>
        <Button onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-4">
        <Link 
          to={`/products/${productId}`} 
          className="text-green-600 hover:underline flex items-center"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Product
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Place Order - {product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-md border bg-gray-100">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    <Loader2 className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-gray-600">${product.price.toFixed(2)} per {product.unit}</p>
              </div>
            </div>
            
            <div className="mt-3 text-sm">
              <p><span className="font-medium">Farmer:</span> {product.rolnikName}</p>
              <p><span className="font-medium">Location:</span> {product.postalCode}</p>
              <p><span className="font-medium">Available:</span> {product.stockQuantity} {product.unit}</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity ({product.unit})</Label>
              <Input 
                id="quantity" 
                type="number" 
                min="1" 
                max={product.stockQuantity}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                required
              />
              {quantity > product.stockQuantity && (
                <p className="text-sm text-red-500">Maximum available: {product.stockQuantity}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Order Notes (Optional)</Label>
              <Textarea 
                id="notes" 
                rows={3} 
                placeholder="Any special instructions for the farmer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg mb-4">
              <p className="font-medium">Order Summary:</p>
              <div className="flex justify-between mt-2">
                <span>Subtotal:</span>
                <span>${(product.price * quantity).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between mt-1">
                <span>Delivery:</span>
                <span>To be determined</span>
              </div>
              
              <div className="flex justify-between mt-4 pt-2 border-t border-green-200 font-semibold">
                <span>Total:</span>
                <span>${(product.price * quantity).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(`/products/${productId}`)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || quantity <= 0 || quantity > product.stockQuantity}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderCreate;