import React, { useState, useEffect } from 'react';
import { Settings, Users, UserCheck, Wind, Loader2, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { fetchDMPricingConfig, updateDMPricingConfig, UpdateDMPricingRequest, DMPricingConfig } from '@/utils/messagingApi';

interface MessageSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PricingCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  field: keyof UpdateDMPricingRequest;
  config: Partial<UpdateDMPricingRequest>;
  localPrices: Record<string, string>;
  handlePriceChange: (field: keyof UpdateDMPricingRequest, value: string) => void;
  handleFreeToggle: (field: keyof UpdateDMPricingRequest, isFree: boolean) => void;
}

const PricingCard: React.FC<PricingCardProps> = ({
  icon: Icon,
  title,
  description,
  field,
  config,
  localPrices,
  handlePriceChange,
  handleFreeToggle,
}) => (
  <Card>
    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
      <div>
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      <div className="p-2 bg-primary/10 rounded-lg">
        <Icon className="w-6 h-6 text-primary" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Label htmlFor={field} className="sr-only">{title} Price</Label>
          <div className="relative">
            <Input
              id={field}
              type="text"
              inputMode="decimal"
              value={localPrices[field] ?? ''}
              onChange={(e) => handlePriceChange(field, e.target.value)}
              placeholder="0.00"
              className="pl-8 text-lg font-mono"
              disabled={config[field] === 0}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground font-mono">Ξ</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-5">
          <Label htmlFor={`${field}-free`}>Free</Label>
          <Switch
            id={`${field}-free`}
            checked={config[field] === 0}
            onCheckedChange={(checked) => handleFreeToggle(field, checked)}
          />
        </div>
      </div>
    </CardContent>
  </Card>
);

const MessageSettingsDialog: React.FC<MessageSettingsDialogProps> = ({ open, onOpenChange }) => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [config, setConfig] = useState<Partial<UpdateDMPricingRequest>>({});
  const [localPrices, setLocalPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  const loadConfig = async () => {
    setLoading(true);
    const response = await fetchDMPricingConfig();
    if (response?.success) {
      const fetchedConfig = {
        followers_price: response.config.followers_price,
        following_price: response.config.following_price,
        others_price: response.config.others_price,
      };
      setConfig(fetchedConfig);
      setLocalPrices({
        followers_price: String(fetchedConfig.followers_price ?? ''),
        following_price: String(fetchedConfig.following_price ?? ''),
        others_price: String(fetchedConfig.others_price ?? ''),
      });
    } else {
      toast.error('Failed to load messaging settings.');
    }
    setLoading(false);
  };

  const handlePriceChange = (field: keyof UpdateDMPricingRequest, value: string) => {
    setLocalPrices(prev => ({ ...prev, [field]: value }));

    const price = parseFloat(value);
    if (!isNaN(price) && price > 0) {
      setConfig(prev => ({ ...prev, [field]: price }));
    } else {
      setConfig(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFreeToggle = (field: keyof UpdateDMPricingRequest, isFree: boolean) => {
    if (isFree) {
      setConfig(prev => ({ ...prev, [field]: 0 }));
      setLocalPrices(prev => ({ ...prev, [field]: '0' }));
    } else {
      setConfig(prev => ({ ...prev, [field]: undefined }));
      setLocalPrices(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const handleSave = async () => {
    setUpdating(true);
    const updateData: UpdateDMPricingRequest = {
      followers_price: config.followers_price ?? 0,
      following_price: config.following_price ?? 0,
      others_price: config.others_price ?? 0,
    };
    const response = await updateDMPricingConfig(updateData);
    if (response?.success) {
      toast.success('Settings updated successfully!');
      onOpenChange(false);
    } else {
      toast.error('Failed to update settings.');
    }
    setUpdating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <Settings className="w-6 h-6 mr-3 text-primary" />
            Message Settings
          </DialogTitle>
          <DialogDescription>
            Control who can message you and set prices to prevent spam and earn from your DMs. Prices are in ETH.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <PricingCard
              icon={UserCheck}
              title="Followers"
              description="Price for users who follow you."
              field="followers_price"
              config={config}
              localPrices={localPrices}
              handlePriceChange={handlePriceChange}
              handleFreeToggle={handleFreeToggle}
            />
            <PricingCard
              icon={Users}
              title="Following"
              description="Price for users you follow."
              field="following_price"
              config={config}
              localPrices={localPrices}
              handlePriceChange={handlePriceChange}
              handleFreeToggle={handleFreeToggle}
            />
            <PricingCard
              icon={Wind}
              title="Others"
              description="Price for everyone else."
              field="others_price"
              config={config}
              localPrices={localPrices}
              handlePriceChange={handlePriceChange}
              handleFreeToggle={handleFreeToggle}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || updating}>
            {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageSettingsDialog; 