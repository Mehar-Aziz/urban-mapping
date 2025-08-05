"use client"
import React from "react"
import { Logo } from "./Logo" 
import { Button } from "../ui/button"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { BRAND_COLOR, BRAND_COLOR_HOVER } from "@/constants"
import { CreateProjectButtonProps, MobileNavigationProps, MobileNavItemProps } from "@/types"
import { DESKTOP_NAV_ITEMS, MOBILE_NAV_ITEMS } from "@/constants"
import Link from "next/link"
import { DesktopNavLinkProps } from "@/types"
import { UserDropdownMenu } from "@/components/navbar/userDropDown"

export const DesktopNavLink = ({ href, label, isActive }: DesktopNavLinkProps) => (
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


export const DesktopNavigation = ({ pathname }: { pathname: string }) => (
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

export const CreateProjectButton = ({ onClick, variant = 'desktop' }: CreateProjectButtonProps) => {
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
}


export const DesktopActions = ({ onCreateProject }: { onCreateProject: () => void }) => (
  <div className="hidden md:flex items-center space-x-4">
    <CreateProjectButton onClick={onCreateProject} />
    <UserDropdownMenu />
  </div>
)

export const MobileNavigation = ({ pathname, onCreateProject }: MobileNavigationProps) => (
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

export const Header = ({ pathname, onCreateProject }: { pathname: string; onCreateProject: () => void }) => (
  <header className="sticky top-0 z-40 bg-white shadow-md">
    <div className="flex items-center justify-between px-4 md:px-6 py-4">
      <Logo />
      <DesktopNavigation pathname={pathname} />
      <DesktopActions onCreateProject={onCreateProject} />
    </div>
  </header>
)
