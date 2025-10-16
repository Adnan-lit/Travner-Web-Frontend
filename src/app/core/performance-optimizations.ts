/**
 * Performance Optimization Strategies for Travner Frontend
 * 
 * This file contains performance optimization recommendations and implementations
 * for the Travner social media platform.
 */

// 1. Lazy Loading Strategy
export const LAZY_LOADING_CONFIG = {
  // Route-based lazy loading
  routes: {
    'itineraries': () => import('../components/itineraries/itinerary-list/itinerary-list.component'),
    'travel-buddies': () => import('../components/travel-buddies/travel-buddy-list/travel-buddy-list.component'),
    'local-guides': () => import('../components/local-guides/local-guide-list/local-guide-list.component'),
    'marketplace': () => import('../components/marketplace/product-list/product-list.component'),
    'chat': () => import('../components/chat/chat.component')
  },
  
  // Component lazy loading
  components: {
    'post-detail': () => import('../components/posts/post-detail/post-detail.component'),
    'product-detail': () => import('../components/marketplace/product-detail/product-detail.component'),
    'user-profile': () => import('../components/user/user-profile/user-profile.component')
  }
};

// 2. Caching Strategy
export const CACHE_CONFIG = {
  // API Response Caching
  apiCache: {
    posts: { ttl: 300000, maxSize: 100 }, // 5 minutes, 100 items
    products: { ttl: 600000, maxSize: 200 }, // 10 minutes, 200 items
    users: { ttl: 900000, maxSize: 50 }, // 15 minutes, 50 items
    conversations: { ttl: 180000, maxSize: 20 } // 3 minutes, 20 items
  },
  
  // Image Caching
  imageCache: {
    profileImages: { ttl: 3600000, maxSize: 50 }, // 1 hour
    postImages: { ttl: 1800000, maxSize: 100 }, // 30 minutes
    productImages: { ttl: 3600000, maxSize: 200 } // 1 hour
  }
};

// 3. Bundle Optimization
export const BUNDLE_OPTIMIZATION = {
  // Code splitting strategies
  codeSplitting: {
    vendor: ['@angular/core', '@angular/common', '@angular/router'],
    shared: ['rxjs', 'tslib'],
    features: {
      'location-features': ['itinerary', 'travel-buddy', 'local-guide'],
      'marketplace': ['product', 'cart', 'order'],
      'social': ['post', 'comment', 'chat']
    }
  },
  
  // Tree shaking optimization
  treeShaking: {
    // Remove unused imports
    unusedImports: [
      'rxjs/operators/map',
      'rxjs/operators/filter',
      'rxjs/operators/tap'
    ],
    
    // Optimize lodash usage
    lodashOptimization: {
      use: 'lodash-es',
      imports: ['debounce', 'throttle', 'cloneDeep']
    }
  }
};

// 4. Network Optimization
export const NETWORK_OPTIMIZATION = {
  // Request batching
  requestBatching: {
    enabled: true,
    batchSize: 5,
    timeout: 100 // ms
  },
  
  // Request deduplication
  requestDeduplication: {
    enabled: true,
    cacheTime: 1000 // ms
  },
  
  // Compression
  compression: {
    gzip: true,
    brotli: true,
    minSize: 1024 // bytes
  }
};

// 5. Memory Management
export const MEMORY_MANAGEMENT = {
  // Component cleanup
  componentCleanup: {
    unsubscribeOnDestroy: true,
    clearIntervals: true,
    removeEventListeners: true
  },
  
  // Image optimization
  imageOptimization: {
    lazyLoading: true,
    webpSupport: true,
    responsiveImages: true,
    maxWidth: 1920,
    quality: 85
  },
  
  // Virtual scrolling
  virtualScrolling: {
    enabled: true,
    itemHeight: 100,
    bufferSize: 5
  }
};

// 6. Real-time Optimization
export const REALTIME_OPTIMIZATION = {
  // WebSocket connection management
  websocket: {
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000
  },
  
  // Message batching
  messageBatching: {
    enabled: true,
    batchSize: 10,
    flushInterval: 1000
  },
  
  // Presence optimization
  presence: {
    updateInterval: 30000,
    offlineTimeout: 60000
  }
};

// 7. SEO and Performance Metrics
export const SEO_OPTIMIZATION = {
  // Meta tags
  metaTags: {
    title: 'Travner - Social Media for Travelers',
    description: 'Connect with fellow travelers, share experiences, and discover amazing places.',
    keywords: ['travel', 'social media', 'travelers', 'itineraries', 'travel buddies']
  },
  
  // Performance budgets
  performanceBudgets: {
    firstContentfulPaint: 1500, // ms
    largestContentfulPaint: 2500, // ms
    cumulativeLayoutShift: 0.1,
    firstInputDelay: 100, // ms
    timeToInteractive: 3000 // ms
  }
};

// 8. Progressive Web App Features
export const PWA_FEATURES = {
  // Service worker
  serviceWorker: {
    enabled: true,
    cacheStrategy: 'networkFirst',
    offlineFallback: true
  },
  
  // App shell
  appShell: {
    enabled: true,
    criticalCSS: true,
    preloadResources: true
  },
  
  // Push notifications
  pushNotifications: {
    enabled: true,
    permissionRequest: 'onInteraction'
  }
};

// 9. Accessibility Optimization
export const ACCESSIBILITY_OPTIMIZATION = {
  // ARIA labels
  ariaLabels: {
    required: true,
    descriptive: true,
    consistent: true
  },
  
  // Keyboard navigation
  keyboardNavigation: {
    tabOrder: 'logical',
    focusManagement: true,
    skipLinks: true
  },
  
  // Screen reader support
  screenReader: {
    announcements: true,
    liveRegions: true,
    semanticHTML: true
  }
};

// 10. Analytics and Monitoring
export const ANALYTICS_CONFIG = {
  // Performance monitoring
  performanceMonitoring: {
    enabled: true,
    metrics: ['FCP', 'LCP', 'CLS', 'FID', 'TTFB'],
    sampling: 0.1 // 10% of users
  },
  
  // Error tracking
  errorTracking: {
    enabled: true,
    captureUnhandledRejections: true,
    captureConsoleErrors: true
  },
  
  // User analytics
  userAnalytics: {
    enabled: true,
    events: ['page_view', 'user_action', 'api_call'],
    privacy: 'anonymized'
  }
};
