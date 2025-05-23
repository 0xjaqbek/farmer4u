// src/components/blockchain/WalletProvider.jsx
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  LedgerWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { useAuth } from '../../context/AuthContext';
import blockchainService from '../../services/blockchain';

// Create blockchain context
const BlockchainContext = createContext();

// Blockchain provider component
const BlockchainProviderInner = ({ children }) => {
  const { connected, publicKey, wallet } = useWallet();
  const { userProfile } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [error, setError] = useState(null);

  // Initialize blockchain service when wallet connects
  useEffect(() => {
    const initializeBlockchain = async () => {
      if (connected && wallet && publicKey && userProfile) {
        setIsLoading(true);
        setError(null);
        
        try {
          console.log('Initializing blockchain service...');
          await blockchainService.initialize(wallet.adapter);
          setIsInitialized(true);
          
          // Load farmer profile if user is a farmer
          if (userProfile.role === 'rolnik') {
            await loadFarmerProfile();
          }
          
          console.log('Blockchain service initialized successfully');
        } catch (err) {
          console.error('Failed to initialize blockchain service:', err);
          setError(err.message);
          setIsInitialized(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsInitialized(false);
        setFarmerProfile(null);
        setError(null);
      }
    };

    initializeBlockchain();
  }, [connected, wallet, publicKey, userProfile]);

  // Load farmer profile from blockchain
  const loadFarmerProfile = async () => {
    if (!connected || !publicKey || !userProfile) return;

    try {
      console.log('Loading farmer profile from blockchain...');
      const profile = await blockchainService.fetchFarmerProfile(publicKey.toString());
      setFarmerProfile(profile);
    } catch (err) {
      console.error('Failed to load farmer profile:', err);
      // Don't set error here as profile might not exist yet
    }
  };

  // Initialize farmer profile on blockchain
  const initializeFarmerProfile = async () => {
    if (!connected || !isInitialized || !userProfile) {
      throw new Error('Wallet not connected or blockchain service not ready');
    }

    if (userProfile.role !== 'rolnik') {
      throw new Error('Only farmers can create blockchain profiles');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating farmer profile on blockchain...');
      const result = await blockchainService.initializeFarmerProfile(userProfile);
      
      // Reload the profile
      await loadFarmerProfile();
      
      console.log('Farmer profile created successfully:', result);
      return result;
    } catch (err) {
      console.error('Failed to initialize farmer profile:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Create product on blockchain
  const createProductOnBlockchain = async (productData) => {
    if (!connected || !isInitialized || !userProfile) {
      throw new Error('Wallet not connected or blockchain service not ready');
    }

    try {
      console.log('Creating product on blockchain...');
      const result = await blockchainService.createProduct(userProfile, productData);
      console.log('Product created on blockchain:', result);
      return result;
    } catch (err) {
      console.error('Failed to create product on blockchain:', err);
      throw err;
    }
  };

  // Add growth update
  const addGrowthUpdate = async (productId, updateData) => {
    if (!connected || !isInitialized) {
      throw new Error('Wallet not connected or blockchain service not ready');
    }

    try {
      console.log('Adding growth update...');
      const result = await blockchainService.addGrowthUpdate(productId, updateData);
      console.log('Growth update added:', result);
      return result;
    } catch (err) {
      console.error('Failed to add growth update:', err);
      throw err;
    }
  };

  // Create crowdfunding campaign
  const createCrowdfundingCampaign = async (campaignData) => {
    if (!connected || !isInitialized || !userProfile) {
      throw new Error('Wallet not connected or blockchain service not ready');
    }

    try {
      console.log('Creating crowdfunding campaign...');
      const result = await blockchainService.createCrowdfundingCampaign(userProfile, campaignData);
      console.log('Crowdfunding campaign created:', result);
      return result;
    } catch (err) {
      console.error('Failed to create crowdfunding campaign:', err);
      throw err;
    }
  };

  // Get wallet balance
  const getBalance = async () => {
    if (!connected || !isInitialized) return 0;
    
    try {
      return await blockchainService.getWalletBalance();
    } catch (err) {
      console.error('Failed to get wallet balance:', err);
      return 0;
    }
  };

  const value = {
    // Wallet state
    connected,
    publicKey,
    wallet,
    
    // Blockchain service state
    isInitialized,
    isLoading,
    error,
    farmerProfile,
    
    // Actions
    initializeFarmerProfile,
    createProductOnBlockchain,
    addGrowthUpdate,
    createCrowdfundingCampaign,
    loadFarmerProfile,
    getBalance,
    
    // Service instance for advanced usage
    blockchainService
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};

// Main blockchain provider with wallet setup
export const BlockchainProvider = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;
  
  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  // Configure available wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BlockchainProviderInner>
            {children}
          </BlockchainProviderInner>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Hook to use blockchain context
export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
};

// Export individual hooks for convenience
export const useWalletConnection = () => {
  const { connected, publicKey, wallet } = useWallet();
  return { connected, publicKey, wallet };
};