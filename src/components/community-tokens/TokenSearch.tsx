import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Flame, Clock, Trophy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Token {
  id: number;
  name: string;
  symbol: string;
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
  category?: string;
}

interface TokenSearchProps {
  tokens: Token[];
  onTokenSelect: (token: Token) => void;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

const TokenSearch: React.FC<TokenSearchProps> = ({ 
  tokens, 
  onTokenSelect, 
  onSearchChange,
  placeholder = "Search tokens, communities, or categories..." 
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter tokens based on search query
  useEffect(() => {
    if (!query.trim()) {
      setFilteredTokens([]);
      setIsOpen(false);
      return;
    }

    const filtered = tokens.filter(token => 
      token.name.toLowerCase().includes(query.toLowerCase()) ||
      token.symbol.toLowerCase().includes(query.toLowerCase()) ||
      token.description.toLowerCase().includes(query.toLowerCase()) ||
      token.category?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8); // Limit to 8 results

    setFilteredTokens(filtered);
    setIsOpen(filtered.length > 0);
    setSelectedIndex(-1);
  }, [query, tokens]);

  // Handle search input change
  const handleInputChange = (value: string) => {
    setQuery(value);
    onSearchChange(value);
  };

  // Handle token selection
  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredTokens.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredTokens.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredTokens.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleTokenSelect(filteredTokens[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getTokenBadges = (token: Token) => {
    const badges = [];
    if (token.isHot) badges.push({ icon: Flame, label: 'HOT', color: 'bg-orange-500' });
    if (token.isNew) badges.push({ icon: Trophy, label: 'NEW', color: 'bg-green-500' });
    if (token.status === 'incubation') badges.push({ icon: Clock, label: 'INCUBATION', color: 'bg-yellow-500' });
    return badges;
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(true)}
          className="pl-10 pr-10 py-3 text-base bg-background/80 backdrop-blur-sm border-2 border-muted focus:border-primary transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              onSearchChange('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && filteredTokens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-md border-2 border-muted rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-2">
              {filteredTokens.map((token, index) => (
                <motion.div
                  key={token.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleTokenSelect(token)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    index === selectedIndex 
                      ? 'bg-primary/20 border-primary/50 border' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Token Avatar */}
                    <div className="text-2xl flex-shrink-0">{token.avatar}</div>
                    
                    {/* Token Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">{token.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          ${token.symbol}
                        </Badge>
                        {/* Status Badges */}
                        {getTokenBadges(token).slice(0, 2).map((badge, i) => (
                          <Badge key={i} className={`${badge.color} text-white text-xs px-1 py-0`}>
                            <badge.icon className="w-2 h-2 mr-1" />
                            {badge.label}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-2">
                        {token.description}
                      </p>
                      
                      {/* Token Stats */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="font-semibold">{(Number(token.price) || 0).toFixed(6)} ETH</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">MCap:</span>
                          <span className="font-semibold">{(Number(token.marketCap) || 0).toFixed(1)} ETH</span>
                        </div>
                        <div className={`flex items-center gap-1 ${
                          (Number(token.priceChange24h) || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className="w-3 h-3" />
                          <span className="font-semibold">
                            {(Number(token.priceChange24h) || 0) >= 0 ? '+' : ''}{(Number(token.priceChange24h) || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Indicator */}
                    <div className="flex-shrink-0 text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Search Footer */}
            <div className="border-t border-muted p-3 bg-muted/20">
              <p className="text-xs text-muted-foreground text-center">
                Showing {filteredTokens.length} results • Press ↑↓ to navigate, Enter to select
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results */}
      <AnimatePresence>
        {isOpen && query && filteredTokens.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-md border-2 border-muted rounded-lg shadow-2xl z-50"
          >
            <div className="p-6 text-center">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No tokens found for "{query}"
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for token names, symbols, or categories
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TokenSearch;

