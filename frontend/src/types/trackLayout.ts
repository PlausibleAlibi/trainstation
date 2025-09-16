// API response types for track layout data

export interface TrackSection {
  id: number;
  name: string;
  trackLineId: number;
  length?: number;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  isActive: boolean;
}

export interface TrackSwitch {
  id: number;
  name?: string;
  accessoryId: number;
  sectionId: number;
  position: string;
  isActive: boolean;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  orientation?: number;
  kind?: string;
  defaultRoute?: string;
}

export interface AccessoryCategory {
  id: number;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface TrackAccessory {
  id: number;
  name: string;
  categoryId: number;
  controlType: string;
  address: string;
  isActive: boolean;
  timedMs?: number;
  sectionId?: number;
  category?: AccessoryCategory;
}

export interface SectionConnection {
  id: number;
  fromSectionId: number;
  toSectionId: number;
  connectionType: string;
  switchId?: number;
  isActive: boolean;
}

export interface TrackLayoutData {
  sections: TrackSection[];
  switches: TrackSwitch[];
  accessories: TrackAccessory[];
  connections: SectionConnection[];
}

// Transform backend data to frontend format for VirtualTrackLayout
export interface VirtualTrackLayoutData {
  sections: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    radius: number;
  }>;
  switches: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    radius: number;
    color: string;
  }>;
  accessories: Array<{
    id: string;
    type: string;
    name: string;
    x: number;
    y: number;
    sectionId: string;
  }>;
  connections: Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    type: string;
  }>;
}