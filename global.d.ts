
// This file is used to declare global types, specifically for extending the Window interface
// with browser-specific APIs not yet fully standardized in TypeScript's lib.dom.d.ts.

declare global {
    // Web Speech API types removed
}

// This export is necessary to make this file a module, which allows augmenting the global scope.
export {};
