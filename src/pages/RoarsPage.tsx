import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const RoarsPage = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Store the referrer context for the farming page
    if (username) {
      sessionStorage.setItem('roar_share_referrer', username);
    }
    
    // Simulate loading and then redirect to farming page
    const timer = setTimeout(() => {
      setIsLoading(false);
      navigate('/roar-farming');
    }, 2000);

    return () => clearTimeout(timer);
  }, [username, navigate]);

  // Generate dynamic OG meta tags
  const ogTitle = `🦁 ${username} just claimed ROAR tokens!`;
  const ogDescription = `${username} is earning ROAR tokens on dapps.co! Join the farming revolution and start earning rewards too! 🚀`;
  const ogImage = `https://dapps.co/api/generateRoarClaimImage?handle=${encodeURIComponent(username || '')}`;
  const ogUrl = `https://dapps.co/roars/${username}`;

  return (
    <>
      <Helmet>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDescription} />
        
        {/* Open Graph tags */}
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="dapps.co" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:site" content="@dapps_co" />
        
        {/* Additional meta tags */}
        <meta name="theme-color" content="#F59E0B" />
        <link rel="canonical" href={ogUrl} />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Card className="border-amber-200 dark:border-amber-800 shadow-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
            <CardHeader className="pb-4">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatDelay: 1 
                }}
                className="mx-auto mb-4"
              >
                <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-6xl">🦁</span>
                </div>
              </motion.div>
              
              <CardTitle className="text-3xl font-bold text-amber-800 dark:text-amber-200 mb-2">
                🎉 {username} Claimed ROAR!
              </CardTitle>
              
              <div className="text-lg text-muted-foreground mb-4">
                Join the roar farming revolution!
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 text-amber-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Taking you to the farming grounds...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-green-600 font-semibold">
                    ✅ Redirecting to ROAR Farming...
                  </div>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="pb-8">
              <div className="space-y-4">
                <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-4 border-2 border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-center gap-2 text-amber-800 dark:text-amber-200 font-semibold">
                    <Trophy className="h-5 w-5" />
                    <span>Start Your Own ROAR Journey!</span>
                  </div>
                  <div className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                    Earn ROAR tokens by participating in the dapps.co community
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl mb-1">🚀</div>
                    <div className="text-sm font-medium">Easy to Start</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl mb-1">💎</div>
                    <div className="text-sm font-medium">Real Rewards</div>
                  </div>
                </div>
                
                {!isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      size="lg"
                      onClick={() => navigate('/roar-farming')}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Start Farming ROAR Now!
                    </Button>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6 text-sm text-muted-foreground">
            <p>If you're not redirected automatically,</p>
            <button 
              onClick={() => navigate('/roar-farming')}
              className="text-amber-600 hover:text-amber-700 underline font-medium"
            >
              click here to go to ROAR Farming
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default RoarsPage; 