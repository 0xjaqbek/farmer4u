// src/components/blockchain/WalletProvider.jsx - Fixed Implementation
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { useAuth } from '../../context/AuthContext';
import blockchainService from '../../services/blockchain';

// Create blockchain context
const BlockchainContext = createContext();

// Blockchain provider inner component
const BlockchainProviderInner = ({ children }) => {
  const { connected, wallet, publicKey } = useWallet();
  const { userProfile } = useAuth();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    walletAddress: null,
    programId: null,
    cluster: 'devnet',
    initialized: false,
    idlLoaded: false,
    providerReady: false
  });

  // Initialize blockchain service when wallet connects
  const initializeBlockchain = useCallback(async () => {
    if (!connected || !wallet || !userProfile) {
      setIsInitialized(false);
      setFarmerProfile(null);
      setError(null);
      return;
    }

    console.log('Starting blockchain initialization...');
    setIsLoading(true);
    setError(null);

    try {
      // Initialize the blockchain service
      console.log('Initializing blockchain service with wallet:', publicKey?.toString());
      const result = await blockchainService.initialize(wallet.adapter);
      
      if (result) {
        console.log('Blockchain service initialized successfully');
        setIsInitialized(true);
        
        // Update connection status
        const status = blockchainService.getConnectionStatus();
        setConnectionStatus(status);
        
        // Fetch farmer profile if user is a farmer and has blockchain profile
        if (userProfile.role === 'rolnik' && userProfile.blockchainProfilePDA) {
          try {
            console.log('Fetching farmer profile from blockchain...');
            const profile = await blockchainService.fetchFarmerProfile(publicKey.toString());
            setFarmerProfile(profile);
            console.log('Farmer profile loaded:', profile);
          } catch (profileError) {
            console.warn('Could not fetch farmer profile:', profileError.message);
            // Don't throw here - profile might not exist yet
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      setError(error.message);
      setIsInitialized(false);
      setFarmerProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [connected, wallet, userProfile, publicKey]);

  // Initialize when wallet connection changes
  useEffect(() => {
    initializeBlockchain();
  }, [initializeBlockchain]);

  // Clean up when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setIsInitialized(false);
      setFarmerProfile(null);
      setError(null);
      setConnectionStatus({
        connected: false,
        walletAddress: null,
        programId: null,
        cluster: 'devnet',
        initialized: false,
        idlLoaded: false,
        providerReady: false
      });
    }
  }, [connected]);

  // Initialize farmer profile on blockchain
  const initializeFarmerOnBlockchain = async () => {
    if (!isInitialized || !userProfile || userProfile.role !== 'rolnik') {
      throw new Error('Cannot initialize farmer profile - service not ready or user not a farmer');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await blockchainService.initializeFarmerProfile(userProfile);
      
      if (result.profile) {
        setFarmerProfile(result.profile);
      }
      
      return result;
    } catch (error) {
      console.error('Error initializing farmer on blockchain:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create crowdfunding campaign
  const createCrowdfundingCampaign = async (campaignData) => {
    if (!isInitialized || !userProfile) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await blockchainService.createCrowdfundingCampaign(userProfile, campaignData);
      return result;
    } catch (error) {
      console.error('Error creating crowdfunding campaign:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get wallet balance
  const getBalance = async () => {
    if (!isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      return await blockchainService.getWalletBalance();
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw error;
    }
  };

  // Retry initialization
  const retryInitialization = () => {
    setError(null);
    initializeBlockchain();
  };

  const value = {
    // Connection status
    connected,
    publicKey,
    isInitialized,
    isLoading,
    error,
    connectionStatus,
    
    // Data
    farmerProfile,
    
    // Methods
    initializeFarmerOnBlockchain,
    createCrowdfundingCampaign,
    getBalance,
    retryInitialization,
    
    // Service reference for advanced usage
    blockchainService: isInitialized ? blockchainService : null
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};

// Main blockchain provider component
export const BlockchainProvider = ({ children }) => {
  // Network configuration
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);

  // Wallet adapters
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
    new LedgerWalletAdapter(),
  ];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
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
  
  if (context === undefined) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  
  return context;
};