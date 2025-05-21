import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllProducts } from '../../firebase/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import ProductCard from '@/components/products/ProductCard';
import { Search, Filter, ShoppingCart, Loader2 } from 'lucide-react';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Get unique categories from products
  const categories = Array.from(new Set(products.map(product => product.category)))
    .filter(Boolean)
    .sort();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        
        const productData = await getAllProducts();
        setProducts(productData);
        setFilteredProducts(productData);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);
  
  // Filter products when search term or category changes
  useEffect(() => {
    let result = [...products];
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        product => 
          product.name.toLowerCase().includes(search) || 
          product.description.toLowerCase().includes(search) ||
          product.rolnikName.toLowerCase().includes(search)
      );
    }
    
    // Filter by category
    if (categoryFilter) {
      result = result.filter(product => product.category === categoryFilter);
    }
    
    setFilteredProducts(result);
  }, [searchTerm, categoryFilter, products]);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleCategoryFilter = (category) => {
    setCategoryFilter(category === categoryFilter ? '' : category);
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Browse Products</h1>
      
      {/* Search and filter */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search products, descriptions, farmers..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          {filteredProducts.length !== products.length && (
            <Button variant="ghost" onClick={clearFilters}>
              Clear Filters ({filteredProducts.length} of {products.length})
            </Button>
          )}
        </div>
        
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={categoryFilter === category ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryFilter(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}
      </div>
      
      {error && (
        <Card className="mb-6">
          <CardContent className="p-4 text-red-500">
            {error}
          </CardContent>
        </Card>
      )}
      
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {products.length > 0 
                ? 'No products match your search criteria' 
                : 'No products available yet.'}
            </p>
            {products.length > 0 && (
              <Button onClick={clearFilters}>Clear Filters</Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductList;