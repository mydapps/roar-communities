
import React from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { usePrivy } from '@privy-io/react-auth';

interface OnboardingStoriesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OnboardingStories = ({ open, onOpenChange }: OnboardingStoriesProps) => {
  const { login } = usePrivy();

  const handlePrivyLogin = () => {
    login();
    // The rest of the authentication flow is handled in the PrivyAuthProvider
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md p-0 bg-background overflow-auto">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b">
            <h2 className="text-2xl font-semibold tracking-tight">Welcome to dapps.co</h2>
            <p className="text-muted-foreground mt-1">
              Join a new kind of social network where your contributions have real value.
            </p>
          </div>

          {/* Content */}
          <div className="flex-grow overflow-auto p-6 space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Why join dapps.co?</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-[#31bcc3]/10 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-[#31bcc3] text-sm">✓</span>
                  </div>
                  <p>Own your audience and build true connections</p>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-[#31bcc3]/10 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-[#31bcc3] text-sm">✓</span>
                  </div>
                  <p>Earn real rewards for your contributions</p>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-[#31bcc3]/10 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-[#31bcc3] text-sm">✓</span>
                  </div>
                  <p>Join communities built around shared interests</p>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-[#31bcc3]/10 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-[#31bcc3] text-sm">✓</span>
                  </div>
                  <p>Turn engagement into lasting wealth</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer with Login button */}
          <div className="p-6 border-t mt-auto">
            <Button 
              onClick={handlePrivyLogin} 
              className="w-full py-6 text-lg bg-gradient-to-r from-[#31bcc3] to-[#31bcc3]/90 hover:from-[#31bcc3]/90 hover:to-[#31bcc3] text-white"
            >
              Login / Sign Up with Privy
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default OnboardingStories;
