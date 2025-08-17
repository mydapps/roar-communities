import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Send, 
  Users, 
  History, 
  FileText, 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Eye,
  User,
  Globe,
  RefreshCw,
  Settings,
  BarChart3,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  checkAdminAccess,
  getMarketingUsers,
  sendMarketingNotification,
  getCampaignHistory,
  getNotificationTemplates,
  formatSuccessRate,
  formatTargetType,
  formatCampaignStatus,
  type MarketingUser,
  type Campaign,
  type NotificationTemplate,
  type SendNotificationRequest
} from '@/utils/marketingApi';

const MarketingNotificationsPage: React.FC = () => {
  const isMobile = useIsMobile();
  
  // 🔐 Admin Access Control
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 📊 State Management
  const [activeTab, setActiveTab] = useState('send');
  const [users, setUsers] = useState<MarketingUser[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 📝 Form State
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    url: '',
    target_type: 'single' as 'single' | 'multiple' | 'all',
    notes: ''
  });
  
  // 📈 Pagination State
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  
  const [campaignsPagination, setCampaignsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // 🔐 Check Admin Access on Mount
  useEffect(() => {
    const checkAccess = () => {
      const hasAccess = checkAdminAccess();
      setHasAdminAccess(hasAccess);
      setIsLoading(false);
      
      if (!hasAccess) {
        toast.error('Admin access required. Only UIDs 1, 2, 3 can access marketing notifications.');
      }
    };
    
    checkAccess();
  }, []);

  // 📊 Load Initial Data
  useEffect(() => {
    if (hasAdminAccess) {
      loadUsers();
      loadCampaigns();
      loadTemplates();
    }
  }, [hasAdminAccess]);

  // 👥 Load Users Function
  const loadUsers = async (page = 1) => {
    try {
      setIsRefreshing(true);
      const response = await getMarketingUsers({
        page,
        limit: usersPagination.limit,
        include_devices: true
      });
      
      if (response) {
        setUsers(response.users);
        setUsersPagination(prev => ({
          ...prev,
          page: response.pagination.page,
          total: response.pagination.total,
          pages: response.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 📈 Load Campaigns Function
  const loadCampaigns = async (page = 1) => {
    try {
      const response = await getCampaignHistory({
        page,
        limit: campaignsPagination.limit
      });
      
      if (response) {
        setCampaigns(response.campaigns);
        setCampaignsPagination(prev => ({
          ...prev,
          page: response.pagination.page,
          total: response.pagination.total,
          pages: response.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  // 📝 Load Templates Function
  const loadTemplates = async () => {
    try {
      const response = await getNotificationTemplates();
      if (response) {
        setTemplates(response.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  // 🎯 User Selection Functions
  const handleUserSelection = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const selectAllUsers = () => {
    setSelectedUsers(users.map(user => user.id));
  };

  const clearAllUsers = () => {
    setSelectedUsers([]);
  };

  // 📝 Template Application
  const applyTemplate = (template: NotificationTemplate) => {
    setNotificationForm(prev => ({
      ...prev,
      title: template.title,
      message: template.message,
      url: template.url_template || ''
    }));
    toast.success(`Applied template: ${template.name}`);
  };

  // 📨 Send Notification Function
  const handleSendNotification = async () => {
    try {
      // Validation
      if (!notificationForm.title.trim()) {
        toast.error('Title is required');
        return;
      }
      
      if (!notificationForm.message.trim()) {
        toast.error('Message is required');
        return;
      }
      
      if (notificationForm.target_type !== 'all' && selectedUsers.length === 0) {
        toast.error('Please select at least one user');
        return;
      }
      
      // Confirmation for "All Users"
      if (notificationForm.target_type === 'all') {
        const confirmed = window.confirm(
          '⚠️ Are you sure you want to send this notification to ALL users? This cannot be undone.'
        );
        if (!confirmed) return;
      }
      
      // Prepare request
      const request: SendNotificationRequest = {
        title: notificationForm.title,
        message: notificationForm.message,
        url: notificationForm.url || undefined,
        target_type: notificationForm.target_type,
        target_user_ids: notificationForm.target_type === 'all' ? undefined : selectedUsers,
        notes: notificationForm.notes || undefined
      };
      
      // Send notification
      const response = await sendMarketingNotification(request);
      
      if (response) {
        // Reset form
        setNotificationForm({
          title: '',
          message: '',
          url: '',
          target_type: 'single',
          notes: ''
        });
        setSelectedUsers([]);
        
        // Refresh campaigns
        loadCampaigns();
        
        toast.success(`🎉 Campaign sent successfully! ${response.results.total_sent} notifications delivered.`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  // 🚫 Access Denied Redirect
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }
  
  if (hasAdminAccess === false) {
    return <Navigate to="/feed" replace />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* 🎯 Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Marketing Notifications</h1>
            <p className="text-muted-foreground">Admin-only push notification management system</p>
          </div>
        </div>
        
        {/* 📊 Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{usersPagination.total.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Campaigns</p>
                  <p className="text-2xl font-bold">{campaignsPagination.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Templates</p>
                  <p className="text-2xl font-bold">{templates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Selected</p>
                  <p className="text-2xl font-bold">{selectedUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 📱 Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>

        {/* 📨 Send Notifications Tab */}
        <TabsContent value="send" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Create Campaign
              </CardTitle>
              <CardDescription>
                Send push notifications to targeted users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Notification Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Notification title (60 chars max)"
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {notificationForm.title.length}/60 characters
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Notification message content"
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="url">Deep Link URL (Optional)</Label>
                    <Input
                      id="url"
                      placeholder="/communities or https://example.com"
                      value={notificationForm.url}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, url: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Campaign Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Internal notes about this campaign"
                      value={notificationForm.notes}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Target Type Selection */}
                  <div>
                    <Label>Target Type</Label>
                    <Select
                      value={notificationForm.target_type}
                      onValueChange={(value) => setNotificationForm(prev => ({ 
                        ...prev, 
                        target_type: value as 'single' | 'multiple' | 'all' 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">👤 Single User</SelectItem>
                        <SelectItem value="multiple">👥 Multiple Users</SelectItem>
                        <SelectItem value="all">🌍 All Users ⚠️</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* User Selection */}
                  {notificationForm.target_type !== 'all' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Selected Users ({selectedUsers.length})</Label>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={selectAllUsers}>
                            Select All
                          </Button>
                          <Button size="sm" variant="outline" onClick={clearAllUsers}>
                            Clear
                          </Button>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                        {users.length > 0 ? (
                          <div className="space-y-2">
                            {users.map((user) => (
                              <div key={user.id} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={selectedUsers.includes(user.id)}
                                  onCheckedChange={(checked) => 
                                    handleUserSelection(user.id, checked as boolean)
                                  }
                                />
                                <div className="flex items-center gap-2 flex-1">
                                  <img 
                                    src={user.avatar || '/images/default-avatar.png'} 
                                    alt={user.handle}
                                    className="w-6 h-6 rounded-full"
                                  />
                                  <span className="font-medium">@{user.handle}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {user.device_count} device{user.device_count !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No users loaded. Click the Users tab to load users.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Preview */}
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="font-medium mb-2">📱 Preview</h4>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border shadow-sm">
                      <div className="font-medium text-sm">
                        {notificationForm.title || 'Notification Title'}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {notificationForm.message || 'Notification message will appear here...'}
                      </div>
                      {notificationForm.url && (
                        <div className="text-xs text-blue-500 mt-1">
                          🔗 {notificationForm.url}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Send Button */}
                  <Button 
                    onClick={handleSendNotification}
                    className="w-full"
                    size="lg"
                    disabled={!notificationForm.title || !notificationForm.message}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Campaign
                    {notificationForm.target_type === 'all' && (
                      <span className="ml-2 text-yellow-200">⚠️</span>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 📈 Campaign History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Campaign History
                  </CardTitle>
                  <CardDescription>
                    View past campaigns and their performance
                  </CardDescription>
                </div>
                <Button onClick={() => loadCampaigns()} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <Card key={campaign.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{campaign.title}</h4>
                              <Badge variant="outline">
                                {formatCampaignStatus(campaign.status)}
                              </Badge>
                              <Badge variant="secondary">
                                {formatTargetType(campaign.target_type)}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {campaign.message}
                            </p>
                            
                            {campaign.url && (
                              <p className="text-xs text-blue-500 mb-2">
                                🔗 {campaign.url}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>By @{campaign.sent_by_handle}</span>
                              <span>{new Date(campaign.sent_at).toLocaleDateString()}</span>
                              {campaign.notes && <span>📝 {campaign.notes}</span>}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium">
                                {formatSuccessRate(campaign.success_rate)} {campaign.success_rate}
                              </span>
                            </div>
                            
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>📊 {campaign.total_targeted} targeted</div>
                              <div>✅ {campaign.total_sent} sent</div>
                              <div>❌ {campaign.total_failed} failed</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Pagination */}
                  {campaignsPagination.pages > 1 && (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={campaignsPagination.page <= 1}
                        onClick={() => loadCampaigns(campaignsPagination.page - 1)}
                      >
                        Previous
                      </Button>
                      
                      <span className="text-sm text-muted-foreground">
                        Page {campaignsPagination.page} of {campaignsPagination.pages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={campaignsPagination.page >= campaignsPagination.pages}
                        onClick={() => loadCampaigns(campaignsPagination.page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground">
                    Send your first marketing notification to get started!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 📝 Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notification Templates
              </CardTitle>
              <CardDescription>
                Pre-built templates for common campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{template.title}</h4>
                            <Badge variant="outline" className="mt-1">
                              {template.category}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => applyTemplate(template)}
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Use
                          </Button>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {template.message}
                        </p>
                        
                        {template.url_template && (
                          <p className="text-xs text-blue-500">
                            🔗 {template.url_template}
                          </p>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          Created by @{template.created_by_handle}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No templates available</h3>
                  <p className="text-muted-foreground">
                    Templates will appear here when they're created.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 👥 Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    View and select users for targeting
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => loadUsers()}
                  variant="outline" 
                  size="sm"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {users.length > 0 ? (
                <div className="space-y-4">
                  {/* User List */}
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => 
                              handleUserSelection(user.id, checked as boolean)
                            }
                          />
                          <img 
                            src={user.avatar || '/images/default-avatar.png'} 
                            alt={user.handle}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <div className="font-medium">@{user.handle}</div>
                            <div className="text-xs text-muted-foreground">
                              ID: {user.id} • Last active: {new Date(user.last_active).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {user.device_count} device{user.device_count !== 1 ? 's' : ''}
                          </Badge>
                          <Badge variant="outline">
                            {user.enabled_notification_types.length} types
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {usersPagination.pages > 1 && (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={usersPagination.page <= 1}
                        onClick={() => loadUsers(usersPagination.page - 1)}
                      >
                        Previous
                      </Button>
                      
                      <span className="text-sm text-muted-foreground">
                        Page {usersPagination.page} of {usersPagination.pages} 
                        ({usersPagination.total.toLocaleString()} total users)
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={usersPagination.page >= usersPagination.pages}
                        onClick={() => loadUsers(usersPagination.page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    No users with notifications enabled were found.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingNotificationsPage; 