import React, { useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import DesktopTradingModal from './DesktopTradingModal';
import MobileTradingSheet from './MobileTradingSheet';

interface Token {
  id: number;
  name: string;
  symbol?: string; // For wallet page compatibility
  ticker?: string; // For community tokens page compatibility
  description: string;
  avatar: string;
  status: 'incubation' | 'graduated';
  price: number;
  marketCap: number;
  holders: number;
  volume24h: number;
  priceChange24h: number;
  rewardPool: number;
  timeLeft?: number;
  tokensRemaining?: number;
  totalSupply: number;
  userHoldings?: number;
  isHot?: boolean;
  isNew?: boolean;
}

interface TradingInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token | null;
  mode: 'buy' | 'sell';
  onTradeComplete?: () => void;
  userEthBalance?: string;
}

const TradingInterface: React.FC<TradingInterfaceProps> = (props) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Add body class when modal is open on mobile
  useEffect(() => {
    if (props.isOpen && isMobile) {
      document.body.classList.add('trading-modal-open');
    } else {
      document.body.classList.remove('trading-modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('trading-modal-open');
    };
  }, [props.isOpen, isMobile]);

  if (isMobile) {
    return <MobileTradingSheet {...props} />;
  }

  return <DesktopTradingModal {...props} />;
};

export default TradingInterface;
