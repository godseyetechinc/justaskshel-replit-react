import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bell, 
  BellOff,
  Coins,
  Trophy,
  TrendingUp,
  Users,
  Gift,
  Settings,
  ArrowRight,
  Clock
} from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: number;
  userId: string;
  type: 'Points' | 'TierUpgrade' | 'Achievement' | 'Referral' | 'Reward' | 'System';
  title: string;
  message: string;
  data?: any;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  isRead: boolean;
  createdAt: string;
}

const getNotificationIcon = (type: string) => {
  const iconProps = { className: "h-4 w-4" };
  
  switch (type) {
    case 'Points': return <Coins {...iconProps} className="h-4 w-4 text-yellow-500" />;
    case 'TierUpgrade': return <TrendingUp {...iconProps} className="h-4 w-4 text-green-500" />;
    case 'Achievement': return <Trophy {...iconProps} className="h-4 w-4 text-orange-500" />;
    case 'Referral': return <Users {...iconProps} className="h-4 w-4 text-blue-500" />;
    case 'Reward': return <Gift {...iconProps} className="h-4 w-4 text-purple-500" />;
    case 'System': return <Settings {...iconProps} className="h-4 w-4 text-gray-500" />;
    default: return <Bell {...iconProps} />;
  }
};

interface NotificationDropdownItemProps {
  notification: Notification;
}

const NotificationDropdownItem = ({ notification }: NotificationDropdownItemProps) => {
  return (
    <div 
      className={`p-3 hover:bg-muted cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-primary/5' : ''
      }`}
      data-testid={`dropdown-notification-${notification.id}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <p className={`text-sm font-medium truncate ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
              {notification.title}
            </p>
            {!notification.isRead && (
              <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
            {notification.message}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            {notification.data?.points && (
              <span className="text-xs font-medium text-yellow-600">
                +{notification.data.points}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationDropdownSkeleton = () => (
  <div className="space-y-3 p-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex items-start space-x-3">
        <Skeleton className="h-4 w-4 rounded-full mt-0.5" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = "" }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch recent notifications (limit to recent unread + latest few)
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", { limit: 10 }],
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  const recentNotifications = notifications?.slice(0, 5) || [];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative h-9 w-9 ${className}`}
          data-testid="notification-bell"
        >
          {unreadCount > 0 ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="notification-count"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-hidden p-0"
        data-testid="notification-dropdown"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <NotificationDropdownSkeleton />
          ) : recentNotifications.length > 0 ? (
            <div className="divide-y">
              {recentNotifications.map(notification => (
                <NotificationDropdownItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <BellOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground">You're all caught up!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {recentNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link href="/dashboard/notifications">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between text-sm"
                  onClick={() => setIsOpen(false)}
                  data-testid="view-all-notifications"
                >
                  View all notifications
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}