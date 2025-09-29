import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { ChatMessage } from '../../../models/chat.models';
import { EnvironmentConfig } from '../../../config/environment.config';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$: WebSocketSubject<any>;
  private messagesSubject = new Subject<ChatMessage>();
  private connectionStatusSubject = new Subject<boolean>();

  constructor() {
    this.socket$ = this.createWebSocketConnection();
    this.socket$.subscribe({
      next: (message) => this.handleMessage(message),
      error: (err) => this.handleError(err),
      complete: () => this.handleComplete()
    });
  }

  private createWebSocketConnection(): WebSocketSubject<any> {
    const wsUrl = EnvironmentConfig.getWebSocketUrl();

    // Attempt to include Basic Auth via query param (if backend supports) since typical browsers block custom headers in WS ctor
    let finalUrl = wsUrl;
    try {
      const authJson = localStorage.getItem('travner_auth');
      if (authJson) {
        const { username, password } = JSON.parse(authJson);
        if (username && password) {
          const token = btoa(`${username}:${password}`);
          // Append as query parameter (backend should extract if needed)
          const sep = wsUrl.includes('?') ? '&' : '?';
          finalUrl = `${wsUrl}${sep}auth=${encodeURIComponent(token)}`;
        }
      }
    } catch (e) {
      console.warn('Failed to attach auth to WebSocket URL', e);
    }

    return webSocket({
      url: finalUrl,
      openObserver: { next: () => { console.log('WebSocket connection established', { url: finalUrl }); this.connectionStatusSubject.next(true); } },
      closeObserver: { next: () => { console.log('WebSocket connection closed'); this.connectionStatusSubject.next(false); } }
    });
  }

  private handleMessage(message: any): void {
    // Handle incoming WebSocket messages
    if (message.type === 'chat') {
      this.messagesSubject.next(message.data);
    }
  }

  private handleError(err: any): void {
    console.error('WebSocket error:', err);
    this.connectionStatusSubject.next(false);
  }

  private handleComplete(): void {
    console.log('WebSocket connection completed');
    this.connectionStatusSubject.next(false);
  }

  // Public methods for WebSocket interactions

  /**
   * Send a chat message
   */
  sendMessage(message: ChatMessage): void {
    if (!this.socket$ || this.socket$.closed) {
      console.error('WebSocket is not connected. Attempting reconnection...');
      this.socket$ = this.createWebSocketConnection();
    }
    this.socket$.next({ type: 'chat', data: message });
  }

  /**
   * Get incoming messages as Observable
   */
  getMessages(): Observable<ChatMessage> {
    return this.messagesSubject.asObservable();
  }

  /**
   * Get connection status as Observable
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  /**
   * Disconnect the WebSocket connection
   */
  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
    }
  }
}