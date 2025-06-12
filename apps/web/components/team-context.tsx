"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"

export interface Team {
  id: string
  name: string
  color: string
  createdAt: Date
}

interface TeamContextValue {
  teams: Team[]
  selectedTeamId: string
  setSelectedTeamId: (id: string) => void
  loadTeams: () => void
  getCurrentTeam: () => Team | undefined
  createTeam: (name: string) => void
  updateTeam: (id: string, name: string) => void
  deleteTeam: (id: string) => void
}

const TeamContext = createContext<TeamContextValue | undefined>(undefined)

export function useTeam() {
  const context = useContext(TeamContext)
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider')
  }
  return context
}

interface TeamProviderProps {
  children: ReactNode
}

export function TeamProvider({ children }: TeamProviderProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")

  // Default team colors
  const teamColors = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", 
    "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"
  ]

  const loadTeams = useCallback(() => {
    try {
      const savedTeams = JSON.parse(localStorage.getItem('timer-teams') || '[]')
      const parsedTeams = savedTeams.map((team: any) => ({
        ...team,
        createdAt: new Date(team.createdAt)
      }))
      
      if (parsedTeams.length === 0) {
        // Create default team
        const defaultTeam: Team = {
          id: "default",
          name: "Default Team",
          color: teamColors[0]!,
          createdAt: new Date()
        }
        parsedTeams.push(defaultTeam)
        localStorage.setItem('timer-teams', JSON.stringify([defaultTeam]))
      }
      
      setTeams(parsedTeams)
      
      // Set initial selected team if none is set
      const savedSelectedTeam = localStorage.getItem('selected-team-id')
      const teamExists = parsedTeams.find((t: Team) => t.id === savedSelectedTeam)
      const initialTeamId = teamExists ? savedSelectedTeam! : parsedTeams[0]?.id
      
      if (initialTeamId && !selectedTeamId) {
        setSelectedTeamId(initialTeamId)
        localStorage.setItem('selected-team-id', initialTeamId)
      }
    } catch (error) {
      console.error('Failed to load teams:', error)
      setTeams([])
    }
  }, [teamColors])

  // Load teams only once on mount
  useEffect(() => {
    loadTeams()
  }, []) // Empty dependency array to run only once

  const createTeam = useCallback((name: string) => {
    if (!name.trim()) return
    
    const newTeam: Team = {
      id: Date.now().toString(),
      name: name.trim(),
      color: teamColors[teams.length % teamColors.length]!,
      createdAt: new Date()
    }
    
    try {
      const updatedTeams = [...teams, newTeam]
      setTeams(updatedTeams)
      localStorage.setItem('timer-teams', JSON.stringify(updatedTeams))
    } catch (error) {
      console.error('Failed to create team:', error)
    }
  }, [teams, teamColors])

  const updateTeam = useCallback((id: string, name: string) => {
    if (!name.trim()) return
    
    try {
      const updatedTeams = teams.map(team => 
        team.id === id ? { ...team, name: name.trim() } : team
      )
      setTeams(updatedTeams)
      localStorage.setItem('timer-teams', JSON.stringify(updatedTeams))
    } catch (error) {
      console.error('Failed to update team:', error)
    }
  }, [teams])

  const deleteTeam = useCallback((id: string) => {
    if (teams.length <= 1) return // Don't allow deleting the last team
    
    try {
      const updatedTeams = teams.filter(team => team.id !== id)
      setTeams(updatedTeams)
      localStorage.setItem('timer-teams', JSON.stringify(updatedTeams))
      
      // Delete all rounds associated with the deleted team
      // This ensures data consistency and prevents orphaned records
      const existingRounds = JSON.parse(localStorage.getItem('timer-rounds') || '[]')
      const filteredRounds = existingRounds.filter((round: any) => round.teamId !== id)
      localStorage.setItem('timer-rounds', JSON.stringify(filteredRounds))
      
      // If the deleted team was selected, switch to first available team
      if (selectedTeamId === id) {
        const newSelectedId = updatedTeams[0]?.id || ""
        if (newSelectedId) {
          setSelectedTeamId(newSelectedId)
          localStorage.setItem('selected-team-id', newSelectedId)
        }
      }
    } catch (error) {
      console.error('Failed to delete team:', error)
    }
  }, [teams, selectedTeamId])

  const handleSetSelectedTeamId = useCallback((id: string) => {
    setSelectedTeamId(id)
    localStorage.setItem('selected-team-id', id)
  }, [])

  const getCurrentTeam = useCallback(() => {
    return teams.find(team => team.id === selectedTeamId)
  }, [teams, selectedTeamId])

  const value: TeamContextValue = {
    teams,
    selectedTeamId,
    setSelectedTeamId: handleSetSelectedTeamId,
    loadTeams,
    getCurrentTeam,
    createTeam,
    updateTeam,
    deleteTeam
  }

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  )
}
