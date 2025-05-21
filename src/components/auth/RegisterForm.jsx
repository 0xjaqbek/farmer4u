import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../firebase/auth.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    postalCode: '',
    role: 'klient'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRoleChange = (value) => {
    console.log('Role changed to:', value);
    setFormData(prev => ({ ...prev, role: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Podstawowa walidacja
    if (!formData.firstName) {
      setError('First name is required');
      return;
    }
    
    if (!formData.lastName) {
      setError('Last name is required');
      return;
    }
    
    if (!formData.email) {
      setError('Email is required');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!formData.postalCode) {
      setError('Postal code is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Log all form data before submission
      console.log('Form data before submission:', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        postalCode: formData.postalCode,
        role: formData.role
      });
      
      // Prepare userData object to be more explicit
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        postalCode: formData.postalCode,
        role: formData.role
      };
      
      console.log('Sending userData to registerUser:', userData);
      
      // Rejestracja użytkownika
      const user = await registerUser(formData.email, formData.password, userData);
      
      console.log('Registration successful, user:', user.uid);
      
      // Store data in localStorage as a backup (remove in production)
      localStorage.setItem('userRegistrationData', JSON.stringify({
        uid: user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        postalCode: formData.postalCode,
        role: formData.role
      }));
      
      // Przekierowanie do logowania
      navigate('/login');
    } catch (error) {
      console.error('Registration error in form:', error);
      
      // Wyświetl przyjazny komunikat o błędzie
      if (error.code === 'auth/email-already-in-use') {
        setError('Email is already in use');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else {
        setError(`Registration failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
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
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              value={formData.password}
              onChange={handleChange}
              required 
              minLength={6}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input 
              id="confirmPassword" 
              name="confirmPassword" 
              type="password" 
              value={formData.confirmPassword}
              onChange={handleChange}
              required 
            />
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
          
          <div className="space-y-2">
            <Label htmlFor="role">I am a</Label>
            <Select
              onValueChange={handleRoleChange}
              defaultValue={formData.role}
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="klient">Customer (Klient)</SelectItem>
                <SelectItem value="rolnik">Farmer (Rolnik)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">Current role: {formData.role}</p>
          </div>
          
          {formData.role === 'rolnik' && (
            <div className="p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-600">
                As a Farmer (Rolnik), you'll be able to list your products, manage orders, and connect directly with customers.
              </p>
            </div>
          )}
          
          {formData.role === 'klient' && (
            <div className="p-4 bg-green-50 rounded-md">
              <p className="text-sm text-green-600">
                As a Customer (Klient), you'll be able to browse farmers in your area, order products directly, and track your orders.
              </p>
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </Button>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:underline">
                Login here
              </a>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;
