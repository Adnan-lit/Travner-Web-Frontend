import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  errorRate: number;
  userInteractions: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'slow_load' | 'high_memory' | 'network_issue' | 'error_spike' | 'slow_render' | 'slow_operation';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private metricsSubject = new BehaviorSubject<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    errorRate: 0,
    userInteractions: 0
  });

  private alertsSubject = new BehaviorSubject<PerformanceAlert[]>([]);
  
  public metrics$ = this.metricsSubject.asObservable();
  public alerts$ = this.alertsSubject.asObservable();

  private startTime: number = 0;
  private renderStartTime: number = 0;
  private userInteractionCount = 0;
  private errorCount = 0;
  private networkRequests = 0;
  private totalNetworkTime = 0;

  constructor() {
    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Monitor page load time
    window.addEventListener('load', () => {
      this.measureLoadTime();
    });

    // Monitor memory usage
    this.startMemoryMonitoring();

    // Monitor user interactions
    this.startInteractionMonitoring();

    // Monitor network performance
    this.startNetworkMonitoring();

    // Monitor render performance
    this.startRenderMonitoring();
  }

  /**
   * Measure page load time
   */
  private measureLoadTime(): void {
    const loadTime = performance.now();
    this.updateMetric('loadTime', loadTime);
    
    if (loadTime > 3000) {
      this.createAlert('slow_load', `Page load time is ${loadTime.toFixed(0)}ms`, 'medium');
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        this.updateMetric('memoryUsage', memoryUsage);
        
        if (memoryUsage > 80) {
          this.createAlert('high_memory', `Memory usage is ${memoryUsage.toFixed(1)}%`, 'high');
        }
      }
    }, 5000);
  }

  /**
   * Start user interaction monitoring
   */
  private startInteractionMonitoring(): void {
    const events = ['click', 'scroll', 'keydown', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.userInteractionCount++;
        this.updateMetric('userInteractions', this.userInteractionCount);
      }, { passive: true });
    });
  }

  /**
   * Start network monitoring
   */
  private startNetworkMonitoring(): void {
    // Override fetch to monitor network requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      this.networkRequests++;
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const latency = endTime - startTime;
        
        this.totalNetworkTime += latency;
        const avgLatency = this.totalNetworkTime / this.networkRequests;
        this.updateMetric('networkLatency', avgLatency);
        
        if (latency > 5000) {
          this.createAlert('network_issue', `Network request took ${latency.toFixed(0)}ms`, 'medium');
        }
        
        return response;
      } catch (error) {
        this.errorCount++;
        this.updateErrorRate();
        throw error;
      }
    };
  }

  /**
   * Start render performance monitoring
   */
  private startRenderMonitoring(): void {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFrame = (currentTime: number) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        
        if (fps < 30) {
          this.createAlert('slow_render', `Low FPS detected: ${fps}`, 'medium');
        }
      }
      
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
  }

  /**
   * Update a specific metric
   */
  private updateMetric(key: keyof PerformanceMetrics, value: number): void {
    const currentMetrics = this.metricsSubject.value;
    this.metricsSubject.next({
      ...currentMetrics,
      [key]: value
    });
  }

  /**
   * Update error rate
   */
  private updateErrorRate(): void {
    const errorRate = (this.errorCount / this.networkRequests) * 100;
    this.updateMetric('errorRate', errorRate);
    
    if (errorRate > 10) {
      this.createAlert('error_spike', `High error rate: ${errorRate.toFixed(1)}%`, 'high');
    }
  }

  /**
   * Create a performance alert
   */
  private createAlert(type: PerformanceAlert['type'], message: string, severity: PerformanceAlert['severity']): void {
    const alert: PerformanceAlert = {
      id: this.generateAlertId(),
      type,
      message,
      severity,
      timestamp: new Date(),
      resolved: false
    };

    const currentAlerts = this.alertsSubject.value;
    this.alertsSubject.next([alert, ...currentAlerts.slice(0, 49)]); // Keep last 50 alerts
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return this.metricsSubject.value;
  }

  /**
   * Get performance alerts
   */
  getAlerts(): PerformanceAlert[] {
    return this.alertsSubject.value;
  }

  /**
   * Get unresolved alerts
   */
  getUnresolvedAlerts(): PerformanceAlert[] {
    return this.alertsSubject.value.filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alerts = this.alertsSubject.value;
    const updatedAlerts = alerts.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    );
    this.alertsSubject.next(updatedAlerts);
  }

  /**
   * Clear all alerts
   */
  clearAllAlerts(): void {
    this.alertsSubject.next([]);
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    const metrics = this.metricsSubject.value;
    let score = 100;

    // Deduct points for slow load time
    if (metrics.loadTime > 2000) {
      score -= Math.min(30, (metrics.loadTime - 2000) / 100);
    }

    // Deduct points for high memory usage
    if (metrics.memoryUsage > 70) {
      score -= (metrics.memoryUsage - 70) * 0.5;
    }

    // Deduct points for high network latency
    if (metrics.networkLatency > 1000) {
      score -= Math.min(20, (metrics.networkLatency - 1000) / 100);
    }

    // Deduct points for high error rate
    if (metrics.errorRate > 5) {
      score -= metrics.errorRate * 2;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(): string[] {
    const metrics = this.metricsSubject.value;
    const recommendations: string[] = [];

    if (metrics.loadTime > 3000) {
      recommendations.push('Consider optimizing images and reducing bundle size');
    }

    if (metrics.memoryUsage > 80) {
      recommendations.push('Memory usage is high. Consider implementing lazy loading');
    }

    if (metrics.networkLatency > 2000) {
      recommendations.push('Network latency is high. Consider using a CDN');
    }

    if (metrics.errorRate > 10) {
      recommendations.push('Error rate is high. Check for network issues or API problems');
    }

    if (metrics.userInteractions === 0) {
      recommendations.push('No user interactions detected. Check if the interface is responsive');
    }

    return recommendations;
  }

  /**
   * Start performance measurement for a specific operation
   */
  startMeasurement(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`${operation} took ${duration.toFixed(2)}ms`);
      
      if (duration > 1000) {
        this.createAlert('slow_operation', `${operation} took ${duration.toFixed(0)}ms`, 'medium');
      }
    };
  }

  /**
   * Monitor component performance
   */
  monitorComponent(componentName: string): void {
    const endMeasurement = this.startMeasurement(`${componentName} initialization`);
    
    // End measurement after component is fully rendered
    setTimeout(endMeasurement, 0);
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): any {
    const metrics = this.metricsSubject.value;
    const alerts = this.alertsSubject.value;
    const score = this.getPerformanceScore();
    const recommendations = this.getPerformanceRecommendations();

    return {
      timestamp: new Date(),
      metrics,
      score,
      recommendations,
      alerts: alerts.filter(alert => !alert.resolved),
      summary: {
        totalAlerts: alerts.length,
        unresolvedAlerts: alerts.filter(alert => !alert.resolved).length,
        criticalAlerts: alerts.filter(alert => alert.severity === 'critical').length,
        performanceGrade: this.getPerformanceGrade(score)
      }
    };
  }

  /**
   * Get performance grade based on score
   */
  private getPerformanceGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
