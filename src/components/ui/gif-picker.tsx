import React, { useState } from 'react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Initialize Giphy API with public beta key (you should replace this with your own key)
const gf = new GiphyFetch('sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh'); // Public beta key

interface GifPickerProps {
  onGifSelect: (gifUrl: string) => void;
  className?: string;
}

export const GifPicker: React.FC<GifPickerProps> = ({ onGifSelect, className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showTrending, setShowTrending] = useState(true);

  // Fetch function for trending GIFs
  const fetchTrendingGifs = (offset: number) => gf.trending({ offset, limit: 20 });
  
  // Fetch function for search results
  const fetchSearchGifs = (offset: number) => gf.search(searchTerm, { offset, limit: 20 });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setShowTrending(true);
      return;
    }
    setIsSearching(true);
    setShowTrending(false);
    setTimeout(() => setIsSearching(false), 500);
  };

  const handleGifClick = (gif: any, e: React.SyntheticEvent<HTMLElement, Event>) => {
    e.preventDefault();
    // Get the original GIF URL
    const gifUrl = gif.images.original.url;
    onGifSelect(gifUrl);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowTrending(true);
  };

  return (
    <div className={cn("w-full max-w-md mx-auto bg-background border border-border rounded-lg overflow-hidden", className)}>
      {/* Header with search */}
      <div className="p-3 border-b border-border bg-muted/50">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search for GIFs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8 h-8 text-sm"
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-0 h-8 w-8 p-0 hover:bg-muted"
                onClick={clearSearch}
              >
                ✕
              </Button>
            )}
          </div>
          <Button 
            type="submit" 
            size="sm" 
            variant="outline" 
            className="h-8 px-3"
            disabled={isSearching}
          >
            {isSearching ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Search className="h-3 w-3" />
            )}
          </Button>
        </form>
        
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant={showTrending ? "default" : "ghost"}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              setShowTrending(true);
              setSearchTerm('');
            }}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Trending
          </Button>
          {!showTrending && searchTerm && (
            <span className="text-xs text-muted-foreground">
              Results for "{searchTerm}"
            </span>
          )}
        </div>
      </div>

      {/* GIF Grid */}
      <div className="h-[300px] overflow-y-auto">
        <div className="p-2">
          {showTrending ? (
            <Grid
              key="trending"
              fetchGifs={fetchTrendingGifs}
              width={400}
              columns={2}
              gutter={6}
              onGifClick={handleGifClick}
            />
          ) : (
            searchTerm && (
              <Grid
                key={`search-${searchTerm}`}
                fetchGifs={fetchSearchGifs}
                width={400}
                columns={2}
                gutter={6}
                onGifClick={handleGifClick}
              />
            )
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border bg-muted/50">
        <div className="flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Powered by</span>
          <img 
            src="https://giphy.com/static/img/PoweredBy_200px-Black.png" 
            alt="Powered by GIPHY" 
            className="h-4 ml-1 dark:invert"
          />
        </div>
      </div>
    </div>
  );
};
