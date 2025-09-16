import type { TrackLayoutData, VirtualTrackLayoutData } from '../types/trackLayout';

const API_BASE_URL = import.meta.env.VITE_API_BASE || '/api';

export class TrackLayoutService {
  /**
   * Fetch track layout data from the backend API
   */
  static async fetchTrackLayout(): Promise<TrackLayoutData> {
    const response = await fetch(`${API_BASE_URL}/track-layout`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch track layout: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Transform backend data to the format expected by VirtualTrackLayout component
   */
  static transformToVirtualLayout(data: TrackLayoutData): VirtualTrackLayoutData {
    // Scale factor to convert from backend coordinates to SVG coordinates
    const SCALE_FACTOR = 2.5;
    const OFFSET_X = 300; // Center the layout in the SVG
    const OFFSET_Y = 200;

    // Transform sections
    const sections = data.sections.map(section => ({
      id: section.id.toString(),
      name: section.name,
      x: (section.positionX ?? 0) * SCALE_FACTOR + OFFSET_X,
      y: (section.positionY ?? 0) * SCALE_FACTOR + OFFSET_Y,
      radius: 25
    }));

    // Transform switches
    const switches = data.switches.map(switchItem => {
      // Get switch color based on type or use default colors
      const color = this.getSwitchColor(switchItem.kind || 'turnout');
      
      return {
        id: switchItem.id.toString(),
        name: switchItem.name || `SW${switchItem.id}`,
        x: (switchItem.positionX ?? 0) * SCALE_FACTOR + OFFSET_X,
        y: (switchItem.positionY ?? 0) * SCALE_FACTOR + OFFSET_Y,
        radius: 15,
        color
      };
    });

    // Transform accessories - filter non-switch accessories and map categories to types
    const accessories = data.accessories
      .filter(acc => acc.category?.name !== 'Switches') // Exclude switch motors
      .map(accessory => {
        const type = this.getAccessoryType(accessory.category?.name);
        const sectionId = accessory.sectionId?.toString() || '';
        
        // Find the associated section to get position
        const section = data.sections.find(s => s.id === accessory.sectionId);
        const sectionX = (section?.positionX ?? 0) * SCALE_FACTOR + OFFSET_X;
        const sectionY = (section?.positionY ?? 0) * SCALE_FACTOR + OFFSET_Y;
        
        // Offset accessories slightly from their section center
        return {
          id: accessory.id.toString(),
          type,
          name: accessory.name,
          x: sectionX + this.getAccessoryOffset(type).x,
          y: sectionY + this.getAccessoryOffset(type).y,
          sectionId
        };
      });

    // Transform connections to lines between sections
    const connections = this.generateConnections(data, sections, switches, SCALE_FACTOR, OFFSET_X, OFFSET_Y);

    return {
      sections,
      switches,
      accessories,
      connections
    };
  }

  /**
   * Get switch color based on switch type
   */
  private static getSwitchColor(kind: string): string {
    switch (kind.toLowerCase()) {
      case 'turnout':
        return '#4CAF50'; // Green
      case 'crossover':
        return '#FF9800'; // Orange
      case 'junction':
        return '#2196F3'; // Blue
      default:
        return '#4CAF50'; // Default green
    }
  }

  /**
   * Map backend category names to frontend accessory types
   */
  private static getAccessoryType(categoryName?: string): string {
    switch (categoryName?.toLowerCase()) {
      case 'signals':
        return 'signal';
      case 'lights':
        return 'light';
      case 'buildings':
        return 'house';
      default:
        return 'signal'; // Default fallback
    }
  }

  /**
   * Get position offset for accessories relative to their section
   */
  private static getAccessoryOffset(type: string): { x: number; y: number } {
    switch (type) {
      case 'signal':
        return { x: -40, y: -20 };
      case 'light':
        return { x: 30, y: 30 };
      case 'house':
        return { x: 0, y: 40 };
      default:
        return { x: 0, y: 0 };
    }
  }

  /**
   * Generate connection lines between sections based on section connections
   */
  private static generateConnections(
    data: TrackLayoutData, 
    sections: VirtualTrackLayoutData['sections'],
    _switches: VirtualTrackLayoutData['switches'],
    _scaleFactor: number,
    _offsetX: number,
    _offsetY: number
  ): VirtualTrackLayoutData['connections'] {
    return data.connections.map(conn => {
      const fromSection = sections.find(s => s.id === conn.fromSectionId.toString());
      const toSection = sections.find(s => s.id === conn.toSectionId.toString());
      
      if (!fromSection || !toSection) {
        console.warn(`Missing section for connection: ${conn.fromSectionId} -> ${conn.toSectionId}`);
        return {
          from: { x: 0, y: 0 },
          to: { x: 0, y: 0 },
          type: conn.connectionType
        };
      }

      // Calculate connection points on the edge of sections (not center)
      const angle = Math.atan2(toSection.y - fromSection.y, toSection.x - fromSection.x);
      const fromRadius = fromSection.radius;
      const toRadius = toSection.radius;

      return {
        from: {
          x: fromSection.x + Math.cos(angle) * fromRadius,
          y: fromSection.y + Math.sin(angle) * fromRadius
        },
        to: {
          x: toSection.x - Math.cos(angle) * toRadius,
          y: toSection.y - Math.sin(angle) * toRadius
        },
        type: conn.connectionType
      };
    });
  }
}