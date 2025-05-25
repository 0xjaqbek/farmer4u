// src/services/blockchain.js - Fixed Implementation
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import CryptoJS from 'crypto-js';
import { db } from '../firebase/config.jsx';
import { doc, updateDoc} from 'firebase/firestore';

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

      // Load IDL from the public directory with better error handling
      console.log('Loading IDL from /farm_direct.json...');
      let response;
      try {
        response = await fetch('/farm_direct.json');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (fetchError) {
        console.error('Failed to fetch IDL:', fetchError);
        throw new Error(`Failed to load IDL file: ${fetchError.message}`);
      }
      
      try {
        this.idl = await response.json();
        console.log('IDL loaded successfully:', this.idl.metadata?.name || this.idl.name);
      } catch (parseError) {
        console.error('Failed to parse IDL JSON:', parseError);
        throw new Error(`Failed to parse IDL JSON: ${parseError.message}`);
      }

      // Validate IDL structure
      this.validateIdl();

      // Create provider with better error handling
      try {
        this.provider = new anchor.AnchorProvider(
          this.connection,
          walletAdapter,
          { 
            commitment: 'confirmed',
            preflightCommitment: 'confirmed',
            skipPreflight: false
          }
        );
        
        anchor.setProvider(this.provider);
        console.log('Provider created successfully');
      } catch (providerError) {
        console.error('Failed to create provider:', providerError);
        throw new Error(`Failed to create Anchor provider: ${providerError.message}`);
      }
      
      // Create program instance with better error handling
      try {
        // Validate program ID format
        if (!this.programId || this.programId.toString().length !== 44) {
          throw new Error('Invalid program ID format');
        }

        // Log detailed information for debugging
        console.log('Creating program with:');
        console.log('- Program ID:', this.programId.toString());
        console.log('- IDL metadata:', this.idl.metadata);
        console.log('- Anchor version:', anchor.VERSION || 'unknown');

        // Check if IDL has the expected structure for Anchor
        if (!this.idl.version) {
          console.warn('IDL missing version field - this might cause compatibility issues');
        }

        // Attempt to create the program with error isolation
        try {
          this.program = new anchor.Program(this.idl, this.programId, this.provider);
        } catch (innerError) {
          console.error('Inner program creation error:', innerError);
          console.error('Error stack:', innerError.stack);
          
          // Try alternative approach - create program with explicit address
          console.log('Attempting alternative program creation...');
          this.program = new anchor.Program(this.idl, this.provider);
          this.program.programId = this.programId;
        }

        if (!this.program) {
          throw new Error('Program instance is null after creation');
        }

        console.log('Program initialized successfully');
        console.log('Program ID verification:', this.program.programId?.toString());
        console.log('Available methods:', Object.keys(this.program.methods || {}));
        console.log('Available accounts:', Object.keys(this.program.account || {}));
        
        // Verify critical methods exist
        const requiredMethods = ['initializeFarmer', 'createProduct', 'addGrowthUpdate'];
        const availableMethods = Object.keys(this.program.methods || {});
        const missingMethods = requiredMethods.filter(method => !availableMethods.includes(method));
        
        if (missingMethods.length > 0) {
          console.warn('Missing expected methods:', missingMethods);
        }

      } catch (programError) {
        console.error('Failed to create program:', programError);
        console.error('Program ID:', this.programId.toString());
        console.error('Provider details:', {
          connection: !!this.provider.connection,
          wallet: !!this.provider.wallet,
          commitment: this.provider.opts?.commitment
        });
        console.error('IDL structure:', {
          instructions: this.idl.instructions?.length || 0,
          accounts: this.idl.accounts?.length || 0,
          types: this.idl.types?.length || 0,
          version: this.idl.version,
          metadata: this.idl.metadata
        });
        
        // Log the full IDL for debugging (only first few instructions to avoid spam)
        console.log('IDL instructions (first 3):', this.idl.instructions?.slice(0, 3));
        console.log('IDL accounts:', this.idl.accounts?.map(acc => acc.name));
        
        throw new Error(`Failed to create Anchor program: ${programError.message}`);
      }
      
      return true;
      
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      this.cleanup();
      throw new Error(`Blockchain initialization failed: ${error.message}`);
    }
  }

  // Validate IDL structure
  validateIdl() {
    if (!this.idl) {
      throw new Error('IDL not loaded');
    }

    console.log('Validating IDL structure...');

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

    // Log available types for debugging
    const availableTypes = this.idl.types.map(t => t.name);
    console.log('Available types in IDL:', availableTypes);

    // Check for required types
    const requiredTypes = ['DeliveryStatus', 'GrowthStage', 'CampaignType'];
    const missingTypes = requiredTypes.filter(type => !availableTypes.includes(type));
    
    if (missingTypes.length > 0) {
      console.warn('Warning: Missing types in IDL:', missingTypes);
      // Print the actual types to help debug
      console.log('IDL types structure:', this.idl.types);
    }

    // Validate specific type structures
    const deliveryStatus = this.idl.types.find(t => t.name === 'DeliveryStatus');
    if (deliveryStatus) {
      console.log('DeliveryStatus type found:', deliveryStatus);
    } else {
      console.error('DeliveryStatus type not found in IDL');
      throw new Error('Required type DeliveryStatus not found in IDL');
    }

    // Fix common IDL compatibility issues
    this.fixIdlCompatibility();

    console.log('IDL structure validated successfully');
  }

  // Fix IDL compatibility issues
  fixIdlCompatibility() {
    console.log('Applying IDL compatibility fixes...');

    // Ensure version field exists
    if (!this.idl.version) {
      this.idl.version = '0.1.0';
      console.log('Added missing version field to IDL');
    }

    // Ensure metadata exists
    if (!this.idl.metadata) {
      this.idl.metadata = {
        name: 'farm_direct',
        version: '0.1.0',
        spec: '0.1.0'
      };
      console.log('Added missing metadata to IDL');
    }

    // Fix instruction discriminators if they're missing
    this.idl.instructions.forEach((instruction, index) => {
      if (!instruction.discriminator || !Array.isArray(instruction.discriminator)) {
        console.warn(`Instruction ${instruction.name} missing discriminator`);
        // Generate a simple discriminator (this should match your Rust program)
        instruction.discriminator = [index, 0, 0, 0, 0, 0, 0, 0];
      }
    });

    // Fix account discriminators if they're missing
    this.idl.accounts.forEach((account, index) => {
      if (!account.discriminator || !Array.isArray(account.discriminator)) {
        console.warn(`Account ${account.name} missing discriminator`);
        // Generate a simple discriminator
        account.discriminator = [100 + index, 0, 0, 0, 0, 0, 0, 0];
      }
    });

    // Ensure all types have proper structure
    this.idl.types.forEach(type => {
      if (!type.type) {
        console.warn(`Type ${type.name} missing type definition`);
      }
    });

    console.log('IDL compatibility fixes applied');
  }

  // Cleanup method
  cleanup() {
    this.program = null;
    this.provider = null;
    this.wallet = null;
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
      idlLoaded: !!this.idl,
      providerReady: !!this.provider
    };
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
}

// Singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;