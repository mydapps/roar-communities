import React from 'react';
import { Notification } from '@/utils/notificationApi';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MessageSquare, Star, Award, Bell, Users, ArrowRightCircle, Repeat2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  // Get appropriate icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'roar':
        return <Star className="h-5 w-5 text-amber-500" />;
      case 'reply':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'tag':
        return <ArrowRightCircle className="h-5 w-5 text-purple-500" />;
      case 'reward':
        return <Award className="h-5 w-5 text-green-500" />;
      case 'community':
        return <Users className="h-5 w-5 text-indigo-500" />;
      case 'mirror':
        return <Repeat2 className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Link 
      to={notification.url} 
      className={cn(
        "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
        !notification.seen && "bg-primary/5 hover:bg-primary/10"
      )}
      onClick={(e) => {
        // Mark as seen and follow the link
        e.preventDefault(); // Prevent navigation
        onClick(); // Mark as seen
        window.location.href = notification.url; // Then navigate
      }}
    >
      <div className="flex-shrink-0 mt-1">
        {notification.image ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={notification.image} alt="" />
            <AvatarFallback>{getIcon()}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
            {getIcon()}
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm" dangerouslySetInnerHTML={{ __html: notification.message }} />
        <div className="text-xs text-muted-foreground mt-1">{notification.date}</div>
      </div>
      
      {!notification.seen && (
        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
      )}
    </Link>
  );
};

export default NotificationItem; 