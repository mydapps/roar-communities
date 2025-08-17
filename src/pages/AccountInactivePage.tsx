import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogOut } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';
import * as apiBase from '@/utils/apiBase'; // Import apiBase for logout

const AccountInactivePage = () => {
  const navigate = useNavigate();
  const { logout: privyLogout } = usePrivy(); // Rename to avoid conflict if needed

  const handleLogout = async () => {
    try {
      console.log('Logging out from inactive account page...');
      
      // Call backend logout first (if applicable)
      await apiBase.logoutCurrentDevice(); 
      console.log('Logged out from current device');
      
      // Then call Privy logout
      await privyLogout();
      console.log('Logged out from Privy');
      
      // Redirect to homepage
      navigate('/');
      
      // Show success message (optional, as user is leaving)
      // toast.success('Successfully logged out'); 
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out. Please try again.');
      // Even if logout fails, try navigating away
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg animate-fade-in">
        <CardHeader className="items-center">
          {/* Assuming logo path based on PrivyProvider config */}
          <img src="/images/logo1.png" alt="Dapps Logo" className="h-16 w-auto mb-4" />
          <CardTitle className="text-2xl font-semibold">Account Deactivated</CardTitle>
          <CardDescription className="mt-2 text-muted-foreground">
            Your account has been deactivated or deleted. If you believe this is an error, please contact support.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleLogout}
            className="w-full bg-primary hover:opacity-90 text-primary-foreground gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountInactivePage; 