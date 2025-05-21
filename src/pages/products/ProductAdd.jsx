import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { addProduct } from '../../firebase/products.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LoaderCircle, 
  Image as ImageIcon, 
  XCircle, 
  Info,
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

const ProductAdd = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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

  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageUpload = (e) => {
    setImageError('');
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    if (files.length + images.length > 5) {
      setImageError('You can upload maximum 5 images per product');
      return;
    }
    
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setImageError('Some images exceed 5MB size limit');
      return;
    }

    const newImageFiles = [...imageFiles, ...files];
    setImageFiles(newImageFiles);
    
    // Generate previews
    const newImageUrls = files.map(file => URL.createObjectURL(file));
    setImages([...images, ...newImageUrls]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.description || !formData.category || 
        !formData.price || !formData.unit || !formData.stockQuantity) {
      setError('Please fill all required fields');
      return;
    }
    
    if (imageFiles.length === 0) {
      setImageError('Please upload at least one image');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Convert price and quantity to numbers
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        rolnikId: userProfile.uid,
        rolnikName: `${userProfile.firstName} ${userProfile.lastName}`,
        postalCode: userProfile.postalCode,
        createdAt: new Date().toISOString()
      };
      
      console.log('Creating product with data:', productData);
      console.log('Uploading images:', imageFiles.length);
      
      const productId = await addProduct(productData, imageFiles);
      console.log('Product created with ID:', productId);
      
      navigate('/products/manage');
    } catch (err) {
      console.error('Error creating product:', err);
      setError('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold">Add New Product</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Product'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            {imageError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{imageError}</AlertDescription>
              </Alert>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                className="hidden"
              />
              {images.length === 0 ? (
                <div>
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => fileInputRef.current.click()}
                    >
                      Upload Images
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Upload up to 5 images (max 5MB each)
                  </p>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="h-32 w-full object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XCircle size={20} className="text-red-500" />
                        </button>
                      </div>
                    ))}
                    
                    {images.length < 5 && (
                      <div 
                        className="h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-50"
                        onClick={() => fileInputRef.current.click()}
                      >
                        <div className="text-center">
                          <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-500">Add More</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    {images.length} of 5 images uploaded
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-md p-4 flex">
              <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Tips for good product images:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Use good lighting</li>
                  <li>Show the product clearly</li>
                  <li>Include multiple angles</li>
                  <li>Maintain a consistent style</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductAdd;
