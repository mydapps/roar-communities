import React from 'react';
import { Clock, DollarSign, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { DMPaymentStatusResponse } from '@/utils/messagingApi';

interface PaymentStatusBannerProps {
  paymentStatus: DMPaymentStatusResponse;
  timeRemaining: string;
}

const PaymentStatusBanner: React.FC<PaymentStatusBannerProps> = ({
  paymentStatus,
  timeRemaining,
}) => {
  const { has_paid, payment_info } = paymentStatus;
  const payment_amount = payment_info?.amount;
  const payment_deadline = payment_info?.payment_deadline;
  const payment_status = payment_info?.status;

  if (!has_paid) return null;

  const getStatusColor = () => {
    switch (payment_status) {
      case 'pending': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'paid': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'replied': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'expired': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getStatusText = () => {
    switch (payment_status) {
      case 'pending': return 'Payment Processing...';
      case 'paid': return 'Payment Confirmed';
      case 'replied': return 'Conversation Active';
      case 'expired': return 'Payment Expired';
      default: return 'Payment Status Unknown';
    }
  };

  const getStatusIcon = () => {
    switch (payment_status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'paid': return <DollarSign className="h-4 w-4 text-blue-600" />;
      case 'replied': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'expired': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`p-4 border-b border-opacity-50 ${getStatusColor()}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {getStatusText()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Paid {payment_amount} ETH to start this conversation
            </p>
          </div>
        </div>
        
        {payment_deadline && payment_status === 'paid' && (
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {timeRemaining}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Reply deadline
            </p>
          </div>
        )}
      </div>
      
      {payment_status === 'paid' && (
        <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            💡 <strong>Payment Policy:</strong> If they reply within 7 days, they keep 90% of your payment. 
            If not, you get 50% refunded automatically.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default PaymentStatusBanner; 