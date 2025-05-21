import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, updateProduct } from '../../firebase/products.jsx';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Image as ImageIcon, 
  XCircle, 
  ArrowLeft, 
  LoaderCircle,
  Info,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const ProductImages = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(id);
        console.log('Fetched product:', productData);
        
        setProduct(productData);
        setImages(productData.images || []);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product images. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleImageUpload = (e) => {
    setError('');
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    if (files.length + images.length + newImagePreviews.length > 5) {
      setError('You can upload maximum 5 images per product');
      return;
    }
    
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Some images exceed 5MB size limit');
      return;
    }

    // Add to new image files array
    setNewImageFiles([...newImageFiles, ...files]);
    
    // Generate previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setNewImagePreviews([...newImagePreviews, ...newPreviews]);
  };

  const removeExistingImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
    setNewImageFiles(newImageFiles.filter((_, i) => i !== index));
  };

  const moveImageUp = (index, isExisting = true) => {
    if (index === 0) return;
    
    if (isExisting) {
      const newImages = [...images];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      setImages(newImages);
    } else {
      const newPreviews = [...newImagePreviews];
      const newFiles = [...newImageFiles];
      
      [newPreviews[index - 1], newPreviews[index]] = [newPreviews[index], newPreviews[index - 1]];
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      
      setNewImagePreviews(newPreviews);
      setNewImageFiles(newFiles);
    }
  };

  const moveImageDown = (index, isExisting = true) => {
    if (isExisting && index === images.length - 1) return;
    if (!isExisting && index === newImagePreviews.length - 1) return;
    
    if (isExisting) {
      const newImages = [...images];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      setImages(newImages);
    } else {
      const newPreviews = [...newImagePreviews];
      const newFiles = [...newImageFiles];
      
      [newPreviews[index], newPreviews[index + 1]] = [newPreviews[index + 1], newPreviews[index]];
      [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
      
      setNewImagePreviews(newPreviews);
      setNewImageFiles(newFiles);
    }
  };

  const handleSaveImages = async () => {
    if (images.length + newImageFiles.length === 0) {
      setError('A product must have at least one image');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      // Upload new images
      const uploadPromises = newImageFiles.map(file => {
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        return uploadBytes(storageRef).then(snapshot => getDownloadURL(snapshot.ref));
      });
      
      const newImageUrls = await Promise.all(uploadPromises);
      console.log('Uploaded new images:', newImageUrls);
      
      // Combine existing and new images
      const updatedImages = [...images, ...newImageUrls];
      
      // Update product in Firestore
      await updateProduct(id, {
        images: updatedImages,
        updatedAt: new Date().toISOString()
      });
      
      setMessage('Product images updated successfully');
      
      // Reset state
      setNewImageFiles([]);
      setNewImagePreviews([]);
      setImages(updatedImages);
      
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error saving images:', err);
      setError('Failed to update product images. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product images...</p>
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
        <h1 className="text-2xl font-bold">Manage Product Images</h1>
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Product: {product?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Current Images</h3>
            
            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="h-40 w-full object-cover rounded-md"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-md"></div>
                    <div className="absolute top-2 right-2 flex flex-col space-y-1">
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XCircle size={20} className="text-red-500" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 right-2 flex flex-col space-y-1">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImageUp(index)}
                          className="bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ArrowUp size={16} className="text-gray-700" />
                        </button>
                      )}
                      {index < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveImageDown(index)}
                          className="bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ArrowDown size={16} className="text-gray-700" />
                        </button>
                      )}
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {index === 0 ? 'Main Image' : `Image ${index + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No images currently available for this product.</p>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Add New Images</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                className="hidden"
              />
              
              {newImagePreviews.length > 0 ? (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                    {newImagePreviews.map((image, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <img
                          src={image}
                          alt={`New image ${index + 1}`}
                          className="h-40 w-full object-cover rounded-md"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-md"></div>
                        <div className="absolute top-2 right-2">
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XCircle size={20} className="text-red-500" />
                          </button>
                        </div>
                        <div className="absolute bottom-2 right-2 flex flex-col space-y-1">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => moveImageUp(index, false)}
                              className="bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ArrowUp size={16} className="text-gray-700" />
                            </button>
                          )}
                          {index < newImagePreviews.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveImageDown(index, false)}
                              className="bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ArrowDown size={16} className="text-gray-700" />
                            </button>
                          )}
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          New Image {index + 1}
                        </div>
                      </div>
                    ))}
                    
                    {images.length + newImagePreviews.length < 5 && (
                      <div 
                        className="h-40 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-50"
                        onClick={() => fileInputRef.current.click()}
                      >
                        <div className="text-center">
                          <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-500">Add More</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    {images.length === 0 
                      ? "Your product doesn't have any images yet. Add some now!" 
                      : `You have ${images.length} of 5 possible images.`}
                  </p>
                  <div className="mt-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => fileInputRef.current.click()}
                      disabled={images.length >= 5}
                    >
                      Upload Images
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Upload up to {5 - images.length} more images (max 5MB each)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 rounded-md p-4 flex mb-6">
            <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Important notes:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>The first image will be displayed as the main product image</li>
                <li>You can reorder images by using the up/down arrows</li>
                <li>Changes will only be saved when you click the "Save Changes" button</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/products/manage')}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveImages} 
              disabled={saving || (newImageFiles.length === 0 && images.length === 0)}
            >
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductImages;
