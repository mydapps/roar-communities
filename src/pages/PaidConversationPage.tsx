import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  MoreVertical, 
  Shield,
  Wifi,
  DollarSign,
  Clock,
  Loader2,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useTitle } from '@/hooks/useTitle';
import { formatETH } from '@/utils/formatUtils';
import { 
  calculateDMPrice, 
  estimateDMPayment, 
  initiateDMPayment, 
  startConversation,
  checkDMPaymentStatus,
  type DMPriceInfo,
  type DMPaymentEstimate,
  type StartConversationResponse,
  type DMPaymentStatusResponse
} from '@/utils/messagingApi';



const PaidConversationPage = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  
  // Paid conversation state
  const [priceInfo, setPriceInfo] = useState<DMPriceInfo | null>(null);
  const [recipientInfo, setRecipientInfo] = useState<{ id: number; handle: string } | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentEstimate, setPaymentEstimate] = useState<DMPaymentEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Payment status state
  const [paymentStatus, setPaymentStatus] = useState<DMPaymentStatusResponse | null>(null);
  const [hasAlreadyPaid, setHasAlreadyPaid] = useState(false);

  useTitle(`Start conversation with @${handle} - dapps.co`);

  // Load pricing information
  useEffect(() => {
    if (!handle) return;
    
    const loadPricing = async () => {
      setLoading(true);
      try {
        // First, check if the user has already paid for this conversation
        console.log('🔍 Checking payment status for user:', handle);
        const paymentStatus = await checkDMPaymentStatus(handle);
        
        console.log('💰 Payment status response:', paymentStatus);
        
        if (paymentStatus.success && paymentStatus.has_paid) {
          console.log('✅ User has already paid for this conversation');
          setPaymentStatus(paymentStatus);
          setHasAlreadyPaid(true);
          
          // Still get recipient info for display
          const response = await calculateDMPrice(handle);
          if (response.success && response.recipient) {
            setRecipientInfo(response.recipient);
          }
          
          // Don't return here - let the component render the "already paid" state
        } else {
          // If not paid, proceed with normal pricing check
          const response = await calculateDMPrice(handle);
          
          console.log('🔍 Full pricing response:', response);
          console.log('🔍 Price info:', response.price_info);
          console.log('🔍 Recipient info:', response.recipient);
          
          if (response.success && response.price_info && response.recipient) {
            console.log('✅ Setting price info and recipient info');
            setPriceInfo(response.price_info);
            setRecipientInfo(response.recipient);
            
            // If it's free, redirect to normal conversation
            if (response.price_info.isFree) {
              const conversationResponse = await startConversation(handle);
              if (conversationResponse.success && conversationResponse.conversation) {
                navigate(`/messages/${conversationResponse.conversation.id}`, {
                  state: { otherUser: conversationResponse.conversation.other_user }
                });
                return;
              }
            }
          } else {
            console.error('❌ Failed to load pricing - missing required fields:', {
              success: response.success,
              hasPriceInfo: !!response.price_info,
              hasRecipient: !!response.recipient,
              error: response.error
            });
            toast.error(response.error || 'Failed to load pricing information', {
              action: {
                label: 'Retry',
                onClick: () => window.location.reload()
              }
            });
            // Don't navigate away immediately - let user retry
          }
        }
      } catch (error) {
        console.error('Error loading pricing:', error);
        toast.error('Failed to load pricing information');
        navigate('/messages');
      } finally {
        setLoading(false);
      }
    };

    loadPricing();
  }, [handle, navigate]);

  const handlePaymentClick = async () => {
    if (!priceInfo || !recipientInfo) return;
    
    setIsPaymentModalOpen(true);
    setIsEstimating(true);
    
    try {
      const estimate = await estimateDMPayment(recipientInfo.handle, priceInfo.price);
      
      if (estimate.success && estimate.estimate) {
        setPaymentEstimate(estimate.estimate);
      } else {
        toast.error(estimate.error || 'Failed to get payment estimate');
        setIsPaymentModalOpen(false);
      }
    } catch (error) {
      console.error('Error getting payment estimate:', error);
      toast.error('Failed to get payment estimate');
      setIsPaymentModalOpen(false);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!priceInfo || !recipientInfo) return;
    
    setIsProcessingPayment(true);
    
    try {
      const response = await initiateDMPayment(recipientInfo.handle, priceInfo.price);
      
      console.log('[API] DM payment initiation response', response);
      
      if (response.success) {
        // Payment was successful - check if we have transaction details
        if (response.payment_transaction_id || response.transaction) {
          toast.success(response.message || 'Payment successful! 🎉 You can now start messaging.');
          
          // Start the conversation
          const conversationResponse = await startConversation(recipientInfo.handle);
          if (conversationResponse.success && conversationResponse.conversation) {
            navigate(`/messages/${conversationResponse.conversation.id}`, {
              state: { otherUser: conversationResponse.conversation.other_user }
            });
          } else {
            toast.error(conversationResponse.error || 'Payment successful but failed to create conversation. Please try refreshing the page.');
          }
        } else {
          // Success but no transaction details - might be a different success case
          toast.success(response.message || 'Payment processed successfully!');
          
          // Try to start conversation anyway
          const conversationResponse = await startConversation(recipientInfo.handle);
          if (conversationResponse.success && conversationResponse.conversation) {
            navigate(`/messages/${conversationResponse.conversation.id}`, {
              state: { otherUser: conversationResponse.conversation.other_user }
            });
          }
        }
      } else {
        toast.error(response.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment failed');
    } finally {
      setIsProcessingPayment(false);
      setIsPaymentModalOpen(false);
    }
  };

  const handleStartPaidConversation = async () => {
    if (!recipientInfo) return;
    
    setIsProcessingPayment(true);
    
    try {
      // If we have a conversation ID from payment status, navigate directly
      if (paymentStatus?.payment_info?.conversation_id) {
        console.log('✅ Navigating to existing paid conversation:', paymentStatus.payment_info.conversation_id);
        navigate(`/messages/${paymentStatus.payment_info.conversation_id}`, {
          state: { 
            otherUser: { 
              id: paymentStatus.recipient_id,
              handle: paymentStatus.recipient_handle,
              avatar: '' 
            } 
          }
        });
      } else {
        // Fallback: try to start conversation normally
        console.log('🔄 Starting conversation for already-paid user');
        const conversationResponse = await startConversation(recipientInfo.handle);
        if (conversationResponse.success && conversationResponse.conversation) {
          navigate(`/messages/${conversationResponse.conversation.id}`, {
            state: { otherUser: conversationResponse.conversation.other_user }
          });
        } else {
          toast.error(conversationResponse.error || 'Failed to start conversation. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error starting paid conversation:', error);
      toast.error('Failed to start conversation. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };



  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-16">
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-500 dark:text-gray-400 font-medium"
            >
              Loading pricing information...
            </motion.p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!hasAlreadyPaid && (!priceInfo || !recipientInfo)) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-16">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-6xl mb-4">💸</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Unable to load pricing information
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              We couldn't load the pricing details for messaging @{handle}. This might be a temporary issue.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Loader2 className="h-4 w-4 mr-2" />
                Retry Loading
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/messages')}
              >
                Back to Messages
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user has already paid, show different UI
  if (hasAlreadyPaid && recipientInfo) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-16">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/messages')}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 hidden md:flex"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {recipientInfo.handle.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">@{recipientInfo.handle}</h2>
                <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <Shield className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span className="hidden sm:inline">End-to-end encrypted by</span>
                  <span className="sm:hidden">Encrypted</span>
                  <img src="/xmtp.png" alt="XMTP" className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="font-semibold hidden sm:inline">XMTP</span>
                  <Wifi className="h-3 w-3 text-green-500 flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Payment Complete!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              You've already paid to message @{recipientInfo.handle}. You can now start your conversation!
            </p>
            
            {paymentStatus?.payment_info && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <DollarSign className="h-6 w-6 text-green-600" />
                                     <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                     {paymentStatus.payment_info.amount} ETH Paid
                   </span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-300 mb-3">
                  Status: {paymentStatus.payment_info.detailed_status}
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>
                    {paymentStatus.payment_info.has_replied 
                      ? "Conversation is active" 
                      : `${paymentStatus.payment_info.hours_until_deadline}h remaining for reply`
                    }
                  </span>
                </div>
              </div>
            )}

            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleStartPaidConversation}
                disabled={isProcessingPayment}
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 shadow-lg text-lg py-6"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Starting Conversation...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Start Conversation
                  </>
                )}
              </Button>
            </motion.div>
            
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              Your payment has been processed. Enjoy your conversation!
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-16">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/messages')}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 hidden md:flex"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {recipientInfo.handle.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">@{recipientInfo.handle}</h2>
              <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <Shield className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span className="hidden sm:inline">End-to-end encrypted by</span>
                <span className="sm:hidden">Encrypted</span>
                <img src="/xmtp.png" alt="XMTP" className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="font-semibold hidden sm:inline">XMTP</span>
                <Wifi className="h-3 w-3 text-green-500 flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto"
        >
          <div className="text-6xl mb-6">✨</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect with @{recipientInfo.handle}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            This is your chance to start a meaningful conversation. One small investment opens the door to unlimited messaging.
          </p>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <DollarSign className="h-6 w-6 text-blue-600" />
              <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {formatETH(priceInfo.price)} ETH
              </span>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-300 mb-3">
              One-time cost • <span className="font-medium capitalize">{priceInfo.priceCategory}</span> pricing
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-green-600 dark:text-green-400">
              <Clock className="h-4 w-4" />
              <span className="font-medium">50% refund guarantee if no reply within 7 days</span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400 mb-8">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span>End-to-end encrypted messaging</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <span>Unlimited messages after connection</span>
            </div>
          </div>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handlePaymentClick}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg text-lg py-6"
            >
              Start Conversation for {formatETH(priceInfo.price)} ETH
            </Button>
          </motion.div>
          
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Your message matters. Make it count.
          </p>
        </motion.div>
      </div>



      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              Confirm Payment
            </DialogTitle>
            <DialogDescription>
              Ready to connect with <span className="font-semibold">@{recipientInfo?.handle}</span>? Review the payment details below.
            </DialogDescription>
          </DialogHeader>
          
          {isEstimating ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Calculating fees...</span>
            </div>
          ) : paymentEstimate ? (
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Message Price:</span>
                  <span className="font-medium">{formatETH(paymentEstimate.amount)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Platform Fee:</span>
                  <span className="font-medium">{formatETH(paymentEstimate.platform_fee)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Gas Fee:</span>
                  <span className="font-medium">{formatETH(paymentEstimate.estimated_fee)} ETH</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Total Cost:</span>
                  <span className="font-semibold">{formatETH(paymentEstimate.total_cost)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-600 dark:text-green-400">Recipient Gets:</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">{formatETH(paymentEstimate.recipient_gets)} ETH</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                💡 Remember: 50% refund if no reply within 7 days!
              </div>
            </div>
          ) : null}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsPaymentModalOpen(false)}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmPayment}
              disabled={isEstimating || isProcessingPayment || !paymentEstimate}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Pay ${formatETH(paymentEstimate?.total_cost || '...')} ETH`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaidConversationPage; 