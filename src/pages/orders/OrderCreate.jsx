import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const OrderCreate = () => {
  const { id: productId } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Here we'll fetch the product details
    // For now, just set dummy data
    setProduct({
      id: productId,
      name: 'Fresh Apples',
      description: 'Delicious organic apples',
      price: 2.99,
      unit: 'kg',
      stockQuantity: 50,
      rolnikId: 'rolnik1',
      rolnikName: 'Farm Fresh',
      images: ['https://via.placeholder.com/200']
    });
    setLoading(false);
  }, [productId]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!userProfile) {
      console.error('User profile not found');
      return;
    }
    
    // Tworzymy dane zamówienia z użyciem userProfile
    const orderData = {
      productId,
      productName: product.name,
      productImage: product.images[0],
      quantity: parseInt(quantity),
      unit: product.unit,
      price: product.price,
      totalPrice: product.price * parseInt(quantity),
      notes,
      clientId: userProfile.uid,
      clientName: `${userProfile.firstName} ${userProfile.lastName}`,
      clientPostalCode: userProfile.postalCode,
      rolnikId: product.rolnikId,
      rolnikName: product.rolnikName
    };
    
    console.log('Creating order:', orderData);
    
    // Here we'll create the order
    // For now, just redirect to orders page
    navigate('/orders');
  };
  
  if (loading) {
    return <div>Loading product details...</div>;
  }
  
  if (!product) {
    return <div>Product not found.</div>;
  }
  
  // Weryfikacja, czy użytkownik ma rolę klienta
  if (userProfile && userProfile.role !== 'klient') {
    return (
      <div className="p-6 bg-yellow-50 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-2">Niewystarczające uprawnienia</h2>
        <p className="mb-4">Tylko klienci mogą składać zamówienia.</p>
        <Button onClick={() => navigate('/dashboard')}>
          Powrót do Panelu
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
          &larr; Back to Product
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Place Order - {product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-md">
                {product.images && product.images.length > 0 && (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-gray-600">${product.price.toFixed(2)} / {product.unit}</p>
              </div>
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
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                required
              />
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
              {userProfile && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Delivery to: {userProfile.postalCode}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(`/products/${productId}`)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Place Order
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderCreate;
