import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AIChatService, AIChatMessage, AIChatSession } from '../../services/ai-chat.service';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ai-chat-container">
      <!-- Chat Header -->
      <div class="chat-header">
        <div class="header-content">
          <div class="ai-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <div class="header-info">
            <h3>Travner AI Assistant</h3>
            <p>Your personal travel guide for Bangladesh & beyond</p>
          </div>
        </div>
        
        <div class="header-actions">
          <select [(ngModel)]="selectedModel" (change)="onModelChange()" class="model-selector">
            <option *ngFor="let model of availableModels" [value]="model">
              {{ getModelDisplayName(model) }}
            </option>
          </select>
          
          <button class="new-chat-btn" (click)="startNewChat()" title="New Chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14m-7-7h14"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="quick-action-btn" (click)="askQuickQuestion('Best places to visit in Bangladesh')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Bangladesh Destinations
        </button>
        
        <button class="quick-action-btn" (click)="askQuickQuestion('Create a 3-day itinerary for Cox\\'s Bazar')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
          </svg>
          Plan Itinerary
        </button>
        
        <button class="quick-action-btn" (click)="askQuickQuestion('Find travel buddies for adventure travel')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Find Travel Buddies
        </button>
        
        <button class="quick-action-btn" (click)="askQuickQuestion('Budget travel tips for Bangladeshi travelers')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
          </svg>
          Budget Tips
        </button>
      </div>

      <!-- Messages Container -->
      <div class="messages-container" #messagesContainer>
        <div *ngIf="currentSession.messages.length === 0" class="welcome-message">
          <div class="welcome-content">
            <div class="welcome-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <h3>Welcome to Travner AI!</h3>
            <p>I'm your personal travel assistant, specialized in helping Bangladeshi travelers explore the world. Ask me about:</p>
            <ul>
              <li>🏖️ Best destinations in Bangladesh</li>
              <li>🌍 International travel recommendations</li>
              <li>📋 Detailed itineraries</li>
              <li>👥 Travel buddy matching</li>
              <li>💰 Budget travel tips</li>
              <li>🍜 Local food recommendations</li>
            </ul>
          </div>
        </div>

        <div *ngFor="let message of currentSession.messages" class="message" [class.user-message]="message.role === 'user'" [class.ai-message]="message.role === 'assistant'">
          <div class="message-avatar" *ngIf="message.role === 'assistant'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          
          <div class="message-content">
            <div class="message-text" [innerHTML]="formatMessage(message.content)"></div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>

        <div *ngIf="isTyping" class="message ai-message typing-message">
          <div class="message-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-container">
        <div class="input-wrapper">
          <textarea
            [(ngModel)]="userMessage"
            (keydown)="onKeyDown($event)"
            placeholder="Ask me anything about travel..."
            class="message-input"
            [disabled]="isLoading"
            rows="1"
            #messageInput
          ></textarea>
          
          <button 
            class="send-button" 
            (click)="sendMessage()" 
            [disabled]="!userMessage.trim() || isLoading"
            title="Send Message"
          >
            <svg *ngIf="!isLoading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
            </svg>
            <div *ngIf="isLoading" class="loading-spinner"></div>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./ai-chat.component.css']
})
export class AIChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  userMessage = '';
  isLoading = false;
  isTyping = false;
  currentSession: AIChatSession;
  availableModels: string[] = [];
  selectedModel: string = '';

  private destroy$ = new Subject<void>();

  constructor(private aiChatService: AIChatService) {
    this.currentSession = this.aiChatService.getCurrentSession();
  }

  ngOnInit(): void {
    this.availableModels = this.aiChatService.getAvailableModels();
    this.selectedModel = this.aiChatService.getCurrentModel();
    
    // Subscribe to session updates
    this.aiChatService.sessions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(sessions => {
        if (sessions.length > 0) {
          this.currentSession = sessions[sessions.length - 1];
        }
      });
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  sendMessage(): void {
    if (!this.userMessage.trim() || this.isLoading) {
      return;
    }

    const message = this.userMessage.trim();
    this.userMessage = '';
    this.isLoading = true;
    this.isTyping = true;

    this.aiChatService.sendMessage(message).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isTyping = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.isLoading = false;
        this.isTyping = false;
      }
    });
  }

  askQuickQuestion(question: string): void {
    this.userMessage = question;
    this.sendMessage();
  }

  startNewChat(): void {
    this.currentSession = this.aiChatService.createNewSession();
    this.scrollToBottom();
  }

  onModelChange(): void {
    this.aiChatService.switchModel(this.selectedModel);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatMessage(content: string): string {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/^(\d+)\./gm, '<br><strong>$1.</strong>');
  }

  formatTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getModelDisplayName(model: string): string {
    const modelNames: { [key: string]: string } = {
      'microsoft/phi-3-mini-128k-instruct:free': 'Phi-3 Mini (Fast)',
      'meta-llama/llama-3.2-3b-instruct:free': 'Llama 3.2 (Balanced)',
      'google/gemma-2-2b-it:free': 'Gemma 2 (Creative)',
      'mistralai/mistral-7b-instruct:free': 'Mistral 7B (Advanced)'
    };
    return modelNames[model] || model;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }
}

