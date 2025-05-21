// src/components/products/ProductCard.jsx - Product card component
import { Link } from 'react-router-dom';
import { ShoppingCart, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const ProductCard = ({ product }) => {
  return (
    <Card className="h-full flex flex-col">
      <div className="relative h-48 overflow-hidden">
        {product.images && product.images.length > 0 && (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle>
          <Link to={`/products/${product.id}`} className="hover:text-green-600 transition-colors">
            {product.name}
          </Link>
        </CardTitle>
        <div className="flex items-center text-sm text-gray-500">
          <MapPin className="h-4 w-4 mr-1" />
          {product.postalCode}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-gray-600 line-clamp-3">{product.description}</p>
        <div className="mt-3">
          <p className="text-lg font-semibold text-green-600">
            ${product.price.toFixed(2)} / {product.unit}
          </p>
          <p className="text-sm text-gray-500">
            {product.stockQuantity} {product.unit} available
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full">
          <Button variant="default" className="w-full" asChild>
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