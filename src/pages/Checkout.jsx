import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../firebase/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, CreditCard, Check, ArrowLeft } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    email: userProfile?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: userProfile?.postalCode || '',
    paymentMethod: 'card',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Group items by farmer/rolnik
      const itemsByRolnik = {};
      cartItems.forEach(item => {
        if (!itemsByRolnik[item.rolnikId]) {
          itemsByRolnik[item.rolnikId] = {
            rolnikId: item.rolnikId,
            rolnikName: item.rolnikName,
            items: []
          };
        }
        itemsByRolnik[item.rolnikId].items.push(item);
      });
      
      // Create order for each farmer
      const orderPromises = Object.values(itemsByRolnik).map(async ({ rolnikId, rolnikName, items }) => {
        const orderItems = items.map(item => ({
          productId: item.id,
          productName: item.name,
          productImage: item.image,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit,
          totalPrice: item.price * item.quantity
        }));
        
        const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
        
        const orderData = {
          items: orderItems,
          subtotal,
          totalPrice: subtotal, // In a real app, you'd add taxes, shipping, etc.
          status: 'pending',
          customerInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode
          },
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
          clientId: userProfile.uid,
          clientName: `${formData.firstName} ${formData.lastName}`,
          clientPostalCode: formData.postalCode,
          rolnikId,
          rolnikName
        };
        
        return createOrder(orderData);
      });
      
      await Promise.all(orderPromises);
      
      // Show success and clear cart
      setSuccess(true);
      clearCart();
      
      // Redirect to orders page after a delay
      setTimeout(() => {
        navigate('/orders');
      }, 3000);
      
    } catch (error) {
      console.error('Checkout error:', error);
      setError('Failed to process your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Order Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your order has been successfully placed. You will be redirected to your orders.
              </p>
              <Button asChild>
                <Link to="/orders">View Your Orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (cartItems.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="py-8">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">
                You need to add products to your cart before checkout.
              </p>
              <Button asChild>
                <Link to="/browse">Browse Products</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      className={`border rounded-md p-4 cursor-pointer flex items-center ${
                        formData.paymentMethod === 'card' ? 'border-green-500 bg-green-50' : ''
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'card' }))}
                    >
                      <input
                        type="radio"
                        id="card"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <label htmlFor="card" className="flex items-center cursor-pointer">
                        <CreditCard className="h-5 w-5 mr-2 text-gray-600" />
                        Credit Card
                      </label>
                    </div>
                    <div 
                      className={`border rounded-md p-4 cursor-pointer flex items-center ${
                        formData.paymentMethod === 'cash' ? 'border-green-500 bg-green-50' : ''
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cash' }))}
                    >
                      <input
                        type="radio"
                        id="cash"
                        name="paymentMethod"
                        value="cash"
                        checked={formData.paymentMethod === 'cash'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <label htmlFor="cash" className="flex items-center cursor-pointer">
                        <ShoppingCart className="h-5 w-5 mr-2 text-gray-600" />
                        Cash on Delivery
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any special instructions for delivery"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="ghost" asChild className="text-green-600">
                    <Link to="/cart">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Cart
                    </Link>
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Place Order'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y mb-4">
                {cartItems.map(item => (
                  <li key={item.id} className="py-2 flex justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} x ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Taxes</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;