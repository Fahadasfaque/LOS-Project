'use client';

/**
 * @file page.tsx (/customer/notifications)
 * @description Customer Notifications Page.
 *
 * Displays all customer notifications, grouped by date (Today, Yesterday, Earlier).
 * Allows marking individual notifications as read or marking all as read.
 */

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { groupNotificationsByDate } from '@/lib/customerStatusMap';
import {
  Bell,
  Spinner,
  Check,
  CheckSquare,
  Clock,
  Warning,
} from '@phosphor-icons/react';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
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

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await api.patch('/customer/notifications/read', { notificationIds: [id] });
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch {
      // non-fatal
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      const res = await api.patch('/customer/notifications/read', {});
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch {
      // non-fatal
    } finally {
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
  const hasNotifications = notifications.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stay updated with real-time progress updates on your loan applications.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
            className="flex h-8 px-3 items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-colors disabled:opacity-50"
          >
            {actionLoading ? (
              <Spinner className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckSquare className="h-4 w-4" />
            )}
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 flex items-center gap-2">
          <Warning className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {!hasNotifications ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
          <Bell className="h-16 w-16 text-muted-foreground/60 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-foreground mb-1">All Caught Up!</h3>
          <p className="text-xs text-muted-foreground">
            You do not have any new notifications at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today */}
          {groups.today.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                Today
              </h2>
              <div className="grid gap-2">
                {groups.today.map((n) => (
                  <NotificationRow key={n.id} notification={n} onMarkRead={handleMarkAsRead} />
                ))}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {groups.yesterday.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                Yesterday
              </h2>
              <div className="grid gap-2">
                {groups.yesterday.map((n) => (
                  <NotificationRow key={n.id} notification={n} onMarkRead={handleMarkAsRead} />
                ))}
              </div>
            </div>
          )}

          {/* Earlier */}
          {groups.earlier.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                Earlier
              </h2>
              <div className="grid gap-2">
                {groups.earlier.map((n) => (
                  <NotificationRow key={n.id} notification={n} onMarkRead={handleMarkAsRead} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
        !notification.isRead
          ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
          : 'border-border bg-card'
      }`}
    >
      {/* Read Status Dot */}
      <div
        className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 transition-all ${
          !notification.isRead ? 'bg-primary' : 'bg-muted-foreground/30'
        }`}
      />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground">{notification.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground/50 mt-1 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(notification.createdAt).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Mark read button */}
      {!notification.isRead && (
        <button
          onClick={() => onMarkRead(notification.id)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          title="Mark as read"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
