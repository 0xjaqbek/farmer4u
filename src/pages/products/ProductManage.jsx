import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProductsByRolnik, deleteProduct } from '../../firebase/products.jsx';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { 
  CirclePlus, 
  Edit, 
  Trash2, 
  QrCode, 
  ImagePlus, 
  ClipboardCheck,
  BarChart 
} from 'lucide-react';

const ProductManage = () => {
  const { userProfile } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      if (!userProfile) return;

      try {
        setLoading(true);
        setError('');
        
        console.log('Fetching products for rolnik:', userProfile.uid);
        const fetchedProducts = await getProductsByRolnik(userProfile.uid);
        console.log('Fetched products:', fetchedProducts);
        
        setProducts(fetchedProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [userProfile]);

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await deleteProduct(productId);
      setProducts(products.filter(product => product.id !== productId));
      setMessage('Product deleted successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your products...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Your Products</h1>
        <Button onClick={() => navigate('/products/add')} className="flex items-center gap-2">
          <CirclePlus size={18} />
          Add New Product
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertDescription className="text-green-700">{message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Products ({products.length})</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="outofstock">Out of Stock</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="pt-4">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onDelete={handleDeleteProduct}
                  onEdit={() => navigate(`/products/edit/${product.id}`)}
                  onAddImages={() => navigate(`/products/images/${product.id}`)}
                  onViewQR={() => navigate(`/products/qr/${product.id}`)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-4 text-gray-400">
                  <CirclePlus size={48} className="mx-auto" />
                </div>
                <p className="text-gray-500 mb-4">You haven't added any products yet.</p>
                <Button onClick={() => navigate('/products/add')}>Add Your First Product</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="active" className="pt-4">
          {products.filter(p => p.stockQuantity > 0).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products
                .filter(p => p.stockQuantity > 0)
                .map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onDelete={handleDeleteProduct}
                    onEdit={() => navigate(`/products/edit/${product.id}`)}
                    onAddImages={() => navigate(`/products/images/${product.id}`)}
                    onViewQR={() => navigate(`/products/qr/${product.id}`)}
                  />
                ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No active products found.</p>
          )}
        </TabsContent>
        
        <TabsContent value="outofstock" className="pt-4">
          {products.filter(p => p.stockQuantity <= 0).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products
                .filter(p => p.stockQuantity <= 0)
                .map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onDelete={handleDeleteProduct}
                    onEdit={() => navigate(`/products/edit/${product.id}`)}
                    onAddImages={() => navigate(`/products/images/${product.id}`)}
                    onViewQR={() => navigate(`/products/qr/${product.id}`)}
                  />
                ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No out of stock products found.</p>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Product Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center">
              <div className="bg-blue-50 p-3 rounded-full mr-4">
                <BarChart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-gray-500">Total Products</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center">
              <div className="bg-green-50 p-3 rounded-full mr-4">
                <ClipboardCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.filter(p => p.stockQuantity > 0).length}</p>
                <p className="text-sm text-gray-500">In Stock</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center">
              <div className="bg-red-50 p-3 rounded-full mr-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.filter(p => p.stockQuantity <= 0).length}</p>
                <p className="text-sm text-gray-500">Out of Stock</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ProductCard component for displaying each product
const ProductCard = ({ product, onDelete, onEdit, onAddImages, onViewQR }) => {
  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="h-48 overflow-hidden bg-gray-100 relative">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No image</p>
          </div>
        )}
        
        <div className="absolute top-2 right-2 flex space-x-1">
          <Button 
            variant="outline" 
            size="icon" 
            className="bg-white rounded-full h-8 w-8"
            onClick={() => onAddImages()}
          >
            <ImagePlus size={16} />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4 flex-grow">
        <div className="mb-3">
          <h3 className="font-semibold text-lg">{product.name}</h3>
          <p className="text-sm text-gray-500">{product.category}</p>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
        
        <div className="flex justify-between items-baseline">
          <div className="text-green-600 font-medium">
            ${product.price?.toFixed(2)} / {product.unit}
          </div>
          <div className={`text-sm ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
          </div>
        </div>
      </CardContent>
      
      <div className="border-t p-3 grid grid-cols-3 gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit()}>
          <Edit size={16} className="mr-1" /> Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onViewQR()}>
          <QrCode size={16} className="mr-1" /> QR
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(product.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <Trash2 size={16} className="mr-1" /> Delete
        </Button>
      </div>
    </Card>
  );
};

export default ProductManage;
