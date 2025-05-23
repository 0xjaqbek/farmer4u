// src/components/blockchain/CrowdfundingForm.jsx
import { useState } from 'react';
import { useBlockchain } from './WalletProvider';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Target, 
  Calendar, 
  DollarSign, 
  FileText, 
  Loader2,
  Plus,
  X
} from 'lucide-react';

export const CrowdfundingForm = ({ onSuccess }) => {
  const { connected, isInitialized, createCrowdfundingCampaign } = useBlockchain();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalAmount: '',
    deadline: '',
    type: 'equipment',
    milestones: ['']
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const campaignTypes = [
    { value: 'equipment', label: 'Farm Equipment' },
    { value: 'seeds', label: 'Seeds & Supplies' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'expansion', label: 'Farm Expansion' },
    { value: 'emergency', label: 'Emergency Funds' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMilestoneChange = (index, value) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index] = value;
    setFormData(prev => ({
      ...prev,
      milestones: newMilestones
    }));
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, '']
    }));
  };

  const removeMilestone = (index) => {
    if (formData.milestones.length > 1) {
      const newMilestones = formData.milestones.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        milestones: newMilestones
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!connected || !isInitialized) {
      setError('Please connect your wallet first');
      return;
    }

    // Validation
    if (!formData.title || !formData.description || !formData.goalAmount || !formData.deadline) {
      setError('Please fill all required fields');
      return;
    }

    if (parseFloat(formData.goalAmount) <= 0) {
      setError('Goal amount must be greater than 0');
      return;
    }

    const deadlineDate = new Date(formData.deadline);
    if (deadlineDate <= new Date()) {
      setError('Deadline must be in the future');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const campaignData = {
        id: `campaign_${Date.now()}`, // Generate a simple ID
        title: formData.title,
        description: formData.description,
        goalAmount: parseFloat(formData.goalAmount),
        deadline: formData.deadline,
        type: formData.type,
        milestones: formData.milestones.filter(m => m.trim() !== '')
      };

      const result = await createCrowdfundingCampaign(campaignData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        goalAmount: '',
        deadline: '',
        type: 'equipment',
        milestones: ['']
      });

      if (onSuccess) {
        onSuccess(result);
      }

    } catch (err) {
      console.error('Failed to create crowdfunding campaign:', err);
      setError(err.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!connected) {
    return (
      <Alert>
        <AlertDescription>
          Please connect your wallet to create crowdfunding campaigns.
        </AlertDescription>
      </Alert>
    );
  }

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
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. New Tractor for Organic Farm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Campaign Type *</Label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                {campaignTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goalAmount">Goal Amount (SOL) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="goalAmount"
                  name="goalAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.goalAmount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Campaign Deadline *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="deadline"
                  name="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Campaign Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your campaign, what you need funding for, and how it will help your farm..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Campaign Milestones</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMilestone}
                className="flex items-center"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Milestone
              </Button>
            </div>
            
            {formData.milestones.map((milestone, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={milestone}
                  onChange={(e) => handleMilestoneChange(index, e.target.value)}
                  placeholder={`Milestone ${index + 1}`}
                  className="flex-1"
                />
                {formData.milestones.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMilestone(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Important Notes</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>All transactions will be recorded on the Solana blockchain</li>
                  <li>Funds will be held in a secure smart contract</li>
                  <li>Contributors will receive transparency updates</li>
                  <li>Campaign cannot be modified after creation</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  title: '',
                  description: '',
                  goalAmount: '',
                  deadline: '',
                  type: 'equipment',
                  milestones: ['']
                });
                setError('');
              }}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isInitialized}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <Target className="mr-2 h-4 w-4" />
                  Create Campaign
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};