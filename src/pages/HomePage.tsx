
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container px-4 py-20 md:py-32 max-w-6xl">
        <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
          <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
            Web3 Community Network
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Invest in communities
            </span>{" "}
            you believe in
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl text-balance">
            dapps.co is where social meets investing. Join communities, earn rewards, and share in their growth.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button asChild size="lg" className="animate-float">
              <Link to="/feed">
                Launch App <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/communities">
                Explore Communities
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="mt-20 md:mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Invest in Communities" 
            description="Buy shares in communities you believe in and watch your investments grow as the community thrives."
          />
          <FeatureCard 
            title="Earn Rewards" 
            description="Create quality content and earn from the community reward pool distributed to top posts each month."
          />
          <FeatureCard 
            title="Build Together" 
            description="Participate in discussions, share ideas, and help shape the future of your favorite communities."
          />
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  title: string;
  description: string;
}

const FeatureCard = ({ title, description }: FeatureCardProps) => {
  return (
    <div className="glass-card rounded-xl p-6 transition-all duration-300 hover:shadow-md animate-fade-in">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default HomePage;
