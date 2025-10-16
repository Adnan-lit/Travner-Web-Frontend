// Global polyfill for SockJS compatibility
// This file must be imported before any SockJS usage

// Define global variable for browser environment
if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

// Define process for Node.js compatibility
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { 
    env: {},
    nextTick: (callback: () => void) => setTimeout(callback, 0)
  };
}

// Define Buffer for Node.js compatibility (if needed)
if (typeof (window as any).Buffer === 'undefined') {
  (window as any).Buffer = {
    isBuffer: () => false
  };
}

export {};

