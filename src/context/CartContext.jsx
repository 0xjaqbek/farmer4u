import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const { toast } = useToast();

  // Load cart from localStorage on initial load
  useEffect(() => {
    const savedCart = localStorage.getItem('farmDirectCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
      }
    }
  }, []);

  // Update localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('farmDirectCart', JSON.stringify(cartItems));
    
    // Update cart count and total
    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    setCartCount(itemCount);
    
    const total = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity, 
      0
    );
    setCartTotal(total);
  }, [cartItems]);

  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(
        item => item.id === product.id
      );
      
      if (existingItemIndex > -1) {
        // Update quantity of existing item
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
        
        toast({
          title: 'Cart updated',
          description: `${product.name} quantity updated in cart`,
        });
        
        return updatedItems;
      } else {
        // Add new item
        const newItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          image: product.images && product.images.length > 0 ? product.images[0] : null,
          rolnikId: product.rolnikId,
          rolnikName: product.rolnikName,
          quantity
        };
        
        toast({
          title: 'Added to cart',
          description: `${product.name} added to your cart`,
        });
        
        return [...prevItems, newItem];
      }
    });
  };

  // Update item quantity
  const updateCartItemQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCartItems(prevItems => {
      const itemToRemove = prevItems.find(item => item.id === productId);
      if (itemToRemove) {
        toast({
          title: 'Removed from cart',
          description: `${itemToRemove.name} removed from your cart`,
        });
      }
      
      return prevItems.filter(item => item.id !== productId);
    });
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
    toast({
      title: 'Cart cleared',
      description: 'All items have been removed from your cart',
    });
  };

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};