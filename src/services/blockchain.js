// src/services/blockchain.js - Production blockchain service
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import CryptoJS from 'crypto-js';
import { db } from '../firebase/config.jsx';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';



// IDL will be loaded dynamically during initialization
let farmDirectIdl = null;

class BlockchainService {
  constructor() {
    // Connection to Solana Devnet
    this.connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    this.programId = new PublicKey('9n3L3af5CKKPqdUXjCFBnt5kto95tqCjZv9vANECuS4V');
    this.program = null;
    this.wallet = null;
    
    // Encryption key for sensitive data
    this.encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'fallback-key-for-dev';
    
    // Cache for synchronized data
    this.syncedData = new Map();
    
    console.log('BlockchainService initialized with program ID:', this.programId.toString());
  }

  // Helper function to convert string to Uint8Array (Browser-compatible Buffer replacement)
  stringToUint8Array(str) {
    return new TextEncoder().encode(str);
  }

  // Initialize with user's wallet
  async initialize(walletAdapter) {
    console.log('Initializing blockchain service...');
    
    if (!walletAdapter || !walletAdapter.publicKey) {
      throw new Error('Wallet not connected');
    }

    this.wallet = walletAdapter;
    
    // Test connection
    const version = await this.connection.getVersion();
    console.log('Solana RPC connection successful:', version);

    // Load IDL if not already loaded
    if (!farmDirectIdl) {
      try {
        // Try fetching from public directory (most reliable for Vite)
        const response = await fetch('/farm_direct.json');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        farmDirectIdl = await response.json();
        console.log('IDL loaded from public directory');
        
        // Debug: Log raw IDL to see what we actually got
        console.log('Raw IDL metadata:', {
          name: farmDirectIdl.name,
          version: farmDirectIdl.version,
          hasInstructions: !!farmDirectIdl.instructions,
          hasTypes: !!farmDirectIdl.types,
          instructionCount: farmDirectIdl.instructions?.length,
          typeCount: farmDirectIdl.types?.length
        });
        
      } catch (error) {
        console.warn('Could not load IDL from public directory:', error.message);
        try {
          // Try importing from src directory as fallback
          const idlModule = await import('../farm_direct.json');
          farmDirectIdl = idlModule.default || idlModule;
          console.log('IDL loaded from src directory');
        } catch (importError) {
          console.error('Could not load IDL from anywhere:', importError);
          throw new Error('Farm Direct IDL not found. Please ensure farm_direct.json is available in the public directory.');
        }
      }
    }

    // Validate IDL structure
    if (!farmDirectIdl || typeof farmDirectIdl !== 'object') {
      throw new Error('Invalid IDL structure - not an object');
    }

    if (!farmDirectIdl.instructions || !Array.isArray(farmDirectIdl.instructions)) {
      throw new Error('Invalid IDL structure - missing instructions array');
    }

    if (!farmDirectIdl.types || !Array.isArray(farmDirectIdl.types)) {
      throw new Error('Invalid IDL structure - missing types array');
    }

    // Ensure IDL has required metadata
    if (!farmDirectIdl.name) {
      farmDirectIdl.name = farmDirectIdl.metadata?.name || 'farm_direct_blockchain';
    }

    if (!farmDirectIdl.version) {
      farmDirectIdl.version = '0.1.0';
    }

    // Check for required types
    const requiredTypes = ['DeliveryStatus', 'GrowthStage', 'CampaignType'];
    const availableTypes = farmDirectIdl.types.map(t => t.name);
    const missingTypes = requiredTypes.filter(type => !availableTypes.includes(type));
    
    if (missingTypes.length > 0) {
      console.error('Missing required types in IDL:', missingTypes);
      console.log('Available types:', availableTypes);
      
      // Log full IDL for debugging
      console.log('Full IDL structure:', JSON.stringify(farmDirectIdl, null, 2));
    }

    console.log('IDL loaded successfully:', farmDirectIdl.name);
    console.log('IDL contains', farmDirectIdl.instructions.length, 'instructions and', farmDirectIdl.types.length, 'types');

    // Initialize the program
    let provider;
    try {
      provider = new anchor.AnchorProvider(
        this.connection,
        walletAdapter,
        { 
          commitment: 'confirmed',
          preflightCommitment: 'confirmed'
        }
      );
      
      anchor.setProvider(provider);
      
      // Ensure program ID matches IDL
      const idlAddress = farmDirectIdl.address || farmDirectIdl.metadata?.address;
      if (idlAddress && idlAddress !== this.programId.toString()) {
        console.warn(`Program ID mismatch! Service: ${this.programId.toString()}, IDL: ${idlAddress}`);
      }
      
      console.log('Creating Anchor Program with:');
      console.log('- Program ID:', this.programId.toString());
      console.log('- IDL name:', farmDirectIdl.name || farmDirectIdl.metadata?.name);
      console.log('- Provider wallet:', provider.wallet.publicKey.toString());
      
      // Create program with explicit program ID
      this.program = new anchor.Program(farmDirectIdl, this.programId, provider);
      console.log('Anchor Program created successfully');
      console.log('Blockchain service initialized with wallet:', walletAdapter.publicKey.toString());
      
    } catch (programError) {
      console.error('Failed to initialize Anchor program:', programError);
      console.error('Program error details:', {
        name: programError.name,
        message: programError.message,
        stack: programError.stack
      });
      
      // Try a workaround - create a modified IDL without problematic instructions
      if (programError.message.includes('DeliveryStatus') || programError.message.includes('GrowthStage') || programError.message.includes('Type not found')) {
        console.warn('Attempting comprehensive workaround: creating minimal IDL...');
        try {
          // Create a minimal IDL with only basic instructions that don't use complex enum types
          const minimalIdl = {
            ...farmDirectIdl,
            instructions: farmDirectIdl.instructions.filter(instruction => {
              // Keep only simple instructions without complex enum parameters
              const safeInstructions = [
                'initialize_farmer',
                'update_farmer_profile', 
                'create_product',
                'update_actual_quantity'
              ];
              return safeInstructions.includes(instruction.name);
            })
          };
          
          console.log('Creating program with minimal IDL...');
          console.log('Safe instructions:', minimalIdl.instructions.map(i => i.name));
          
          this.program = new anchor.Program(minimalIdl, this.programId, provider);
          console.log('✅ Minimal workaround successful - Program initialized with basic functionality');
          console.log('⚠️  Note: Growth tracking, delivery updates, and crowdfunding are temporarily disabled');
          
        } catch (minimalError) {
          console.error('Even minimal workaround failed:', minimalError);
          
          // Final fallback - create an extremely basic IDL with just farmer profile
          try {
            console.warn('Attempting final fallback: farmer profile only...');
            const basicIdl = {
              name: 'farm_direct_blockchain',
              version: '0.1.0',
              instructions: [
                {
                  name: 'initialize_farmer',
                  accounts: [
                    { name: 'farmer_profile', isMut: true, isSigner: true },
                    { name: 'farmer', isMut: true, isSigner: true },
                    { name: 'system_program', isMut: false, isSigner: false }
                  ],
                  args: [
                    { name: 'encrypted_data', type: 'string' },
                    { name: 'public_name', type: 'string' },
                    { name: 'region', type: 'string' },
                    { name: 'certifications', type: { vec: 'string' } }
                  ]
                }
              ],
              accounts: [
                {
                  name: 'FarmerProfile',
                  type: {
                    kind: 'struct',
                    fields: [
                      { name: 'farmer', type: 'publicKey' },
                      { name: 'encrypted_data', type: 'string' },
                      { name: 'public_name', type: 'string' },
                      { name: 'region', type: 'string' },
                      { name: 'certifications', type: { vec: 'string' } },
                      { name: 'verification_status', type: 'bool' },
                      { name: 'reputation_score', type: 'u64' },
                      { name: 'total_products', type: 'u64' },
                      { name: 'created_at', type: 'i64' },
                      { name: 'updated_at', type: 'i64' }
                    ]
                  }
                }
              ],
              types: [],
              errors: []
            };
            
            this.program = new anchor.Program(basicIdl, this.programId, provider);
            console.log('✅ Basic fallback successful - Farmer profile functionality only');
            console.log('⚠️  Note: Only farmer profile initialization will work');
            
          } catch (basicError) {
            console.error('All workarounds failed:', basicError);
            throw new Error(`Program initialization failed completely. Original error: ${programError.message}`);
          }
        }
      } else {
        throw new Error(`Program initialization failed: ${programError.message}`);
      }
    }
    
    // Verify program exists on blockchain
    try {
      const accountInfo = await this.connection.getAccountInfo(this.programId);
      if (!accountInfo) {
        throw new Error('Program account not found on blockchain');
      }
      console.log('Program account verified on blockchain');
    } catch (verifyError) {
      console.warn('Could not verify program account:', verifyError.message);
      // Don't throw here as the program might still work
    }
  }

  // Encrypt sensitive data
  encryptSensitiveData(data) {
    const dataString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(dataString, this.encryptionKey).toString();
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
      } catch  {
        throw new Error('Failed to decrypt sensitive data');
      }
    }
  }

  // Initialize farmer profile on blockchain
  async initializeFarmerProfile(userProfile) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    console.log('Initializing farmer profile on blockchain for:', userProfile.uid);

    // Prepare sensitive data for encryption
    const sensitiveData = {
      email: userProfile.email,
      phone: userProfile.phone || '',
      fullAddress: userProfile.fullAddress || '',
      taxId: userProfile.taxId || '',
    };

    const encryptedData = this.encryptSensitiveData(sensitiveData);

    // Generate PDA for farmer profile
    const [farmerProfilePDA] = await PublicKey.findProgramAddress(
      [
        this.stringToUint8Array('farmer_profile'),
        this.wallet.publicKey.toBuffer(),
      ],
      this.programId
    );

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
      .rpc();

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
  }

  // Update farmer profile on blockchain
  async updateFarmerProfile(userProfile, changes) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

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
      .rpc();

    console.log('Farmer profile updated on blockchain:', tx);

    // Update Firestore
    await updateDoc(doc(db, 'users', userProfile.uid), {
      lastBlockchainUpdate: new Date().toISOString(),
    });

    return tx;
  }

  // Create product on blockchain
  async createProduct(userProfile, productData) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    console.log('Creating product on blockchain:', productData.name);

    // Generate PDA for product
    const [productPDA] = await PublicKey.findProgramAddress(
      [
        this.stringToUint8Array('product'),
        this.wallet.publicKey.toBuffer(),
        this.stringToUint8Array(productData.id.substring(0, 8)),
      ],
      this.programId
    );

    const farmerProfilePDA = new PublicKey(userProfile.blockchainProfilePDA);

    const tx = await this.program.methods
      .createProduct(
        productData.name,
        productData.category,
        productData.description,
        Math.floor(new Date(productData.estimatedHarvestDate || Date.now() + 90 * 24 * 60 * 60 * 1000).getTime() / 1000),
        productData.stockQuantity || 0,
        productData.images || []
      )
      .accounts({
        productCycle: productPDA,
        farmerProfile: farmerProfilePDA,
        farmer: this.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log('Product created on blockchain:', tx);

    // Update product in Firestore with PDA
    await updateDoc(doc(db, 'products', productData.id), {
      blockchainPDA: productPDA.toString(),
      blockchainSynced: true,
      lastBlockchainUpdate: new Date().toISOString(),
    });

    return { tx, pda: productPDA.toString() };
  }

  // Add growth update to blockchain
  async addGrowthUpdate(productId, updateData) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    console.log('Adding growth update to blockchain:', productId, updateData.stage);

    const productPDA = new PublicKey(updateData.blockchainPDA);

    // Stage mapping
    const stageMapping = {
      'seeding': { seeding: {} },
      'germination': { germination: {} },
      'growing': { growing: {} },
      'flowering': { flowering: {} },
      'fruiting': { fruiting: {} },
      'harvest': { harvest: {} },
      'post_harvest': { postHarvest: {} },
    };

    const stage = stageMapping[updateData.stage] || { growing: {} };

    const tx = await this.program.methods
      .addGrowthUpdate(
        stage,
        updateData.notes || '',
        updateData.images || []
      )
      .accounts({
        productCycle: productPDA,
        farmer: this.wallet.publicKey,
      })
      .rpc();

    console.log('Growth update added to blockchain:', tx);
    return tx;
  }

  // Update actual quantity on blockchain
  async updateActualQuantity(productId, actualQuantity) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    // Get product PDA from Firestore
    const productDoc = await getDoc(doc(db, 'products', productId));
    if (!productDoc.exists() || !productDoc.data().blockchainPDA) {
      throw new Error('Product not found on blockchain');
    }

    const productPDA = new PublicKey(productDoc.data().blockchainPDA);

    const tx = await this.program.methods
      .updateActualQuantity(actualQuantity)
      .accounts({
        productCycle: productPDA,
        farmer: this.wallet.publicKey,
      })
      .rpc();

    console.log('Actual quantity updated on blockchain:', tx);
    return tx;
  }

  // Add delivery update to blockchain
  async addDeliveryUpdate(orderId, statusData) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    // Check if delivery update instruction is available
    if (!this.program.methods.addDeliveryUpdate) {
      console.warn('Delivery update functionality is not available (instruction was filtered out during initialization)');
      throw new Error('Delivery update functionality is temporarily disabled due to IDL compatibility issues');
    }

    // Delivery status mapping
    const statusMapping = {
      'preparing': { preparing: {} },
      'packed': { packed: {} },
      'in_transit': { inTransit: {} },
      'delivered': { delivered: {} },
      'completed': { completed: {} },
    };

    const status = statusMapping[statusData.status] || { preparing: {} };

    // Find product PDA based on order
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const orderData = orderDoc.data();
    let productPDA;

    if (orderData.items && orderData.items.length > 0) {
      const productDoc = await getDoc(doc(db, 'products', orderData.items[0].productId));
      productPDA = new PublicKey(productDoc.data().blockchainPDA);
    } else if (orderData.productId) {
      const productDoc = await getDoc(doc(db, 'products', orderData.productId));
      productPDA = new PublicKey(productDoc.data().blockchainPDA);
    } else {
      throw new Error('Product PDA not found');
    }

    const tx = await this.program.methods
      .addDeliveryUpdate(
        status,
        statusData.notes || '',
        statusData.location || null
      )
      .accounts({
        productCycle: productPDA,
        farmer: this.wallet.publicKey,
      })
      .rpc();

    console.log('Delivery update added to blockchain:', tx);
    return tx;
  }

  // Create crowdfunding campaign on blockchain
  async createCrowdfundingCampaign(userProfile, campaignData) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    console.log('Creating crowdfunding campaign on blockchain:', campaignData.title);

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

    // Campaign type mapping
    const typeMapping = {
      'equipment': { equipment: {} },
      'seeds': { seeds: {} },
      'infrastructure': { infrastructure: {} },
      'expansion': { expansion: {} },
      'emergency': { emergency: {} },
    };

    const campaignType = typeMapping[campaignData.type] || { equipment: {} };

    const tx = await this.program.methods
      .createCrowdfundingCampaign(
        campaignData.title,
        campaignData.description,
        campaignData.goalAmount * anchor.web3.LAMPORTS_PER_SOL,
        Math.floor(new Date(campaignData.deadline).getTime() / 1000),
        campaignType,
        campaignData.milestones || []
      )
      .accounts({
        campaign: campaignPDA,
        campaignVault: campaignVaultPDA,
        farmer: this.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log('Crowdfunding campaign created on blockchain:', tx);

    // Update campaign in Firestore
    await updateDoc(doc(db, 'crowdfunding', campaignData.id), {
      blockchainPDA: campaignPDA.toString(),
      vaultPDA: campaignVaultPDA.toString(),
      blockchainSynced: true,
      lastBlockchainUpdate: new Date().toISOString(),
    });

    return { tx, pda: campaignPDA.toString(), vault: campaignVaultPDA.toString() };
  }

  // Contribute to crowdfunding campaign
  async contributeToCampaign(campaignId, amount, contributorWallet) {
    if (!this.program) {
      throw new Error('Blockchain service not initialized');
    }

    // Get campaign data from Firestore
    const campaignDoc = await getDoc(doc(db, 'crowdfunding', campaignId));
    if (!campaignDoc.exists() || !campaignDoc.data().blockchainPDA) {
      throw new Error('Campaign not found on blockchain');
    }

    const campaignData = campaignDoc.data();
    const campaignPDA = new PublicKey(campaignData.blockchainPDA);
    const vaultPDA = new PublicKey(campaignData.vaultPDA);

    const tx = await this.program.methods
      .contributeToCampaign(amount * anchor.web3.LAMPORTS_PER_SOL)
      .accounts({
        campaign: campaignPDA,
        campaignVault: vaultPDA,
        contributor: contributorWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([contributorWallet])
      .rpc();

    console.log('Contribution made to campaign:', tx);
    return tx;
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

    const [farmerProfilePDA] = await PublicKey.findProgramAddress(
      [
        this.stringToUint8Array('farmer_profile'),
        new PublicKey(farmerWallet).toBuffer(),
      ],
      this.programId
    );

    const profileAccount = await this.program.account.farmerProfile.fetch(farmerProfilePDA);
    
    // Decrypt sensitive data
    const sensitiveData = this.decryptSensitiveData(profileAccount.encryptedData);

    return {
      ...profileAccount,
      sensitiveData,
      pda: farmerProfilePDA.toString(),
    };
  }

  // Fetch product cycle from blockchain
  async fetchProductCycle(productPDA) {
    if (!this.program) {
      throw new Error('Blockchain service not initialized');
    }

    console.log('Fetching product cycle from blockchain:', productPDA);

    const productAccount = await this.program.account.productCycle.fetch(new PublicKey(productPDA));
    return {
      ...productAccount,
      pda: productPDA,
    };
  }

  // Start automatic synchronization
  startAutoSync(userId) {
    console.log('Starting auto-sync for user:', userId);

    // Listen for changes in user profile
    const userDocRef = doc(db, 'users', userId);
    const unsubscribeUser = onSnapshot(userDocRef, async (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        
        // Check if synchronization is needed
        if (this.shouldSync('user', userData)) {
          try {
            if (!userData.blockchainProfilePDA) {
              await this.initializeFarmerProfile(userData);
            } else {
              console.log('User profile sync needed - update implementation required');
            }
          } catch (error) {
            console.error('Auto-sync error for user:', error);
          }
        }
      }
    });

    return () => {
      unsubscribeUser();
      console.log('Auto-sync stopped for user:', userId);
    };
  }

  // Check if data should be synced
  shouldSync(type, data) {
    const lastUpdate = data.updatedAt || data.lastModified;
    const lastBlockchainUpdate = data.lastBlockchainUpdate;
    
    if (!lastBlockchainUpdate) return true;
    
    return new Date(lastUpdate) > new Date(lastBlockchainUpdate);
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: !!this.wallet,
      walletAddress: this.wallet?.publicKey?.toString(),
      programId: this.programId.toString(),
      cluster: 'devnet',
      initialized: !!this.program
    };
  }

  // Check if service is ready
  isReady() {
    return !!(this.program && this.wallet);
  }
}

// Singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;