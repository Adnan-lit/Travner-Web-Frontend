import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SecurityEvent {
  id: string;
  type: 'suspicious_activity' | 'unauthorized_access' | 'data_breach' | 'malicious_input' | 'rate_limit_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  source: string;
  details?: any;
  resolved: boolean;
}

export interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  suspiciousActivities: number;
  unauthorizedAccess: number;
  dataBreaches: number;
  maliciousInputs: number;
  rateLimitViolations: number;
}

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private eventsSubject = new BehaviorSubject<SecurityEvent[]>([]);
  private metricsSubject = new BehaviorSubject<SecurityMetrics>({
    totalEvents: 0,
    criticalEvents: 0,
    suspiciousActivities: 0,
    unauthorizedAccess: 0,
    dataBreaches: 0,
    maliciousInputs: 0,
    rateLimitViolations: 0
  });

  public events$ = this.eventsSubject.asObservable();
  public metrics$ = this.metricsSubject.asObservable();

  private requestCounts = new Map<string, { count: number; timestamp: number }>();
  private suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi
  ];

  constructor() {
    this.initializeSecurityMonitoring();
  }

  /**
   * Initialize security monitoring
   */
  private initializeSecurityMonitoring(): void {
    // Monitor for XSS attempts
    this.monitorXSSAttempts();
    
    // Monitor for suspicious network requests
    this.monitorNetworkRequests();
    
    // Monitor for rate limiting
    this.monitorRateLimiting();
    
    // Monitor for unauthorized access attempts
    this.monitorUnauthorizedAccess();
  }

  /**
   * Monitor for XSS attempts
   */
  private monitorXSSAttempts(): void {
    // Override innerHTML to detect XSS attempts
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    
    Object.defineProperty(Element.prototype, 'innerHTML', {
      set: function(value) {
        if (this.securityService?.isMaliciousInput(value)) {
          this.securityService?.logSecurityEvent('malicious_input', 'XSS attempt detected', 'high', 'DOM', { input: value });
        }
        originalInnerHTML?.set?.call(this, value);
      },
      get: originalInnerHTML?.get
    });
  }

  /**
   * Monitor network requests for suspicious activity
   */
  private monitorNetworkRequests(): void {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0]?.toString() || '';
      
      // Check for suspicious URLs
      if (this.isSuspiciousUrl(url)) {
        this.logSecurityEvent('suspicious_activity', `Suspicious URL accessed: ${url}`, 'medium', 'Network', { url });
      }
      
      // Check rate limiting
      if (this.isRateLimitExceeded(url)) {
        this.logSecurityEvent('rate_limit_exceeded', `Rate limit exceeded for: ${url}`, 'medium', 'Network', { url });
        throw new Error('Rate limit exceeded');
      }
      
      try {
        const response = await originalFetch(...args);
        
        // Check for unauthorized access
        if (response.status === 401 || response.status === 403) {
          this.logSecurityEvent('unauthorized_access', `Unauthorized access attempt: ${url}`, 'high', 'Network', { 
            url, 
            status: response.status 
          });
        }
        
        return response;
      } catch (error) {
        this.logSecurityEvent('suspicious_activity', `Network request failed: ${url}`, 'low', 'Network', { url, error });
        throw error;
      }
    };
  }

  /**
   * Monitor rate limiting
   */
  private monitorRateLimiting(): void {
    setInterval(() => {
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      
      // Clean up old entries
      for (const [key, value] of this.requestCounts.entries()) {
        if (value.timestamp < oneMinuteAgo) {
          this.requestCounts.delete(key);
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Monitor unauthorized access attempts
   */
  private monitorUnauthorizedAccess(): void {
    // Monitor for repeated 401/403 responses
    let unauthorizedCount = 0;
    const unauthorizedThreshold = 5;
    
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (response.status === 401 || response.status === 403) {
          unauthorizedCount++;
          
          if (unauthorizedCount >= unauthorizedThreshold) {
            this.logSecurityEvent('unauthorized_access', 
              `Multiple unauthorized access attempts detected (${unauthorizedCount})`, 
              'high', 
              'Authentication'
            );
            unauthorizedCount = 0; // Reset counter
          }
        } else {
          unauthorizedCount = 0; // Reset on successful request
        }
        
        return response;
      } catch (error) {
        return originalFetch(...args);
      }
    };
  }

  /**
   * Check if input contains malicious content
   */
  isMaliciousInput(input: string): boolean {
    if (!input || typeof input !== 'string') return false;
    
    return this.suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Check if URL is suspicious
   */
  private isSuspiciousUrl(url: string): boolean {
    const suspiciousPatterns = [
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /onload/gi,
      /onerror/gi
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Check if rate limit is exceeded
   */
  private isRateLimitExceeded(url: string): boolean {
    const key = this.getRequestKey(url);
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    const current = this.requestCounts.get(key);
    
    if (!current || current.timestamp < oneMinuteAgo) {
      this.requestCounts.set(key, { count: 1, timestamp: now });
      return false;
    }
    
    current.count++;
    this.requestCounts.set(key, current);
    
    // Rate limit: 60 requests per minute per endpoint
    return current.count > 60;
  }

  /**
   * Get request key for rate limiting
   */
  private getRequestKey(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.origin}${urlObj.pathname}`;
    } catch {
      return url;
    }
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    type: SecurityEvent['type'], 
    message: string, 
    severity: SecurityEvent['severity'], 
    source: string, 
    details?: any
  ): void {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      severity,
      message,
      timestamp: new Date(),
      source,
      details,
      resolved: false
    };

    const currentEvents = this.eventsSubject.value;
    this.eventsSubject.next([event, ...currentEvents.slice(0, 99)]); // Keep last 100 events

    this.updateMetrics(type, severity);
    
    // Log to console in development
    console.warn(`[Security] ${severity.toUpperCase()}: ${message}`, details);
  }

  /**
   * Update security metrics
   */
  private updateMetrics(type: SecurityEvent['type'], severity: SecurityEvent['severity']): void {
    const currentMetrics = this.metricsSubject.value;
    const updatedMetrics = { ...currentMetrics };
    
    updatedMetrics.totalEvents++;
    
    if (severity === 'critical') {
      updatedMetrics.criticalEvents++;
    }
    
    switch (type) {
      case 'suspicious_activity':
        updatedMetrics.suspiciousActivities++;
        break;
      case 'unauthorized_access':
        updatedMetrics.unauthorizedAccess++;
        break;
      case 'data_breach':
        updatedMetrics.dataBreaches++;
        break;
      case 'malicious_input':
        updatedMetrics.maliciousInputs++;
        break;
      case 'rate_limit_exceeded':
        updatedMetrics.rateLimitViolations++;
        break;
    }
    
    this.metricsSubject.next(updatedMetrics);
  }

  /**
   * Get all security events
   */
  getEvents(): SecurityEvent[] {
    return this.eventsSubject.value;
  }

  /**
   * Get unresolved security events
   */
  getUnresolvedEvents(): SecurityEvent[] {
    return this.eventsSubject.value.filter(event => !event.resolved);
  }

  /**
   * Get critical security events
   */
  getCriticalEvents(): SecurityEvent[] {
    return this.eventsSubject.value.filter(event => event.severity === 'critical');
  }

  /**
   * Resolve a security event
   */
  resolveEvent(eventId: string): void {
    const events = this.eventsSubject.value;
    const updatedEvents = events.map(event => 
      event.id === eventId ? { ...event, resolved: true } : event
    );
    this.eventsSubject.next(updatedEvents);
  }

  /**
   * Clear all security events
   */
  clearAllEvents(): void {
    this.eventsSubject.next([]);
  }

  /**
   * Get security metrics
   */
  getMetrics(): SecurityMetrics {
    return this.metricsSubject.value;
  }

  /**
   * Get security score (0-100)
   */
  getSecurityScore(): number {
    const metrics = this.metricsSubject.value;
    let score = 100;
    
    // Deduct points for security events
    score -= metrics.criticalEvents * 20;
    score -= metrics.suspiciousActivities * 5;
    score -= metrics.unauthorizedAccess * 10;
    score -= metrics.dataBreaches * 30;
    score -= metrics.maliciousInputs * 8;
    score -= metrics.rateLimitViolations * 3;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get security recommendations
   */
  getSecurityRecommendations(): string[] {
    const metrics = this.metricsSubject.value;
    const recommendations: string[] = [];
    
    if (metrics.criticalEvents > 0) {
      recommendations.push('Critical security events detected. Immediate attention required.');
    }
    
    if (metrics.unauthorizedAccess > 5) {
      recommendations.push('High number of unauthorized access attempts. Review authentication system.');
    }
    
    if (metrics.maliciousInputs > 10) {
      recommendations.push('Multiple malicious input attempts detected. Strengthen input validation.');
    }
    
    if (metrics.rateLimitViolations > 20) {
      recommendations.push('High rate limit violations. Consider implementing stricter rate limiting.');
    }
    
    if (metrics.suspiciousActivities > 15) {
      recommendations.push('Suspicious activities detected. Review user behavior patterns.');
    }
    
    return recommendations;
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove potentially dangerous characters
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/eval\s*\(/gi, '')
      .replace(/expression\s*\(/gi, '')
      .trim();
  }

  /**
   * Validate user input
   */
  validateInput(input: string, type: 'email' | 'username' | 'password' | 'general'): boolean {
    if (!input || typeof input !== 'string') return false;
    
    switch (type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      case 'username':
        return /^[a-zA-Z0-9_]{3,20}$/.test(input);
      case 'password':
        return input.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(input);
      case 'general':
        return !this.isMaliciousInput(input);
      default:
        return true;
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
