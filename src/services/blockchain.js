// src/services/blockchain.js - Fixed version
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import CryptoJS from 'crypto-js';
import { db } from '../firebase/config.jsx';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';

// Create a mock IDL for development - replace with actual IDL when available
const mockFarmDirectIdl = {
  "version": "0.1.0",
  "name": "farm_direct_blockchain",
  "instructions": [],
  "accounts": [],
  "types": [],
  "errors": [],
  "metadata": {
    "address": "9n3L3af5CKKPqdUXjCFBnt5kto95tqCjZv9vANECuS4V"
  }
};

class BlockchainService {
  constructor() {
    // Connection to Solana Devnet
    this.connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    this.programId = new PublicKey('9n3L3af5CKKPqdUXjCFBnt5kto95tqCjZv9vANECuS4V');
    this.program = null;
    this.wallet = null;
    this.isSimulated = true; // Flag to indicate we're running in simulation mode
    
    // Encryption key for sensitive data
    this.encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'fallback-key-for-dev';
    
    // Cache for synchronized data
    this.syncedData = new Map();
  }

  // Helper function to convert string to Uint8Array (Browser-compatible Buffer replacement)
  stringToUint8Array(str) {
    return new TextEncoder().encode(str);
  }

  // Initialize with user's wallet
  async initialize(walletAdapter) {
    try {
      console.log('Initializing blockchain service...');
      
      if (!walletAdapter || !walletAdapter.publicKey) {
        throw new Error('Wallet not connected');
      }

      this.wallet = walletAdapter;
      
      // Test connection first
      try {
        const version = await this.connection.getVersion();
        console.log('Solana RPC connection successful:', version);
      } catch (connectionError) {
        console.warn('Solana RPC connection failed, running in simulation mode:', connectionError);
        this.isSimulated = true;
        return; // Skip program initialization if connection fails
      }

      // Try to initialize the program
      try {
        const provider = new anchor.AnchorProvider(
          this.connection,
          walletAdapter,
          { 
            commitment: 'confirmed',
            preflightCommitment: 'confirmed'
          }
        );
        
        // Use mock IDL for now - replace with actual IDL when available
        this.program = new anchor.Program(mockFarmDirectIdl, provider);
        console.log('Blockchain service initialized with wallet:', walletAdapter.publicKey.toString());
        
        this.isSimulated = false; // We have a real connection
      } catch (programError) {
        console.warn('Program initialization failed, running in simulation mode:', programError);
        this.isSimulated = true;
        
        // Continue with simulation mode - don't throw error
        console.log('Blockchain service running in simulation mode');
      }
      
    } catch (error) {
      console.error('Error initializing blockchain service:', error);
      // Don't throw - allow the app to continue in simulation mode
      this.isSimulated = true;
      console.log('Blockchain service fallback to simulation mode');
    }
  }

  // Check if we're running in simulation mode
  isSimulationMode() {
    return this.isSimulated;
  }

  // Encrypt sensitive data
  encryptSensitiveData(data) {
    try {
      const dataString = JSON.stringify(data);
      return CryptoJS.AES.encrypt(dataString, this.encryptionKey).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      return JSON.stringify(data); // Fallback to unencrypted in dev
    }
  }

  // Decrypt sensitive data
  decryptSensitiveData(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      try {
        // Try to parse as unencrypted JSON (development fallback)
        return JSON.parse(encryptedData);
      } catch (parseError) {
        return null;
      }
    }
  }

  // Simulate farmer profile initialization
  async initializeFarmerProfile(userProfile) {
    console.log('Initializing farmer profile (simulated):', userProfile.uid);
    
    if (this.isSimulated) {
      // Simulate blockchain operation
      const simulatedPDA = `farmer_${userProfile.uid}_${Date.now()}`;
      
      const mockProfile = {
        pda: simulatedPDA,
        publicName: `${userProfile.firstName} ${userProfile.lastName}`,
        region: userProfile.postalCode?.substring(0, 2) || 'Unknown',
        certifications: ['Organic', 'Local'],
        verificationStatus: true,
        reputationScore: 85,
        totalProducts: 0,
        createdAt: Math.floor(Date.now() / 1000),
        simulated: true
      };
      
      // Update Firestore with simulated data
      try {
        await updateDoc(doc(db, 'users', userProfile.uid), {
          blockchainProfilePDA: simulatedPDA,
          blockchainSynced: true,
          lastBlockchainUpdate: new Date().toISOString(),
        });
      } catch (firestoreError) {
        console.warn('Firestore update failed:', firestoreError);
      }
      
      return { 
        tx: `simulated_tx_${Date.now()}`, 
        pda: simulatedPDA, 
        profile: mockProfile 
      };
    }
    
    // Real blockchain implementation would go here
    throw new Error('Real blockchain implementation not available');
  }

  // Simulate product creation
  async createProduct(userProfile, productData) {
    console.log('Creating product on blockchain (simulated):', productData.name);
    
    if (this.isSimulated) {
      const simulatedPDA = `product_${productData.id}_${Date.now()}`;
      
      // Update product in Firestore with simulated blockchain data
      try {
        await updateDoc(doc(db, 'products', productData.id), {
          blockchainPDA: simulatedPDA,
          blockchainSynced: true,
          lastBlockchainUpdate: new Date().toISOString(),
        });
      } catch (firestoreError) {
        console.warn('Firestore update failed:', firestoreError);
      }
      
      return { 
        tx: `simulated_tx_${Date.now()}`, 
        pda: simulatedPDA 
      };
    }
    
    throw new Error('Real blockchain implementation not available');
  }

  // Simulate growth update
  async addGrowthUpdate(productId, updateData) {
    console.log('Adding growth update (simulated):', productId, updateData.stage);
    
    if (this.isSimulated) {
      return `simulated_tx_${Date.now()}`;
    }
    
    throw new Error('Real blockchain implementation not available');
  }

  // Simulate crowdfunding campaign creation
  async createCrowdfundingCampaign(userProfile, campaignData) {
    console.log('Creating crowdfunding campaign (simulated):', campaignData.title);
    
    if (this.isSimulated) {
      const simulatedPDA = `campaign_${campaignData.id}_${Date.now()}`;
      const simulatedVaultPDA = `vault_${campaignData.id}_${Date.now()}`;
      
      return { 
        tx: `simulated_tx_${Date.now()}`, 
        pda: simulatedPDA,
        vault: simulatedVaultPDA
      };
    }
    
    throw new Error('Real blockchain implementation not available');
  }

  // Get wallet balance
  async getWalletBalance() {
    if (!this.wallet || !this.wallet.publicKey) {
      return 0;
    }
    
    try {
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      return balance / anchor.web3.LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return 0;
    }
  }

  // Fetch farmer profile (simulated)
  async fetchFarmerProfile(farmerWallet) {
    console.log('Fetching farmer profile (simulated):', farmerWallet);
    
    if (this.isSimulated) {
      // Return a mock profile
      return {
        publicName: 'Simulated Farm',
        region: 'Test Region',
        certifications: ['Organic', 'Local'],
        reputationScore: 85,
        totalProducts: 5,
        verificationStatus: true,
        simulated: true
      };
    }
    
    return null;
  }

  // Fetch product cycle (simulated)
  async fetchProductCycle(productPDA) {
    console.log('Fetching product cycle (simulated):', productPDA);
    
    if (this.isSimulated) {
      return {
        growthUpdates: [
          {
            stage: 'seeding',
            timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
            notes: 'Seeds planted',
            images: []
          },
          {
            stage: 'growing',
            timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000,
            notes: 'Plants growing well',
            images: []
          }
        ],
        actualQuantity: 0,
        pda: productPDA,
        simulated: true
      };
    }
    
    return null;
  }

  // Start auto-sync (simplified for simulation)
  startAutoSync(userId) {
    console.log('Starting auto-sync (simulated) for user:', userId);
    
    // Return a no-op unsubscribe function
    return () => {
      console.log('Auto-sync stopped for user:', userId);
    };
  }

  // Check if data should be synced
  shouldSync(type, data) {
    // In simulation mode, don't sync
    if (this.isSimulated) {
      return false;
    }
    
    const lastUpdate = data.updatedAt || data.lastModified;
    const lastBlockchainUpdate = data.lastBlockchainUpdate;
    
    if (!lastBlockchainUpdate) return true;
    
    return new Date(lastUpdate) > new Date(lastBlockchainUpdate);
  }
}

// Singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;