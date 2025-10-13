import { useState } from 'react';
import { format } from 'date-fns';
import { Download, ChevronDown, ChevronUp, Calendar, Clock, Eye, AlertTriangle, Trash2, Play, Info, X, ImageIcon } from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: 'detection' | 'anomaly' | 'alert' | 'motion' | 'manual';
  message: string;
  timestamp: Date;
  objects?: any[];
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

interface EventsListProps {
  events: SecurityEvent[];
}

const EventsList: React.FC<EventsListProps> = ({ events }) => {
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video', url: string, eventId: string, blob?: Blob } | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'detection': return Eye;
      case 'anomaly': return AlertTriangle;
      case 'alert': return AlertTriangle;
      case 'motion': return Eye;
      case 'manual': return Eye;
      default: return AlertTriangle;
    }
  };

    const handleMediaView = (blob: Blob, type: 'image' | 'video', eventId: string) => {
    try {
      // Create a proper blob URL with MIME type
      const blobWithType = new Blob([blob], { 
        type: type === 'video' ? 'video/webm' : 'image/jpeg' 
      });
      const url = URL.createObjectURL(blobWithType);
      
      setSelectedMedia({ 
        url, 
        type, 
        eventId,
        blob: blobWithType
      });
    } catch (error) {
      console.error('Error creating media URL:', error);
      // Fallback: try to use the blob directly
      const url = URL.createObjectURL(blob);
      setSelectedMedia({ url, type, eventId, blob });
    }
  };

  const closeMediaView = () => {
    if (selectedMedia) {
      URL.revokeObjectURL(selectedMedia.url);
      setSelectedMedia(null);
    }
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  if (events.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Events Yet</h3>
        <p className="text-gray-400">Start monitoring to see security events here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Security Events</h2>
        <div className="text-sm text-gray-400">
          {events.length} total events
        </div>
      </div>

      <div className="space-y-3">
        {events.map((event) => {
          const Icon = getTypeIcon(event.type);
          const isExpanded = expandedEvents.has(event.id);
          
          return (
            <div key={event.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-full ${getSeverityColor(event.severity)}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{event.message}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{event.timestamp.toLocaleString()}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.severity)} text-white`}>
                          {event.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleEventExpansion(event.id)}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                        title={isExpanded ? "Show less" : "Show more details"}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <button className="text-gray-400 hover:text-red-400 transition-colors p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Always show basic info */}
                  {event.objects && event.objects.length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      Objects: {event.objects.map(obj => obj.class).join(', ')}
                    </div>
                  )}
                  
                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 space-y-2 border-t border-gray-700 pt-3">
                      {/* Debug info */}
                      <div className="bg-gray-700 rounded p-2 text-xs">
                        <div className="text-yellow-400 font-medium mb-1">Debug Info:</div>
                        <div>Event ID: {event.id}</div>
                        <div>Type: {event.type}</div>
                        <div>Has Image: {event.imageBlob ? 'Yes' : 'No'}</div>
                        <div>Has Video: {event.videoBlob ? 'Yes' : 'No'}</div>
                        {event.confidence && <div>Confidence: {(event.confidence * 100).toFixed(1)}%</div>}
                      </div>
                      
                      {/* Enhanced detection details */}
                      {event.detections && event.detections.length > 0 && (
                        <div className="bg-gray-800 rounded p-3 mt-2">
                          <div className="text-sm font-medium text-blue-400 mb-2">
                            🎯 Detected Objects ({event.detections.length})
                          </div>
                          <div className="space-y-2">
                            {event.detections.map((detection, idx) => {
                              const confidence = Math.round((detection.score || detection.confidence || 0) * 100);
                              const className = detection.className || detection.class || 'Unknown';
                              const bbox = detection.bbox || [0, 0, 0, 0];
                              const [x, y, w, h] = bbox;
                              
                              // Determine alert level and color
                              let alertColor = 'text-green-400';
                              let alertIcon = '🟢';
                              
                              if (['person'].includes(className.toLowerCase())) {
                                alertColor = 'text-red-400';
                                alertIcon = '🔴';
                              } else if (['car', 'truck', 'motorcycle', 'bicycle'].includes(className.toLowerCase())) {
                                alertColor = 'text-orange-400';
                                alertIcon = '🟠';
                              } else if (['knife', 'scissors', 'bottle'].includes(className.toLowerCase())) {
                                alertColor = 'text-red-500';
                                alertIcon = '⚠️';
                              }
                              
                              return (
                                <div key={idx} className="flex items-center justify-between text-xs border-l-2 border-gray-600 pl-2">
                                  <div className="flex items-center space-x-2">
                                    <span>{alertIcon}</span>
                                    <span className={`font-medium ${alertColor}`}>
                                      {className.toUpperCase()}
                                    </span>
                                    <span className="text-gray-400">
                                      {confidence}% confidence
                                    </span>
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    📍 ({Math.round(x)}, {Math.round(y)}) 
                                    📏 {Math.round(w)}×{Math.round(h)}px
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Metadata */}
                      {event.metadata && (
                        <div className="text-xs text-gray-400">
                          <strong>Camera:</strong> {event.metadata.cameraId}
                          {event.metadata.duration && (
                            <span className="ml-2"><strong>Duration:</strong> {event.metadata.duration}s</span>
                          )}
                          {event.metadata.deviceId && (
                            <span className="ml-2"><strong>Device:</strong> {event.metadata.deviceId}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Media buttons */}
                  {(event.imageBlob || event.videoBlob) && (
                    <div className="flex items-center space-x-2 mt-3">
                      {event.imageBlob && (
                        <button
                          onClick={() => handleMediaView(event.imageBlob!, 'image', event.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors"
                        >
                          <ImageIcon className="h-3 w-3" />
                          <span>View Image</span>
                        </button>
                      )}
                      {event.videoBlob && (
                        <button
                          onClick={() => handleMediaView(event.videoBlob!, 'video', event.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white transition-colors"
                        >
                          <Play className="h-3 w-3" />
                          <span>Play Video</span>
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Show message if no media available */}
                  {!event.imageBlob && !event.videoBlob && isExpanded && (
                    <div className="mt-3 p-2 bg-gray-700 rounded text-xs text-gray-400">
                      <Info className="h-3 w-3 inline mr-1" />
                      No media recorded for this event
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Media Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full bg-gray-900 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">
                {selectedMedia.type === 'video' ? 'Event Video' : 'Event Image'}
              </h3>
              <button
                onClick={closeMediaView}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4">
              {selectedMedia.type === 'video' ? (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  muted
                  playsInline
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                  className="rounded"
                  onError={(e) => {
                    console.error('Video playback error:', e);
                    console.log('Video URL:', selectedMedia.url);
                    console.log('Video blob type:', selectedMedia.blob?.type);
                  }}
                >
                  Your browser does not support video playback.
                </video>
              ) : (
                <img
                  src={selectedMedia.url}
                  alt="Event capture"
                  className="max-w-full max-h-[70vh] rounded object-contain"
                  onError={(e) => {
                    console.error('Image load error:', e);
                    console.log('Image URL:', selectedMedia.url);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsList;