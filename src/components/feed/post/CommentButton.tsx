
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface CommentButtonProps {
  count: number;
  onClick: (e: React.MouseEvent) => void;
  hidden?: boolean;
}

export const CommentButton = ({ count, onClick, hidden = false }: CommentButtonProps) => {
  if (hidden) return null;
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent Post component's click handler from firing
    onClick(e);
  };
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleClick}
      className="gap-2 hover:text-blue-500 hover:bg-blue-500/10"
    >
      <MessageCircle className="h-4 w-4" />
      <span>{count}</span>
    </Button>
  );
};
