// src/components/orders/OrderForm.jsx - Order form for clients
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOrder } from '../../firebase/orders';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const orderSchema = z.object({
  quantity: z.string().min(1, 'Quantity is required'),
  notes: z.string().optional()
});

const OrderForm = ({ product }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      quantity: '1'
    }
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      
      // Calculate total price
      const quantity = parseInt(data.quantity);
      const totalPrice = product.price * quantity;
      
      // Create the order
      await createOrder({
        productId: product.id,
        productName: product.name,
        productImage: product.images[0],
        price: product.price,
        unit: product.unit,
        quantity,
        totalPrice,
        notes: data.notes || '',
        clientId: userProfile.uid,
        clientName: `${userProfile.firstName} ${userProfile.lastName}`,
        clientPostalCode: userProfile.postalCode,
        rolnikId: product.rolnikId,
        rolnikName: product.rolnikName,
        rolnikPostalCode: product.postalCode
      });
      
      toast({
        title: 'Order Placed',
        description: 'Your order has been successfully placed',
        variant: 'success'
      });
      
      // Redirect to orders page
      navigate('/orders');
    } catch (error) {
      console.error('Place order error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (!product) {
    return <div>Loading product...</div>;
  }
  
  return (
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
          <div className="flex items-center mb-4">
            <div className="h-16 w-16 overflow-hidden rounded-md mr-4">
              {product.images && product.images.length > 0 && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-gray-600">${product.price.toFixed(2)} / {product.unit}</p>
            </div>
          </div>
          
          <div className="text-sm">
            <p><span className="font-medium">Farmer:</span> {product.rolnikName}</p>
            <p><span className="font-medium">Location:</span> {product.postalCode}</p>
            <p><span className="font-medium">Available:</span> {product.stockQuantity} {product.unit}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity ({product.unit})</Label>
            <Input 
              id="quantity" 
              type="number" 
              min="1" 
              max={product.stockQuantity}
              {...register('quantity')} 
            />
            {errors.quantity && (
              <p className="text-sm text-red-500">{errors.quantity.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Order Notes (Optional)</Label>
            <Textarea 
              id="notes" 
              rows={3} 
              placeholder="Any special instructions for the farmer..."
              {...register('notes')}
            />
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg mb-4">
            <p className="font-medium">Order Summary:</p>
            <div className="flex justify-between mt-2">
              <span>Subtotal:</span>
              <span>${(product.price * parseInt(document.getElementById('quantity')?.value || 1)).toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate(`/products/${product.id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
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
  );
};

export default OrderForm;