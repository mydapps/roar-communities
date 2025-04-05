import React, { useEffect, useRef, useCallback } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationItem from '@/components/notifications/NotificationItem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, BellOff, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTitle } from '@/hooks/useTitle';
import { motion } from 'framer-motion';

const NotificationsPage: React.FC = () => {
  useTitle('Notifications | Dapps.co');
  
  const { 
    loading, 
    loadingMore,
    notifications, 
    unreadCount,
    pagination,
    markAsSeen,
    markAllAsSeen,
    loadMoreNotifications
  } = useNotifications();
  
  // Reference for infinite scrolling
  const loaderRef = useRef<HTMLDivElement>(null);
  
  // Intersection observer callback for infinite scrolling
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && pagination.has_more && !loadingMore) {
      loadMoreNotifications();
    }
  }, [pagination.has_more, loadingMore, loadMoreNotifications]);
  
  // Set up observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '0px',
      threshold: 1.0
    });
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [handleObserver]);
  
  // Handle notification click
  const handleNotificationClick = (id: number) => {
    markAsSeen(id);
  };

  return (
    <div className="container max-w-4xl mx-auto pt-24 pb-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notifications
          </h1>
          <p className="text-muted-foreground">
            Stay updated on your activity
          </p>
        </motion.div>
        
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => markAllAsSeen()}
          >
            Mark all as read
          </Button>
        )}
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Activity Feed</CardTitle>
            <CardDescription>
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium">No notifications yet</h3>
                <p className="text-sm mt-1">
                  When you get notifications, they will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification.id)}
                  />
                ))}
                
                {/* Loading spinner for infinite scroll */}
                <div 
                  ref={loaderRef} 
                  className="py-8 flex justify-center"
                >
                  {loadingMore && (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  )}
                  
                  {!pagination.has_more && notifications.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      You've reached the end
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default NotificationsPage; 