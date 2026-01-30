// Core domain types for Cura Photo Manager

export interface ImageMetadata {
  captureDate?: Date;
  cameraMake?: string;
  cameraModel?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  dimensions: {
    width: number;
    height: number;
  };
  fileSize: number;
  fileModified: Date;
}

export interface Tag {
  label: string;
  confidence: number;
}

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface ImageRecord {
  id: number;
  path: string;
  thumbnailSmall: string;
  thumbnailMedium: string;
  checksum: string;
  metadata: ImageMetadata;
  tags: Tag[];
  syncStatus: SyncStatus;
  syncedAt?: Date;
}

export interface SearchQuery {
  text?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  location?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  cameraModel?: string;
  semantic?: boolean;
}

export interface SearchResult {
  images: ImageRecord[];
  totalCount: number;
  searchTimeMs: number;
}

export interface SyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number;
  uploadQuality: 'original' | 'high' | 'medium';
  excludePatterns: string[];
}

export interface ScanProgress {
  count: number;
  currentFile: string;
}

export interface SyncProgress {
  current: number;
  total: number;
  currentFile: string;
}
