"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState, useCallback } from "react"
import { Settings, History, ChevronDown, Users, Plus, Edit2, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { useTeam } from "@/components/team-context"

export function Navigation() {
  const pathname = usePathname()
  const { teams, selectedTeamId, setSelectedTeamId, createTeam, updateTeam, deleteTeam, getCurrentTeam } = useTeam()
  const [showTeamDropdown, setShowTeamDropdown] = useState(false)
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
    setShowTeamDropdown(false)
  }, [setSelectedTeamId])

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
                Manage Teams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create New Team */}
              <div>
                <label htmlFor="newTeamName" className="text-sm font-medium">Create New Team</label>
                <div className="flex gap-2 mt-1">
                  <input
                    id="newTeamName"
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="flex-1 px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
              <div>
                <label className="text-sm font-medium">Existing Teams</label>
                <div className="space-y-2 mt-2">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center gap-3 p-3 rounded-lg border"
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      {editingTeam?.id === team.id ? (
                        <input
                          type="text"
                          value={editTeamName}
                          onChange={(e) => setEditTeamName(e.target.value)}
                          className="flex-1 px-2 py-1 border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                      <div className="flex gap-1">
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

              <Button 
                onClick={() => setShowManageDialog(false)}
                className="w-full"
                variant="outline"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold hover:text-primary transition-colors">
            Timer
          </Link>
          
          <div className="flex items-center gap-2">
            {/* Team Selector Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTeamDropdown(!showTeamDropdown)}
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
              
              {showTeamDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-background border border-border rounded-lg shadow-lg z-40">
                  <div className="p-2 space-y-1">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleTeamSelect(team.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedTeamId === team.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        {team.name}
                      </button>
                    ))}
                    <div className="border-t pt-1 mt-1">
                      <button
                        onClick={() => {
                          setShowTeamDropdown(false)
                          setShowManageDialog(true)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                      >
                        <Users className="h-4 w-4" />
                        Manage Teams
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link href="/history">
              <Button 
                variant={pathname === "/history" ? "default" : "ghost"} 
                size="sm"
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                History
              </Button>
            </Link>
            
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </div>
      </header>
    </>
  )
}
