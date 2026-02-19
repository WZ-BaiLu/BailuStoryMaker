/**
 * Test utilities for loading manager classes
 * This file helps load classes from the JS files for testing
 */

// Mock DOM environment
const { JSDOM } = require('jsdom');

// Create a basic DOM structure
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  url: 'http://localhost'
});

// Set up global environment
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;

// Mock window.matchMedia for theme tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Helper to load manager code from file system
const fs = require('fs');
const path = require('path');

function loadManagerFile(filename) {
  const filePath = path.join(__dirname, '../js/managers', filename);
  const code = fs.readFileSync(filePath, 'utf8');
  return code;
}

function loadManagerClass(filename, className) {
  const code = loadManagerFile(filename);
  // Remove the class declaration and replace with a class definition we can return
  const classRegex = new RegExp(`class\\s+${className}\\s*\\{([\\s\\S]*)\\}`, 'm');
  const match = code.match(classRegex);
  
  if (!match) {
    throw new Error(`Could not find class ${className} in ${filename}`);
  }
  
  // Create a class from the matched content
  const classBody = match[1];
  const classDefinition = `return class ${className} { ${classBody} }`;
  return new Function(classDefinition)();
}

module.exports = {
  loadManagerFile,
  loadManagerClass
};
