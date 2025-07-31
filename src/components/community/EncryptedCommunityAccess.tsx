import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Lock, 
  Shield, 
  Users, 
  Sparkles, 
  TrendingUp, 
  ArrowRight,
  Star,
  Crown,
  Zap
} from 'lucide-react';

interface EncryptedCommunityAccessProps {
  communityName: string;
  memberCount?: number;
  onJoinClick: () => void;
  isLoading?: boolean;
}

export const EncryptedCommunityAccess: React.FC<EncryptedCommunityAccessProps> = ({
  communityName,
  memberCount = 0,
  onJoinClick,
  isLoading = false
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full"
      >
        {/* Main Access Card */}
        <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-card/80 backdrop-blur-lg">
          {/* Premium Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse" />
          
          <CardHeader className="text-center pb-6 relative">
            {/* Premium Badge */}
            <div className="flex justify-center mb-4">
              <Badge variant="outline" className="px-4 py-2 bg-primary/10 text-primary border-primary/30 text-sm font-medium">
                <Crown className="w-4 h-4 mr-2" />
                Exclusive Community
              </Badge>
            </div>

            {/* Lock Icon with Glow */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                duration: 0.8,
                type: "spring",
                bounce: 0.3
              }}
              className="relative mx-auto mb-6"
            >
              <div className="relative">
                {/* Glow rings */}
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ padding: '20px' }} />
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" style={{ padding: '10px' }} />
                
                {/* Main icon container */}
                <div className="relative bg-gradient-to-br from-primary/20 to-primary/30 p-8 rounded-full border border-primary/30">
                  <Lock className="w-12 h-12 text-primary" />
                </div>
              </div>
            </motion.div>

            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-3">
              Welcome to {communityName}
            </CardTitle>
            
            <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
              <span className="text-primary font-semibold">Exclusive community</span> for premium members
            </p>
          </CardHeader>

          <CardContent className="space-y-6 relative">
            {/* Simple Stats */}
            <div className="flex justify-center items-center gap-6 mb-8 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-primary" />
                Encrypted
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-primary" />
                {memberCount}+ Members
              </div>
              <div className="flex items-center">
                <Crown className="w-4 h-4 mr-2 text-primary" />
                Premium
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center pt-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  size="lg" 
                  onClick={onJoinClick}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5 mr-2" />
                      Join Community
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
              
              <p className="text-sm text-muted-foreground mt-4">
                Buy shares to unlock access
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Floating Elements for Visual Appeal */}
        <motion.div
          className="absolute -top-4 -right-4 w-8 h-8 bg-primary/20 rounded-full blur-xl"
          animate={{
            y: [0, -10, 0],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute -bottom-4 -left-4 w-6 h-6 bg-purple-500/20 rounded-full blur-lg"
          animate={{
            y: [0, 10, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </motion.div>
    </div>
  );
};