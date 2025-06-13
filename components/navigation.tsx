"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState, useCallback } from "react"
import { History, ChevronDown, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTeam } from "@/components/team-context"
import { TeamManageDialog } from "@/components/team-manage-dialog"

export function Navigation() {
  const pathname = usePathname()
  const { teams, setSelectedTeamId, getCurrentTeam } = useTeam()
  const [showManageDialog, setShowManageDialog] = useState(false)

  const handleTeamSelect = useCallback((teamId: string) => {
    setSelectedTeamId(teamId)
  }, [setSelectedTeamId])

  const handleManageDialogOpen = useCallback(() => {
    setShowManageDialog(true)
  }, [])

  const currentTeam = getCurrentTeam()

  return (
    <>
      {/* Team Management Dialog */}
      <TeamManageDialog
        open={showManageDialog}
        onOpenChange={setShowManageDialog}
      />

      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold hover:text-primary transition-colors">
            Wettkämpfe Timer
          </Link>

          <div className="flex items-center gap-2">
            {/* Team Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {currentTeam && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentTeam.color }}
                    />
                  )}
                  <span>{currentTeam?.name || "Gruppe auswählen"}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white dark:bg-gray-800" sideOffset={5}>
                {teams.map((team) => (
                  <DropdownMenuItem
                    key={team.id}
                    onClick={() => handleTeamSelect(team.id)}
                    className="flex items-center gap-3 cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="flex-1">{team.name}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleManageDialogOpen}
                  className="flex items-center gap-3 cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span>Gruppen verwalten</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/history">
              <Button
                variant={pathname === "/history" ? "default" : "ghost"}
                size="sm"
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Verlauf</span>
              </Button>
            </Link>

            {/* <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Einstellungen</span>
            </Button> */}
          </div>
        </div>
      </header>
    </>
  )
}
