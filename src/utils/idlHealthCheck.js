// src/utils/idlHealthCheck.js - IDL Health Check Utility

/**
 * Comprehensive IDL health check utility
 */
export class IdlHealthCheck {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.info = [];
  }

  /**
   * Run complete health check on IDL
   */
  async checkIdl(idlUrl = '/farm_direct.json') {
    console.log('🔍 Starting IDL health check...');
    
    try {
      // Step 1: Check file accessibility
      const idl = await this.checkFileAccess(idlUrl);
      
      // Step 2: Validate basic structure
      this.validateBasicStructure(idl);
      
      // Step 3: Check discriminators
      this.validateDiscriminators(idl);
      
      // Step 4: Check required types
      this.validateTypes(idl);
      
      // Step 5: Check compatibility
      this.checkCompatibility(idl);
      
      // Generate report
      return this.generateReport(idl);
      
    } catch (error) {
      this.issues.push(`Failed to load IDL: ${error.message}`);
      return this.generateReport(null);
    }
  }

  /**
   * Check if IDL file is accessible
   */
  async checkFileAccess(url) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const idl = await response.json();
      this.info.push('✅ IDL file is accessible and valid JSON');
      return idl;
      
    } catch (error) {
      if (error.name === 'SyntaxError') {
        throw new Error('IDL file contains invalid JSON');
      }
      throw error;
    }
  }

  /**
   * Validate basic IDL structure
   */
  validateBasicStructure(idl) {
    const requiredFields = ['name', 'instructions', 'accounts', 'types'];
    const missingFields = requiredFields.filter(field => !idl[field]);
    
    if (missingFields.length > 0) {
      this.issues.push(`Missing required fields: ${missingFields.join(', ')}`);
    } else {
      this.info.push('✅ All required fields present');
    }

    // Check optional but recommended fields
    if (!idl.version) {
      this.warnings.push('⚠️ Missing version field (recommended)');
    }
    
    if (!idl.metadata) {
      this.warnings.push('⚠️ Missing metadata field (recommended)');
    }

    // Validate array fields
    if (!Array.isArray(idl.instructions)) {
      this.issues.push('Instructions field must be an array');
    }
    
    if (!Array.isArray(idl.accounts)) {
      this.issues.push('Accounts field must be an array');
    }
    
    if (!Array.isArray(idl.types)) {
      this.issues.push('Types field must be an array');
    }
  }

  /**
   * Validate discriminators
   */
  validateDiscriminators(idl) {
    // Check instruction discriminators
    const badInstructions = idl.instructions?.filter(inst => 
      !inst.discriminator || 
      !Array.isArray(inst.discriminator) || 
      inst.discriminator.length !== 8
    ) || [];

    if (badInstructions.length > 0) {
      this.issues.push(
        `${badInstructions.length} instructions missing valid discriminators: ${
          badInstructions.map(i => i.name).join(', ')
        }`
      );
    } else if (idl.instructions?.length > 0) {
      this.info.push('✅ All instructions have valid discriminators');
    }

    // Check account discriminators
    const badAccounts = idl.accounts?.filter(acc => 
      !acc.discriminator || 
      !Array.isArray(acc.discriminator) || 
      acc.discriminator.length !== 8
    ) || [];

    if (badAccounts.length > 0) {
      this.issues.push(
        `${badAccounts.length} accounts missing valid discriminators: ${
          badAccounts.map(a => a.name).join(', ')
        }`
      );
    } else if (idl.accounts?.length > 0) {
      this.info.push('✅ All accounts have valid discriminators');
    }
  }

  /**
   * Validate required types
   */
  validateTypes(idl) {
    const requiredTypes = ['DeliveryStatus', 'GrowthStage', 'CampaignType'];
    const availableTypes = idl.types?.map(t => t.name) || [];
    const missingTypes = requiredTypes.filter(type => !availableTypes.includes(type));

    if (missingTypes.length > 0) {
      this.issues.push(`Missing required types: ${missingTypes.join(', ')}`);
    } else {
      this.info.push('✅ All required types present');
    }

    // Check type structure
    idl.types?.forEach(type => {
      if (!type.name) {
        this.issues.push('Type missing name field');
      }
      if (!type.type) {
        this.issues.push(`Type ${type.name} missing type definition`);
      }
    });
  }

  /**
   * Check Anchor compatibility
   */
  checkCompatibility(idl) {
    // Check for common compatibility issues
    
    // IDL spec version
    if (idl.metadata?.spec && idl.metadata.spec !== '0.1.0') {
      this.warnings.push(`⚠️ IDL spec version ${idl.metadata.spec} may not be compatible`);
    }

    // Check for deprecated fields
    const deprecatedFields = ['constants', 'events'];
    deprecatedFields.forEach(field => {
      if (idl[field]) {
        this.warnings.push(`⚠️ Field ${field} is deprecated in newer Anchor versions`);
      }
    });

    // Check discriminator patterns
    const allDiscriminators = [
      ...(idl.instructions?.map(i => i.discriminator) || []),
      ...(idl.accounts?.map(a => a.discriminator) || [])
    ].filter(Boolean);

    const uniqueDiscriminators = new Set(allDiscriminators.map(d => d.join(',')));
    if (uniqueDiscriminators.size !== allDiscriminators.length) {
      this.warnings.push('⚠️ Duplicate discriminators detected - this may cause conflicts');
    }
  }

  /**
   * Generate health check report
   */
  generateReport(idl) {
    const report = {
      status: this.issues.length === 0 ? 'healthy' : 'unhealthy',
      summary: {
        issues: this.issues.length,
        warnings: this.warnings.length,
        info: this.info.length
      },
      details: {
        issues: this.issues,
        warnings: this.warnings,
        info: this.info
      },
      idl: idl ? {
        name: idl.name,
        version: idl.version || 'not specified',
        instructions: idl.instructions?.length || 0,
        accounts: idl.accounts?.length || 0,
        types: idl.types?.length || 0,
        hasMetadata: !!idl.metadata
      } : null,
      recommendations: this.generateRecommendations()
    };

    this.logReport(report);
    return report;
  }

  /**
   * Generate recommendations based on findings
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.issues.some(issue => issue.includes('discriminator'))) {
      recommendations.push('Use the IDL Debug Tool to auto-fix discriminator issues');
    }

    if (this.issues.some(issue => issue.includes('Missing required fields'))) {
      recommendations.push('Rebuild your Anchor program to generate complete IDL');
    }

    if (this.warnings.some(warning => warning.includes('version'))) {
      recommendations.push('Add version and metadata fields to your IDL');
    }

    if (this.issues.some(issue => issue.includes('HTTP'))) {
      recommendations.push('Ensure IDL file is in the public/ directory and accessible');
    }

    if (recommendations.length === 0 && this.issues.length === 0) {
      recommendations.push('IDL appears healthy - if you\'re still having issues, check Anchor version compatibility');
    }

    return recommendations;
  }

  /**
   * Log formatted report to console
   */
  logReport(report) {
    console.log('\n📋 IDL Health Check Report');
    console.log('='.repeat(40));
    
    console.log(`Status: ${report.status.toUpperCase()}`);
    console.log(`Issues: ${report.summary.issues}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    console.log(`Info: ${report.summary.info}`);

    if (report.idl) {
      console.log('\n📊 IDL Statistics:');
      console.log(`  Name: ${report.idl.name}`);
      console.log(`  Version: ${report.idl.version}`);
      console.log(`  Instructions: ${report.idl.instructions}`);
      console.log(`  Accounts: ${report.idl.accounts}`);
      console.log(`  Types: ${report.idl.types}`);
    }

    if (report.details.issues.length > 0) {
      console.log('\n❌ Issues:');
      report.details.issues.forEach(issue => console.log(`  • ${issue}`));
    }

    if (report.details.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      report.details.warnings.forEach(warning => console.log(`  • ${warning}`));
    }

    if (report.details.info.length > 0) {
      console.log('\n✅ Good:');
      report.details.info.forEach(info => console.log(`  • ${info}`));
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }

    console.log('='.repeat(40));
  }

  /**
   * Quick health check function
   */
  static async quickCheck() {
    const checker = new IdlHealthCheck();
    const report = await checker.checkIdl();
    return report.status === 'healthy';
  }
}

// Export convenience function
export async function checkIdlHealth(url = '/farm_direct.json') {
  const checker = new IdlHealthCheck();
  return await checker.checkIdl(url);
}

// Browser-friendly version for direct use
if (typeof window !== 'undefined') {
  window.checkIdlHealth = checkIdlHealth;
}