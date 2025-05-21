import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Trash2, ArrowRight, Plus, Minus, ArrowLeft } from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, updateCartItemQuantity, removeFromCart, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuantityChange = (productId, quantity) => {
    updateCartItemQuantity(productId, quantity);
  };

  const handleCheckout = () => {
    setIsProcessing(true);
    // In a real app you might want to validate cart, check inventory, etc.
    setTimeout(() => {
      navigate('/checkout');
    }, 500);
  };

  if (cartItems.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="py-8">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">
                Looks like you haven't added any products to your cart yet.
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
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Cart Items ({cartItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {cartItems.map((item) => (
                  <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100 mr-4">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <ShoppingCart className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500">${item.price.toFixed(2)} per {item.unit}</p>
                        <p className="text-sm text-gray-500">From: {item.rolnikName}</p>
                      </div>
                      <div className="flex items-center ml-4">
                        <div className="flex items-center border border-gray-300 rounded-md mr-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            min="1"
                            className="w-12 h-8 text-center border-0 focus-visible:ring-0"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-1 text-red-500 hover:text-red-700"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            <span className="text-xs">Remove</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex justify-between mt-6 pt-6 border-t">
                <Button variant="ghost" asChild className="text-green-600">
                  <Link to="/browse">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Continue Shopping
                  </Link>
                </Button>
                <Button variant="outline" onClick={clearCart} className="text-red-500">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Taxes</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                  {!isProcessing && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;