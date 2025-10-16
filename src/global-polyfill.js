// Global polyfill for SockJS compatibility
// This file must be loaded before any SockJS usage

// Define global variable for browser environment
if (typeof window.global === 'undefined') {
  window.global = window;
}

// Define process for Node.js compatibility
if (typeof window.process === 'undefined') {
  window.process = { 
    env: {},
    nextTick: function(callback) { setTimeout(callback, 0); }
  };
}

// Define Buffer for Node.js compatibility (if needed)
if (typeof window.Buffer === 'undefined') {
  window.Buffer = {
    isBuffer: function() { return false; }
  };
}

