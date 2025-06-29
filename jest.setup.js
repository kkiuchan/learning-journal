import "@testing-library/jest-dom";

// Mock next/router
jest.mock("next/router", () => require("next-router-mock"));

// Mock next/navigation
jest.mock("next/navigation", () => require("next-router-mock"));

// Mock Supabase client (only mock if file exists)
// jest.mock("@/lib/supabaseClient", () => ({
//   supabase: {
//     auth: {
//       getSession: jest.fn(),
//       signInWithPassword: jest.fn(),
//       signUp: jest.fn(),
//       signOut: jest.fn(),
//     },
//   },
//   storage: {
//     uploadResource: jest.fn(),
//   },
// }));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
