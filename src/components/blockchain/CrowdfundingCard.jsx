// src/components/blockchain/CrowdfundingCard.jsx - Campaign Display Card
import { useState} from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Target, 
  Clock, 
  Users, 
  TrendingUp, 
  Calendar,
  Wallet,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const CrowdfundingCard = ({ campaign, onContribute }) => {
  const { connected } = useWallet();
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributing, setContributing] = useState(false);
  const [error, setError] = useState('');

  const progressPercentage = (campaign.currentAmount / campaign.goalAmount) * 100;
  const daysLeft = Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;
  const isCompleted = campaign.currentAmount >= campaign.goalAmount;

  const getCampaignTypeIcon = (type) => {
    const icons = {
      equipment: '🚜',
      seeds: '🌱',
      infrastructure: '🏗️',
      expansion: '📈',
      emergency: '🚨'
    };
    return icons[type] || '📋';
  };

  const handleContribute = async () => {
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setContributing(true);
      setError('');
      
      await onContribute(campaign.id, parseFloat(contributionAmount));
      setContributionAmount('');
      
    } catch (err) {
      setError(err.message || 'Contribution failed');
    } finally {
      setContributing(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center text-lg">
              <span className="mr-2">{getCampaignTypeIcon(campaign.type)}</span>
              {campaign.title}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              by {campaign.farmerName}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={isCompleted ? 'default' : isExpired ? 'destructive' : 'secondary'}>
              {isCompleted ? 'Funded' : isExpired ? 'Expired' : 'Active'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700">{campaign.description}</p>
        
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              {campaign.currentAmount.toFixed(2)} SOL raised
            </span>
            <span className="text-gray-500">
              of {campaign.goalAmount.toFixed(2)} SOL goal
            </span>
          </div>
          
          <Progress value={Math.min(progressPercentage, 100)} className="h-2" />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>{Math.round(progressPercentage)}% funded</span>
            <span>{campaign.contributors?.length || 0} contributors</span>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            {isExpired ? 'Campaign ended' : `${daysLeft} days left`}
          </div>
          
          <div className="flex items-center text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(campaign.deadline).toLocaleDateString()}
          </div>
        </div>
        
        {/* Milestones */}
        {campaign.milestones && campaign.milestones.length > 0 && (
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium mb-2">Milestones</h4>
            <ul className="space-y-1">
              {campaign.milestones.map((milestone, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start">
                  <CheckCircle className="h-3 w-3 mr-2 mt-0.5 text-green-500" />
                  {milestone}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Contribution Form */}
        {connected && !isExpired && !isCompleted && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-medium">Contribute to this campaign</h4>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex space-x-2">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Amount in SOL"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleContribute}
                disabled={contributing || !contributionAmount}
              >
                {contributing ? 'Contributing...' : 'Contribute'}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500">
              Minimum contribution: 0.01 SOL (~$0.20)
            </p>
          </div>
        )}
        
        {!connected && !isExpired && !isCompleted && (
          <div className="border-t pt-4">
            <div className="flex items-center text-sm text-gray-500">
              <Wallet className="h-4 w-4 mr-2" />
              Connect wallet to contribute
            </div>
          </div>
        )}
        
        {/* Campaign Stats */}
        <div className="border-t pt-3 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm font-medium">{campaign.contributors?.length || 0}</div>
            <div className="text-xs text-gray-500">Contributors</div>
          </div>
          <div>
            <div className="text-sm font-medium">
              {campaign.currentAmount.toFixed(2)} SOL
            </div>
            <div className="text-xs text-gray-500">Raised</div>
          </div>
          <div>
            <div className="text-sm font-medium">{daysLeft}</div>
            <div className="text-xs text-gray-500">Days left</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};