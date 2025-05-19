import React from 'react';
import { Transaction } from '@/utils/communityApi'; // Import the Transaction type
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowUp, ArrowDown, LogIn, SendHorizontal, Award, HelpCircle, Clock, CheckCircle, AlertCircle, ExternalLink
} from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns'; // For relative time

interface TransactionListItemProps {
  transaction: Transaction;
}

// Helper to get icon based on type_code
const getTransactionIcon = (typeCode: string) => {
  switch (typeCode) {
    case 'buy': return <ArrowUp className="h-5 w-5 text-green-500" />;
    case 'sell': return <ArrowDown className="h-5 w-5 text-red-500" />;
    case 'deposit': return <LogIn className="h-5 w-5 text-blue-500" />; // Assuming deposit is ETH coming in
    case 'send': return <SendHorizontal className="h-5 w-5 text-orange-500" />; // Assuming send is ETH going out
    case 'refbonusroar': return <Award className="h-5 w-5 text-purple-500" />;
    // Add more cases for other types as they become known
    default: return <HelpCircle className="h-5 w-5 text-gray-500" />;
  }
};

// Helper to format amount and determine currency/color
const formatAmount = (transaction: Transaction): { text: string; color: string } => {
  const { type_code, amount, name } = transaction;
  let unit = '';
  let color = 'text-foreground'; // Default color

  // Basic currency inference
  if (['buy', 'sell', 'deposit', 'send'].includes(type_code)) {
    unit = ' ETH';
  } else if (type_code === 'refbonusroar' || name?.toLowerCase().includes('roar')) {
    unit = ' ROAR'; // Example inference
  }

  // Determine color based on type
  if (['buy', 'deposit', 'refbonusroar'].includes(type_code)) { // Positive impact
    color = 'text-green-600';
    return { text: `+${amount.toFixed(type_code === 'refbonusroar' ? 0 : 4)}${unit}`, color }; // No decimals for ROAR
  } else if (['sell', 'send'].includes(type_code)) { // Negative impact
    color = 'text-red-600';
    return { text: `-${amount.toFixed(4)}${unit}`, color };
  }

  // Default for unknown types
  return { text: `${amount}${unit}`, color };
};

// Helper to format date
const formatDate = (dateString: string) => {
  try {
    // Show relative time for recent transactions, absolute for older ones
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return formatDistanceToNowStrict(date, { addSuffix: true });
    } else {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' +
             date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString; // Fallback
  }
};

// Helper for status icon
const getStatusIcon = (status: string) => {
  if (status.toLowerCase() === 'completed') {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  } else if (status.toLowerCase() === 'pending') {
    return <Clock className="h-4 w-4 text-yellow-500" />;
  } else if (status.toLowerCase() === 'failed') {
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
  return null; // No icon for unknown status
};

// Basescan URL (Adjust if network changes)
const BASESCAN_URL = 'https://basescan.org/tx/';

export const TransactionListItem: React.FC<TransactionListItemProps> = ({ transaction }) => {
  const icon = getTransactionIcon(transaction.type_code);
  const formattedAmount = formatAmount(transaction);
  const formattedDate = formatDate(transaction.created_on);
  const statusIcon = getStatusIcon(transaction.status);

  // Construct description
  let description = transaction.type_description;
  if (transaction.name && transaction.name !== transaction.type_code) {
     if (['buy', 'sell'].includes(transaction.type_code)) {
        description += ` in ${transaction.name}`;
     } else if (transaction.type_code === 'refbonusroar' && transaction.name === 'signup_bonus') {
        // Keep it simple: "Signup bonus for ROAR tokens" is already good
     }
     // Add more specific descriptions based on type_code and name if needed
  }


  return (
    <Card className="mb-3 hover:shadow-md transition-shadow duration-200 ease-in-out overflow-hidden">
      <CardContent className="p-4 flex items-center space-x-4">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm font-medium truncate mr-2">{description}</p>
            <p className={`text-sm font-semibold whitespace-nowrap ${formattedAmount.color}`}>
              {formattedAmount.text}
            </p>
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              {statusIcon}
              <span>{transaction.status}</span>
              <span className="mx-1">&bull;</span>
              <span>{formattedDate}</span>
            </div>
            {transaction.txn_hash && (
              <a
                href={`${BASESCAN_URL}${transaction.txn_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 hover:text-primary hover:underline"
                title="View on Basescan"
              >
                <span>{`${transaction.txn_hash.substring(0, 6)}...${transaction.txn_hash.substring(transaction.txn_hash.length - 4)}`}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 