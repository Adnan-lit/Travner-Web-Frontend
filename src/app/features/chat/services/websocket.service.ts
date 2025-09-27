import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { ChatMessage, ChatRoom, ChatUser } from '../../../models/chat.models';

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
    // Replace with your actual WebSocket server URL
    const wsUrl = 'ws://localhost:8080/ws';

    return webSocket({
      url: wsUrl,
      openObserver: {
        next: () => {
          console.log('WebSocket connection established');
          this.connectionStatusSubject.next(true);
        }
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket connection closed');
          this.connectionStatusSubject.next(false);
        }
      }
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
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.next({
        type: 'chat',
        data: message
      });
    } else {
      console.error('WebSocket is not connected');
    }
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