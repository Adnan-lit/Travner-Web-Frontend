import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  timestamp: Date;
  read: boolean;
  type: 'message' | 'order' | 'travel_buddy' | 'itinerary' | 'general';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private permission: NotificationPermission = 'default';

  constructor() {
    this.checkPermission();
    this.loadStoredNotifications();
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Check current notification permission
   */
  checkPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    this.permission = Notification.permission;
    return this.permission;
  }

  /**
   * Show a browser notification
   */
  async showNotification(notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>): Promise<void> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('Notification permission not granted');
        return;
      }
    }

    const notificationData: NotificationData = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      read: false
    };

    // Store notification
    this.addNotification(notificationData);

    // Show browser notification
    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/assets/icons/icon-192x192.png',
        badge: notification.badge || '/assets/icons/badge-72x72.png',
        tag: notification.tag,
        data: notification.data,
        requireInteraction: notification.type === 'message',
        silent: false
      });

      // Auto close after 5 seconds for non-message notifications
      if (notification.type !== 'message') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }

      browserNotification.onclick = () => {
        window.focus();
        this.markAsRead(notificationData.id);
        browserNotification.close();
      };

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Show chat message notification
   */
  async showChatNotification(senderName: string, message: string, conversationId: string): Promise<void> {
    await this.showNotification({
      title: `New message from ${senderName}`,
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      type: 'message',
      tag: `chat-${conversationId}`,
      data: { conversationId, type: 'chat' }
    });
  }

  /**
   * Show order notification
   */
  async showOrderNotification(orderNumber: string, status: string): Promise<void> {
    await this.showNotification({
      title: `Order ${orderNumber} Update`,
      body: `Your order status has been updated to: ${status}`,
      type: 'order',
      tag: `order-${orderNumber}`,
      data: { orderNumber, status, type: 'order' }
    });
  }

  /**
   * Show travel buddy notification
   */
  async showTravelBuddyNotification(buddyName: string, message: string): Promise<void> {
    await this.showNotification({
      title: `Travel Buddy Match: ${buddyName}`,
      body: message,
      type: 'travel_buddy',
      data: { buddyName, type: 'travel_buddy' }
    });
  }

  /**
   * Show itinerary notification
   */
  async showItineraryNotification(title: string, message: string): Promise<void> {
    await this.showNotification({
      title: `Itinerary: ${title}`,
      body: message,
      type: 'itinerary',
      data: { title, type: 'itinerary' }
    });
  }

  /**
   * Show general notification
   */
  async showGeneralNotification(title: string, message: string, data?: any): Promise<void> {
    await this.showNotification({
      title,
      body: message,
      type: 'general',
      data: { ...data, type: 'general' }
    });
  }

  /**
   * Get all notifications
   */
  getNotifications(): NotificationData[] {
    return this.notificationsSubject.value;
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): number {
    return this.notificationsSubject.value.filter(n => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notifications = this.notificationsSubject.value;
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications(notifications);
      this.notificationsSubject.next([...notifications]);
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.saveNotifications(notifications);
    this.notificationsSubject.next(notifications);
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): void {
    const notifications = this.notificationsSubject.value.filter(n => n.id !== notificationId);
    this.saveNotifications(notifications);
    this.notificationsSubject.next(notifications);
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    this.notificationsSubject.next([]);
    this.saveNotifications([]);
  }

  /**
   * Clear old notifications (older than 7 days)
   */
  clearOldNotifications(): void {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const notifications = this.notificationsSubject.value.filter(
      n => n.timestamp > sevenDaysAgo
    );
    
    this.saveNotifications(notifications);
    this.notificationsSubject.next(notifications);
  }

  private addNotification(notification: NotificationData): void {
    const notifications = [notification, ...this.notificationsSubject.value];
    // Keep only last 100 notifications
    const limitedNotifications = notifications.slice(0, 100);
    this.saveNotifications(limitedNotifications);
    this.notificationsSubject.next(limitedNotifications);
  }

  private loadStoredNotifications(): void {
    try {
      const stored = localStorage.getItem('travner-notifications');
      if (stored) {
        const notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this.notificationsSubject.next(notifications);
      }
    } catch (error) {
      console.error('Error loading stored notifications:', error);
    }
  }

  private saveNotifications(notifications: NotificationData[]): void {
    try {
      localStorage.setItem('travner-notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Check if permission is granted
   */
  isPermissionGranted(): boolean {
    return this.permission === 'granted';
  }
}
