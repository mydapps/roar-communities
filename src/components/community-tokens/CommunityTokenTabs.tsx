import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Users, 
  Trophy, 
  FileText, 
  Settings,
  BarChart3,
  Coins,
  Activity,
  TrendingUp
} from 'lucide-react';

interface CommunityTokenTabsProps {
  isMobile: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
}

const CommunityTokenTabs: React.FC<CommunityTokenTabsProps> = ({
  isMobile,
  activeTab,
  setActiveTab,
  isAdmin
}) => {
  return (
    <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'} ${isMobile ? 'h-12' : 'h-10'}`}>
      <TabsTrigger 
        value="posts" 
        className={`flex items-center gap-2 ${isMobile ? 'text-xs px-2' : 'text-sm'}`}
      >
        <MessageCircle className="w-4 h-4" />
        {!isMobile && "Posts"}
      </TabsTrigger>
      
      <TabsTrigger 
        value="token" 
        className={`flex items-center gap-2 ${isMobile ? 'text-xs px-2' : 'text-sm'} relative`}
      >
        <BarChart3 className="w-4 h-4" />
        {!isMobile && "Token"}
        <Badge 
          variant="secondary" 
          className="ml-1 px-1 py-0 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        >
          New
        </Badge>
      </TabsTrigger>
      
      <TabsTrigger 
        value="members" 
        className={`flex items-center gap-2 ${isMobile ? 'text-xs px-2' : 'text-sm'}`}
      >
        <Users className="w-4 h-4" />
        {!isMobile && "Holders"}
      </TabsTrigger>
      
      <TabsTrigger 
        value="rewards" 
        className={`flex items-center gap-2 ${isMobile ? 'text-xs px-2' : 'text-sm'}`}
      >
        <Trophy className="w-4 h-4" />
        {!isMobile && "Rewards"}
      </TabsTrigger>
      
      <TabsTrigger 
        value="about" 
        className={`flex items-center gap-2 ${isMobile ? 'text-xs px-2' : 'text-sm'}`}
      >
        <FileText className="w-4 h-4" />
        {!isMobile && "About"}
      </TabsTrigger>
      
      {isAdmin && (
        <TabsTrigger 
          value="admin" 
          className={`flex items-center gap-2 ${isMobile ? 'text-xs px-2' : 'text-sm'}`}
        >
          <Settings className="w-4 h-4" />
          {!isMobile && "Admin"}
        </TabsTrigger>
      )}
    </TabsList>
  );
};

export default CommunityTokenTabs;




