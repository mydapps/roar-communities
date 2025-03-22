
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IpfsContentProps {
  ipfsHash: string;
}

export const IpfsContent = ({ ipfsHash }: IpfsContentProps) => {
  const { toast } = useToast();
  
  const copyIpfsHash = () => {
    navigator.clipboard.writeText(ipfsHash);
    toast({
      title: "Copied to clipboard",
      description: "IPFS hash has been copied to clipboard",
    });
  };
  
  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="bg-muted/50 p-4 rounded-lg border">
        <h3 className="text-sm font-medium mb-2">Post IPFS Hash</h3>
        <div className="flex items-center gap-2">
          <code className="bg-background text-sm p-2 rounded flex-1 overflow-x-auto font-mono text-xs">{ipfsHash}</code>
          <Button 
            variant="outline" 
            size="icon" 
            className="shrink-0"
            onClick={copyIpfsHash}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">What is IPFS?</h3>
        <p className="text-sm text-muted-foreground">
          The InterPlanetary File System (IPFS) is a protocol designed to create a permanent and 
          decentralized method of storing and sharing files. Unlike traditional servers, content on 
          IPFS is identified by its content, not its location.
        </p>
        <p className="text-sm text-muted-foreground">
          This means once your content is published, it cannot be censored or removed by any 
          central authority, preserving your freedom of expression.
        </p>
      </div>
    </div>
  );
};
