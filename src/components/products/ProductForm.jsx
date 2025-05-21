// src/components/products/ProductForm.jsx - Product form for farmers
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addProduct } from '../../firebase/products';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.string().min(1, 'Price is required'),
  unit: z.string().min(1, 'Unit is required'),
  category: z.string().min(1, 'Category is required'),
  stockQuantity: z.string().min(1, 'Stock quantity is required')
});

const ProductForm = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(productSchema)
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const handleImageChange = (e) => {
    if (e.target.files) {
      // Convert FileList to array
      const fileArray = Array.from(e.target.files);
      setImages(fileArray);
    }
  };
  
  const onSubmit = async (data) => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Add the product
      await addProduct({
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        unit: data.unit,
        category: data.category,
        stockQuantity: parseInt(data.stockQuantity),
        rolnikId: userProfile.uid,
        rolnikName: `${userProfile.firstName} ${userProfile.lastName}`,
        postalCode: userProfile.postalCode
      }, images);
      
      toast({
        title: 'Product Added',
        description: 'Your product has been successfully added',
        variant: 'success'
      });
      
      // Reset form
      reset();
      setImages([]);
      
      // Redirect to products management
      navigate('/products/manage');
    } catch (error) {
      console.error('Add product error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} {...register('description')} />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" step="0.01" {...register('price')} />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" placeholder="kg, piece, bunch, etc." {...register('unit')} />
              {errors.unit && (
                <p className="text-sm text-red-500">{errors.unit.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" placeholder="Vegetables, Fruits, Dairy, etc." {...register('category')} />
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Stock Quantity</Label>
              <Input id="stockQuantity" type="number" {...register('stockQuantity')} />
              {errors.stockQuantity && (
                <p className="text-sm text-red-500">{errors.stockQuantity.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="images">Product Images</Label>
            <Input 
              id="images" 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleImageChange}
            />
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {images.map((img, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={URL.createObjectURL(img)} 
                      alt={`Preview ${index}`} 
                      className="h-20 w-20 object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate('/products/manage')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Product...
                </>
              ) : (
                'Add Product'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductForm;