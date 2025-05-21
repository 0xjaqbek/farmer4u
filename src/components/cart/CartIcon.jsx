import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const CartIcon = () => {
  const { cartItems, cartCount, cartTotal, removeFromCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative" aria-label="Shopping Cart">
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 font-medium border-b">
          {cartCount > 0 ? (
            <span>Your Cart ({cartCount} items)</span>
          ) : (
            <span>Your Cart is Empty</span>
          )}
        </div>

        {cartCount > 0 ? (
          <>
            <div className="max-h-72 overflow-y-auto">
              {cartItems.map(item => (
                <div key={item.id} className="py-2 px-3 border-b last:border-b-0">
                  <div className="flex items-start">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border bg-gray-50 mr-2">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <ShoppingCart className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <span>{item.quantity} x ${item.price.toFixed(2)}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeFromCart(item.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-gray-50">
              <div className="flex justify-between font-medium mb-2">
                <span>Subtotal:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              
              <DropdownMenuSeparator />
              
              <div className="flex justify-between gap-2 mt-2">
                <Button
                  asChild
                  variant="outline"
                  className="w-1/2"
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/cart">View Cart</Link>
                </Button>
                <Button
                  asChild
                  className="w-1/2"
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/checkout">Checkout</Link>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 text-center">
            <p className="text-gray-500 mb-3">Your shopping cart is empty</p>
            <Button
              asChild
              onClick={() => setIsOpen(false)}
            >
              <Link to="/browse">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Browse Products
              </Link>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CartIcon;