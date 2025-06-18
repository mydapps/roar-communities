import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Copy, Download, Key, LogOut, Moon, Sun, Upload, Bell, BellOff, BellRing, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import useDeviceNotifications from '@/hooks/useDeviceNotifications';
import { Badge } from '@/components/ui/badge';
import PushNotificationSetup from '@/components/notifications/PushNotificationSetup';
import { useTheme } from '@/contexts/ThemeContext';

const AccountPage = () => {
  const { theme, toggleTheme } = useTheme();
  
  const {
    isMobileApp,
    deviceInfo,
    isLoading: isLoadingDeviceInfo,
    isRegistered,
    isEnabled,
    isTogglingStatus,
    error: deviceError,
    toggleNotificationStatus
  } = useDeviceNotifications();
  
  const handleCopyAddress = () => {
    navigator.clipboard.writeText('0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s');
    toast.success("Address copied to clipboard!");
  };
  
  const handleDarkModeToggle = () => {
    toggleTheme();
    toast.success(`${theme === 'light' ? 'Dark' : 'Light'} mode enabled`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Account Settings</h1>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
          <TabsTrigger value="wallet" className="flex-1">Wallet</TabsTrigger>
          <TabsTrigger value="preferences" className="flex-1">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile details and public information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center sm:flex-row sm:justify-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                
                <div className="flex flex-col items-center sm:items-start gap-2">
                  <h3 className="text-lg font-medium">Profile Picture</h3>
                  <p className="text-sm text-muted-foreground">
                    Your profile picture will be visible to community members
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Change
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid gap-5">
                <div className="grid gap-2.5">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="your.eth" />
                  <p className="text-sm text-muted-foreground">
                    This is your public username. It can be your ENS name or any unique identifier.
                  </p>
                </div>
                
                <div className="grid gap-2.5">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea 
                    id="bio" 
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                    placeholder="Tell communities a bit about yourself..."
                  />
                  <p className="text-sm text-muted-foreground">
                    Write a short bio to introduce yourself to the community.
                  </p>
                </div>
                
                <div className="grid gap-2.5">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your@email.com" 
                  />
                  <p className="text-sm text-muted-foreground">
                    Your email will only be used for important notifications and won't be shared publicly.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="wallet" className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Information</CardTitle>
              <CardDescription>
                View your wallet details and export your keys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2.5">
                <Label>Your Wallet Address</Label>
                <div className="flex items-center space-x-2">
                  <div className="bg-muted/50 rounded-md px-3 py-2 text-sm font-mono flex-1 truncate">
                    0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s
                  </div>
                  <Button variant="outline" size="icon" onClick={handleCopyAddress}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  This is your public wallet address that receives rewards and transaction fees.
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Security Operations</h3>
                <div className="flex flex-col space-y-3">
                  <Button variant="outline" className="justify-start">
                    <Key className="h-4 w-4 mr-2" />
                    Export Private Key
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Download Keystore File
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect Wallet
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Warning: Never share your private key or keystore file with anyone. Keep them secure and backed up.
                </p>
              </div>
              
              <Separator />
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-4">
                <h3 className="text-base font-medium text-yellow-700 mb-2">Security Reminder</h3>
                <p className="text-sm text-yellow-700">
                  Always verify the URL is dapps.co before entering sensitive information. We will never ask for your private key in emails or messages.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences" className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how dapps.co looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark theme
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch 
                    id="dark-mode" 
                    checked={theme === 'dark'} 
                    onCheckedChange={handleDarkModeToggle} 
                  />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce spacing for a denser interface
                  </p>
                </div>
                <Switch id="compact-mode" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isMobileApp && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        {isMobileApp && !isRegistered && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Not Enabled
                          </Badge>
                        )}
                        {isMobileApp && isRegistered && isEnabled && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Enabled
                          </Badge>
                        )}
                        {isMobileApp && isRegistered && !isEnabled && (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications even when you're not using the app
                      </p>
                    </div>
                    {isLoadingDeviceInfo ? (
                      <div className="h-5 w-10 bg-muted animate-pulse rounded" />
                    ) : isRegistered ? (
                      <Switch 
                        id="push-notifications" 
                        checked={isEnabled}
                        disabled={!isRegistered || isTogglingStatus}
                        onCheckedChange={(checked) => toggleNotificationStatus(checked)}
                      />
                    ) : (
                      <PushNotificationSetup variant="minimal" />
                    )}
                  </div>
                  
                  {deviceError && (
                    <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-md flex items-start gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-600">
                        There was an error checking your device notification status. Please try again.
                      </p>
                    </div>
                  )}
                  
                  <Separator />
                </>
              )}
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="roar-notifications">Roars on your posts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone roars your post
                  </p>
                </div>
                <Switch id="roar-notifications" defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="comment-notifications">Comments</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new comments on your posts
                  </p>
                </div>
                <Switch id="comment-notifications" defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mention-notifications">Mentions</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone mentions you
                  </p>
                </div>
                <Switch id="mention-notifications" defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reward-notifications">Rewards</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about community rewards and earnings
                  </p>
                </div>
                <Switch id="reward-notifications" defaultChecked />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>
                Manage your privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="share-stats">Community Contributions</Label>
                  <p className="text-sm text-muted-foreground">
                    Share your activity stats with communities you join
                  </p>
                </div>
                <Switch id="share-stats" defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="analytics">Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Help improve dapps.co with anonymous usage data
                  </p>
                </div>
                <Switch id="analytics" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                For more information on how we handle your data, please see our <a href="/privacy" className="underline">Privacy Policy</a>.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountPage;
