import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, updateProduct } from '../../firebase/products.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LoaderCircle,
  ArrowLeft
} from 'lucide-react';

const categories = [
  "Fruits", 
  "Vegetables", 
  "Dairy", 
  "Meat", 
  "Eggs", 
  "Honey", 
  "Grains", 
  "Baked Goods", 
  "Herbs",
  "Preserves",
  "Other"
];

const units = [
  "kg", 
  "g", 
  "L", 
  "mL", 
  "piece", 
  "bunch", 
  "box", 
  "bag", 
  "jar",
  "bottle"
];

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    unit: '',
    stockQuantity: '',
    isOrganic: false,
    origin: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const product = await getProductById(id);
        console.log('Fetched product:', product);
        
        if (product) {
          setFormData({
            name: product.name || '',
            description: product.description || '',
            category: product.category || '',
            price: product.price ? product.price.toString() : '',
            unit: product.unit || '',
            stockQuantity: product.stockQuantity ? product.stockQuantity.toString() : '',
            isOrganic: product.isOrganic || false,
            origin: product.origin || ''
          });
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.description || !formData.category || 
        !formData.price || !formData.unit || !formData.stockQuantity) {
      setError('Please fill all required fields');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      // Convert price and quantity to numbers
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        updatedAt: new Date().toISOString()
      };
      
      console.log('Updating product with data:', productData);
      
      await updateProduct(id, productData);
      console.log('Product updated successfully');
      
      setMessage('Product updated successfully');
      setTimeout(() => {
        navigate('/products/manage');
      }, 1500);
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/products/manage')}
          className="mr-2"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-700">{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Organic Carrots"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your product..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isOrganic">Organic Product</Label>
                <div className="flex items-center h-10">
                  <input
                    type="checkbox"
                    id="isOrganic"
                    name="isOrganic"
                    checked={formData.isOrganic}
                    onChange={handleChange}
                    className="w-5 h-5 text-green-600"
                  />
                  <label htmlFor="isOrganic" className="ml-2">
                    This product is organic
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price per Unit (in $) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select Unit</option>
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Available Quantity *</Label>
                <Input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="origin">Origin Location</Label>
                <Input
                  id="origin"
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  placeholder="e.g. Local Farm, Region"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/products/manage')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductEdit;
