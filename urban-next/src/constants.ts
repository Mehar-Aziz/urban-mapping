import { Home, Map, HelpCircle, User } from "lucide-react"
import { NavItem, ClassColors } from "./types"


export const BRAND_COLOR = '#00674F'
export const BRAND_COLOR_HOVER = '#00674F30'

export const DESKTOP_NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/main', label: 'Map', icon: Map },
  { href: '/land-cover-classification', label: 'Land Cover', icon: Map },
  { href: '/help', label: 'Help', icon: HelpCircle },
]

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/main', label: 'Map', icon: Map },
  { href: '/help', label: 'Help', icon: HelpCircle },
  { href: '/profile', label: 'Profile', icon: User },
]


////////////PREDICTIONS///////////////////
export const CLASS_COLORS: ClassColors = {
  'Permanet water bodies': '#2563eb',
  'Tree cover': '#16a34a',
  'Shrubland': '#ca8a04',
  'GrassLand': '#84cc16',
  'Cropland': '#f59e0b',
  'Built-up': '#dc2626',
  'Bare/sparse vegetaion': '#a3a3a3',
  'Snow and ice': '#e5e7eb',
  'Herbaceous wetland': '#06b6d4',
  'Mangroves': '#c2ffacff',
  'Moss and lichen': '#f472b6',
};

export const AVAILABLE_MODELS = [
  { value: 'LSTM', label: 'LSTM Model' },
  { value: 'BiLSTM', label: 'BiLSTM Model' },
  { value: 'GRU', label: 'GRU Model' },
  { value: 'Transformer', label: 'Transformer Model' }
];

export const MAP_CONFIG = {
  center: [70.8897, 29.1805] as [number, number],
  zoom: 12,
  style: "mapbox://styles/mapbox/satellite-v9",
};