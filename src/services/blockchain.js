// src/services/blockchain.js - Fixed Implementation
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import CryptoJS from 'crypto-js';
import { db } from '../firebase/config.jsx';
import { doc,  updateDoc, getDoc } from 'firebase/firestore';

class BlockchainService {
  constructor() {
    this.connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    this.programId = new PublicKey('9n3L3af5CKKPqdUXjCFBnt5kto95tqCjZv9vANECuS4V');
    this.program = null;
    this.wallet = null;
    this.provider = null;
    this.idl = null;
    
    // Encryption key for sensitive data
    this.encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'fallback-key-for-dev';
    
    console.log('BlockchainService initialized with program ID:', this.programId.toString());
  }

  // Initialize with user's wallet
  async initialize(walletAdapter) {
    console.log('Initializing blockchain service...');
    
    if (!walletAdapter || !walletAdapter.publicKey) {
      throw new Error('Wallet not connected');
    }

    this.wallet = walletAdapter;
    
    try {
      // Test connection first
      const version = await this.connection.getVersion();
      console.log('Solana RPC connection successful:', version);

      // Load IDL from the public directory
      const response = await fetch('/farm_direct.json');
      if (!response.ok) {
        throw new Error(`Failed to load IDL: ${response.status} ${response.statusText}`);
      }
      
      this.idl = await response.json();
      console.log('IDL loaded successfully:', this.idl.metadata?.name || this.idl.name);

      // Validate IDL structure
      this.validateIdl();

      // Create provider
      this.provider = new anchor.AnchorProvider(
        this.connection,
        walletAdapter,
        { 
          commitment: 'confirmed',
          preflightCommitment: 'confirmed'
        }
      );
      
      anchor.setProvider(this.provider);
      
      // Create program instance
      this.program = new anchor.Program(this.idl, this.programId, this.provider);
      
      console.log('Program initialized successfully');
      console.log('Available methods:', Object.keys(this.program.methods));
      console.log('Available accounts:', Object.keys(this.program.account || {}));
      
      return true;
      
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      throw new Error(`Blockchain initialization failed: ${error.message}`);
    }
  }

  // Validate IDL structure
  validateIdl() {
    if (!this.idl) {
      throw new Error('IDL not loaded');
    }

    // Check required fields
    if (!this.idl.instructions || !Array.isArray(this.idl.instructions)) {
      throw new Error('IDL missing instructions array');
    }

    if (!this.idl.accounts || !Array.isArray(this.idl.accounts)) {
      throw new Error('IDL missing accounts array');
    }

    if (!this.idl.types || !Array.isArray(this.idl.types)) {
      throw new Error('IDL missing types array');
    }

    // Check for required types
    const requiredTypes = ['DeliveryStatus', 'GrowthStage', 'CampaignType'];
    const availableTypes = this.idl.types.map(t => t.name);
    
    const missingTypes = requiredTypes.filter(type => !availableTypes.includes(type));
    if (missingTypes.length > 0) {
      console.warn('Warning: Missing types in IDL:', missingTypes);
      // Don't throw here as some types might be optional
    }

    console.log('IDL structure validated successfully');
  }

  // Helper functions
  stringToUint8Array(str) {
    return new TextEncoder().encode(str);
  }

  encryptSensitiveData(data) {
    const dataString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(dataString, this.encryptionKey).toString();
  }

  decryptSensitiveData(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      try {
        return JSON.parse(encryptedData); // Fallback for unencrypted data
      } catch {
        throw new Error('Failed to decrypt sensitive data');
      }
    }
  }

  // Get PDA for farmer profile
  async getFarmerProfilePDA(farmerPubkey) {
    const [pda] = await PublicKey.findProgramAddress(
      [
        this.stringToUint8Array('farmer_profile'),
        farmerPubkey.toBuffer(),
      ],
      this.programId
    );
    return pda;
  }

  // Get PDA for product
  async getProductPDA(farmerPubkey, productId) {
    const [pda] = await PublicKey.findProgramAddress(
      [
        this.stringToUint8Array('product'),
        farmerPubkey.toBuffer(),
        this.stringToUint8Array(productId.substring(0, 8)),
      ],
      this.programId
    );
    return pda;
  }

  // Initialize farmer profile on blockchain
  async initializeFarmerProfile(userProfile) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    console.log('Initializing farmer profile on blockchain for:', userProfile.uid);

    try {
      // Prepare sensitive data for encryption
      const sensitiveData = {
        email: userProfile.email,
        phone: userProfile.phone || '',
        fullAddress: userProfile.fullAddress || '',
        taxId: userProfile.taxId || '',
      };

      const encryptedData = this.encryptSensitiveData(sensitiveData);

      // Generate PDA for farmer profile
      const farmerProfilePDA = await this.getFarmerProfilePDA(this.wallet.publicKey);

      // Call smart contract
      const tx = await this.program.methods
        .initializeFarmer(
          encryptedData,
          `${userProfile.firstName} ${userProfile.lastName}`,
          userProfile.region || userProfile.postalCode?.substring(0, 2) || 'Unknown',
          userProfile.certifications || []
        )
        .accounts({
          farmerProfile: farmerProfilePDA,
          farmer: this.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc({
          commitment: 'confirmed',
          preflightCommitment: 'confirmed'
        });

      console.log('Farmer profile initialized on blockchain:', tx);

      // Update Firestore with PDA
      await updateDoc(doc(db, 'users', userProfile.uid), {
        blockchainProfilePDA: farmerProfilePDA.toString(),
        blockchainSynced: true,
        lastBlockchainUpdate: new Date().toISOString(),
      });

      // Fetch and return the created profile
      const profile = await this.fetchFarmerProfile(this.wallet.publicKey.toString());

      return { 
        tx, 
        pda: farmerProfilePDA.toString(),
        profile
      };

    } catch (error) {
      console.error('Error initializing farmer profile:', error);
      throw new Error(`Failed to initialize farmer profile: ${error.message}`);
    }
  }

  // Update farmer profile on blockchain
  async updateFarmerProfile(userProfile, changes) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const farmerProfilePDA = new PublicKey(userProfile.blockchainProfilePDA);

      // Prepare data for update
      let encryptedData = null;
      if (changes.email || changes.phone || changes.fullAddress || changes.taxId) {
        const sensitiveData = {
          email: changes.email || userProfile.email,
          phone: changes.phone || userProfile.phone || '',
          fullAddress: changes.fullAddress || userProfile.fullAddress || '',
          taxId: changes.taxId || userProfile.taxId || '',
        };
        encryptedData = this.encryptSensitiveData(sensitiveData);
      }

      const tx = await this.program.methods
        .updateFarmerProfile(
          encryptedData,
          changes.firstName || changes.lastName 
            ? `${changes.firstName || userProfile.firstName} ${changes.lastName || userProfile.lastName}`
            : null,
          changes.region || null,
          changes.certifications || null
        )
        .accounts({
          farmerProfile: farmerProfilePDA,
          farmer: this.wallet.publicKey,
        })
        .rpc({
          commitment: 'confirmed',
          preflightCommitment: 'confirmed'
        });

      console.log('Farmer profile updated on blockchain:', tx);

      // Update Firestore
      await updateDoc(doc(db, 'users', userProfile.uid), {
        lastBlockchainUpdate: new Date().toISOString(),
      });

      return tx;

    } catch (error) {
      console.error('Error updating farmer profile:', error);
      throw new Error(`Failed to update farmer profile: ${error.message}`);
    }
  }

  // Create product on blockchain
  async createProduct(userProfile, productData) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    console.log('Creating product on blockchain:', productData.name);

    try {
      // Generate PDA for product
      const productPDA = await this.getProductPDA(this.wallet.publicKey, productData.id);
      const farmerProfilePDA = new PublicKey(userProfile.blockchainProfilePDA);

      const tx = await this.program.methods
        .createProduct(
          productData.name,
          productData.category,
          productData.description,
          new anchor.BN(Math.floor(new Date(productData.estimatedHarvestDate || Date.now() + 90 * 24 * 60 * 60 * 1000).getTime() / 1000)),
          new anchor.BN(productData.stockQuantity || 0),
          productData.images || []
        )
        .accounts({
          productCycle: productPDA,
          farmerProfile: farmerProfilePDA,
          farmer: this.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc({
          commitment: 'confirmed',
          preflightCommitment: 'confirmed'
        });

      console.log('Product created on blockchain:', tx);

      // Update product in Firestore with PDA
      await updateDoc(doc(db, 'products', productData.id), {
        blockchainPDA: productPDA.toString(),
        blockchainSynced: true,
        lastBlockchainUpdate: new Date().toISOString(),
      });

      return { tx, pda: productPDA.toString() };

    } catch (error) {
      console.error('Error creating product on blockchain:', error);
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  // Add growth update to blockchain
  async addGrowthUpdate(productId, updateData) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    console.log('Adding growth update to blockchain:', productId, updateData.stage);

    try {
      const productPDA = new PublicKey(updateData.blockchainPDA);

      // Convert stage to proper enum format
      const stageVariant = this.convertGrowthStage(updateData.stage);

      const tx = await this.program.methods
        .addGrowthUpdate(
          stageVariant,
          updateData.notes || '',
          updateData.images || []
        )
        .accounts({
          productCycle: productPDA,
          farmer: this.wallet.publicKey,
        })
        .rpc({
          commitment: 'confirmed',
          preflightCommitment: 'confirmed'
        });

      console.log('Growth update added to blockchain:', tx);
      return tx;

    } catch (error) {
      console.error('Error adding growth update:', error);
      throw new Error(`Failed to add growth update: ${error.message}`);
    }
  }

  // Convert growth stage string to enum variant
  convertGrowthStage(stage) {
    const stageMap = {
      'seeding': { seeding: {} },
      'germination': { germination: {} },
      'growing': { growing: {} },
      'flowering': { flowering: {} },
      'fruiting': { fruiting: {} },
      'harvest': { harvest: {} },
      'post_harvest': { postHarvest: {} },
    };
    return stageMap[stage] || { growing: {} };
  }

  // Convert delivery status string to enum variant
  convertDeliveryStatus(status) {
    const statusMap = {
      'preparing': { preparing: {} },
      'packed': { packed: {} },
      'in_transit': { inTransit: {} },
      'delivered': { delivered: {} },
      'completed': { completed: {} },
    };
    return statusMap[status] || { preparing: {} };
  }

  // Convert campaign type string to enum variant
  convertCampaignType(type) {
    const typeMap = {
      'equipment': { equipment: {} },
      'seeds': { seeds: {} },
      'infrastructure': { infrastructure: {} },
      'expansion': { expansion: {} },
      'emergency': { emergency: {} },
    };
    return typeMap[type] || { equipment: {} };
  }

  // Update actual quantity on blockchain
  async updateActualQuantity(productId, actualQuantity) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Get product PDA from Firestore
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (!productDoc.exists() || !productDoc.data().blockchainPDA) {
        throw new Error('Product not found on blockchain');
      }

      const productPDA = new PublicKey(productDoc.data().blockchainPDA);

      const tx = await this.program.methods
        .updateActualQuantity(new anchor.BN(actualQuantity))
        .accounts({
          productCycle: productPDA,
          farmer: this.wallet.publicKey,
        })
        .rpc({
          commitment: 'confirmed',
          preflightCommitment: 'confirmed'
        });

      console.log('Actual quantity updated on blockchain:', tx);
      return tx;

    } catch (error) {
      console.error('Error updating actual quantity:', error);
      throw new Error(`Failed to update actual quantity: ${error.message}`);
    }
  }

  // Add delivery update to blockchain
  async addDeliveryUpdate(orderId, statusData) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Convert status to proper enum format
      const statusVariant = this.convertDeliveryStatus(statusData.status);

      // Find product PDA based on order
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const orderData = orderDoc.data();
      let productPDA;

      if (orderData.items && orderData.items.length > 0) {
        const productDoc = await getDoc(doc(db, 'products', orderData.items[0].productId));
        if (!productDoc.exists() || !productDoc.data().blockchainPDA) {
          throw new Error('Product not found on blockchain');
        }
        productPDA = new PublicKey(productDoc.data().blockchainPDA);
      } else if (orderData.productId) {
        const productDoc = await getDoc(doc(db, 'products', orderData.productId));
        if (!productDoc.exists() || !productDoc.data().blockchainPDA) {
          throw new Error('Product not found on blockchain');
        }
        productPDA = new PublicKey(productDoc.data().blockchainPDA);
      } else {
        throw new Error('Product PDA not found in order');
      }

      const tx = await this.program.methods
        .addDeliveryUpdate(
          statusVariant,
          statusData.notes || '',
          statusData.location || null
        )
        .accounts({
          productCycle: productPDA,
          farmer: this.wallet.publicKey,
        })
        .rpc({
          commitment: 'confirmed',
          preflightCommitment: 'confirmed'
        });

      console.log('Delivery update added to blockchain:', tx);
      return tx;

    } catch (error) {
      console.error('Error adding delivery update:', error);
      throw new Error(`Failed to add delivery update: ${error.message}`);
    }
  }

  // Create crowdfunding campaign on blockchain
  async createCrowdfundingCampaign(userProfile, campaignData) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    console.log('Creating crowdfunding campaign on blockchain:', campaignData.title);

    try {
      // Generate PDA for campaign
      const [campaignPDA] = await PublicKey.findProgramAddress(
        [
          this.stringToUint8Array('campaign'),
          this.wallet.publicKey.toBuffer(),
          this.stringToUint8Array(campaignData.id.substring(0, 8)),
        ],
        this.programId
      );

      // Generate vault for campaign
      const [campaignVaultPDA] = await PublicKey.findProgramAddress(
        [
          this.stringToUint8Array('campaign_vault'),
          campaignPDA.toBuffer(),
        ],
        this.programId
      );

      // Convert campaign type to proper enum format
      const campaignTypeVariant = this.convertCampaignType(campaignData.type);

      const tx = await this.program.methods
        .createCrowdfundingCampaign(
          campaignData.title,
          campaignData.description,
          new anchor.BN(campaignData.goalAmount * anchor.web3.LAMPORTS_PER_SOL),
          new anchor.BN(Math.floor(new Date(campaignData.deadline).getTime() / 1000)),
          campaignTypeVariant,
          campaignData.milestones || []
        )
        .accounts({
          campaign: campaignPDA,
          campaignVault: campaignVaultPDA,
          farmer: this.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc({
          commitment: 'confirmed',
          preflightCommitment: 'confirmed'
        });

      console.log('Crowdfunding campaign created on blockchain:', tx);

      // Update campaign in Firestore
      await updateDoc(doc(db, 'crowdfunding', campaignData.id), {
        blockchainPDA: campaignPDA.toString(),
        vaultPDA: campaignVaultPDA.toString(),
        blockchainSynced: true,
        lastBlockchainUpdate: new Date().toISOString(),
      });

      return { tx, pda: campaignPDA.toString(), vault: campaignVaultPDA.toString() };

    } catch (error) {
      console.error('Error creating crowdfunding campaign:', error);
      throw new Error(`Failed to create crowdfunding campaign: ${error.message}`);
    }
  }

  // Contribute to crowdfunding campaign
  async contributeToCampaign(campaignId, amount) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Get campaign data from Firestore
      const campaignDoc = await getDoc(doc(db, 'crowdfunding', campaignId));
      if (!campaignDoc.exists() || !campaignDoc.data().blockchainPDA) {
        throw new Error('Campaign not found on blockchain');
      }

      const campaignData = campaignDoc.data();
      const campaignPDA = new PublicKey(campaignData.blockchainPDA);
      const vaultPDA = new PublicKey(campaignData.vaultPDA);

      const tx = await this.program.methods
        .contributeToCampaign(new anchor.BN(amount * anchor.web3.LAMPORTS_PER_SOL))
        .accounts({
          campaign: campaignPDA,
          campaignVault: vaultPDA,
          contributor: this.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc({
          commitment: 'confirmed',
          preflightCommitment: 'confirmed'
        });

      console.log('Contribution made to campaign:', tx);
      return tx;

    } catch (error) {
      console.error('Error contributing to campaign:', error);
      throw new Error(`Failed to contribute to campaign: ${error.message}`);
    }
  }

  // Get wallet balance
  async getWalletBalance() {
    if (!this.wallet || !this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    const balance = await this.connection.getBalance(this.wallet.publicKey);
    return balance / anchor.web3.LAMPORTS_PER_SOL;
  }

  // Fetch farmer profile from blockchain
  async fetchFarmerProfile(farmerWallet) {
    if (!this.program) {
      throw new Error('Blockchain service not initialized');
    }

    console.log('Fetching farmer profile from blockchain:', farmerWallet);

    try {
      const farmerProfilePDA = await this.getFarmerProfilePDA(new PublicKey(farmerWallet));
      const profileAccount = await this.program.account.farmerProfile.fetch(farmerProfilePDA);
      
      // Decrypt sensitive data
      const sensitiveData = this.decryptSensitiveData(profileAccount.encryptedData);

      return {
        ...profileAccount,
        sensitiveData,
        pda: farmerProfilePDA.toString(),
        // Convert BN values to numbers
        reputationScore: profileAccount.reputationScore.toNumber(),
        totalProducts: profileAccount.totalProducts.toNumber(),
        createdAt: profileAccount.createdAt.toNumber(),
        updatedAt: profileAccount.updatedAt.toNumber(),
      };

    } catch (error) {
      console.error('Error fetching farmer profile:', error);
      throw new Error(`Failed to fetch farmer profile: ${error.message}`);
    }
  }

  // Fetch product cycle from blockchain
  async fetchProductCycle(productPDA) {
    if (!this.program) {
      throw new Error('Blockchain service not initialized');
    }

    console.log('Fetching product cycle from blockchain:', productPDA);

    try {
      const productAccount = await this.program.account.productCycle.fetch(new PublicKey(productPDA));
      
      return {
        ...productAccount,
        pda: productPDA,
        // Convert BN values to numbers
        estimatedHarvestDate: productAccount.estimatedHarvestDate.toNumber(),
        estimatedQuantity: productAccount.estimatedQuantity.toNumber(),
        actualQuantity: productAccount.actualQuantity.toNumber(),
        createdAt: productAccount.createdAt.toNumber(),
        updatedAt: productAccount.updatedAt.toNumber(),
        // Convert growth updates timestamps
        growthUpdates: productAccount.growthUpdates.map(update => ({
          ...update,
          timestamp: update.timestamp.toNumber()
        })),
        // Convert delivery updates timestamps
        deliveryUpdates: productAccount.deliveryUpdates.map(update => ({
          ...update,
          timestamp: update.timestamp.toNumber()
        }))
      };

    } catch (error) {
      console.error('Error fetching product cycle:', error);
      throw new Error(`Failed to fetch product cycle: ${error.message}`);
    }
  }

  // Check if service is ready
  isReady() {
    return !!(this.program && this.wallet && this.provider);
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: !!this.wallet,
      walletAddress: this.wallet?.publicKey?.toString(),
      programId: this.programId.toString(),
      cluster: 'devnet',
      initialized: !!this.program,
      idlLoaded: !!this.idl
    };
  }
}

// Singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;