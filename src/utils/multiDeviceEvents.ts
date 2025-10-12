import { SecurityEvent } from './storage';
import { Device } from './deviceRegistry';

// Extended Security Event for Multi-Device
export interface MultiDeviceSecurityEvent extends SecurityEvent {
  sourceDevice: {
    id: string;
    name: string;
    type: Device['type'];
    location: string;
  };
  correlationId?: string; // Link related events across devices
  eventChain?: {
    previousEvent?: string; // Previous event ID in sequence
    nextEvent?: string; // Next event ID in sequence
    chainType: 'motion-sequence' | 'person-tracking' | 'area-coverage';
  };
}

export interface DeviceEventSummary {
  deviceId: string;
  deviceName: string;
  eventsToday: number;
  lastEventTime: Date;
  alertLevel: 'low' | 'medium' | 'high';
  topDetections: Array<{
    object: string;
    count: number;
    confidence: number;
  }>;
}

export interface LocationEventSummary {
  locationName: string;
  devices: number;
  eventsToday: number;
  alertLevel: 'low' | 'medium' | 'high';
  lastActivity: Date;
  activeDetections: number;
}

// Multi-Device Event Aggregation Service
export class MultiDeviceEventService {
  private events: Map<string, MultiDeviceSecurityEvent> = new Map();
  private eventQueues: Map<string, MultiDeviceSecurityEvent[]> = new Map(); // Per device
  private correlationEngine: CorrelationEngine;
  
  constructor() {
    this.correlationEngine = new CorrelationEngine();
  }

  // Ingest event from any device
  async ingestEvent(
    event: SecurityEvent, 
    sourceDevice: Device
  ): Promise<MultiDeviceSecurityEvent> {
    const multiDeviceEvent: MultiDeviceSecurityEvent = {
      ...event,
      sourceDevice: {
        id: sourceDevice.id,
        name: sourceDevice.name,
        type: sourceDevice.type,
        location: sourceDevice.location.name
      }
    };

    // Store event
    this.events.set(event.id, multiDeviceEvent);
    
    // Add to device queue
    const deviceQueue = this.eventQueues.get(sourceDevice.id) || [];
    deviceQueue.push(multiDeviceEvent);
    this.eventQueues.set(sourceDevice.id, deviceQueue);

    // Run correlation analysis
    await this.correlationEngine.analyzeEvent(multiDeviceEvent, this.getRecentEvents());

    // Trigger real-time notifications
    await this.notifySubscribers(multiDeviceEvent);

    return multiDeviceEvent;
  }

  // Get events across all devices with filtering
  getAggregatedEvents(filters: {
    deviceIds?: string[];
    locations?: string[];
    timeRange?: { start: Date; end: Date };
    objectTypes?: string[];
    alertLevel?: 'low' | 'medium' | 'high';
    limit?: number;
  }): MultiDeviceSecurityEvent[] {
    let events = Array.from(this.events.values());

    // Apply filters
    if (filters.deviceIds) {
      events = events.filter(e => filters.deviceIds!.includes(e.sourceDevice.id));
    }
    
    if (filters.locations) {
      events = events.filter(e => filters.locations!.includes(e.sourceDevice.location));
    }

    if (filters.timeRange) {
      events = events.filter(e => 
        e.timestamp >= filters.timeRange!.start && 
        e.timestamp <= filters.timeRange!.end
      );
    }

    if (filters.objectTypes) {
      events = events.filter(e => 
        e.detections.some((obj: any) => filters.objectTypes!.includes(obj.className))
      );
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return filters.limit ? events.slice(0, filters.limit) : events;
  }

  // Generate device summaries
  getDeviceEventSummaries(): DeviceEventSummary[] {
    const summaries: DeviceEventSummary[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const [deviceId, events] of this.eventQueues) {
      const todayEvents = events.filter(e => e.timestamp >= today);
      const lastEvent = events[events.length - 1];
      
      // Calculate top detections
      const detectionCounts = new Map<string, { count: number; totalConfidence: number }>();
      todayEvents.forEach(event => {
        event.detections.forEach((obj: any) => {
          const existing = detectionCounts.get(obj.className) || { count: 0, totalConfidence: 0 };
          detectionCounts.set(obj.className, {
            count: existing.count + 1,
            totalConfidence: existing.totalConfidence + obj.score
          });
        });
      });

      const topDetections = Array.from(detectionCounts.entries())
        .map(([className, data]) => ({
          object: className,
          count: data.count,
          confidence: data.totalConfidence / data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      summaries.push({
        deviceId,
        deviceName: lastEvent?.sourceDevice.name || 'Unknown',
        eventsToday: todayEvents.length,
        lastEventTime: lastEvent?.timestamp || new Date(0),
        alertLevel: this.calculateAlertLevel(todayEvents),
        topDetections
      });
    }

    return summaries;
  }

  // Generate location summaries
  getLocationEventSummaries(): LocationEventSummary[] {
    const locationMap = new Map<string, {
      devices: Set<string>;
      events: MultiDeviceSecurityEvent[];
    }>();

    // Group events by location
    Array.from(this.events.values()).forEach(event => {
      const location = event.sourceDevice.location;
      const existing = locationMap.get(location) || { 
        devices: new Set(), 
        events: [] 
      };
      
      existing.devices.add(event.sourceDevice.id);
      existing.events.push(event);
      locationMap.set(location, existing);
    });

    // Generate summaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from(locationMap.entries()).map(([location, data]) => {
      const todayEvents = data.events.filter(e => e.timestamp >= today);
      const lastActivity = data.events.reduce((latest, event) => 
        event.timestamp > latest ? event.timestamp : latest, 
        new Date(0)
      );

      return {
        locationName: location,
        devices: data.devices.size,
        eventsToday: todayEvents.length,
        alertLevel: this.calculateAlertLevel(todayEvents),
        lastActivity,
        activeDetections: this.getActiveDetections(location)
      };
    });
  }

  private getRecentEvents(hours: number = 1): MultiDeviceSecurityEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.events.values()).filter(e => e.timestamp >= cutoff);
  }

  private calculateAlertLevel(events: MultiDeviceSecurityEvent[]): 'low' | 'medium' | 'high' {
    if (events.length === 0) return 'low';
    
    const recentEvents = events.filter(e => 
      Date.now() - e.timestamp.getTime() < 30 * 60 * 1000 // Last 30 minutes
    );

    if (recentEvents.length > 10) return 'high';
    if (recentEvents.length > 5) return 'medium';
    return 'low';
  }

  private getActiveDetections(location: string): number {
    const recentCutoff = new Date(Date.now() - 5 * 60 * 1000); // Last 5 minutes
    return Array.from(this.events.values()).filter(e => 
      e.sourceDevice.location === location && 
      e.timestamp >= recentCutoff
    ).length;
  }

  private async notifySubscribers(_event: MultiDeviceSecurityEvent): Promise<void> {
    // Implement real-time notifications
    // WebSocket, Server-Sent Events, or Push Notifications
  }
}

// Correlation Engine for detecting patterns across devices
class CorrelationEngine {
  async analyzeEvent(
    event: MultiDeviceSecurityEvent, 
    recentEvents: MultiDeviceSecurityEvent[]
  ): Promise<void> {
    // Motion sequence detection
    await this.detectMotionSequence(event, recentEvents);
    
    // Person tracking across cameras
    await this.detectPersonTracking(event, recentEvents);
    
    // Area coverage analysis
    await this.detectAreaCoverage(event, recentEvents);
  }

  private async detectMotionSequence(
    event: MultiDeviceSecurityEvent,
    recentEvents: MultiDeviceSecurityEvent[]
  ): Promise<void> {
    // Look for motion events in sequence across different devices
    // This would identify someone moving through the house
    const motionEvents = recentEvents.filter(e => 
      e.detections.some((obj: any) => obj.className === 'person') &&
      Math.abs(e.timestamp.getTime() - event.timestamp.getTime()) < 60000 // Within 1 minute
    );

    if (motionEvents.length > 1) {
      // Create correlation chain
      const correlationId = `motion_seq_${Date.now()}`;
      // Update events with correlation info
      console.log(`Motion sequence detected: ${correlationId}`);
    }
  }

  private async detectPersonTracking(
    _event: MultiDeviceSecurityEvent,
    _recentEvents: MultiDeviceSecurityEvent[]
  ): Promise<void> {
    // Advanced: Use ML to track the same person across different cameras
    // This would require facial recognition or gait analysis
  }

  private async detectAreaCoverage(
    _event: MultiDeviceSecurityEvent,
    _recentEvents: MultiDeviceSecurityEvent[]
  ): Promise<void> {
    // Analyze which areas are currently being monitored
    // Identify blind spots or coverage gaps
  }
}