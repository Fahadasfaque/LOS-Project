'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { groupNotificationsByDate } from '@/lib/customerStatusMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Bell, Spinner, CheckSquare, Clock, Warning, Check } from '@phosphor-icons/react';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function NotificationGroup({ title, items, onMarkRead }: { title: string; items: Notification[]; onMarkRead: (id: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 py-1">{title}</p>
      {items.map((n, i) => (
        <React.Fragment key={n.id}>
          <div
            className={`flex items-start gap-3 rounded-lg px-3 py-3 transition-colors ${
              !n.isRead ? 'bg-primary/5 border border-primary/20' : 'border border-transparent hover:bg-muted/30'
            }`}
          >
            <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-foreground leading-snug">{n.title}</p>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  {!n.isRead && (
                    <button
                      onClick={() => onMarkRead(n.id)}
                      className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="h-3 w-3" weight="bold" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
            </div>
          </div>
          {i < items.length - 1 && <Separator className="opacity-40" />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/customer/notifications');
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifs(); }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await api.patch('/customer/notifications/read', { notificationIds: [id] });
      if (res.success) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      }
    } catch { /* non-fatal */ }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      const res = await api.patch('/customer/notifications/read', {});
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch { /* non-fatal */ } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const groups = groupNotificationsByDate(notifications);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <Badge className="text-[10px] h-5 px-2 bg-primary">{unreadCount} unread</Badge>
            )}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time updates on your loan application progress.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
            className="gap-1.5 h-8 text-xs"
          >
            {actionLoading ? (
              <Spinner className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckSquare className="h-3.5 w-3.5" weight="bold" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <Bell className="h-14 w-14 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-foreground mb-1">No Notifications</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You're all caught up! Notifications about your loan application will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border">
          <CardContent className="p-4 space-y-4">
            <NotificationGroup title="Today" items={groups.today} onMarkRead={handleMarkAsRead} />
            {groups.today.length > 0 && (groups.yesterday.length > 0 || groups.earlier.length > 0) && (
              <Separator />
            )}
            <NotificationGroup title="Yesterday" items={groups.yesterday} onMarkRead={handleMarkAsRead} />
            {groups.yesterday.length > 0 && groups.earlier.length > 0 && (
              <Separator />
            )}
            <NotificationGroup title="Earlier" items={groups.earlier} onMarkRead={handleMarkAsRead} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
