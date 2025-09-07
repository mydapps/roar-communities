import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, LineData } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Loader2 } from 'lucide-react';
import { getPriceHistory, PriceHistoryResponse } from '@/utils/communityTokensApi';

interface TradingViewChartProps {
  ticker: string;
  className?: string;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ ticker, className }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const initChart = () => {
    if (!chartContainerRef.current) return;

    try {
      // Clean up existing chart
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }

      // Create chart
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#64748b',
        },
        width: chartContainerRef.current.clientWidth,
        height: 300,
        grid: {
          vertLines: { color: '#e2e8f0' },
          horzLines: { color: '#e2e8f0' },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: '#e2e8f0',
        },
        timeScale: {
          borderColor: '#e2e8f0',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      // Verify chart was created successfully
      if (!chart || typeof chart.addLineSeries !== 'function') {
        console.error('Chart creation failed or addLineSeries not available');
        setError('Failed to initialize chart');
        return;
      }

      // Create line series
      const lineSeries = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: '#3b82f6',
        crosshairMarkerBackgroundColor: '#3b82f6',
      });

      chartRef.current = chart;
      seriesRef.current = lineSeries;
    } catch (error) {
      console.error('Error initializing chart:', error);
      setError('Failed to initialize chart');
      return;
    }

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  };

  const fetchPriceData = async (selectedPeriod: string) => {
    setLoading(true);
    setError(null);

    try {
      const response: PriceHistoryResponse = await getPriceHistory(ticker, selectedPeriod);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch price data');
      }

      // Transform API data to chart format
      const chartData: LineData[] = response.data.prices.map(price => ({
        time: new Date(price.timestamp).getTime() / 1000, // Convert to seconds
        value: price.price_usd,
      }));

      // Sort by time
      chartData.sort((a, b) => (a.time as number) - (b.time as number));

      if (seriesRef.current && chartData.length > 0) {
        seriesRef.current.setData(chartData);
        
        // Fit content to show all data
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
      }
    } catch (err) {
      console.error('Error fetching price data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cleanup = initChart();
    return () => {
      if (cleanup) cleanup();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (ticker && chartRef.current) {
      fetchPriceData(period);
    }
  }, [ticker, period]);

  const handlePeriodChange = (newPeriod: '1h' | '24h' | '7d' | '30d') => {
    setPeriod(newPeriod);
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
          
          <div 
            ref={chartContainerRef} 
            className="w-full h-[300px] rounded-md"
            style={{ minHeight: '300px' }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingViewChart;
