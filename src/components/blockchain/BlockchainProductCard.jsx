// src/components/blockchain/BlockchainProductCard.jsx - Enhanced Product Card
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBlockchain } from './WalletProvider';
import blockchainService from '../../services/blockchain';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { 
  ShoppingCart, 
  MapPin, 
  Package, 
  Leaf, 
  Blockchain,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import StarRating from '../reviews/StarRating';

export const BlockchainProductCard = ({ product }) => {
  const { connected } = useBlockchain();
  const [blockchainData, setBlockchainData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBlockchainData = async () => {
    if (!product.blockchainPDA || !connected) return;
    
    try {
      setLoading(true);
      const data = await blockchainService.fetchProductCycle(product.blockchainPDA);
      setBlockchainData(data);
    } catch (error) {
      console.error('Failed to fetch blockchain data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatus = () => {
    if (product.blockchainPDA && product.blockchainSynced) {
      return {
        verified: true,
        label: 'Blockchain Verified',
        color: 'bg-green-100 text-green-800'
      };
    }
    return {
      verified: false,
      label: 'Traditional',
      color: 'bg-gray-100 text-gray-800'
    };
  };

  const verification = getVerificationStatus();

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
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
        
        {/* Verification Badge */}
        <div className="absolute top-2 left-2">
          <Badge className={verification.color}>
            {verification.verified && <Blockchain className="h-3 w-3 mr-1" />}
            {verification.label}
          </Badge>
        </div>
        
        {/* Organic Badge */}
        {product.isOrganic && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-100 text-green-800">
              <Leaf className="h-3 w-3 mr-1" />
              Organic
            </Badge>
          </div>
        )}

        {/* Growth Stage Indicator */}
        {blockchainData?.growthUpdates?.length > 0 && (
          <div className="absolute bottom-2 right-2">
            <Badge className="bg-blue-100 text-blue-800">
              <TrendingUp className="h-3 w-3 mr-1" />
              {blockchainData.growthUpdates[blockchainData.growthUpdates.length - 1].stage}
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle>
          <Link 
            to={`/products/${product.id}`} 
            className="hover:text-green-600 transition-colors"
          >
            {product.name}
          </Link>
        </CardTitle>
        
        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-1" />
            {product.postalCode || 'Location unavailable'}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <StarRating rating={product.averageRating || 0} size="small" />
              <span className="text-xs text-gray-500 ml-1">
                ({product.reviewCount || 0})
              </span>
            </div>
            
            {verification.verified && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs p-1 h-6"
                onClick={fetchBlockchainData}
                disabled={loading}
              >
                <Eye className="h-3 w-3 mr-1" />
                Track
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <p className="text-gray-600 line-clamp-2 text-sm mb-3">{product.description}</p>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-green-600">
              ${product.price?.toFixed(2)} / {product.unit}
            </span>
            <span className="text-sm text-gray-500">
              {product.stockQuantity > 0 
                ? `${product.stockQuantity} ${product.unit} available` 
                : 'Out of stock'}
            </span>
          </div>
          
          {/* Blockchain specific info */}
          {verification.verified && blockchainData && (
            <div className="bg-blue-50 p-2 rounded text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">Growth Updates:</span>
                <span>{blockchainData.growthUpdates?.length || 0}</span>
              </div>
              {blockchainData.actualQuantity > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Harvested:</span>
                  <span>{blockchainData.actualQuantity} {product.unit}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <div className="w-full space-y-2">
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
          
          {verification.verified && (
            <Button 
              variant="outline" 
              className="w-full" 
              asChild
              size="sm"
            >
              <Link to={`/track/product/${product.id}`}>
                <Blockchain className="mr-2 h-3 w-3" />
                View Blockchain Data
              </Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};