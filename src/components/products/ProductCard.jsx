// src/components/products/ProductCard.jsx - Product card component
import { Link } from 'react-router-dom';
import { ShoppingCart, MapPin, Package, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import StarRating from '@/components/reviews/StarRating';

const ProductCard = ({ product }) => {
  return (
    <Card className="h-full flex flex-col">
      <div className="relative h-48 overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-300" />
          </div>
        )}
        
        {product.isOrganic && (
          <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Leaf className="h-3 w-3 mr-1" />
            Organic
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle>
          <Link to={`/products/${product.id}`} className="hover:text-green-600 transition-colors">
            {product.name}
          </Link>
        </CardTitle>
        
        <div className="flex flex-col space-y-1">
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-1" />
            {product.postalCode || 'Location unavailable'}
          </div>
          
          <div className="flex items-center">
            <StarRating rating={product.averageRating || 0} size="small" />
            <span className="text-xs text-gray-500 ml-1">
              ({product.reviewCount || 0})
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <p className="text-gray-600 line-clamp-3 text-sm">{product.description}</p>
        <div className="mt-3">
          <p className="text-lg font-semibold text-green-600">
            ${product.price?.toFixed(2)} / {product.unit}
          </p>
          <p className="text-sm text-gray-500">
            {product.stockQuantity > 0 
              ? `${product.stockQuantity} ${product.unit} available` 
              : 'Out of stock'}
          </p>
        </div>
      </CardContent>
      
      <CardFooter>
        <div className="w-full">
          <Button 
            variant="default" 
            className="w-full" 
            asChild
            disabled={product.stockQuantity <= 0}
          >
            <Link to={`/products/${product.id}`}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              View Product
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;