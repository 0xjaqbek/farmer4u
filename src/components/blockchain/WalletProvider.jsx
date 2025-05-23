// src/components/blockchain/WalletProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import blockchainService from '../../services/blockchain';
import { useAuth } from '../../context/AuthContext';

// CSS dla wallet modal (dodaj do index.css)
import '@solana/wallet-adapter-react-ui/styles.css';

const BlockchainContext = createContext();

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within BlockchainProvider');
  }
  return context;
};

// Główny provider blockchain
export const BlockchainProvider = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);
  
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network }),
    new TorusWalletAdapter(),
  ];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BlockchainContextProvider>
            {children}
          </BlockchainContextProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Context provider z logiką blockchain
const BlockchainContextProvider = ({ children }) => {
  const { wallet, publicKey, connected, disconnect } = useWallet();
  const { userProfile } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [farmerProfile, setFarmerProfile] = useState(null);

  // Inicjalizacja blockchain service gdy wallet się połączy
  useEffect(() => {
    if (connected && wallet && publicKey) {
      initializeBlockchain();
    } else {
      setIsInitialized(false);
      setFarmerProfile(null);
    }
  }, [connected, wallet, publicKey]);

  const initializeBlockchain = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      await blockchainService.initialize(wallet);
      setIsInitialized(true);
      
      // Spróbuj pobrać profil rolnika z blockchain
      if (userProfile?.role === 'rolnik') {
        await loadFarmerProfile();
      }
      
      console.log('Blockchain initialized successfully');
    } catch (err) {
      console.error('Failed to initialize blockchain:', err);
      setError('Failed to connect to blockchain');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFarmerProfile = async () => {
    try {
      const profile = await blockchainService.fetchFarmerProfile(publicKey.toString());
      setFarmerProfile(profile);
    } catch  {
      console.log('Farmer profile not found on blockchain, needs initialization');
    }
  };

  // Inicjalizacja profilu rolnika na blockchain
  const initializeFarmerOnBlockchain = async () => {
    if (!userProfile || userProfile.role !== 'rolnik') {
      throw new Error('Only farmers can initialize blockchain profile');
    }

    try {
      setIsLoading(true);
      const result = await blockchainService.initializeFarmerProfile(userProfile);
      await loadFarmerProfile();
      return result;
    } catch (err) {
      console.error('Failed to initialize farmer profile:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Synchronizacja produktu na blockchain
  const syncProductToBlockchain = async (productData) => {
    try {
      setIsLoading(true);
      const result = await blockchainService.createProduct(userProfile, productData);
      return result;
    } catch (err) {
      console.error('Failed to sync product to blockchain:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Dodanie aktualizacji wzrostu
  const addGrowthUpdate = async (productId, updateData) => {
    try {
      setIsLoading(true);
      const result = await blockchainService.addGrowthUpdate(productId, updateData);
      return result;
    } catch (err) {
      console.error('Failed to add growth update:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Tworzenie kampanii crowdfundingowej
  const createCrowdfundingCampaign = async (campaignData) => {
    try {
      setIsLoading(true);
      const result = await blockchainService.createCrowdfundingCampaign(userProfile, campaignData);
      return result;
    } catch (err) {
      console.error('Failed to create crowdfunding campaign:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    // Wallet state
    wallet,
    publicKey,
    connected,
    disconnect,
    
    // Blockchain state
    isInitialized,
    isLoading,
    error,
    farmerProfile,
    
    // Actions
    initializeFarmerOnBlockchain,
    syncProductToBlockchain,
    addGrowthUpdate,
    createCrowdfundingCampaign,
    loadFarmerProfile,
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};