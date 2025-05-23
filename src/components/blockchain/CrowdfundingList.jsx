// src/pages/blockchain/CrowdfundingList.jsx - Browse All Campaigns (Fixed)
import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useBlockchain } from '../../components/blockchain/WalletProvider';
import blockchainService from '../../services/blockchain';
import { CrowdfundingCard } from '../../components/blockchain/CrowdfundingCard';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Loader2
} from 'lucide-react';

export const CrowdfundingList = () => {
  const { connected } = useBlockchain();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError('');
      
      const campaignsQuery = query(
        collection(db, 'crowdfunding'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(campaignsQuery);
      const campaignData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        deadline: doc.data().deadline?.toDate?.() || new Date(doc.data().deadline),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
      
      setCampaigns(campaignData);
      
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = async (campaignId, amount) => {
    if (!connected) {
      setError('Please connect your wallet to contribute');
      return;
    }

    try {
      // This would call the blockchain method
      await blockchainService.contributeToCampaign(campaignId, amount);
      
      // Refresh campaigns to show updated amounts
      await fetchCampaigns();
      
    } catch (error) {
      console.error('Contribution failed:', error);
      setError(`Contribution failed: ${error.message}`);
    }
  };

  const filterCampaigns = (status) => {
    const now = new Date();
    
    switch (status) {
      case 'active':
        return campaigns.filter(c => 
          c.deadline > now && 
          c.currentAmount < c.goalAmount && 
          c.isActive
        );
      case 'funded':
        return campaigns.filter(c => c.currentAmount >= c.goalAmount);
      case 'expired':
        return campaigns.filter(c => c.deadline <= now);
      default:
        return campaigns;
    }
  };

  const getStats = () => {
    const active = filterCampaigns('active').length;
    const funded = filterCampaigns('funded').length;
    const expired = filterCampaigns('expired').length;
    const totalRaised = campaigns.reduce((sum, c) => sum + c.currentAmount, 0);
    
    return { active, funded, expired, totalRaised };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading campaigns...</span>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Crowdfunding Campaigns</h1>
        <p className="text-gray-600">Support local farmers and sustainable agriculture</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-gray-500">Active Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.funded}</p>
                <p className="text-sm text-gray-500">Successfully Funded</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.totalRaised.toFixed(1)} SOL</p>
                <p className="text-sm text-gray-500">Total Raised</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.expired}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active ({stats.active})
          </TabsTrigger>
          <TabsTrigger value="funded">
            Funded ({stats.funded})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({campaigns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <CampaignGrid 
            campaigns={filterCampaigns('active')} 
            onContribute={handleContribute}
            emptyMessage="No active campaigns at the moment"
          />
        </TabsContent>

        <TabsContent value="funded" className="mt-6">
          <CampaignGrid 
            campaigns={filterCampaigns('funded')} 
            onContribute={handleContribute}
            emptyMessage="No funded campaigns yet"
          />
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <CampaignGrid 
            campaigns={campaigns} 
            onContribute={handleContribute}
            emptyMessage="No campaigns found"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper component for campaign grid
const CampaignGrid = ({ campaigns, onContribute, emptyMessage }) => {
  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map(campaign => (
        <CrowdfundingCard
          key={campaign.id}
          campaign={campaign}
          onContribute={onContribute}
        />
      ))}
    </div>
  );
};