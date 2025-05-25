// src/utils/idlFixer.js - IDL Compatibility Fixer

/**
 * Fixes common IDL compatibility issues for Anchor programs
 */
export class IdlFixer {
  constructor(idl) {
    this.idl = JSON.parse(JSON.stringify(idl)); // Deep clone
  }

  /**
   * Apply all fixes to make IDL compatible with Anchor client
   */
  fix() {
    console.log('Applying IDL fixes...');
    
    this.addMissingFields();
    this.fixDiscriminators();
    this.validateStructure();
    
    console.log('IDL fixes completed');
    return this.idl;
  }

  /**
   * Add missing required fields
   */
  addMissingFields() {
    // Ensure version field exists
    if (!this.idl.version) {
      this.idl.version = '0.1.0';
      console.log('✓ Added missing version field');
    }

    // Ensure metadata exists
    if (!this.idl.metadata) {
      this.idl.metadata = {
        name: this.idl.name || 'farm_direct',
        version: '0.1.0',
        spec: '0.1.0',
        description: 'Farm Direct Blockchain Program'
      };
      console.log('✓ Added missing metadata');
    }
  }

  /**
   * Fix instruction and account discriminators
   */
  fixDiscriminators() {
    // Fix instruction discriminators using method name hashing
    this.idl.instructions.forEach(instruction => {
      if (!instruction.discriminator || !Array.isArray(instruction.discriminator)) {
        instruction.discriminator = this.generateInstructionDiscriminator(instruction.name);
        console.log(`✓ Fixed discriminator for instruction: ${instruction.name}`);
      }
    });

    // Fix account discriminators using account name hashing
    this.idl.accounts.forEach(account => {
      if (!account.discriminator || !Array.isArray(account.discriminator)) {
        account.discriminator = this.generateAccountDiscriminator(account.name);
        console.log(`✓ Fixed discriminator for account: ${account.name}`);
      }
    });
  }

  /**
   * Generate instruction discriminator from method name
   */
  generateInstructionDiscriminator(methodName) {
    // Simple hash-based approach using built-in string hashing
    let hash = 0;
    const str = `global:${methodName}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to 8-byte array
    const discriminator = new Array(8).fill(0);
    for (let i = 0; i < 4; i++) {
      discriminator[i] = (hash >> (i * 8)) & 0xFF;
    }
    
    return discriminator;
  }

  /**
   * Generate account discriminator from account name
   */
  generateAccountDiscriminator(accountName) {
    // Simple hash-based approach using built-in string hashing
    let hash = 0;
    const str = `account:${accountName}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to 8-byte array
    const discriminator = new Array(8).fill(0);
    for (let i = 0; i < 4; i++) {
      discriminator[i] = (hash >> (i * 8)) & 0xFF;
    }
    
    return discriminator;
  }

  /**
   * Validate the fixed IDL structure
   */
  validateStructure() {
    const requiredFields = ['version', 'name', 'instructions', 'accounts', 'types'];
    const missingFields = requiredFields.filter(field => !this.idl[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`IDL missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate instructions have discriminators
    const instructionsWithoutDiscriminators = this.idl.instructions.filter(
      inst => !inst.discriminator || inst.discriminator.length !== 8
    );
    
    if (instructionsWithoutDiscriminators.length > 0) {
      throw new Error(`Instructions without proper discriminators: ${
        instructionsWithoutDiscriminators.map(i => i.name).join(', ')
      }`);
    }

    // Validate accounts have discriminators
    const accountsWithoutDiscriminators = this.idl.accounts.filter(
      acc => !acc.discriminator || acc.discriminator.length !== 8
    );
    
    if (accountsWithoutDiscriminators.length > 0) {
      throw new Error(`Accounts without proper discriminators: ${
        accountsWithoutDiscriminators.map(a => a.name).join(', ')
      }`);
    }

    console.log('✓ IDL structure validation passed');
  }

  /**
   * Export fixed IDL as JSON string
   */
  toJSON() {
    return JSON.stringify(this.idl, null, 2);
  }

  /**
   * Get summary of applied fixes
   */
  getSummary() {
    return {
      version: this.idl.version,
      name: this.idl.name,
      instructions: this.idl.instructions.length,
      accounts: this.idl.accounts.length,
      types: this.idl.types.length,
      metadata: !!this.idl.metadata
    };
  }
}

/**
 * Quick fix function for IDL
 */
export function fixIdl(idl) {
  const fixer = new IdlFixer(idl);
  return fixer.fix();
}

/**
 * Download fixed IDL file
 */
export function downloadFixedIdl(idl, filename = 'farm_direct_fixed.json') {
  const fixer = new IdlFixer(idl);
  const fixedIdl = fixer.fix();
  
  const blob = new Blob([JSON.stringify(fixedIdl, null, 2)], { 
    type: 'application/json' 
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
  
  return fixer.getSummary();
}