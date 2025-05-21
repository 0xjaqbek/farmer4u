import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';


const ProductList = () => {

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tutaj będzie kod pobierający produkty
    // Na razie ustawmy przykładowe dane
    const dummyProducts = [
      {
        id: '1',
        name: 'Fresh Apples',
        description: 'Delicious organic apples',
        price: 2.99,
        unit: 'kg',
        rolnikName: 'Farm A'
      },
      {
        id: '2',
        name: 'Organic Carrots',
        description: 'Fresh organic carrots',
        price: 1.99,
        unit: 'bunch',
        rolnikName: 'Farm B'
      }
    ];
    
    setProducts(dummyProducts);
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Browse Products</h1>
      
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-gray-600 text-sm">{product.description}</p>
                <div className="mt-2">
                  <p className="font-semibold">${product.price.toFixed(2)} / {product.unit}</p>
                  <p className="text-sm text-gray-500">by {product.rolnikName}</p>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3">
                <Link
                  to={`/products/${product.id}`}
                  className="block w-full text-center py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No products found.</p>
        </div>
      )}
    </div>
  );
};

export default ProductList;