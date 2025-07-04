
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, X, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'urgent';
  title: string;
  message: string;
  timestamp: string;
  persistent: boolean;
  actionRequired: boolean;
  relatedTokenID?: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  fullView?: boolean;
}

const NotificationPanel = ({ notifications, onDismiss, fullView = false }: NotificationPanelProps) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-l-orange-500 bg-orange-50';
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'info':
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-orange-100 text-orange-700';
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!fullView && notifications.length === 0) {
    return null;
  }

  if (!fullView) {
    // Banner notifications for persistent alerts
    const persistentNotifications = notifications.filter(n => n.persistent);
    
    return (
      <div className="space-y-2 mx-6 mt-4">
        {persistentNotifications.map((notification) => (
          <Alert key={notification.id} className={`${getNotificationColor(notification.type)} border-l-4`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                {getNotificationIcon(notification.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">{notification.title}</span>
                    <Badge className={getBadgeColor(notification.type)}>
                      {notification.type.toUpperCase()}
                    </Badge>
                    {notification.actionRequired && (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                        Action Required
                      </Badge>
                    )}
                  </div>
                  <AlertDescription>{notification.message}</AlertDescription>
                  <div className="flex items-center space-x-2 mt-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(notification.timestamp)}</span>
                    {notification.relatedTokenID && (
                      <span>• Token #{notification.relatedTokenID}</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(notification.id)}
                className="h-6 w-6 p-0 hover:bg-white/50"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </Alert>
        ))}
      </div>
    );
  }

  // Full notification center view
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notification Center
          </CardTitle>
          <CardDescription>
            Stay informed about access requests, data views, and system alerts
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-slate-500">No notifications</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} className={`${getNotificationColor(notification.type)} border-l-4 hover:shadow-md transition-shadow`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-slate-900">{notification.title}</h4>
                        <Badge className={getBadgeColor(notification.type)}>
                          {notification.type.toUpperCase()}
                        </Badge>
                        {notification.actionRequired && (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-slate-700">{notification.message}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(notification.timestamp)}</span>
                        </div>
                        {notification.relatedTokenID && (
                          <span>Related to Token #{notification.relatedTokenID}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismiss(notification.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
