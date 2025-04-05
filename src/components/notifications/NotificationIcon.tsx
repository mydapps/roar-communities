import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationItem from './NotificationItem';
import { Link } from 'react-router-dom';
import { Loader2, BellOff, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const NotificationIcon: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { 
    loading, 
    notifications, 
    unreadCount, 
    markAsSeen, 
    markAllAsSeen, 
    refreshNotifications 
  } = useNotifications();

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    
    // Refresh notifications when opening the dropdown
    if (isOpen) {
      refreshNotifications();
    }
  };
  
  // Handle clicking a notification
  const handleNotificationClick = (id: number) => {
    // Mark as seen when clicked
    markAsSeen(id);
    // Close the dropdown
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "relative transition-colors",
            unreadCount > 0 && "text-primary hover:text-primary"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-full opacity-0 hover:opacity-100 transition-opacity"></div>
          <Bell className={cn(
            "h-5 w-5",
            unreadCount > 0 && "animate-subtle-pulse"
          )} />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 flex items-center justify-center text-xs border border-background shadow-sm"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto shadow-lg" alignOffset={-8}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-medium text-base">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-xs h-7 gap-1 text-primary hover:bg-primary/5"
              onClick={() => markAllAsSeen()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <BellOff className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <>
            {notifications.slice(0, 5).map((notification) => (
              <NotificationItem 
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification.id)}
              />
            ))}
            
            {notifications.length > 5 && (
              <DropdownMenuSeparator />
            )}
          </>
        )}
        
        <div className="border-t py-2 px-2 text-center">
          <DropdownMenuItem asChild className="justify-center cursor-pointer text-primary hover:text-primary focus:text-primary hover:bg-primary/5">
            <Link to="/notifications">
              View all notifications
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationIcon; 