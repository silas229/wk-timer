"use client"

import { useState, useCallback } from "react"
import { Users, Plus, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTeam } from "@/components/team-context"

interface TeamManageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TeamManageDialog({ open, onOpenChange }: TeamManageDialogProps) {
  const { teams, createTeam, updateTeam, deleteTeam } = useTeam()
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

  const handleClose = useCallback(() => {
    onOpenChange(false)
    // Reset editing state when closing
    setEditingTeam(null)
    setEditTeamName("")
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gruppen verwalten
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
              onClick={handleClose}
              variant="outline"
            >
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
