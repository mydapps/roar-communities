import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MessageCircle, 
  DollarSign, 
  Info,
  ShieldCheck
} from 'lucide-react';

interface CommunityTabsProps {
  isMobile: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  // Add other props as needed, like counts for badges, etc.
}

const CommunityTabs: React.FC<CommunityTabsProps> = ({ isMobile, activeTab, setActiveTab, isAdmin }) => {
  if (isMobile) {
    // Mobile Tabs List (Horizontal Scroll)
    return (
      <div className="relative overflow-x-auto pb-4 no-scrollbar tab-container">
        <TabsList className="inline-flex w-auto min-w-full justify-center whitespace-nowrap bg-muted/50 p-1.5 gap-2">
          <TabsTrigger value="posts" className="flex-shrink-0 data-[state=active]:bg-background flex items-center py-3 px-4 mobile-friendly-tap">
            <MessageCircle className="h-4 w-4 mr-1" />
            Posts
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="flex-shrink-0 data-[state=active]:bg-background flex items-center py-3 px-4 mobile-friendly-tap">
              <ShieldCheck className="h-4 w-4 mr-1" />
              Admin
            </TabsTrigger>
          )}
          <TabsTrigger value="members" className="flex-shrink-0 data-[state=active]:bg-background flex items-center py-3 px-4 mobile-friendly-tap">
            <Users className="h-4 w-4 mr-1" />
            Members
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex-shrink-0 data-[state=active]:bg-background flex items-center py-3 px-4 mobile-friendly-tap">
            <DollarSign className="h-4 w-4 mr-1" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="about" className="flex-shrink-0 data-[state=active]:bg-background flex items-center py-3 px-4 mobile-friendly-tap">
            <Info className="h-4 w-4 mr-1" />
            About
          </TabsTrigger>
        </TabsList>
      </div>
    );
  } else {
    // Desktop Tabs List (Standard Header Style)
    return (
      <TabsList className="w-full lg:w-auto flex justify-start mb-6 pb-px bg-transparent p-0 overflow-x-auto flex-nowrap h-auto border-b rounded-none">
        <TabsTrigger value="posts" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
          <MessageCircle className="h-4 w-4 mr-2" />
          Posts
        </TabsTrigger>
        {isAdmin && (
          <TabsTrigger value="admin" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Admin
          </TabsTrigger>
        )}
        <TabsTrigger value="members" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
          <Users className="h-4 w-4 mr-2" />
          Members
        </TabsTrigger>
        <TabsTrigger value="rewards" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
          <DollarSign className="h-4 w-4 mr-2" />
          Rewards
        </TabsTrigger>
        <TabsTrigger value="about" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
          <Info className="h-4 w-4 mr-2" />
          About
        </TabsTrigger>
      </TabsList>
    );
  }
};

export default CommunityTabs; 