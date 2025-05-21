import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProductById } from '../../firebase/products';
import AddToCart from '@/components/cart/AddToCart';
import ReviewList from '@/components/reviews/ReviewList';
import StarRating from '@/components/reviews/StarRating';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MapPin, Leaf } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(id);
        setProduct(productData);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <div>Loading product details...</div>;
  }

  if (!product) {
    return <div>Product not found.</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <Link 
          to="/browse" 
          className="text-green-600 hover:underline flex items-center"
        >
          &larr; Back to Products
        </Link>
      </div>
      
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          <div>
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-auto rounded-lg"
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No image available</p>
              </div>
            )}

            {/* Additional images if available */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {product.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="relative cursor-pointer rounded-md overflow-hidden">
                    <img 
                      src={image} 
                      alt={`${product.name} ${index + 2}`}
                      className="w-full h-20 object-cover" 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <div className="flex items-center mb-2">
              {product.isOrganic && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                  <Leaf className="mr-1 h-3 w-3" />
                  Organic
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {product.category}
              </span>
            </div>

            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            
            <div className="flex items-center mb-4">
              <StarRating rating={product.averageRating || 0} />
              <span className="text-sm text-gray-500 ml-2">
                {product.reviewCount || 0} reviews
              </span>
            </div>
            
            <p className="text-gray-600 mb-4">{product.description}</p>
            
            <div className="mb-4">
              <p className="text-2xl font-bold text-green-600">
                ${product.price.toFixed(2)} / {product.unit}
              </p>
              <p className="text-sm text-gray-500">
                {product.stockQuantity} {product.unit} available
              </p>
            </div>
            
            <div className="mb-4">
              <p className="font-medium flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                {product.rolnikName} • {product.postalCode}
              </p>
            </div>
            
            {userProfile?.role === 'klient' ? (
              <div className="space-y-3">
                <AddToCart product={product} />
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  asChild
                >
                  <Link to={`/products/${product.id}/order`}>
                    Buy Now
                  </Link>
                </Button>
              </div>
            ) : (
              <Card className="bg-gray-50 p-4">
                <p className="text-center text-gray-600">
                  You need a customer account to purchase products.
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Tabs for Details and Reviews */}
        <div className="p-6 border-t">
          <Tabs defaultValue="details" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="details">Product Details</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({product.reviewCount || 0})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-3">About this product</h3>
                  <div className="space-y-4">
                    <p>{product.description}</p>
                    
                    {product.origin && (
                      <div>
                        <p className="font-medium">Origin</p>
                        <p className="text-gray-600">{product.origin}</p>
                      </div>
                    )}
                    
                    {product.isOrganic && (
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="font-medium flex items-center">
                          <Leaf className="h-4 w-4 text-green-600 mr-1" />
                          Organic Product
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          This product is certified organic, grown without synthetic pesticides or fertilizers.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3">Farmer Information</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-semibold">{product.rolnikName}</p>
                    <p className="text-gray-600 mt-1">Location: {product.postalCode}</p>
                    <div className="mt-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/chat/${product.rolnikId}`}>
                          Contact Farmer
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reviews">
              <ReviewList productId={product.id} productName={product.name} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;