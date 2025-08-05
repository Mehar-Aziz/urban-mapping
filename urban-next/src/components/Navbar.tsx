'use client'

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "@/components/ui/dropdown-menu"
import { Plus, Home, Map, HelpCircle, User } from "lucide-react"
import { useState, useEffect } from "react"
import CreateProjectModal from "./home/CreateProjectModal"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

// Types
interface NavItem {
  href: string
  label: string
  icon: typeof Home
}

// Constants
const BRAND_COLOR = '#00674F'
const BRAND_COLOR_HOVER = '#00674F30'

const DESKTOP_NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/main', label: 'Map', icon: Map },
  { href: '/land-cover-classification', label: 'Land Cover', icon: Map },
  { href: '/help', label: 'Help', icon: HelpCircle },
]

const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/main', label: 'Map', icon: Map },
  { href: '/help', label: 'Help', icon: HelpCircle },
  { href: '/profile', label: 'Profile', icon: User },
]

// Custom hooks can be moved to separate files when needed

// Components
const Logo = () => (
  <div className="text-xl font-bold text-[#00674F] mx-auto md:mx-0">
    Geomapping
  </div>
)

interface DesktopNavLinkProps {
  href: string
  label: string
  isActive: boolean
}

const DesktopNavLink = ({ href, label, isActive }: DesktopNavLinkProps) => (
  <Link 
    href={href} 
    className={cn(
      "transition-colors hover:text-green-800",
      isActive ? "text-green-800 font-medium" : "text-gray-700"
    )}
  >
    {label}
  </Link>
)

const DesktopNavigation = ({ pathname }: { pathname: string }) => (
  <nav className="hidden md:flex space-x-6">
    {DESKTOP_NAV_ITEMS.map((item) => (
      <DesktopNavLink
        key={item.href}
        href={item.href}
        label={item.label}
        isActive={pathname === item.href}
      />
    ))}
  </nav>
)

interface CreateProjectButtonProps {
  onClick: () => void
  variant?: 'desktop' | 'mobile'
}

const CreateProjectButton = ({ onClick, variant = 'desktop' }: CreateProjectButtonProps) => {
  if (variant === 'mobile') {
    return (
      <Button 
        onClick={onClick}
        variant="outline"
        className={cn(
          "rounded-full h-12 w-12 p-0 flex items-center justify-center",
          "border-none shadow-md transition-colors",
          `bg-[${BRAND_COLOR}] text-white hover:bg-[${BRAND_COLOR_HOVER}]`
        )}
      >
        <Plus className="w-6 h-6" />
      </Button>
    )
  }

  return (
    <Button 
      variant="outline" 
      onClick={onClick}
      className="transition-colors"
    >
      <Plus className="w-4 h-4 mr-2" /> 
      Create Project
    </Button>
  )
}

const UserDropdownMenu = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Avatar className="cursor-pointer h-10 w-10 transition-opacity hover:opacity-80">
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <Link href="/profile" passHref legacyBehavior>
        <DropdownMenuItem asChild>
          <a>My Profile</a>
        </DropdownMenuItem>
      </Link>
      <Link href="/login" passHref legacyBehavior>
        <DropdownMenuItem>Logout</DropdownMenuItem>
      </Link>
    </DropdownMenuContent>
  </DropdownMenu>
)

const DesktopActions = ({ onCreateProject }: { onCreateProject: () => void }) => (
  <div className="hidden md:flex items-center space-x-4">
    <CreateProjectButton onClick={onCreateProject} />
    <UserDropdownMenu />
  </div>
)

interface MobileNavItemProps {
  href: string
  label: string
  icon: typeof Home
  isActive: boolean
}

const MobileNavItem = ({ href, label, icon: Icon, isActive }: MobileNavItemProps) => (
  <Link 
    href={href} 
    className={cn(
      "flex flex-col items-center justify-center transition-colors hover:text-green-800",
      `text-[${BRAND_COLOR}]`,
      isActive && "font-medium"
    )}
  >
    <Icon className={cn("w-6 h-6", isActive && `fill-[${BRAND_COLOR}]`)} />
    <span className="text-xs mt-1">{label}</span>
    {isActive && (
      <div className={cn("h-1 w-6 rounded-full mt-1", `bg-[${BRAND_COLOR}]`)} />
    )}
  </Link>
)

interface MobileNavigationProps {
  pathname: string
  onCreateProject: () => void
}

const MobileNavigation = ({ pathname, onCreateProject }: MobileNavigationProps) => (
  <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-200">
    <div className="flex justify-around items-center h-16">
      {MOBILE_NAV_ITEMS.slice(0, 2).map((item) => (
        <MobileNavItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          isActive={pathname === item.href}
        />
      ))}
      
      <CreateProjectButton onClick={onCreateProject} variant="mobile" />
      
      {MOBILE_NAV_ITEMS.slice(2).map((item) => (
        <MobileNavItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          isActive={pathname === item.href}
        />
      ))}
    </div>
  </nav>
)

const Header = ({ pathname, onCreateProject }: { pathname: string; onCreateProject: () => void }) => (
  <header className="sticky top-0 z-40 bg-white shadow-md">
    <div className="flex items-center justify-between px-4 md:px-6 py-4">
      <Logo />
      <DesktopNavigation pathname={pathname} />
      <DesktopActions onCreateProject={onCreateProject} />
    </div>
  </header>
)

// Main component
export default function Navbar() {
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const pathname = usePathname()

  const handleCreateProject = () => setIsCreateProjectOpen(true)

  return (
    <>
      <Header pathname={pathname} onCreateProject={handleCreateProject} />
      
      <MobileNavigation 
        pathname={pathname} 
        onCreateProject={handleCreateProject} 
      />

      {/* Mobile bottom padding spacer */}
      <div className="md:hidden" />

      <CreateProjectModal 
        open={isCreateProjectOpen} 
        setOpen={setIsCreateProjectOpen} 
      />
    </>
  )
}