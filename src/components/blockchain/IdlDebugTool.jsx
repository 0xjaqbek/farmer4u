// src/components/blockchain/IdlDebugTool.jsx - IDL Debug and Fix Tool
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  FileText,
  Wrench
} from 'lucide-react';

export const IdlDebugTool = () => {
  const [idlContent, setIdlContent] = useState(null);
  const [idlStatus, setIdlStatus] = useState('loading');
  const [fixedIdl, setFixedIdl] = useState(null);
  const [fixes, setFixes] = useState([]);
  const [error, setError] = useState(null);

  // Load IDL file on component mount
  useEffect(() => {
    loadIdlFile();
  }, []);

  const loadIdlFile = async () => {
    try {
      setIdlStatus('loading');
      setError(null);
      
      const response = await fetch('/farm_direct.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const idl = await response.json();
      setIdlContent(idl);
      setIdlStatus('loaded');
      
      console.log('IDL loaded for debugging:', idl);
    } catch (err) {
      console.error('Failed to load IDL:', err);
      setError(err.message);
      setIdlStatus('error');
    }
  };

  const analyzeIdl = () => {
    if (!idlContent) return null;

    const issues = [];
    const recommendations = [];

    // Check for missing fields
    if (!idlContent.version) {
      issues.push('Missing version field');
      recommendations.push('Add version field (e.g., "0.1.0")');
    }

    if (!idlContent.metadata) {
      issues.push('Missing metadata');
      recommendations.push('Add metadata object with name, version, and spec');
    }

    // Check discriminators
    const instructionsWithoutDiscriminators = idlContent.instructions?.filter(
      inst => !inst.discriminator || !Array.isArray(inst.discriminator) || inst.discriminator.length !== 8
    ) || [];

    if (instructionsWithoutDiscriminators.length > 0) {
      issues.push(`${instructionsWithoutDiscriminators.length} instructions missing discriminators`);
      recommendations.push('Generate discriminators for all instructions');
    }

    const accountsWithoutDiscriminators = idlContent.accounts?.filter(
      acc => !acc.discriminator || !Array.isArray(acc.discriminator) || acc.discriminator.length !== 8
    ) || [];

    if (accountsWithoutDiscriminators.length > 0) {
      issues.push(`${accountsWithoutDiscriminators.length} accounts missing discriminators`);
      recommendations.push('Generate discriminators for all accounts');
    }

    // Check types
    const requiredTypes = ['DeliveryStatus', 'GrowthStage', 'CampaignType'];
    const availableTypes = idlContent.types?.map(t => t.name) || [];
    const missingTypes = requiredTypes.filter(type => !availableTypes.includes(type));

    if (missingTypes.length > 0) {
      issues.push(`Missing required types: ${missingTypes.join(', ')}`);
      recommendations.push('Ensure all required types are defined in your Rust program');
    }

    return { issues, recommendations };
  };

  const fixIdl = () => {
    if (!idlContent) return;

    const appliedFixes = [];
    const fixed = JSON.parse(JSON.stringify(idlContent)); // Deep clone

    // Fix version
    if (!fixed.version) {
      fixed.version = '0.1.0';
      appliedFixes.push('Added version field');
    }

    // Fix metadata
    if (!fixed.metadata) {
      fixed.metadata = {
        name: fixed.name || 'farm_direct',
        version: '0.1.0',
        spec: '0.1.0',
        description: 'Farm Direct Blockchain Program'
      };
      appliedFixes.push('Added metadata');
    }

    // Fix instruction discriminators
    fixed.instructions?.forEach(instruction => {
      if (!instruction.discriminator || !Array.isArray(instruction.discriminator) || instruction.discriminator.length !== 8) {
        instruction.discriminator = generateSimpleDiscriminator(`instruction:${instruction.name}`);
        appliedFixes.push(`Fixed discriminator for instruction: ${instruction.name}`);
      }
    });

    // Fix account discriminators
    fixed.accounts?.forEach(account => {
      if (!account.discriminator || !Array.isArray(account.discriminator) || account.discriminator.length !== 8) {
        account.discriminator = generateSimpleDiscriminator(`account:${account.name}`);
        appliedFixes.push(`Fixed discriminator for account: ${account.name}`);
      }
    });

    setFixedIdl(fixed);
    setFixes(appliedFixes);
  };

  const generateSimpleDiscriminator = (input) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to 8-byte array
    const discriminator = new Array(8).fill(0);
    for (let i = 0; i < 4; i++) {
      discriminator[i] = (hash >> (i * 8)) & 0xFF;
    }
    
    return discriminator;
  };

  const downloadFixedIdl = () => {
    if (!fixedIdl) return;

    const blob = new Blob([JSON.stringify(fixedIdl, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'farm_direct_fixed.json';
    a.click();
    
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const analysis = idlContent ? analyzeIdl() : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wrench className="mr-2 h-5 w-5" />
            IDL Debug Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* IDL Status */}
            <div className="flex items-center justify-between">
              <span>IDL File Status:</span>
              <div className="flex items-center">
                {idlStatus === 'loading' && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
                {idlStatus === 'loaded' && <CheckCircle className="h-4 w-4 text-green-500 mr-2" />}
                {idlStatus === 'error' && <XCircle className="h-4 w-4 text-red-500 mr-2" />}
                <span className="capitalize">{idlStatus}</span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* IDL Information */}
            {idlContent && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-6 w-6 mx-auto mb-1 text-gray-600" />
                  <p className="font-medium">{idlContent.instructions?.length || 0}</p>
                  <p className="text-sm text-gray-600">Instructions</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-6 w-6 mx-auto mb-1 text-gray-600" />
                  <p className="font-medium">{idlContent.accounts?.length || 0}</p>
                  <p className="text-sm text-gray-600">Accounts</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-6 w-6 mx-auto mb-1 text-gray-600" />
                  <p className="font-medium">{idlContent.types?.length || 0}</p>
                  <p className="text-sm text-gray-600">Types</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-6 w-6 mx-auto mb-1 text-gray-600" />
                  <p className="font-medium">{idlContent.version || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Version</p>
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {analysis && (
              <div className="space-y-4">
                <h3 className="font-semibold">IDL Analysis</h3>
                
                {analysis.issues.length > 0 ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div>
                        <p className="font-medium mb-2">Issues Found:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {analysis.issues.map((issue, index) => (
                            <li key={index} className="text-sm">{issue}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      No issues found in IDL structure!
                    </AlertDescription>
                  </Alert>
                )}

                {analysis.recommendations.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div>
                        <p className="font-medium mb-2">Recommendations:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {analysis.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={loadIdlFile}
                disabled={idlStatus === 'loading'}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload IDL
              </Button>

              {idlContent && analysis?.issues.length > 0 && (
                <Button
                  onClick={fixIdl}
                  variant="outline"
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  Auto-Fix Issues
                </Button>
              )}

              {fixedIdl && (
                <Button
                  onClick={downloadFixedIdl}
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Fixed IDL
                </Button>
              )}
            </div>

            {/* Applied Fixes */}
            {fixes.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Applied Fixes:</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <ul className="list-disc list-inside space-y-1">
                    {fixes.map((fix, index) => (
                      <li key={index} className="text-sm text-green-700">{fix}</li>
                    ))}
                  </ul>
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> After downloading the fixed IDL, replace your current 
                    public/farm_direct.json file with the fixed version and refresh the page.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* IDL Content Preview */}
            {idlContent && (
              <div>
                <h3 className="font-semibold mb-2">IDL Content Preview</h3>
                <Textarea
                  value={JSON.stringify(fixedIdl || idlContent, null, 2)}
                  readOnly
                  rows={10}
                  className="font-mono text-xs"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => copyToClipboard(JSON.stringify(fixedIdl || idlContent, null, 2))}
                >
                  Copy to Clipboard
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};