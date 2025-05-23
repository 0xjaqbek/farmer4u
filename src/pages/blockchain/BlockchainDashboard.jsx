// src/pages/blockchain/BlockchainDashboard.jsx
import { useState} from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBlockchain } from '../../components/blockchain/WalletProvider';
import { WalletConnection } from '../../components/blockchain/WalletConnection';
import { CrowdfundingForm } from '../../components/blockchain/CrowdfundingForm';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Wallet, 
  Target, 
  BarChart3, 
  Leaf, 
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';

export const BlockchainDashboard = () => {
  const { userProfile } = useAuth();
  const { connected, farmerProfile, isLoading } = useBlockchain();
  const [stats, setStats] = useState({
    totalProducts: 0,
    verifiedProducts: 0,
    totalRaised: 0,
    activeCampaigns: 0
  });

  const isRolnik = userProfile?.role === 'rolnik';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Blockchain Dashboard</h1>
        <p className="text-gray-600">
          Transparent farming with blockchain technology
        </p>
      </div>

      {/* Connection Status */}
      <WalletConnection />

      {connected && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Leaf className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{stats.verifiedProducts}</p>
                    <p className="text-sm text-gray-500">Verified Products</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalProducts}</p>
                    <p className="text-sm text-gray-500">Total Products</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalRaised} SOL</p>
                    <p className="text-sm text-gray-500">Total Raised</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
                    <p className="text-sm text-gray-500">Active Campaigns</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {isRolnik && <TabsTrigger value="crowdfunding">Crowdfunding</TabsTrigger>}
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Blockchain Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  {farmerProfile ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Public Name</p>
                          <p className="font-medium">{farmerProfile.publicName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Region</p>
                          <p className="font-medium">{farmerProfile.region}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Products</p>
                          <p className="font-medium">{farmerProfile.totalProducts}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Reputation Score</p>
                          <p className="font-medium">{farmerProfile.reputationScore}</p>
                        </div>
                      </div>
                      
                      {farmerProfile.certifications.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Certifications</p>
                          <div className="flex flex-wrap gap-2">
                            {farmerProfile.certifications.map((cert, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                              >
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Profile not found on blockchain. 
                      {isRolnik && " Click 'Initialize' above to create your blockchain profile."}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {isRolnik && (
              <TabsContent value="crowdfunding" className="space-y-4">
                <CrowdfundingForm onSuccess={(result) => {
                  alert('Campaign created successfully!');
                  console.log('Campaign result:', result);
                }} />
              </TabsContent>
            )}

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Blockchain Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    Analytics dashboard coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
