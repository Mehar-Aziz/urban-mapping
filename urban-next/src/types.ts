import { LucideIcon } from "lucide-react"
import { Home } from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export interface NavLinkProps {
  href: string
  label: string
  isActive: boolean
}

export interface CreateProjectButtonProps {
  onClick: () => void
  variant?: 'desktop' | 'mobile'
}

export interface DesktopNavLinkProps {
  href: string
  label: string
  isActive: boolean
}

export interface CreateProjectButtonProps {
  onClick: () => void
  variant?: 'desktop' | 'mobile'
}


// mobile navigation item interface

export interface MobileNavItemProps {
  href: string
  label: string
  icon: typeof Home
  isActive: boolean
}

export interface MobileNavigationProps {
  pathname: string
  onCreateProject: () => void
}

////////////PREDICTIONS///////////////////
export interface PredictionPoint {
  latitude: number;
  longitude: number;
  predicted_class: string;
  confidence: number;
}

export interface PolygonCoordinate {
  lat: number;
  lon: number;
}

export interface ApiPayload {
  polygon: PolygonCoordinate[];
  model?: string;
}

export interface ClassColors {
  [key: string]: string;
}
export interface ClassCounts {
  [key: string]: number;
}

export interface MapRefs {
  mapContainer: React.RefObject<HTMLDivElement>;
  map: React.RefObject<mapboxgl.Map | null>;
  draw: React.RefObject<MapboxDraw | null>;
  controlContainer: React.RefObject<HTMLDivElement | null>;
}

export interface MapState {
  isLoading: boolean;
  error: string | null;
  predictions: PredictionPoint[];
  selectedModel: string;
  hasDrawnPolygon: boolean;
  drawMode: 'idle' | 'drawing';
}

export type DrawEventHandler = (e: any) => void;
