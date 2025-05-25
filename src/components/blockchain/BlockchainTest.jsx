// src/components/blockchain/BlockchainTest.jsx - Test Component
import React, { useState } from 'react';
import { useBlockchain } from './WalletProvider';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  TestTube,
  User,
  Wallet
} from 'lucide-react';

export const BlockchainTest = () => {
  const { userProfile } = useAuth();
  const { 
    connected, 
    _publicKey, 
    isInitialized, 
    isLoading, 
    error,
    farmerProfile,
    initializeFarmerOnBlockchain,
    getBalance
  } = useBlockchain();
  
  const [testResults, setTestResults] = useState({});
  const [testRunning, setTestRunning] = useState(false);
  const [balance, setBalance] = useState(null);

  const runTests = async () => {
    setTestRunning(true);
    const results = {};
    
    try {
      // Test 1: Basic connection
      results.connection = {
        name: 'Wallet Connection',
        status: connected ? 'pass' : 'fail',
        message: connected ? 'Wallet connected successfully' : 'Wallet not connected'
      };

      // Test 2: Service initialization
      results.initialization = {
        name: 'Service Initialization',
        status: isInitialized ? 'pass' : 'fail',
        message: isInitialized ? 'Blockchain service initialized' : 'Service not initialized'
      };

      // Test 3: Get wallet balance
      if (connected && isInitialized) {
        try {
          const walletBalance = await getBalance();
          setBalance(walletBalance);
          results.balance = {
            name: 'Wallet Balance',
            status: 'pass',
            message: `Balance: ${walletBalance.toFixed(4)} SOL`
          };
        } catch (balanceError) {
          results.balance = {
            name: 'Wallet Balance',
            status: 'fail',
            message: `Failed to get balance: ${balanceError.message}`
          };
        }
      }

      // Test 4: Farmer profile (if applicable)
      if (userProfile?.role === 'rolnik') {
        if (farmerProfile) {
          results.farmerProfile = {
            name: 'Farmer Profile',
            status: 'pass',
            message: 'Farmer profile loaded from blockchain'
          };
        } else if (userProfile.blockchainProfilePDA) {
          results.farmerProfile = {
            name: 'Farmer Profile',
            status: 'warning',
            message: 'Profile PDA exists but not loaded'
          };
        } else {
          results.farmerProfile = {
            name: 'Farmer Profile',
            status: 'info',
            message: 'No blockchain profile found (can be initialized)'
          };
        }
      }

      setTestResults(results);
    } catch (error) {
      console.error('Test error:', error);
      setTestResults({
        error: {
          name: 'Test Execution',
          status: 'fail',
          message: `Test failed: ${error.message}`
        }
      });
    } finally {
      setTestRunning(false);
    }
  };

  const handleInitializeFarmer = async () => {
    try {
      setTestRunning(true);
      await initializeFarmerOnBlockchain();
      
      // Re-run tests to update results
      await runTests();
      
      setTestResults(prev => ({
        ...prev,
        farmerInit: {
          name: 'Farmer Initialization',
          status: 'pass',
          message: 'Farmer profile initialized successfully'
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        farmerInit: {
          name: 'Farmer Initialization',
          status: 'fail',
          message: `Failed to initialize: ${error.message}`
        }
      }));
    } finally {
      setTestRunning(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <TestTube className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <TestTube className="h-5 w-5 text-blue-500" />;
      default:
        return <TestTube className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'fail':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TestTube className="mr-2 h-5 w-5" />
            Blockchain Integration Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Wallet className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="font-medium">Wallet</p>
                <p className="text-sm text-gray-600">
                  {connected ? 'Connected' : 'Not Connected'}
                </p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <TestTube className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="font-medium">Service</p>
                <p className="text-sm text-gray-600">
                  {isInitialized ? 'Ready' : 'Not Ready'}
                </p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <User className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="font-medium">Profile</p>
                <p className="text-sm text-gray-600">
                  {userProfile?.role || 'Unknown'}
                </p>
              </div>
            </div>

            {/* Balance Display */}
            {balance !== null && (
              <Alert className="bg-green-50 border-green-200">
                <Wallet className="h-4 w-4" />
                <AlertDescription className="text-green-700">
                  Wallet Balance: {balance.toFixed(4)} SOL
                </AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Test Controls */}
            <div className="flex gap-2">
              <Button
                onClick={runTests}
                disabled={testRunning || isLoading}
              >
                {testRunning ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="mr-2 h-4 w-4" />
                )}
                Run Tests
              </Button>

              {userProfile?.role === 'rolnik' && !farmerProfile && isInitialized && (
                <Button
                  variant="outline"
                  onClick={handleInitializeFarmer}
                  disabled={testRunning || isLoading}
                >
                  Initialize Farmer Profile
                </Button>
              )}
            </div>

            {/* Test Results */}
            {Object.keys(testResults).length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Test Results</h3>
                {Object.entries(testResults).map(([key, result]) => (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.name}</span>
                      {getStatusIcon(result.status)}
                    </div>
                    <p className="text-sm mt-1">{result.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Farmer Profile Info */}
            {farmerProfile && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Farmer Profile Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Public Name:</span>
                    <p className="font-medium">{farmerProfile.publicName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Region:</span>
                    <p className="font-medium">{farmerProfile.region}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Total Products:</span>
                    <p className="font-medium">{farmerProfile.totalProducts}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Reputation Score:</span>
                    <p className="font-medium">{farmerProfile.reputationScore}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">PDA:</span>
                    <p className="font-mono text-xs bg-white p-2 rounded">
                      {farmerProfile.pda}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};