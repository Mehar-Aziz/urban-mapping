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