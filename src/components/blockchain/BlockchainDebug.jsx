// src/components/blockchain/BlockchainDebug.jsx - Debug Component
import React, { useState, useEffect } from 'react';
import { useBlockchain } from './WalletProvider';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Info,
  Copy,
  ExternalLink
} from 'lucide-react';

export const BlockchainDebug = () => {
  const { 
    connected, 
    publicKey, 
    isInitialized, 
    isLoading, 
    error, 
    connectionStatus,
    retryInitialization 
  } = useBlockchain();
  
  const [idlStatus, setIdlStatus] = useState(null);
  const [idlContent, setIdlContent] = useState(null);

  // Check IDL file accessibility
  useEffect(() => {
    const checkIdlFile = async () => {
      try {
        const response = await fetch('/farm_direct.json');
        if (response.ok) {
          const idl = await response.json();
          setIdlStatus('success');
          setIdlContent(idl);
        } else {
          setIdlStatus('error');
        }
      } catch (error) {
        setIdlStatus('error');
        console.error('IDL check failed:', error);
      }
    };

    checkIdlFile();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case true:
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case false:
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="mr-2 h-5 w-5" />
            Blockchain Connection Debug
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold">Connection Status</h3>
                
                <div className="flex items-center justify-between">
                  <span>Wallet Connected</span>
                  {getStatusIcon(connected)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Service Initialized</span>
                  {getStatusIcon(isInitialized)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span>IDL Loaded</span>
                  {getStatusIcon(connectionStatus.idlLoaded)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Provider Ready</span>
                  {getStatusIcon(connectionStatus.providerReady)}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Network Information</h3>
                
                <div>
                  <span className="text-sm text-gray-500">Cluster:</span>
                  <p className="font-mono text-sm">{connectionStatus.cluster}</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">Program ID:</span>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm truncate">
                      {connectionStatus.programId}
                    </p>
                    {connectionStatus.programId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(connectionStatus.programId)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {publicKey && (
                  <div>
                    <span className="text-sm text-gray-500">Wallet Address:</span>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm truncate">
                        {publicKey.toString()}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(publicKey.toString())}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* IDL File Status */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">IDL File Status</h3>
              
              <div className="flex items-center justify-between mb-3">
                <span>IDL File Accessible</span>
                {getStatusIcon(idlStatus)}
              </div>
              
              {idlStatus === 'error' && (
                <Alert variant="destructive" className="mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    IDL file not found at /farm_direct.json. Make sure the file is in the public directory.
                  </AlertDescription>
                </Alert>
              )}
              
              {idlContent && (
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <span className="text-sm">Instructions: {idlContent.instructions?.length || 0}</span>
                    <span className="text-sm">Accounts: {idlContent.accounts?.length || 0}</span>
                    <span className="text-sm">Types: {idlContent.types?.length || 0}</span>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-500">Available Types:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {idlContent.types?.map(type => (
                        <span 
                          key={type.name}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {type.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Information */}
            {error && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Error Details</h3>
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Error Message:</p>
                      <p className="text-sm font-mono bg-red-50 p-2 rounded">{error}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Actions */}
            <div className="border-t pt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={retryInitialization}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Retry Initialization
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('https://explorer.solana.com/?cluster=devnet', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Solana Explorer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Common Issues & Solutions:</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>
                  <strong>IDL not found:</strong> Make sure farm_direct.json is in the public/ directory
                </li>
                <li>
                  <strong>Type not found:</strong> Rebuild and redeploy your Anchor program
                </li>
                <li>
                  <strong>Connection failed:</strong> Check if Solana devnet is accessible
                </li>
                <li>
                  <strong>Wallet issues:</strong> Try disconnecting and reconnecting your wallet
                </li>
                <li>
                  <strong>Program ID mismatch:</strong> Verify the program ID matches your deployed program
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium">Required Files:</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>public/farm_direct.json (IDL file)</li>
                <li>Deployed program on Solana devnet</li>
                <li>Correct program ID in blockchain service</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};