import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tutaj będzie kod pobierający szczegóły produktu
    // Na razie ustawmy przykładowe dane
    const dummyProduct = {
      id,
      name: 'Fresh Apples',
      description: 'Delicious organic apples grown without pesticides. Our apples are harvested at peak ripeness to ensure the best flavor and nutritional value.',
      price: 2.99,
      unit: 'kg',
      category: 'Fruits',
      stockQuantity: 50,
      rolnikId: 'rolnik1',
      rolnikName: 'Farm A',
      postalCode: '12-345',
      images: ['https://via.placeholder.com/400x300']
    };
    
    setProduct(dummyProduct);
    setLoading(false);
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
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
          </div>
          
          <div>
            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
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
              <p className="font-medium">Farmer:</p>
              <p>{product.rolnikName}</p>
              <p className="text-sm text-gray-500">Location: {product.postalCode}</p>
            </div>
            
            {userProfile?.role === 'klient' && (
              <Link
                to={`/products/${product.id}/order`}
                className="block w-full text-center py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Order Now
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;