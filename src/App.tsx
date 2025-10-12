import { useState, useCallback, useEffect } from 'react';
import { Camera, Shield, AlertTriangle, Settings } from 'lucide-react';
import CameraStream from './components/CameraStream';
import DetectionOverlay from './components/DetectionOverlay';
import EventsList from './components/EventsList';
import SettingsPanel from './components/SettingsPanel';
import { AuthProvider } from './components/AuthProvider';
import { ProtectedRoute, UserProfileDropdown } from './components/Auth';
import syncQueueService from './utils/syncQueue';
import localStorageService, { SecurityEvent as StoredSecurityEvent } from './utils/storage';

interface DetectedObject {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
  timestamp: Date;
}

interface SecurityEvent {
  id: string;
  type: 'detection' | 'anomaly' | 'alert';
  message: string;
  timestamp: Date;
  objects?: DetectedObject[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  detections?: any[];
  confidence?: number;
  imageBlob?: Blob;
  videoBlob?: Blob;
  metadata?: {
    deviceId: string;
    location?: string;
    cameraId: string;
    duration?: number;
  };
}

interface Settings {
  confidenceThreshold: number;
  humanDetection: boolean;
  motionDetection: boolean;
  notifications: boolean;
  cloudSync: boolean;
  azureConfig?: {
    accountName: string;
    containerName: string;
    sasToken?: string;
  };
}

function App() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'events' | 'settings'>('live');
  const [settings, setSettings] = useState<Settings>({
    confidenceThreshold: 0.5,
    humanDetection: true,
    motionDetection: true,
    notifications: true,
    cloudSync: false,
    azureConfig: undefined
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [databaseReady, setDatabaseReady] = useState(false);

  // Initialize database first
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await localStorageService.initialize();
        console.log('✅ Database initialized successfully');
        
        // Initialize sync service after database is ready
        await syncQueueService.initialize();
        console.log('✅ Sync service initialized successfully');
        
        setDatabaseReady(true);
      } catch (error) {
        console.error('❌ Failed to initialize database or sync service:', error);
      }
    };

    initializeDatabase();
  }, []);

  // Helper function to convert stored events to display format
  const convertStoredEvent = (storedEvent: StoredSecurityEvent): SecurityEvent => {
    // Determine severity based on detections
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (storedEvent.detections.some(d => d.className === 'person')) {
      severity = 'high';
    } else if (storedEvent.confidence > 0.8) {
      severity = 'high';
    } else if (storedEvent.confidence > 0.6) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    // Create display message
    const detectionNames = storedEvent.detections.map(d => d.className).join(', ');
    const message = detectionNames 
      ? `${detectionNames} detected with ${(storedEvent.confidence * 100).toFixed(1)}% confidence`
      : `${storedEvent.type} event`;

    return {
      id: storedEvent.id,
      type: storedEvent.type as 'detection' | 'anomaly' | 'alert',
      message,
      timestamp: storedEvent.timestamp,
      objects: storedEvent.detections.map(d => ({
        class: d.className,
        confidence: d.score,
        bbox: d.bbox,
        timestamp: storedEvent.timestamp
      })),
      severity,
      detections: storedEvent.detections,
      confidence: storedEvent.confidence,
      imageBlob: storedEvent.imageBlob,
      videoBlob: storedEvent.videoBlob,
      metadata: storedEvent.metadata
    };
  };

  // Load settings from storage on startup
  useEffect(() => {
    if (!databaseReady) return; // Wait for database initialization

    const loadSettings = async () => {
      try {
        const storedSettings = await localStorageService.getSettings();
        if (storedSettings) {
          console.log('📋 Loaded settings from storage:', storedSettings);
          setSettings({
            confidenceThreshold: storedSettings.alertThreshold,
            humanDetection: true, // This maps to detection being enabled
            motionDetection: true, // This maps to detection being enabled
            notifications: true, // We can add this to AppSettings later
            cloudSync: storedSettings.cloudSync,
            azureConfig: storedSettings.azureConfig
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, [databaseReady]);

  // Save settings to storage whenever they change
  useEffect(() => {
    if (!settingsLoaded) return; // Don't save until initial load is complete

    const saveSettings = async () => {
      try {
        await localStorageService.saveSettings({
          alertThreshold: settings.confidenceThreshold,
          recordingEnabled: true, // We can make this configurable later
          cloudSync: settings.cloudSync,
          syncOnlyOnWifi: false, // We can make this configurable later
          maxLocalStorageMB: 100, // Default limit
          retentionDays: 30, // Default retention
          azureConfig: settings.azureConfig
        });
        console.log('💾 Settings saved to storage');
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    };

    saveSettings();
  }, [settings, settingsLoaded]);

  // Load events from storage
  // Load events from storage and set up refresh
  useEffect(() => {
    if (!databaseReady) return; // Wait for database initialization

    const loadEvents = async () => {
      try {
        const storedEvents = await localStorageService.getEvents({ limit: 100 });
        if (storedEvents.length > 0) {
          console.log('📚 Loaded events from storage:', storedEvents.length);
          // Debug: Check if blobs are present
          storedEvents.forEach(event => {
            console.log(`🔍 Event ${event.id}: imageBlob=${!!event.imageBlob}, videoBlob=${!!event.videoBlob}, imageSize=${event.imageBlob?.size}, videoSize=${event.videoBlob?.size}`);
          });
          const convertedEvents = storedEvents.map(convertStoredEvent);
          setSecurityEvents(convertedEvents);
        }
      } catch (error) {
        console.error('Failed to load events:', error);
      }
    };

    loadEvents();
    
    // Refresh events every 5 seconds to pick up new ones
    const refreshInterval = setInterval(loadEvents, 5000);
    
    return () => clearInterval(refreshInterval);
  }, [databaseReady]);

  // Handle object detection results
  const handleDetection = useCallback((objects: DetectedObject[]) => {
    setDetectedObjects(objects);

    // Create security events for significant detections
    objects.forEach(obj => {
      if (obj.confidence > settings.confidenceThreshold) {
        const event: SecurityEvent = {
          id: Date.now().toString() + Math.random().toString(36),
          type: 'detection',
          message: `${obj.class} detected with ${(obj.confidence * 100).toFixed(1)}% confidence`,
          timestamp: new Date(),
          objects: [obj],
          severity: obj.class === 'person' ? 'high' : 'medium'
        };

        setSecurityEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events
      }
    });
  }, [settings.confidenceThreshold]);

  // Start/stop monitoring
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    
    if (!isMonitoring) {
      const event: SecurityEvent = {
        id: Date.now().toString(),
        type: 'alert',
        message: 'Security monitoring started',
        timestamp: new Date(),
        severity: 'low'
      };
      setSecurityEvents(prev => [event, ...prev]);
    } else {
      const event: SecurityEvent = {
        id: Date.now().toString(),
        type: 'alert',
        message: 'Security monitoring stopped',
        timestamp: new Date(),
        severity: 'low'
      };
      setSecurityEvents(prev => [event, ...prev]);
    }
  };

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Send notifications for high-severity events
  useEffect(() => {
    if (settings.notifications && securityEvents.length > 0) {
      const latestEvent = securityEvents[0];
      if (latestEvent.severity === 'high' || latestEvent.severity === 'critical') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Security Alert', {
            body: latestEvent.message,
            icon: '/pwa-192x192.png'
          });
        }
      }
    }
  }, [securityEvents, settings.notifications]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <h1 className="text-xl font-bold">Home Security</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Status indicators */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isMonitoring ? 'bg-green-500' : 'bg-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isMonitoring ? 'bg-white animate-pulse' : 'bg-gray-400'
              }`} />
              <span>{isMonitoring ? 'Monitoring' : 'Offline'}</span>
            </div>

            {/* Event count */}
            {securityEvents.length > 0 && (
              <div className="flex items-center space-x-1 text-sm text-yellow-400">
                <AlertTriangle className="h-4 w-4" />
                <span>{securityEvents.length}</span>
              </div>
            )}

            {/* User Authentication */}
            <UserProfileDropdown />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'live', label: 'Live View', icon: Camera },
              { id: 'events', label: 'Events', icon: AlertTriangle },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-400 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        {activeTab === 'live' && (
          <div className="space-y-6">
            {/* Camera View */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="aspect-video relative">
                <CameraStream
                  onDetection={handleDetection}
                  isActive={isMonitoring}
                />
                
                {/* Detection Overlays */}
                {isMonitoring && detectedObjects.length > 0 && (
                  <DetectionOverlay objects={detectedObjects} />
                )}
              </div>

              {/* Controls */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={toggleMonitoring}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        isMonitoring
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                    </button>

                    {/* Detection stats */}
                    {detectedObjects.length > 0 && (
                      <div className="text-sm text-gray-400">
                        {detectedObjects.length} objects detected
                      </div>
                    )}
                  </div>

                  {/* Quick settings */}
                  <div className="flex items-center space-x-2 text-sm">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.humanDetection}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          humanDetection: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span>Human Detection</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Events Preview */}
            {securityEvents.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Recent Events</h3>
                <div className="space-y-2">
                  {securityEvents.slice(0, 3).map(event => (
                    <div key={event.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <div>
                        <p className="text-sm font-medium">{event.message}</p>
                        <p className="text-xs text-gray-400">
                          {event.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        event.severity === 'critical' ? 'bg-red-500' :
                        event.severity === 'high' ? 'bg-orange-500' :
                        event.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}>
                        {event.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <EventsList events={securityEvents} />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
          />
        )}
      </main>
    </div>
  );
}

// Wrap App with Authentication
function AuthenticatedApp() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default AuthenticatedApp;