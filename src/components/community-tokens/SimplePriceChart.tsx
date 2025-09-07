import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Loader2, LineChart } from 'lucide-react';
import { getPriceHistory, PriceHistoryResponse } from '@/utils/communityTokensApi';

interface SimplePriceChartProps {
  ticker: string;
  className?: string;
}

const SimplePriceChart: React.FC<SimplePriceChartProps> = ({ ticker, className }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [priceData, setPriceData] = useState<any[]>([]);
  const [priceChange, setPriceChange] = useState<number>(0);

  // Safe date parsing function to handle invalid dates from API
  const safeParseDate = (dateString: string): Date => {
    try {
      // Try to parse the date as-is first
      let date = new Date(dateString);
      
      // If invalid, try to fix common issues
      if (isNaN(date.getTime())) {
        // Fix potential month/day confusion (e.g., "2025-09-07" -> "2025-01-07")
        const parts = dateString.match(/(\d{4})-(\d{2})-(\d{2})\s+(.+)/);
        if (parts) {
          const [, year, month, day, time] = parts;
          // If month > 12, assume it's actually the day and month is 01
          if (parseInt(month) > 12) {
            date = new Date(`${year}-01-${month} ${time}`);
          }
        }
      }
      
      // If still invalid, return current date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString, 'using current time');
        return new Date();
      }
      
      return date;
    } catch (e) {
      console.warn('Error parsing date:', dateString, 'using current time');
      return new Date();
    }
  };

  const fetchPriceData = async (selectedPeriod: string) => {
    setLoading(true);
    setError(null);

    try {
      const response: PriceHistoryResponse = await getPriceHistory(ticker, selectedPeriod);
      
      if (!response.success || !response.data || !response.data.price_history) {
        throw new Error(response.error || 'Failed to fetch price data');
      }

      const priceHistory = response.data.price_history;
      if (!Array.isArray(priceHistory) || priceHistory.length === 0) {
        throw new Error('No price data available');
      }
      
      // Transform the data to match our expected format and sort by time (oldest first)
      const transformedData = priceHistory
        .map(item => ({
          timestamp: item.time,
          price_usd: parseFloat(item.close_usd) || 0,
          price_eth: parseFloat(item.close_eth) || 0,
          volume_usd: parseFloat(item.volume_usd) || 0,
          volume_eth: parseFloat(item.volume_eth) || 0,
          parsedDate: safeParseDate(item.time)
        }))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      setPriceData(transformedData);

      // Calculate price change
      if (transformedData.length >= 2) {
        const firstPrice = transformedData[0].price_usd;
        const lastPrice = transformedData[transformedData.length - 1].price_usd;
        const change = ((lastPrice - firstPrice) / firstPrice) * 100;
        setPriceChange(change);
      }
    } catch (err) {
      console.error('Error fetching price data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticker) {
      fetchPriceData(period);
    }
  }, [ticker, period]);

  const handlePeriodChange = (newPeriod: '1h' | '24h' | '7d' | '30d') => {
    setPeriod(newPeriod);
  };

  const formatPrice = (price: number) => {
    if (price < 0.000001) {
      return price.toExponential(2);
    } else if (price < 0.01) {
      return price.toFixed(6);
    } else if (price < 1) {
      return price.toFixed(4);
    } else {
      return price.toFixed(2);
    }
  };

  const createSimplePath = () => {
    if (!priceData || !Array.isArray(priceData) || priceData.length < 2) return '';
    
    const width = 400;
    const height = 200;
    const padding = 20;
    
    const prices = priceData.map(d => d?.price_usd || 0);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    
    const points = priceData.map((d, i) => {
      const x = padding + (i / (priceData.length - 1)) * (width - 2 * padding);
      const y = height - padding - (((d?.price_usd || 0) - minPrice) / priceRange) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Price Chart
          </CardTitle>
          <div className="flex gap-1">
            {(['1h', '24h', '7d', '30d'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handlePeriodChange(p)}
                className="h-7 px-2 text-xs"
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading chart...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <p className="text-sm text-destructive mb-2">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchPriceData(period)}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
          
          {!loading && !error && priceData && priceData.length > 0 ? (
            <div className="space-y-4">
              {/* Price Summary */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    ${formatPrice(priceData[priceData.length - 1]?.price_usd || 0)}
                  </p>
                  <p className={`text-sm flex items-center gap-1 ${
                    priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {priceChange >= 0 ? '↗' : '↘'}
                    {Math.abs(priceChange).toFixed(2)}% ({period})
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{priceData?.length || 0} data points</p>
                  <p>Last updated: now</p>
                </div>
              </div>
              
              {/* Simple SVG Chart */}
              <div className="w-full h-[300px] bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4">
                <svg width="100%" height="100%" viewBox="0 0 400 200" className="overflow-visible">
                  <defs>
                    <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  <g stroke="#e2e8f0" strokeWidth="1" opacity="0.5">
                    {[0, 1, 2, 3, 4].map(i => (
                      <line key={i} x1="20" y1={20 + i * 40} x2="380" y2={20 + i * 40} />
                    ))}
                    {[0, 1, 2, 3, 4].map(i => (
                      <line key={i} x1={20 + i * 90} y1="20" x2={20 + i * 90} y2="180" />
                    ))}
                  </g>
                  
                  {/* Price line */}
                  <path
                    d={createSimplePath()}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    className="drop-shadow-sm"
                  />
                  
                  {/* Area fill */}
                  <path
                    d={`${createSimplePath()} L 380,180 L 20,180 Z`}
                    fill="url(#priceGradient)"
                  />
                  
                  {/* Data points */}
                  {priceData && priceData.map((d, i) => {
                    const x = 20 + (i / (priceData.length - 1)) * 360;
                    const prices = priceData.map(p => p?.price_usd || 0);
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    const priceRange = maxPrice - minPrice || 1;
                    const y = 180 - (((d?.price_usd || 0) - minPrice) / priceRange) * 160;
                    
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="3"
                        fill="#3b82f6"
                        className="drop-shadow-sm"
                      >
                        <title>${formatPrice(d?.price_usd || 0)} at {(d?.parsedDate || new Date()).toLocaleString()}</title>
                      </circle>
                    );
                  })}
                </svg>
              </div>
            </div>
          ) : !loading && !error && (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <LineChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No price data available</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimplePriceChart;
