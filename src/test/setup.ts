import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IndexedDB for testing
const mockIDBRequest = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  result: null,
  error: null,
  source: null,
  transaction: null,
  readyState: 'done' as IDBRequestReadyState,
  onsuccess: null,
  onerror: null,
}

const mockIDBDatabase = {
  close: vi.fn(),
  createObjectStore: vi.fn(),
  deleteObjectStore: vi.fn(),
  transaction: vi.fn(() => mockIDBTransaction),
  version: 1,
  name: 'test-db',
  objectStoreNames: [] as any,
  onabort: null,
  onclose: null,
  onerror: null,
  onversionchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}

const mockIDBTransaction = {
  abort: vi.fn(),
  commit: vi.fn(),
  objectStore: vi.fn(() => mockIDBObjectStore),
  db: mockIDBDatabase,
  durability: 'default' as IDBTransactionDurability,
  mode: 'readonly' as IDBTransactionMode,
  objectStoreNames: [] as any,
  onabort: null,
  oncomplete: null,
  onerror: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}

const mockIDBObjectStore = {
  add: vi.fn(() => mockIDBRequest),
  clear: vi.fn(() => mockIDBRequest),
  count: vi.fn(() => mockIDBRequest),
  createIndex: vi.fn(),
  delete: vi.fn(() => mockIDBRequest),
  deleteIndex: vi.fn(),
  get: vi.fn(() => mockIDBRequest),
  getAll: vi.fn(() => mockIDBRequest),
  getAllKeys: vi.fn(() => mockIDBRequest),
  getKey: vi.fn(() => mockIDBRequest),
  index: vi.fn(),
  openCursor: vi.fn(() => mockIDBRequest),
  openKeyCursor: vi.fn(() => mockIDBRequest),
  put: vi.fn(() => mockIDBRequest),
  autoIncrement: false,
  indexNames: [] as any,
  keyPath: null,
  name: 'test-store',
  transaction: mockIDBTransaction,
}

// Mock IndexedDB
global.indexedDB = {
  open: vi.fn(() => {
    const request = { ...mockIDBRequest }
    setTimeout(() => {
      (request as any).result = mockIDBDatabase
      if (request.onsuccess) (request.onsuccess as any)(new Event('success'))
    }, 0)
    return request as any
  }),
  deleteDatabase: vi.fn(() => mockIDBRequest),
  databases: vi.fn(() => Promise.resolve([])),
  cmp: vi.fn(),
} as any

// Mock MediaDevices for camera testing
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(() => 
      Promise.resolve({
        getTracks: () => [{ stop: vi.fn() }],
        getVideoTracks: () => [{ readyState: 'live' }],
      } as any)
    ),
  },
})

// Mock MediaRecorder
global.MediaRecorder = class MockMediaRecorder {
  state = 'inactive'
  mimeType = 'video/webm'
  
  constructor(_stream: any, _options?: any) {}
  
  start = vi.fn()
  stop = vi.fn()
  pause = vi.fn()
  resume = vi.fn()
  requestData = vi.fn()
  
  ondataavailable = null
  onerror = null
  onpause = null
  onresume = null
  onstart = null
  onstop = null
  
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
  dispatchEvent = vi.fn()
  
  static isTypeSupported = vi.fn(() => true)
} as any

// Mock TensorFlow.js
vi.mock('@tensorflow/tfjs', () => ({
  ready: vi.fn(() => Promise.resolve()),
  getBackend: vi.fn(() => 'webgl'),
}))

vi.mock('@tensorflow-models/coco-ssd', () => ({
  load: vi.fn(() => Promise.resolve({
    detect: vi.fn(() => Promise.resolve([])),
  })),
}))