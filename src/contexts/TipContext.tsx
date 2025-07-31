import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface TipTarget {
  postCode: string;
  receiverHandle: string;
  receiverAvatar?: string;
  replyId?: number;
  tipType: 'post' | 'reply';
}

interface TipContextType {
  isOpen: boolean;
  tipTarget: TipTarget | null;
  openTipSheet: (target: TipTarget) => void;
  closeTipSheet: () => void;
  onTipSuccess?: (tipData: {
    senderHandle: string;
    receiverHandle: string;
    amount: number;
    asset: string;
    usdValue?: number;
    parentReplyId?: number;
  }) => void;
  setOnTipSuccess: (callback: TipContextType['onTipSuccess']) => void;
}

const TipContext = createContext<TipContextType | undefined>(undefined);

export const useTip = () => {
  const context = useContext(TipContext);
  if (!context) {
    throw new Error('useTip must be used within a TipProvider');
  }
  return context;
};

interface TipProviderProps {
  children: ReactNode;
}

export const TipProvider: React.FC<TipProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tipTarget, setTipTarget] = useState<TipTarget | null>(null);
  const [onTipSuccess, setOnTipSuccessState] = useState<TipContextType['onTipSuccess']>();

  const openTipSheet = useCallback((target: TipTarget) => {
    setTipTarget(target);
    setIsOpen(true);
  }, []);

  const closeTipSheet = useCallback(() => {
    setIsOpen(false);
    setTipTarget(null);
  }, []);

  const setOnTipSuccess = useCallback((callback: TipContextType['onTipSuccess']) => {
    setOnTipSuccessState(() => callback);
  }, []);

  const value: TipContextType = {
    isOpen,
    tipTarget,
    openTipSheet,
    closeTipSheet,
    onTipSuccess,
    setOnTipSuccess,
  };

  return (
    <TipContext.Provider value={value}>
      {children}
    </TipContext.Provider>
  );
}; 