// src/components/blockchain/BlockchainSettings.jsx - Blockchain Configuration
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBlockchain } from './WalletProvider';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Settings, 
  Shield, 
  Zap, 
  Database,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export const BlockchainSettings = () => {
  const { userProfile } = useAuth();
  const { connected, farmerProfile } = useBlockchain();
  const [settings, setSettings] = useState({
    autoSync: true,
    cryptoPayments: false,
    publicProfile: true,
    growthTracking: true,
    notifications: true
  });
  const [saving, setSaving] = useState(false);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      // Save settings to Firestore
      // Implementation would go here
      
      // Show success message
      console.log('Settings saved:', settings);
      
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Blockchain Settings</h2>
        <p className="text-gray-600">Configure your blockchain integration preferences</p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Wallet Connection</p>
                <p className="text-sm text-gray-500">Solana wallet integration</p>
              </div>
              <div className="flex items-center">
                {connected ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Connected
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Disconnected
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Blockchain Profile</p>
                <p className="text-sm text-gray-500">On-chain farmer verification</p>
              </div>
              <div className="flex items-center">
                {farmerProfile ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Synchronized
                  </div>
                ) : (
                  <div className="flex items-center text-orange-600">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Not Initialized
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Feature Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sync" className="font-medium">
                  Automatic Synchronization
                </Label>
                <p className="text-sm text-gray-500">
                  Automatically sync data changes to blockchain
                </p>
              </div>
              <Switch
                id="auto-sync"
                checked={settings.autoSync}
                onCheckedChange={(checked) => handleSettingChange('autoSync', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="crypto-payments" className="font-medium">
                  Cryptocurrency Payments
                </Label>
                <p className="text-sm text-gray-500">
                  Accept SOL and other crypto payments
                </p>
              </div>
              <Switch
                id="crypto-payments"
                checked={settings.cryptoPayments}
                onCheckedChange={(checked) => handleSettingChange('cryptoPayments', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="public-profile" className="font-medium">
                  Public Blockchain Profile
                </Label>
                <p className="text-sm text-gray-500">
                  Make your farm profile visible on blockchain
                </p>
              </div>
              <Switch
                id="public-profile"
                checked={settings.publicProfile}
                onCheckedChange={(checked) => handleSettingChange('publicProfile', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="growth-tracking" className="font-medium">
                  Growth Tracking
                </Label>
                <p className="text-sm text-gray-500">
                  Record product growth stages on blockchain
                </p>
              </div>
              <Switch
                id="growth-tracking"
                checked={settings.growthTracking}
                onCheckedChange={(checked) => handleSettingChange('growthTracking', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Advanced settings affect blockchain transaction costs and privacy. 
                Change only if you understand the implications.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="sync-frequency">Sync Frequency (seconds)</Label>
                <Input
                  id="sync-frequency"
                  type="number"
                  min="30"
                  max="3600"
                  defaultValue="60"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How often to check for changes requiring blockchain sync
                </p>
              </div>

              <div>
                <Label htmlFor="transaction-priority">Transaction Priority</Label>
                <select 
                  id="transaction-priority"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  defaultValue="medium"
                >
                  <option value="low">Low (Slower, Cheaper)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Faster, More Expensive)</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};