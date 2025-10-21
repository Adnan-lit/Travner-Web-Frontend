import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { timeout, retry } from 'rxjs/operators';
import { of } from 'rxjs';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export interface AIChatSession {
  id: string;
  messages: AIChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AIChatService {
  private readonly API_BASE_URL = 'https://openrouter.ai/api/v1';
  
  // Free models available on OpenRouter
  private readonly FREE_MODELS = [
    'mistralai/mistral-7b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemma-2-2b-it:free'
  ];
  
  private currentModel = this.FREE_MODELS[0]; // Default to mistral-7b
  private currentSession: AIChatSession | null = null;
  private sessionsSubject = new BehaviorSubject<AIChatSession[]>([]);
  
  public sessions$ = this.sessionsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSessions();
  }

  /**
   * Send a message to the AI chatbot
   */
  sendMessage(message: string, sessionId?: string): Observable<AIChatMessage> {
    const userMessage: AIChatMessage = {
      id: this.generateId(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    // Add user message to session
    this.addMessageToSession(userMessage, sessionId);

    // Try backend AI service first, fallback to direct OpenRouter
    return this.sendMessageToBackend(message).pipe(
      catchError(error => {
        console.warn('Backend AI service unavailable, using direct OpenRouter:', error);
        return this.sendMessageToOpenRouter(message);
      })
    );
  }

  /**
   * Send message to backend AI service
   */
  private sendMessageToBackend(message: string): Observable<AIChatMessage> {
    const requestBody = {
      message: message,
      model: this.currentModel
    };

    return this.http.post<any>('/api/ai/chat', requestBody).pipe(
      timeout(60000),
      retry({ count: 2, delay: 2000 }),
      map(response => {
        const assistantMessage: AIChatMessage = {
          id: this.generateId(),
          role: 'assistant',
          content: response.data || 'Sorry, I could not process your request.',
          timestamp: new Date()
        };

        this.addMessageToSession(assistantMessage);
        return assistantMessage;
      }),
      catchError(error => {
        console.error('Backend AI Error:', error);
        throw error;
      })
    );
  }

  /**
   * Send message directly to OpenRouter - fallback (should not be used in production)
   * Note: This requires CORS to be properly configured and API key should be handled server-side
   */
  private sendMessageToOpenRouter(message: string): Observable<AIChatMessage> {
    // In production, always use backend. This is just a fallback that won't work without backend proxy
    const errorMessage: AIChatMessage = {
      id: this.generateId(),
      role: 'assistant',
      content: 'AI service is currently unavailable. Please ensure the backend server is running and the OPENROUTER_API_KEY environment variable is set.',
      timestamp: new Date()
    };
    this.addMessageToSession(errorMessage);
    return of(errorMessage);
  }

  /**
   * Get travel recommendations based on user preferences
   */
  getTravelRecommendations(preferences: {
    destination?: string;
    budget?: number;
    duration?: number;
    interests?: string[];
    travelStyle?: string;
  }): Observable<string> {
    // Try backend first
    return this.http.post<any>('/api/ai/recommendations', preferences).pipe(
      map(response => response.data),
      catchError(error => {
        console.warn('Backend AI service unavailable, using direct prompt:', error);
        const prompt = this.buildTravelRecommendationPrompt(preferences);
        return this.sendMessage(prompt).pipe(
          map(response => response.content)
        );
      })
    );
  }

  /**
   * Get itinerary suggestions
   */
  getItinerarySuggestions(destination: string, duration: number, interests: string[]): Observable<string> {
    const prompt = this.buildItineraryPrompt(destination, duration, interests);
    return this.sendMessage(prompt).pipe(
      map(response => response.content)
    );
  }

  /**
   * Get travel buddy matching suggestions
   */
  getTravelBuddySuggestions(userProfile: {
    age: number;
    interests: string[];
    travelStyle: string;
    destinations: string[];
  }): Observable<string> {
    const prompt = this.buildTravelBuddyPrompt(userProfile);
    return this.sendMessage(prompt).pipe(
      map(response => response.content)
    );
  }

  /**
   * Create a new chat session
   */
  createNewSession(): AIChatSession {
    const session: AIChatSession = {
      id: this.generateId(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.currentSession = session;
    this.saveSessions();
    return session;
  }

  /**
   * Get current session
   */
  getCurrentSession(): AIChatSession {
    if (!this.currentSession) {
      return this.createNewSession();
    }
    return this.currentSession;
  }

  /**
   * Switch to a different AI model
   */
  switchModel(model: string): void {
    this.currentModel = model;
    console.log(`Switched to model: ${model}`);
  }

  /**
   * Get available free models
   */
  getAvailableModels(): string[] {
    return [...this.FREE_MODELS];
  }

  /**
   * Get current model
   */
  getCurrentModel(): string {
    return this.currentModel;
  }

  private addMessageToSession(message: AIChatMessage, sessionId?: string): void {
    const session = sessionId ? this.getSessionById(sessionId) : this.getCurrentSession();
    if (session) {
      session.messages.push(message);
      session.updatedAt = new Date();
      this.saveSessions();
    }
  }

  private getSessionById(sessionId: string): AIChatSession | null {
    const sessions = this.sessionsSubject.value;
    return sessions.find(s => s.id === sessionId) || null;
  }

  private loadSessions(): void {
    const saved = localStorage.getItem('travner-ai-sessions');
    if (saved) {
      try {
        const sessions = JSON.parse(saved);
        this.sessionsSubject.next(sessions);
        if (sessions.length > 0) {
          this.currentSession = sessions[sessions.length - 1];
        }
      } catch (error) {
        console.error('Error loading AI sessions:', error);
      }
    }
  }

  private saveSessions(): void {
    const sessions = this.sessionsSubject.value;
    localStorage.setItem('travner-ai-sessions', JSON.stringify(sessions));
    this.sessionsSubject.next(sessions);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private buildTravelRecommendationPrompt(preferences: any): string {
    return `You are a travel expert specializing in Bangladesh and global destinations. 
    Help the user plan their trip based on these preferences:
    - Destination: ${preferences.destination || 'Not specified'}
    - Budget: ${preferences.budget ? `$${preferences.budget}` : 'Not specified'}
    - Duration: ${preferences.duration ? `${preferences.duration} days` : 'Not specified'}
    - Interests: ${preferences.interests?.join(', ') || 'Not specified'}
    - Travel Style: ${preferences.travelStyle || 'Not specified'}
    
    Provide specific, actionable recommendations including:
    1. Best places to visit
    2. Local experiences to try
    3. Budget-friendly options
    4. Cultural insights
    5. Practical tips for Bangladeshi travelers
    
    Keep your response conversational and helpful.`;
  }

  private buildItineraryPrompt(destination: string, duration: number, interests: string[]): string {
    return `Create a detailed ${duration}-day itinerary for ${destination} focusing on these interests: ${interests.join(', ')}.
    
    Include:
    1. Day-by-day breakdown
    2. Specific attractions and activities
    3. Local food recommendations
    4. Transportation options
    5. Budget estimates in BDT
    6. Cultural tips for Bangladeshi travelers
    7. Best times to visit each location
    
    Make it practical and enjoyable for travelers from Bangladesh.`;
  }

  private buildTravelBuddyPrompt(userProfile: any): string {
    return `Help find the perfect travel buddy for a ${userProfile.age}-year-old who enjoys: ${userProfile.interests.join(', ')}.
    
    Travel style: ${userProfile.travelStyle}
    Interested destinations: ${userProfile.destinations.join(', ')}
    
    Provide suggestions for:
    1. Compatible personality types
    2. Shared interest activities
    3. Communication tips
    4. Safety considerations
    5. How to approach potential travel buddies
    
    Focus on creating meaningful connections within the Bangladeshi travel community.`;
  }
}

