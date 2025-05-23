// src/components/blockchain/ProductGrowthTracker.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../../firebase/products';
import { useBlockchain } from './WalletProvider';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { 
  ArrowLeft, 
  Sprout, 
  Loader2, 
  Camera, 
  Plus,
  Leaf,
  Flower,
  Apple,
  Package
} from 'lucide-react';

const growthStages = [
  { value: 'seeding', label: 'Seeding', icon: Sprout, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'germination', label: 'Germination', icon: Sprout, color: 'bg-green-100 text-green-800' },
  { value: 'growing', label: 'Growing', icon: Leaf, color: 'bg-green-100 text-green-800' },
  { value: 'flowering', label: 'Flowering', icon: Flower, color: 'bg-pink-100 text-pink-800' },
  { value: 'fruiting', label: 'Fruiting', icon: Apple, color: 'bg-red-100 text-red-800' },
  { value: 'harvest', label: 'Harvest', icon: Package, color: 'bg-orange-100 text-orange-800' },
  { value: 'post_harvest', label: 'Post Harvest', icon: Package, color: 'bg-blue-100 text-blue-800' },
];

export const ProductGrowthTracker = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { connected, isInitialized, addGrowthUpdate } = useBlockchain();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [updateData, setUpdateData] = useState({
    stage: 'growing',
    notes: '',
    images: []
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(id);
        setProduct(productData);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!connected || !isInitialized) {
      setError('Please connect your wallet first');
      return;
    }

    if (!updateData.notes.trim()) {
      setError('Please add some notes about this growth update');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const growthData = {
        stage: updateData.stage,
        notes: updateData.notes,
        images: updateData.images,
        blockchainPDA: product.blockchainPDA
      };

      await addGrowthUpdate(id, growthData);
      
      setSuccess('Growth update added successfully to blockchain!');
      setUpdateData({
        stage: 'growing',
        notes: '',
        images: []
      });

    } catch (err) {
      console.error('Failed to add growth update:', err);
      setError(err.message || 'Failed to add growth update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    // In a real implementation, you would upload these to Firebase Storage
    // For now, we'll just store the file names
    const imageNames = files.map(file => file.name);
    setUpdateData(prev => ({
      ...prev,
      images: [...prev.images, ...imageNames]
    }));
  };

  const selectedStage = growthStages.find(stage => stage.value === updateData.stage);
  const StageIcon = selectedStage?.icon || Sprout;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Product not found</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/products/manage')}>
          Back to Products
        </Button>
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
        <h1 className="text-2xl font-bold">Growth Tracking</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Info */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start mb-4">
              <div className="h-20 w-20 overflow-hidden rounded-md border bg-gray-100 mr-4">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    <Package className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.category}</p>
                <div className="flex items-center mt-2 space-x-2">
                  {product.isOrganic && (
                    <Badge className="bg-green-100 text-green-800">
                      <Leaf className="h-3 w-3 mr-1" />
                      Organic
                    </Badge>
                  )}
                  {product.blockchainPDA ? (
                    <Badge className="bg-blue-100 text-blue-800">
                      Blockchain Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      Not on Blockchain
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">{product.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Price</p>
                <p className="font-medium">${product.price?.toFixed(2)} / {product.unit}</p>
              </div>
              <div>
                <p className="text-gray-500">Stock</p>
                <p className="font-medium">{product.stockQuantity} {product.unit}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Growth Update Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <StageIcon className="mr-2 h-5 w-5" />
              Add Growth Update
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Growth Stage</Label>
                <select
                  id="stage"
                  value={updateData.stage}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, stage: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  {growthStages.map(stage => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Update Notes</Label>
                <Textarea
                  id="notes"
                  value={updateData.notes}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Describe the current state of your crop, any observations, treatments applied, etc..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="images">Add Photos (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="images"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="images" className="cursor-pointer">
                    <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload photos
                    </p>
                  </label>
                </div>
                
                {updateData.images.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Selected images:</p>
                    <ul className="text-sm">
                      {updateData.images.map((image, index) => (
                        <li key={index} className="text-gray-500">• {image}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start">
                  <Sprout className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Blockchain Recording</h4>
                    <p className="text-sm text-blue-800">
                      This growth update will be permanently recorded on the Solana blockchain, 
                      providing transparent tracking for your customers.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || !connected || !isInitialized}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording Update...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Growth Update
                  </>
                )}
              </Button>

              {!connected && (
                <Alert>
                  <AlertDescription>
                    Connect your wallet to record growth updates on the blockchain.
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};