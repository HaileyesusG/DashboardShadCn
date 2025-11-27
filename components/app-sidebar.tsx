"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  FileText,
  Users,
  ChevronsUpDown,
  Plus,
  Mail,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  orgId: string
}

export function AppSidebar({ orgId, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [organizations, setOrganizations] = React.useState<any[]>([])
  const [invitationCount, setInvitationCount] = React.useState(0)

  // Fetch user's organizations
  React.useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const sessionToken = localStorage.getItem("session_token")
        const response = await fetch("/api/organization", {
          headers: {
            "Authorization": `Bearer ${sessionToken}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setOrganizations(data.organizations || [])
        }
      } catch (error) {
        console.error("Failed to fetch organizations:", error)
      }
    }
    fetchOrganizations()
  }, [])

  // Check for pending invitations
  React.useEffect(() => {
    const checkInvitations = async () => {
      try {
        const sessionToken = localStorage.getItem("session_token")
        if (!sessionToken) return

        const response = await fetch("/api/invitations", {
          headers: {
            "Authorization": `Bearer ${sessionToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setInvitationCount(data.invitations?.length || 0)
        }
      } catch (error) {
        console.error("Error checking invitations:", error)
      }
    }

    checkInvitations()

    // Check for new invitations every 30 seconds
    const interval = setInterval(checkInvitations, 30000)

    return () => clearInterval(interval)
  }, [])

  const currentOrg = organizations.find((org) => org.id === orgId)

  const navItems = [
    {
      title: "Table",
      url: `/organization/${orgId}/outline`,
      icon: FileText,
      isActive: pathname?.includes("/outline"),
    },
    {
      title: "Team Info / Setup",
      url: `/organization/${orgId}/team`,
      icon: Users,
      isActive: pathname?.includes("/team"),
    },
  ]

  const user = {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/user.jpg",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <span className="text-lg font-bold">A</span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {currentOrg?.name || "Acme Inc"}
                    </span>
                    <Badge variant="outline" className="w-fit text-xs">
                      Enterprise
                    </Badge>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" align="start" side="bottom" sideOffset={4}>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Organizations
                </DropdownMenuLabel>
                {organizations.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => router.push(`/organization/${org.id}/outline`)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <span className="text-xs font-semibold">
                        {org.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {org.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/create-organization")}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border border-dashed">
                    <Plus className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">Add organization</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={item.isActive}>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/invitations"}>
                <a href="/invitations">
                  <Mail />
                  <span>Invitations</span>
                  {invitationCount > 0 && (
                    <SidebarMenuBadge className="ml-auto bg-red-500 text-white">
                      {invitationCount}
                    </SidebarMenuBadge>
                  )}
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
