// src/components/blockchain/WalletConnection.jsx
import { useWallet, useState } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Wallet, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useBlockchain } from './WalletProvider';

export const WalletConnection = () => {
  const { connected, publicKey } = useWallet();
  const { isInitialized, isLoading, error, farmerProfile, initializeFarmerOnBlockchain } = useBlockchain();
  const [initializing, setInitializing] = useState(false);

  const handleInitializeFarmer = async () => {
    try {
      setInitializing(true);
      await initializeFarmerOnBlockchain();
    } catch (err) {
      console.error('Initialization failed:', err);
    } finally {
      setInitializing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wallet className="mr-2 h-5 w-5" />
          Blockchain Wallet
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Wallet Connection */}
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <p className="font-medium">Solana Wallet</p>
              <p className="text-sm text-gray-500">
                {connected 
                  ? `Connected: ${publicKey?.toString().substring(0, 8)}...`
                  : 'Not connected'
                }
              </p>
            </div>
            <WalletMultiButton className="!bg-green-600 hover:!bg-green-700" />
          </div>

          {/* Blockchain Status */}
          {connected && (
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">Blockchain Profile</p>
                <p className="text-sm text-gray-500">
                  {farmerProfile 
                    ? 'Profile synchronized'
                    : 'Profile not found on blockchain'
                  }
                </p>
              </div>
              <div className="flex items-center">
                {isLoading || initializing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                ) : farmerProfile ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Button 
                    size="sm" 
                    onClick={handleInitializeFarmer}
                    disabled={!isInitialized}
                  >
                    Initialize
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Information */}
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Blockchain Features (Optional)</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Product traceability and verification</li>
                  <li>Transparent growth tracking</li>
                  <li>Secure crypto payments</li>
                  <li>Crowdfunding campaigns</li>
                </ul>
                <p className="mt-2 text-xs">
                  All features work without blockchain connection. 
                  Connect wallet for enhanced transparency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};