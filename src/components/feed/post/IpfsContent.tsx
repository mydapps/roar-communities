import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Loader2, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFilCDNStatus } from '@/hooks/useFilCDNStatus';

interface IpfsContentProps {
  ipfsHash: string;
  postCode?: string;
}

export const IpfsContent = ({ ipfsHash, postCode }: IpfsContentProps) => {
  const { toast } = useToast();
  const { data: filcdnData, loading: filcdnLoading, error: filcdnError } = useFilCDNStatus(postCode);
  
  const copyIpfsHash = () => {
    navigator.clipboard.writeText(ipfsHash);
    toast({
      title: "Copied to clipboard",
      description: "IPFS hash has been copied to clipboard",
    });
  };

  const copyFilCDNUrl = () => {
    if (filcdnData?.filcdnUrl) {
      navigator.clipboard.writeText(filcdnData.filcdnUrl);
      toast({
        title: "Copied to clipboard",
        description: "FilCDN URL has been copied to clipboard",
      });
    }
  };

  const openFilCDNUrl = () => {
    if (filcdnData?.filcdnUrl) {
      window.open(filcdnData.filcdnUrl, '_blank');
    }
  };

  const getStatusIcon = () => {
    if (!filcdnData) return null;
    
    switch (filcdnData.filcdnStatus) {
      case 'uploaded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (!filcdnData) return null;
    
    switch (filcdnData.filcdnStatus) {
      case 'uploaded':
        return 'Successfully synced to FilCDN';
      case 'uploading':
        return 'Syncing to FilCDN...';
      case 'pending':
        return 'Queued for FilCDN sync';
      case 'failed':
        return 'FilCDN sync failed';
      default:
        return 'Unknown sync status';
    }
  };

  const getStatusColor = () => {
    if (!filcdnData) return 'text-gray-500';
    
    switch (filcdnData.filcdnStatus) {
      case 'uploaded':
        return 'text-green-600 dark:text-green-400';
      case 'uploading':
        return 'text-blue-600 dark:text-blue-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500';
    }
  };
  
  return (
    <div className="flex flex-col space-y-6 p-4">
      {/* FilCDN Section */}
      {postCode && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <img 
              src="/filcdn.jpg" 
              alt="FilCDN" 
              className="h-6 w-6 rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h3 className="text-sm font-semibold">Protected by FilCDN</h3>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200/50 dark:border-blue-700/30">
            {filcdnLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-muted-foreground">Checking FilCDN status...</span>
              </div>
            ) : filcdnError ? (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">FilCDN status unavailable</span>
              </div>
            ) : filcdnData ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className={`text-sm font-medium ${getStatusColor()}`}>
                    {getStatusText()}
                  </span>
                </div>
                
                {filcdnData.filcdnStatus === 'uploaded' && filcdnData.filcdnUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-2 rounded border">
                      <code className="text-xs font-mono flex-1 overflow-x-auto">
                        {filcdnData.filcdnUrl}
                      </code>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="shrink-0 h-6 w-6"
                        onClick={copyFilCDNUrl}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button 
                      onClick={openFilCDNUrl}
                      size="sm"
                      className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Verify on FilCDN
                    </Button>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground leading-relaxed">
                  FilCDN provides fast, redundant access to your IPFS content with global CDN acceleration 
                  while maintaining full decentralization.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* IPFS Section */}
      <div className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg border">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <span>IPFS Hash</span>
            <span className="text-xs text-muted-foreground">(Raw Decentralized Storage)</span>
          </h3>
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
        
        <div className="space-y-3">
          <h3 className="text-sm font-medium">What does this mean?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This post is secured on decentralized storage (IPFS) and accelerated by FilCDN 
            for optimal speed and redundancy. This means once your content is published, it cannot be censored or removed by any 
            central authority, preserving your freedom of expression.
          </p>
        </div>
      </div>
    </div>
  );
};
