import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../firebase/auth.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      console.log('Login form submitted with:', { email });
      
      // Próba logowania
      const user = await loginUser(email, password);
      console.log('Login successful, user:', user.uid);
      
      // Przekierowanie do panelu
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error in form:', error);
      
      // Wyświetl przyjazny komunikat o błędzie
      if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (error.code === 'auth/user-not-found') {
        setError('User not found');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else {
        setError(`Login failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/register" className="text-blue-600 hover:underline">
                Register here
              </a>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
