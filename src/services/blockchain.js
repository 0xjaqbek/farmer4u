// src/services/blockchain.js
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair, clusterApiUrl } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import CryptoJS from 'crypto-js';
import { db } from '../firebase/config.jsx';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

// IDL smart contractu (wygenerowany przez Anchor)
import farmDirectIdl from '../idl/farm_direct.json';

class BlockchainService {
  constructor() {
    // Połączenie z Solana Devnet
    this.connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    this.programId = new PublicKey('FarmDirect11111111111111111111111111111111');
    this.program = null;
    this.wallet = null;
    
    // Klucz do szyfrowania wrażliwych danych (w produkcji z env)
    this.encryptionKey = process.env.REACT_APP_ENCRYPTION_KEY || 'fallback-key-for-dev';
    
    // Cache dla już zsynchronizowanych danych
    this.syncedData = new Map();
  }

  // Inicjalizacja z wallet użytkownika
  async initialize(wallet) {
    if (!wallet || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    this.wallet = wallet;
    const provider = new anchor.AnchorProvider(
      this.connection,
      wallet,
      { commitment: 'confirmed' }
    );
    
    this.program = new anchor.Program(farmDirectIdl,, provider);
    console.log('Blockchain service initialized with wallet:', wallet.publicKey.toString());
  }

  // Szyfrowanie wrażliwych danych
  encryptSensitiveData(data) {
    const dataString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(dataString, this.encryptionKey).toString();
  }

  // Deszyfrowanie wrażliwych danych
  decryptSensitiveData(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  // Inicjalizacja profilu rolnika na blockchain
  async initializeFarmerProfile(userProfile) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Przygotuj wrażliwe dane do zaszyfrowania
      const sensitiveData = {
        email: userProfile.email,
        phone: userProfile.phone || '',
        fullAddress: userProfile.fullAddress || '',
        taxId: userProfile.taxId || '',
      };

      const encryptedData = this.encryptSensitiveData(sensitiveData);

      // Wygeneruj PDA dla profilu rolnika
      const [farmerProfilePDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from('farmer_profile'),
          this.wallet.publicKey.toBuffer(),
        ],
        this.programId
      );

      // Wywołaj smart contract
      const tx = await this.program.methods
        .initializeFarmer(
          encryptedData,
          `${userProfile.firstName} ${userProfile.lastName}`,
          userProfile.region || userProfile.postalCode?.substring(0, 2),
          userProfile.certifications || []
        )
        .accounts({
          farmerProfile: farmerProfilePDA,
          farmer: this.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log('Farmer profile initialized on blockchain:', tx);

      // Zaktualizuj Firestore z PDA
      await updateDoc(doc(db, 'users', userProfile.uid), {
        blockchainProfilePDA: farmerProfilePDA.toString(),
        blockchainSynced: true,
        lastBlockchainUpdate: new Date().toISOString(),
      });

      return { tx, pda: farmerProfilePDA.toString() };

    } catch (error) {
      console.error('Error initializing farmer profile on blockchain:', error);
      throw error;
    }
  }

  // Aktualizacja profilu rolnika na blockchain
  async updateFarmerProfile(userProfile, changes) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const farmerProfilePDA = new PublicKey(userProfile.blockchainProfilePDA);

      // Przygotuj dane do aktualizacji
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

      // Zaktualizuj Firestore
      await updateDoc(doc(db, 'users', userProfile.uid), {
        lastBlockchainUpdate: new Date().toISOString(),
      });

      return tx;

    } catch (error) {
      console.error('Error updating farmer profile on blockchain:', error);
      throw error;
    }
  }

  // Utworzenie produktu na blockchain
  async createProduct(userProfile, productData) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Wygeneruj PDA dla produktu
      const [productPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from('product'),
          this.wallet.publicKey.toBuffer(),
          Buffer.from(productData.id.substring(0, 8)), // Skrócony ID produktu
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

      // Zaktualizuj produkt w Firestore z PDA
      await updateDoc(doc(db, 'products', productData.id), {
        blockchainPDA: productPDA.toString(),
        blockchainSynced: true,
        lastBlockchainUpdate: new Date().toISOString(),
      });

      return { tx, pda: productPDA.toString() };

    } catch (error) {
      console.error('Error creating product on blockchain:', error);
      throw error;
    }
  }

  // Dodanie aktualizacji wzrostu produktu
  async addGrowthUpdate(productId, updateData) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const productPDA = new PublicKey(updateData.blockchainPDA);

      // Mapowanie stage'ów
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

    } catch (error) {
      console.error('Error adding growth update to blockchain:', error);
      throw error;
    }
  }

  // Aktualizacja rzeczywistej ilości produktu
  async updateActualQuantity(productId, actualQuantity) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Pobierz PDA produktu z Firestore
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

    } catch (error) {
      console.error('Error updating actual quantity on blockchain:', error);
      throw error;
    }
  }

  // Dodanie aktualizacji dostawy
  async addDeliveryUpdate(orderId, statusData) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Mapowanie statusów dostawy
      const statusMapping = {
        'preparing': { preparing: {} },
        'packed': { packed: {} },
        'in_transit': { inTransit: {} },
        'delivered': { delivered: {} },
        'completed': { completed: {} },
      };

      const status = statusMapping[statusData.status] || { preparing: {} };

      // Znajdź PDA produktu na podstawie zamówienia
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

    } catch (error) {
      console.error('Error adding delivery update to blockchain:', error);
      throw error;
    }
  }

  // Tworzenie kampanii crowdfundingowej
  async createCrowdfundingCampaign(userProfile, campaignData) {
    if (!this.program || !this.wallet) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Wygeneruj PDA dla kampanii
      const [campaignPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from('campaign'),
          this.wallet.publicKey.toBuffer(),
          Buffer.from(campaignData.id.substring(0, 8)),
        ],
        this.programId
      );

      // Wygeneruj vault dla kampanii
      const [campaignVaultPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from('campaign_vault'),
          campaignPDA.toBuffer(),
        ],
        this.programId
      );

      // Mapowanie typu kampanii
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
          campaignData.goalAmount * anchor.web3.LAMPORTS_PER_SOL, // Konwertuj SOL na lamporty
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

      // Zaktualizuj kampanię w Firestore
      await updateDoc(doc(db, 'crowdfunding', campaignData.id), {
        blockchainPDA: campaignPDA.toString(),
        vaultPDA: campaignVaultPDA.toString(),
        blockchainSynced: true,
        lastBlockchainUpdate: new Date().toISOString(),
      });

      return { tx, pda: campaignPDA.toString(), vault: campaignVaultPDA.toString() };

    } catch (error) {
      console.error('Error creating crowdfunding campaign on blockchain:', error);
      throw error;
    }
  }

  // Wpłata na kampanię crowdfundingową
  async contributeToCampaign(campaignId, amount, contributorWallet) {
    if (!this.program) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Pobierz dane kampanii z Firestore
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

    } catch (error) {
      console.error('Error contributing to campaign:', error);
      throw error;
    }
  }

  // Automatyczna synchronizacja - nasłuchuje zmian w Firestore
  startAutoSync(userId) {
    console.log('Starting auto-sync for user:', userId);

    // Nasłuchuj zmian w profilu użytkownika
    const userDocRef = doc(db, 'users', userId);
    const unsubscribeUser = onSnapshot(userDocRef, async (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        
        // Sprawdź czy trzeba zsynchronizować
        if (this.shouldSync('user', userData)) {
          try {
            if (!userData.blockchainProfilePDA) {
              await this.initializeFarmerProfile(userData);
            } else {
              // TODO: Implementuj detection zmian i update
              console.log('User profile sync needed');
            }
          } catch (error) {
            console.error('Auto-sync error for user:', error);
          }
        }
      }
    });

    return () => {
      unsubscribeUser();
    };
  }

  // Sprawdź czy dane wymagają synchronizacji
  shouldSync(type, data) {
    const lastUpdate = data.updatedAt || data.lastModified;
    const lastBlockchainUpdate = data.lastBlockchainUpdate;
    
    if (!lastBlockchainUpdate) return true;
    
    return new Date(lastUpdate) > new Date(lastBlockchainUpdate);
  }

  // Pobierz dane z blockchain
  async fetchFarmerProfile(farmerWallet) {
    if (!this.program) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const [farmerProfilePDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from('farmer_profile'),
          new PublicKey(farmerWallet).toBuffer(),
        ],
        this.programId
      );

      const profileAccount = await this.program.account.farmerProfile.fetch(farmerProfilePDA);
      
      // Odszyfruj wrażliwe dane
      const sensitiveData = this.decryptSensitiveData(profileAccount.encryptedData);

      return {
        ...profileAccount,
        sensitiveData,
        pda: farmerProfilePDA.toString(),
      };

    } catch (error) {
      console.error('Error fetching farmer profile from blockchain:', error);
      return null;
    }
  }

  // Pobierz dane produktu z blockchain
  async fetchProductCycle(productPDA) {
    if (!this.program) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const productAccount = await this.program.account.productCycle.fetch(new PublicKey(productPDA));
      return {
        ...productAccount,
        pda: productPDA,
      };

    } catch (error) {
      console.error('Error fetching product from blockchain:', error);
      return null;
    }
  }
}

// Singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;