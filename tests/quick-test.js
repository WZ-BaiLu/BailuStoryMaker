// Quick test to verify the setup
console.log('Starting quick test...');

// Test 1: Check if Jest is available
try {
  const jest = require('jest');
  console.log('✓ Jest is available');
} catch (e) {
  console.log('✗ Jest is not available');
}

// Test 2: Check if jsdom is available
try {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  console.log('✓ jsdom is available and configured');
} catch (e) {
  console.log('✗ jsdom is not available:', e.message);
}

// Test 3: Check if setup.js can be loaded
try {
  require('./setup.js');
  console.log('✓ setup.js loaded successfully');
} catch (e) {
  console.log('✗ setup.js failed to load:', e.message);
}

console.log('Quick test complete');
