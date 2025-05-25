// src/pages/blockchain/BlockchainDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBlockchain } from '../../components/blockchain/WalletProvider';
import { getProductsByRolnik } from '../../firebase/products';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
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
  DollarSign,
  Loader2
} from 'lucide-react';

import { BlockchainDebug } from '../../components/blockchain/BlockchainDebug';
import { IdlDebugTool } from '../../components/blockchain/IdlDebugTool';

export const BlockchainDashboard = () => {
  const { userProfile } = useAuth();
  const { connected, farmerProfile, isLoading: blockchainLoading } = useBlockchain();
  const [stats, setStats] = useState({
    totalProducts: 0,
    verifiedProducts: 0,
    totalRaised: 0,
    activeCampaigns: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const isRolnik = userProfile?.role === 'rolnik';

  // Load stats when component mounts and when user connects wallet
  useEffect(() => {
    if (userProfile) {
      loadStats();
    }
  }, [userProfile, connected]);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      
      if (isRolnik && userProfile) {
        // Get farmer's products
        const products = await getProductsByRolnik(userProfile.uid);
        const verifiedProducts = products.filter(p => p.blockchainPDA && p.blockchainSynced);
        
        // Get crowdfunding campaigns for this farmer
        const campaignsQuery = query(
          collection(db, 'crowdfunding'),
          where('farmerUid', '==', userProfile.uid)
        );
        const campaignsSnapshot = await getDocs(campaignsQuery);
        const campaigns = campaignsSnapshot.docs.map(doc => doc.data());
        
        const activeCampaigns = campaigns.filter(c => 
          c.isActive && new Date(c.deadline) > new Date()
        );
        
        const totalRaised = campaigns.reduce((sum, c) => sum + (c.currentAmount || 0), 0);
        
        setStats({
          totalProducts: products.length,
          verifiedProducts: verifiedProducts.length,
          totalRaised: totalRaised,
          activeCampaigns: activeCampaigns.length
        });
      } else {
        // For non-farmers or admins, show platform-wide stats
        const productsQuery = query(collection(db, 'products'));
        const productsSnapshot = await getDocs(productsQuery);
        const allProducts = productsSnapshot.docs.map(doc => doc.data());
        
        const campaignsQuery = query(collection(db, 'crowdfunding'));
        const campaignsSnapshot = await getDocs(campaignsQuery);
        const allCampaigns = campaignsSnapshot.docs.map(doc => doc.data());
        
        const verifiedProducts = allProducts.filter(p => p.blockchainPDA && p.blockchainSynced);
        const activeCampaigns = allCampaigns.filter(c => 
          c.isActive && new Date(c.deadline) > new Date()
        );
        const totalRaised = allCampaigns.reduce((sum, c) => sum + (c.currentAmount || 0), 0);
        
        setStats({
          totalProducts: allProducts.length,
          verifiedProducts: verifiedProducts.length,
          totalRaised: totalRaised,
          activeCampaigns: activeCampaigns.length
        });
      }
    } catch (error) {
      console.error('Error loading blockchain stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Show loading state
  if (blockchainLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading blockchain dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Blockchain Dashboard</h1>
        <p className="text-gray-600">
          Transparent farming with blockchain technology
        </p>
        <BlockchainDebug />
        <IdlDebugTool />
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
                      
                      {farmerProfile.certifications && farmerProfile.certifications.length > 0 && (
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

              {/* Blockchain Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle>Blockchain Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Wallet className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h3 className="font-medium">Transparent Transactions</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        All payments and transactions are recorded on the blockchain
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Leaf className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h3 className="font-medium">Product Verification</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Customers can verify product authenticity and origin
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <h3 className="font-medium">Crowdfunding</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Raise funds for farm improvements and expansion
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {isRolnik && (
              <TabsContent value="crowdfunding" className="space-y-4">
                <CrowdfundingForm onSuccess={(result) => {
                  alert('Campaign created successfully!');
                  console.log('Campaign result:', result);
                  // Reload stats to reflect new campaign
                  loadStats();
                }} />
              </TabsContent>
            )}

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Blockchain Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">Product Verification Rate</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Verified on Blockchain</span>
                          <span>{stats.verifiedProducts} / {stats.totalProducts}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ 
                              width: `${stats.totalProducts > 0 ? (stats.verifiedProducts / stats.totalProducts) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {stats.totalProducts > 0 
                            ? `${Math.round((stats.verifiedProducts / stats.totalProducts) * 100)}% verified`
                            : 'No products yet'
                          }
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Crowdfunding Overview</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Active Campaigns</span>
                          <span className="font-medium">{stats.activeCampaigns}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Raised</span>
                          <span className="font-medium">{stats.totalRaised} SOL</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">USD Equivalent</span>
                          <span className="font-medium text-green-600">
                            ~${(stats.totalRaised * 20).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!connected && (
        <Alert>
          <AlertDescription>
            Connect your Solana wallet to access blockchain features and view your dashboard statistics.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};