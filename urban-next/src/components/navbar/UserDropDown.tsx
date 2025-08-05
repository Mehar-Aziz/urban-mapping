import React from "react"
import Link from "next/link"
import { Avatar, AvatarFallback} from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"


export const UserDropdownMenu = () => (
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