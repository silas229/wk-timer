"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState, useCallback } from "react"
import { History, ChevronDown, Users, Plus, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTeam } from "@/components/team-context"

export function Navigation() {
  const pathname = usePathname()
  const { teams, setSelectedTeamId, createTeam, updateTeam, deleteTeam, getCurrentTeam } = useTeam()
  const [showManageDialog, setShowManageDialog] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")
  const [editingTeam, setEditingTeam] = useState<{ id: string; name: string; color: string } | null>(null)
  const [editTeamName, setEditTeamName] = useState("")

  const handleCreateTeam = useCallback(() => {
    if (!newTeamName.trim()) return
    createTeam(newTeamName)
    setNewTeamName("")
  }, [newTeamName, createTeam])

  const handleUpdateTeam = useCallback((teamId: string, newName: string) => {
    if (!newName.trim()) return
    updateTeam(teamId, newName)
    setEditingTeam(null)
    setEditTeamName("")
  }, [updateTeam])

  const handleDeleteTeam = useCallback((teamId: string) => {
    deleteTeam(teamId)
  }, [deleteTeam])

  const handleTeamSelect = useCallback((teamId: string) => {
    setSelectedTeamId(teamId)
  }, [setSelectedTeamId])

  const handleManageDialogOpen = useCallback(() => {
    setShowManageDialog(true)
  }, [])

  const handleManageDialogClose = useCallback(() => {
    setShowManageDialog(false)
  }, [])

  const currentTeam = getCurrentTeam()

  return (
    <>
      {/* Team Management Dialog */}
      {showManageDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gruppen verwalten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create New Team */}
              <div className="space-y-2">
                <Label htmlFor="newTeamName">Neue Gruppe anlegen</Label>
                <div className="flex gap-2">
                  <Input
                    id="newTeamName"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Gruppennamen eingeben"
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
                  />
                  <Button
                    onClick={handleCreateTeam}
                    size="sm"
                    disabled={!newTeamName.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Teams List */}
              <div className="space-y-2">
                <Label>Bestehende Gruppen</Label>
                <div className="space-y-2">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: team.color }}
                      />
                      {editingTeam?.id === team.id ? (
                        <Input
                          value={editTeamName}
                          onChange={(e) => setEditTeamName(e.target.value)}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateTeam(team.id, editTeamName)
                            if (e.key === 'Escape') {
                              setEditingTeam(null)
                              setEditTeamName("")
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="flex-1 font-medium">{team.name}</span>
                      )}
                      <div className="flex gap-1 flex-shrink-0">
                        {editingTeam?.id === team.id ? (
                          <>
                            <Button
                              onClick={() => handleUpdateTeam(team.id, editTeamName)}
                              size="sm"
                              variant="ghost"
                              disabled={!editTeamName.trim()}
                            >
                              Save
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingTeam(null)
                                setEditTeamName("")
                              }}
                              size="sm"
                              variant="ghost"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => {
                                setEditingTeam(team)
                                setEditTeamName(team.name)
                              }}
                              size="sm"
                              variant="ghost"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteTeam(team.id)}
                              size="sm"
                              variant="ghost"
                              disabled={teams.length <= 1}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleManageDialogClose}
                  variant="outline"
                >
                  Schließen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                  <span>{currentTeam?.name || "Select Team"}</span>
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
