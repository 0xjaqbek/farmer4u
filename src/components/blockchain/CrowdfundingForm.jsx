// src/components/blockchain/CrowdfundingForm.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { useBlockchain } from './WalletProvider';
import { Loader2, Target, Calendar } from 'lucide-react';

export const CrowdfundingForm = ({ onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();
  const { createCrowdfundingCampaign, isLoading } = useBlockchain();
  const [error, setError] = useState('');

  const campaignType = watch('type');

  const onSubmit = async (data) => {
    try {
      setError('');
      
      const campaignData = {
        id: `campaign_${Date.now()}`, // Temporary ID
        title: data.title,
        description: data.description,
        goalAmount: parseFloat(data.goalAmount),
        deadline: data.deadline,
        type: data.type,
        milestones: data.milestones ? data.milestones.split('\n').filter(m => m.trim()) : [],
      };

      const result = await createCrowdfundingCampaign(campaignData);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
    } catch (err) {
      setError(err.message || 'Failed to create crowdfunding campaign');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="mr-2 h-5 w-5" />
          Create Crowdfunding Campaign
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title</Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="e.g., New Greenhouse Equipment"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              {...register('description', { required: 'Description is required' })}
              placeholder="Describe your campaign goals and how funds will be used..."
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goalAmount">Goal Amount (SOL)</Label>
              <Input
                id="goalAmount"
                type="number"
                step="0.01"
                min="0.1"
                {...register('goalAmount', { 
                  required: 'Goal amount is required',
                  min: { value: 0.1, message: 'Minimum 0.1 SOL' }
                })}
                placeholder="10.0"
              />
              {errors.goalAmount && (
                <p className="text-sm text-red-500">{errors.goalAmount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                {...register('deadline', { required: 'Deadline is required' })}
              />
              {errors.deadline && (
                <p className="text-sm text-red-500">{errors.deadline.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Campaign Type</Label>
            <Select onValueChange={(value) => setValue('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select campaign type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="seeds">Seeds & Supplies</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                <SelectItem value="expansion">Farm Expansion</SelectItem>
                <SelectItem value="emergency">Emergency Fund</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="milestones">Milestones (Optional)</Label>
            <Textarea
              id="milestones"
              rows={3}
              {...register('milestones')}
              placeholder="One milestone per line, e.g.:&#10;25% - Order equipment&#10;50% - Equipment delivery&#10;100% - Installation complete"
            />
            <p className="text-xs text-gray-500">
              Enter each milestone on a new line
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-md">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Campaign Guidelines</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Campaigns are recorded on blockchain for transparency</li>
                  <li>Funds are held in secure smart contract</li>
                  <li>Contributors can track progress publicly</li>
                  <li>Campaign cannot be modified once created</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Campaign...
              </>
            ) : (
              'Create Campaign'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};