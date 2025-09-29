import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bell, 
  BellOff,
  Coins,
  Trophy,
  TrendingUp,
  Users,
  Gift,
  Settings,
  Check,
  X,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Filter
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";

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

const getNotificationIcon = (type: string, priority: string) => {
  const iconProps = { 
    className: `h-5 w-5 ${priority === 'High' || priority === 'Urgent' ? 'text-red-500' : 'text-muted-foreground'}` 
  };
  
  switch (type) {
    case 'Points': return <Coins {...iconProps} />;
    case 'TierUpgrade': return <TrendingUp {...iconProps} />;
    case 'Achievement': return <Trophy {...iconProps} />;
    case 'Referral': return <Users {...iconProps} />;
    case 'Reward': return <Gift {...iconProps} />;
    case 'System': return <Settings {...iconProps} />;
    default: return <Bell {...iconProps} />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'Normal': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const NotificationItem = ({ notification, onMarkAsRead, onDelete }: NotificationItemProps) => {
  return (
    <div 
      className={`p-4 border rounded-lg transition-all duration-200 ${
        notification.isRead 
          ? 'bg-background border-border' 
          : 'bg-muted/30 border-primary/20 shadow-sm'
      }`}
      data-testid={`notification-${notification.id}`}
    >
      <div className="flex items-start justify-between space-x-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`p-2 rounded-lg flex-shrink-0 ${notification.isRead ? 'bg-muted' : 'bg-primary/10'}`}>
            {getNotificationIcon(notification.type, notification.priority)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className={`font-medium text-sm ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                {notification.title}
              </h4>
              {!notification.isRead && (
                <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0" />
              )}
              {notification.priority !== 'Normal' && (
                <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                  {notification.priority}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </span>
              {notification.data?.points && (
                <span className="text-xs font-medium text-yellow-600">
                  +{notification.data.points} points
                </span>
              )}
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!notification.isRead && (
              <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                <Check className="h-4 w-4 mr-2" />
                Mark as read
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => onDelete(notification.id)}
              className="text-red-600 dark:text-red-400"
            >
              <X className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

const NotificationSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="p-4 border rounded-lg">
        <div className="flex items-start space-x-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-5 w-16 rounded" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    ))}
  </div>
);

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({ className = "" }: NotificationCenterProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications, isLoading, error } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) =>
      apiRequest(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notification marked as read",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: number) =>
      apiRequest(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notification deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/notifications/mark-all-read", {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "All notifications marked as read",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id: number) => {
    deleteNotificationMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  if (error) {
    return (
      <div className={`p-6 ${className}`} data-testid="notifications-error">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load notifications. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const filterTypes = ['all', 'Points', 'Achievement', 'TierUpgrade', 'Referral', 'Reward', 'System'];
  
  const filteredNotifications = notifications?.filter(notification => 
    selectedFilter === 'all' || notification.type === selectedFilter
  ) || [];

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className={`space-y-6 ${className}`} data-testid="notification-center">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-muted-foreground">
            Stay updated with your latest activities and rewards
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline" data-testid="mark-all-read">
            <Check className="h-4 w-4 mr-2" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Notifications</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{notifications?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unread</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center space-x-2">
              <BellOff className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold text-orange-600">{unreadCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">
                {notifications?.filter(n => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(n.createdAt) > weekAgo;
                }).length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-7 w-full max-w-2xl">
            {filterTypes.map(type => (
              <TabsTrigger 
                key={type} 
                value={type} 
                className="capitalize text-xs"
                data-testid={`filter-${type}`}
              >
                {type === 'all' ? 'All' : type.replace(/([A-Z])/g, ' $1').trim()}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>All notifications</DropdownMenuItem>
              <DropdownMenuItem>Unread only</DropdownMenuItem>
              <DropdownMenuItem>Read only</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>High priority</DropdownMenuItem>
              <DropdownMenuItem>This week</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {filterTypes.map(type => (
          <TabsContent key={type} value={type} className="space-y-4">
            {isLoading ? (
              <NotificationSkeleton />
            ) : filteredNotifications.length > 0 ? (
              <div className="space-y-3">
                {filteredNotifications
                  .sort((a, b) => {
                    // Sort by read status first (unread first), then by date (newest first)
                    if (a.isRead !== b.isRead) {
                      return a.isRead ? 1 : -1;
                    }
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  })
                  .map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No notifications</h3>
                <p className="text-muted-foreground mt-2">
                  {type === 'all' 
                    ? "You're all caught up! New notifications will appear here."
                    : `No ${type.toLowerCase()} notifications found.`
                  }
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}