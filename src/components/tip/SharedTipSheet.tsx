import React from 'react';
import { TipSheet } from './TipSheet';
import { useTip } from '@/contexts/TipContext';

export const SharedTipSheet: React.FC = () => {
  const { isOpen, tipTarget, closeTipSheet, onTipSuccess } = useTip();

  if (!tipTarget) return null;

  return (
    <TipSheet
      isOpen={isOpen}
      onClose={closeTipSheet}
      postCode={tipTarget.postCode}
      receiverHandle={tipTarget.receiverHandle}
      receiverAvatar={tipTarget.receiverAvatar}
      replyId={tipTarget.replyId}
      tipType={tipTarget.tipType}
      onTipSuccess={onTipSuccess}
    />
  );
}; 