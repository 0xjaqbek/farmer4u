import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateUserProfile } from '../firebase/auth.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Profile = () => {
  const { userProfile, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    postalCode: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (userProfile) {
      console.log('Profile component loaded with userProfile:', userProfile);
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        postalCode: userProfile.postalCode || '',
      });
      setLoading(false);
    }
  }, [userProfile]);

  const handleRefreshProfile = async () => {
    setMessage({ type: 'info', text: 'Refreshing profile...' });
    const refreshedProfile = await refreshUserProfile();
    if (refreshedProfile) {
      setFormData({
        firstName: refreshedProfile.firstName || '',
        lastName: refreshedProfile.lastName || '',
        postalCode: refreshedProfile.postalCode || '',
      });
      setMessage({ type: 'success', text: 'Profile refreshed successfully' });
    } else {
      setMessage({ type: 'error', text: 'Failed to refresh profile' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setMessage({ type: 'info', text: 'Updating profile...' });
      await updateUserProfile(userProfile.uid, formData);
      
      // Refresh profile to get updated data
      await refreshUserProfile();
      
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: `Error updating profile: ${error.message}` });
    }
    
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      {message.text && (
        <Alert 
          variant={message.type === 'error' ? 'destructive' : message.type === 'success' ? 'default' : 'outline'} 
          className="mb-4"
        >
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Information</CardTitle>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={handleRefreshProfile}
              size="sm"
            >
              Refresh
            </Button>
            <Button 
              variant={editing ? "outline" : "default"} 
              onClick={() => setEditing(!editing)}
              size="sm"
            >
              {editing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    name="firstName" 
                    value={formData.firstName}
                    onChange={handleChange}
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    name="lastName" 
                    value={formData.lastName}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input 
                  id="postalCode" 
                  name="postalCode" 
                  value={formData.postalCode}
                  onChange={handleChange}
                  required 
                />
              </div>
              
              <div className="flex justify-end">
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">First Name</p>
                  <p className="font-medium">{userProfile?.firstName || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Name</p>
                  <p className="font-medium">{userProfile?.lastName || 'Not set'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{userProfile?.email || 'Not set'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium capitalize">
                  {userProfile?.role === 'rolnik' ? 'Farmer (Rolnik)' : 
                   userProfile?.role === 'klient' ? 'Customer (Klient)' : 
                   userProfile?.role || 'Not set'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Postal Code</p>
                <p className="font-medium">{userProfile?.postalCode || 'Not set'}</p>
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Debug info:</strong> User ID: {userProfile?.uid || 'Not available'}
                </p>
                {userProfile && (
                  <pre className="mt-2 text-xs text-gray-500 overflow-auto max-h-32">
                    {JSON.stringify(userProfile, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
