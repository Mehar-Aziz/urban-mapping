import { Home, Map, HelpCircle, User } from "lucide-react"
import { NavItem } from "./types"

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
