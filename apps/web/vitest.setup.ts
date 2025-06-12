import "@testing-library/jest-dom";

// Mock IndexedDB for tests
const mockIDBDatabase = {
  transaction: vi.fn(),
  createObjectStore: vi.fn(),
  deleteObjectStore: vi.fn(),
  version: 1,
  name: "test-db",
  objectStoreNames: [],
  close: vi.fn(),
};

const mockIDBRequest = {
  result: mockIDBDatabase,
  error: null,
  source: null,
  transaction: null,
  readyState: "done",
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  onerror: null,
  onsuccess: null,
};

const mockIDBFactory = {
  open: vi.fn(() => mockIDBRequest),
  deleteDatabase: vi.fn(() => mockIDBRequest),
  databases: vi.fn(() => Promise.resolve([])),
  cmp: vi.fn(),
};

// Mock the global indexedDB
Object.defineProperty(globalThis, "indexedDB", {
  value: mockIDBFactory,
  writable: true,
});

// Mock IDBKeyRange
Object.defineProperty(globalThis, "IDBKeyRange", {
  value: {
    bound: vi.fn(),
    only: vi.fn(),
    lowerBound: vi.fn(),
    upperBound: vi.fn(),
  },
  writable: true,
});

// Mock localStorage for migration tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});
