// src/components/blockchain/ProductGrowthTracker.jsx
import { useState, useEffect } from 'react';
import React from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useBlockchain } from './WalletProvider';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import blockchainService from '../../services/blockchain';
import { 
  Seedling, 
  Sprout, 
  TreePine, 
  Flower, 
  Apple, 
  Package,
  Loader2,
  Camera,
  Clock,
  Blockchain
} from 'lucide-react';
const growthStages = [
{ id: 'seeding', label: 'Seeding', icon: Seedling, color: 'bg-brown-100 text-brown-800' },
{ id: 'germination', label: 'Germination', icon: Sprout, color: 'bg-green-100 text-green-800' },
{ id: 'growing', label: 'Growing', icon: TreePine, color: 'bg-green-200 text-green-900' },
{ id: 'flowering', label: 'Flowering', icon: Flower, color: 'bg-pink-100 text-pink-800' },
{ id: 'fruiting', label: 'Fruiting', icon: Apple, color: 'bg-red-100 text-red-800' },
{ id: 'harvest', label: 'Harvest', icon: Package, color: 'bg-orange-100 text-orange-800' },
];
export const ProductGrowthTracker = () => {
const { id } = useParams();
const { userProfile } = useAuth();
const { connected, addGrowthUpdate, isLoading: blockchainLoading } = useBlockchain();
const [product, setProduct] = useState(null);
const [growthUpdates, setGrowthUpdates] = useState([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [newUpdate, setNewUpdate] = useState({
stage: '',
notes: '',
images: []
});
useEffect(() => {
fetchProductData();
}, [id]);
const fetchProductData = async () => {
try {
setLoading(true);
  // Pobierz dane produktu
  const productDoc = await getDoc(doc(db, 'products', id));
  if (productDoc.exists()) {
    setProduct(productDoc.data());
  }

  // Pobierz historię wzrostu
  const updatesDoc = await getDoc(doc(db, 'product_growth', id));
  if (updatesDoc.exists()) {
    setGrowthUpdates(updatesDoc.data().updates || []);
  }
  
} catch (error) {
  console.error('Error fetching product data:', error);
} finally {
  setLoading(false);
}
};
const handleImageUpload = (e) => {
const files = Array.from(e.target.files);
// W rzeczywistej aplikacji, przesłałbyś do Firebase Storage
setNewUpdate(prev => ({
...prev,
images: [...prev.images, ...files.map(f => URL.createObjectURL(f))]
}));
};
const addUpdate = async () => {
if (!newUpdate.stage) {
alert('Please select a growth stage');
return;
}
try {
  setSaving(true);
  
  const update = {
    ...newUpdate,
    timestamp: new Date().toISOString(),
    id: `update_${Date.now()}`,
    blockchainSynced: false
  };

  // Zapisz do Firestore
  const updatedGrowthUpdates = [...growthUpdates, update];
  await updateDoc(doc(db, 'product_growth', id), {
    updates: updatedGrowthUpdates
  });

  // Synchronizuj z blockchain (jeśli połączony)
  if (connected && product?.blockchainPDA) {
    try {
      await addGrowthUpdate(id, {
        ...update,
        blockchainPDA: product.blockchainPDA
      });
      
      // Oznacz jako zsynchronizowane
      update.blockchainSynced = true;
      await updateDoc(doc(db, 'product_growth', id), {
        updates: updatedGrowthUpdates.map(u => 
          u.id === update.id ? { ...u, blockchainSynced: true } : u
        )
      });
      
    } catch (blockchainError) {
      console.error('Blockchain sync failed:', blockchainError);
      // Dane są już zapisane w Firestore, blockchain sync może być powtórzony później
    }
  }

  setGrowthUpdates(updatedGrowthUpdates);
  setNewUpdate({ stage: '', notes: '', images: [] });
  
} catch (error) {
  console.error('Error adding growth update:', error);
  alert('Failed to add update');
} finally {
  setSaving(false);
}
};
const updateActualQuantity = async (quantity) => {
try {
await updateDoc(doc(db, 'products', id), {
actualQuantity: quantity,
harvestDate: new Date().toISOString()
});
  // Sync z blockchain jeśli możliwe
  if (connected) {
    try {
      await blockchainService.updateActualQuantity(id, quantity);
    } catch  {
      console.log('Blockchain sync failed, saved locally');
    }
  }

  setProduct(prev => ({ ...prev, actualQuantity: quantity }));
  
} catch (error) {
  console.error('Error updating quantity:', error);
}
};
if (loading) {
return (
<div className="flex items-center justify-center h-48">
<Loader2 className="h-8 w-8 animate-spin" />
</div>
);
}
const getStageInfo = (stageId) => {
return growthStages.find(stage => stage.id === stageId) || growthStages[0];
};
return (
<div className="space-y-6">
<div className="flex justify-between items-center">
<div>
<h1 className="text-2xl font-bold">Growth Tracker</h1>
<p className="text-gray-600">{product?.name}</p>
</div>
    {connected && product?.blockchainPDA && (
      <div className="flex items-center text-green-600 text-sm">
        <Blockchain className="h-4 w-4 mr-1" />
        Blockchain Verified
      </div>
    )}
  </div>

  {/* Current Status */}
  <Card>
    <CardHeader>
      <CardTitle>Current Status</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500">Current Stage</p>
          <div className="flex items-center mt-1">
            {growthUpdates.length > 0 && (
              <>
                {React.createElement(getStageInfo(growthUpdates[growthUpdates.length - 1].stage).icon, { 
                  className: "h-5 w-5 mr-2" 
                })}
                <span className="font-medium">
                  {getStageInfo(growthUpdates[growthUpdates.length - 1].stage).label}
                </span>
              </>
            )}
          </div>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Estimated Quantity</p>
          <p className="font-medium">{product?.stockQuantity} {product?.unit}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Actual Quantity</p>
          <p className="font-medium">
            {product?.actualQuantity || 'Not harvested yet'}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Add New Update */}
  {userProfile?.role === 'rolnik' && userProfile?.uid === product?.rolnikId && (
    <Card>
      <CardHeader>
        <CardTitle>Add Growth Update</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Growth Stage</Label>
            <Select onValueChange={(value) => setNewUpdate(prev => ({ ...prev, stage: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select growth stage" />
              </SelectTrigger>
              <SelectContent>
                {growthStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    <div className="flex items-center">
                      {React.createElement(stage.icon, { className: "h-4 w-4 mr-2" })}
                      {stage.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={newUpdate.notes}
              onChange={(e) => setNewUpdate(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Describe current state, any observations..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Photos</Label>
            <Input
              id="images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
            />
            {newUpdate.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {newUpdate.images.map((image, imgIndex) => (
                  <img
                    key={imgIndex}
                    src={image}
                    alt={`Preview ${imgIndex}`}
                    className="h-20 w-20 object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>

          <Button 
            onClick={addUpdate} 
            disabled={saving || blockchainLoading}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Update...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Add Update
              </>
            )}
          </Button>

          {connected && (
            <div className="text-xs text-center text-gray-500">
              Update will be automatically synchronized with blockchain
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )}

  {/* Growth Timeline */}
  <Card>
    <CardHeader>
      <CardTitle>Growth Timeline</CardTitle>
    </CardHeader>
    <CardContent>
      {growthUpdates.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No growth updates yet. Add the first update to start tracking!
        </p>
      ) : (
        <div className="space-y-4">
          {growthUpdates.reverse().map((update) => {
            const stageInfo = getStageInfo(update.stage);
            const StageIcon = stageInfo.icon;
            
            return (
              <div key={update.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                <div className={`p-2 rounded-full ${stageInfo.color}`}>
                  <StageIcon className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{stageInfo.label}</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(update.timestamp).toLocaleDateString()}
                      </div>
                      
                      {update.blockchainSynced ? (
                        <Badge variant="secondary" className="text-xs">
                          <Blockchain className="h-3 w-3 mr-1" />
                          On-chain
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Local only
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {update.notes && (
                    <p className="text-gray-600 mb-2">{update.notes}</p>
                  )}
                  
                  {update.images && update.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {update.images.map((image, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={image}
                          alt={`Update ${imgIndex}`}
                          className="h-20 w-20 object-cover rounded cursor-pointer hover:opacity-80"
                          onClick={() => window.open(image, '_blank')}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardContent>
  </Card>

  {/* Harvest Update */}
  {userProfile?.role === 'rolnik' && 
   userProfile?.uid === product?.rolnikId && 
   growthUpdates.some(u => u.stage === 'harvest') && 
   !product?.actualQuantity && (
    <Card>
      <CardHeader>
        <CardTitle>Harvest Complete</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600">
            Update the actual harvested quantity for accurate records.
          </p>
          
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="actualQuantity">Actual Quantity Harvested</Label>
              <Input
                id="actualQuantity"
                type="number"
                placeholder={`Expected: ${product?.stockQuantity} ${product?.unit}`}
                onChange={(e) => {
                  const quantity = parseInt(e.target.value);
                  if (quantity > 0) {
                    updateActualQuantity(quantity);
                  }
                }}
              />
            </div>
            <div className="text-sm text-gray-500">
              {product?.unit}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )}
</div>
);
};