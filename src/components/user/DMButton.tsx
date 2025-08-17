import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { calculateDMPrice, startConversation } from '@/utils/messagingApi';

interface DMButtonProps {
  userHandle: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const DMButton: React.FC<DMButtonProps> = ({ 
  userHandle, 
  className = '',
  variant = 'outline',
  size = 'default'
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleDMClick = async () => {
    setIsLoading(true);
    
    try {
      console.log('🔍 Checking DM pricing for user:', userHandle);
      
      // First, check the pricing for this conversation
      const pricingResponse = await calculateDMPrice(userHandle);
      
      console.log('💰 DM pricing response:', pricingResponse);
      
      if (pricingResponse.success && pricingResponse.price_info) {
        if (pricingResponse.price_info.isFree) {
          // Free conversation - start directly
          console.log('✅ Free conversation, starting directly');
          
          const conversationResponse = await startConversation(userHandle);
          if (conversationResponse.success && conversationResponse.conversation) {
            toast.success(`Started conversation with @${userHandle}! 🎉`);
            navigate(`/messages/${conversationResponse.conversation.id}`, {
              state: { otherUser: conversationResponse.conversation.other_user }
            });
          } else {
            toast.error(conversationResponse.error || 'Failed to start conversation');
          }
        } else {
          // Paid conversation - redirect to payment page
          console.log('💰 Paid conversation, redirecting to payment page');
          toast.success(`Redirecting to payment page for @${userHandle}...`, {
            description: `This conversation requires ${pricingResponse.price_info.price} ETH to start`,
            duration: 2000,
          });
          navigate(`/messages/paid/${userHandle}`);
        }
      } else {
        console.error('❌ DM pricing check failed:', pricingResponse);
        toast.error(pricingResponse.error || 'Unable to check messaging pricing. Please try again.');
      }
    } catch (error) {
      console.error('Error initiating DM:', error);
      toast.error('Failed to start conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDMClick}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={`shadow-sm ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <MessageCircle className="h-4 w-4 mr-2" />
      )}
      {isLoading ? 'Loading...' : 'Message'}
    </Button>
  );
};

export default DMButton; 