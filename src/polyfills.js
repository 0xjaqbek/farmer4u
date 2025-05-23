// src/polyfills.js
// Simple polyfills for blockchain libraries

// Basic process object for browser compatibility
if (typeof process === 'undefined') {
  globalThis.process = {
    env: {},
    version: '',
    versions: {},
    platform: 'browser',
    browser: true,
    nextTick: (fn) => setTimeout(fn, 0)
  };
}

// Buffer polyfill - only if not already available
if (typeof Buffer === 'undefined') {
  try {
    const { Buffer } = await import('buffer');
    globalThis.Buffer = Buffer;
    globalThis.window.Buffer = Buffer;
  } catch (error) {
    console.warn('Buffer polyfill not available:', error);
    // Create a minimal Buffer-like object for basic compatibility
    globalThis.Buffer = {
      from: (data) => new Uint8Array(data),
      alloc: (size) => new Uint8Array(size),
      isBuffer: () => false
    };
  }
}

// Global reference
if (!globalThis.global) {
  globalThis.global = globalThis;
}