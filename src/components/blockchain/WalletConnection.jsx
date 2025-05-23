// src/components/blockchain/WalletConnection.jsx
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '../../context/AuthContext';
import { useBlockchain } from './WalletProvider';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Coins,
  User,
  Shield
} from 'lucide-react';

export const WalletConnection = () => {
  const { connected, publicKey } = useWallet();
  const { userProfile } = useAuth();
  const { 
    isInitialized, 
    isLoading, 
    error, 
    farmerProfile, 
    initializeFarmerProfile,
    getBalance
  } = useBlockchain();
  
  const [balance, setBalance] = useState(0);
  const [initializingProfile, setInitializingProfile] = useState(false);

  const isRolnik = userProfile?.role === 'rolnik';

  // Load wallet balance when connected
  useEffect(() => {
    const loadBalance = async () => {
      if (connected && isInitialized) {
        try {
          const walletBalance = await getBalance();
          setBalance(walletBalance);
        } catch (err) {
          console.error('Failed to load balance:', err);
        }
      }
    };

    loadBalance();
  }, [connected, isInitialized, getBalance]);

  // Handle farmer profile initialization
  const handleInitializeProfile = async () => {
    setInitializingProfile(true);
    
    try {
      const result = await initializeFarmerProfile();
      console.log('Profile initialized:', result);
    } catch (err) {
      console.error('Failed to initialize profile:', err);
    } finally {
      setInitializingProfile(false);
    }
  };

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Connect Your Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Connect your Solana wallet to access blockchain features and transparency tools.
            </p>
            
            <div className="flex justify-center">
              <WalletMultiButton className="!bg-green-600 hover:!bg-green-700" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-medium">Secure</h3>
                <p className="text-sm text-gray-600">
                  Your wallet stays secure with you
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-medium">Transparent</h3>
                <p className="text-sm text-gray-600">
                  All transactions on blockchain
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Coins className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-medium">Low Cost</h3>
                <p className="text-sm text-gray-600">
                  Minimal transaction fees
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Wallet className="mr-2 h-5 w-5" />
              Wallet Connected
            </span>
            <div className="flex items-center space-x-2">
              {isInitialized ? (
                <Badge variant="success" className="bg-green-100 text-green-800">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Ready
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Initializing
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Wallet Address</p>
                <p className="font-mono text-sm break-all">
                  {publicKey?.toString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Balance</p>
                <p className="font-semibold">
                  {balance.toFixed(4)} SOL
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <WalletDisconnectButton className="!bg-gray-600 hover:!bg-gray-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Farmer Profile Section */}
      {isRolnik && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Blockchain Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            {farmerProfile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium">Profile Active</span>
                  </div>
                  <Badge variant="success" className="bg-green-100 text-green-800">
                    Verified
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Public Name</p>
                    <p className="font-medium">{farmerProfile.publicName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Region</p>
                    <p className="font-medium">{farmerProfile.region}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Products</p>
                    <p className="font-medium">{farmerProfile.totalProducts}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reputation</p>
                    <p className="font-medium">{farmerProfile.reputationScore}/100</p>
                  </div>
                </div>
                
                {farmerProfile.certifications && farmerProfile.certifications.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {farmerProfile.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {farmerProfile.simulated && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This is a simulated profile. In production, this would be stored on the Solana blockchain.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">
                    Initialize Your Blockchain Profile
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your verified farmer profile on the blockchain to start using transparency features.
                  </p>
                  
                  <Button 
                    onClick={handleInitializeProfile}
                    disabled={!isInitialized || isLoading || initializingProfile}
                    className="w-full md:w-auto"
                  >
                    {initializingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Profile...
                      </>
                    ) : (
                      <>
                        <User className="mr-2 h-4 w-4" />
                        Initialize Profile
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Your profile will be created on the Solana blockchain</li>
                    <li>Sensitive data will be encrypted for privacy</li>
                    <li>You'll be able to create verified products</li>
                    <li>Customers can verify your products' authenticity</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Non-farmer message */}
      {!isRolnik && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Blockchain features are currently available for farmers only. 
            As a customer, you can view blockchain-verified products and track their journey.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};