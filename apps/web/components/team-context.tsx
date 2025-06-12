"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { indexedDB, initializeDB, type Team } from "@/lib/indexeddb"

interface TeamContextValue {
  teams: Team[]
  selectedTeamId: string
  setSelectedTeamId: (id: string) => void
  loadTeams: () => void
  getCurrentTeam: () => Team | undefined
  createTeam: (name: string) => void
  updateTeam: (id: string, name: string) => void
  deleteTeam: (id: string) => void
  isInitialized: boolean
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
  const [isInitialized, setIsInitialized] = useState(false)

  // Default team colors
  const teamColors = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", 
    "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"
  ]

  const loadTeams = useCallback(async () => {
    try {
      if (!isInitialized) return
      
      const savedTeams = await indexedDB.getAllTeams()
      
      if (savedTeams.length === 0) {
        // Create default team
        const defaultTeam: Team = {
          id: "default",
          name: "Default Team",
          color: teamColors[0]!,
          createdAt: new Date()
        }
        await indexedDB.saveTeam(defaultTeam)
        setTeams([defaultTeam])
      } else {
        setTeams(savedTeams)
      }
      
      // Set initial selected team if none is set
      const savedSelectedTeamId = await indexedDB.getSetting('selectedTeamId')
      const teamExists = savedTeams.find((t: Team) => t.id === savedSelectedTeamId)
      const initialTeamId = teamExists ? savedSelectedTeamId : savedTeams[0]?.id || "default"
      
      if (initialTeamId && !selectedTeamId) {
        setSelectedTeamId(initialTeamId)
        await indexedDB.setSetting('selectedTeamId', initialTeamId)
      }
    } catch (error) {
      console.error('Failed to load teams:', error)
      setTeams([])
    }
  }, [teamColors, isInitialized, selectedTeamId])

  // Initialize IndexedDB and load teams
  useEffect(() => {
    const initDB = async () => {
      try {
        await initializeDB()
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error)
      }
    }
    initDB()
  }, [])

  // Load teams when IndexedDB is ready
  useEffect(() => {
    if (isInitialized) {
      loadTeams()
    }
  }, [isInitialized, loadTeams])

  const createTeam = useCallback(async (name: string) => {
    if (!name.trim() || !isInitialized) return
    
    const newTeam: Team = {
      id: Date.now().toString(),
      name: name.trim(),
      color: teamColors[teams.length % teamColors.length]!,
      createdAt: new Date()
    }
    
    try {
      await indexedDB.saveTeam(newTeam)
      const updatedTeams = [...teams, newTeam]
      setTeams(updatedTeams)
    } catch (error) {
      console.error('Failed to create team:', error)
    }
  }, [teams, teamColors, isInitialized])

  const updateTeam = useCallback(async (id: string, name: string) => {
    if (!name.trim() || !isInitialized) return
    
    try {
      const updatedTeam = teams.find(team => team.id === id)
      if (!updatedTeam) return
      
      const newTeam = { ...updatedTeam, name: name.trim() }
      await indexedDB.saveTeam(newTeam)
      
      const updatedTeams = teams.map(team => 
        team.id === id ? newTeam : team
      )
      setTeams(updatedTeams)
    } catch (error) {
      console.error('Failed to update team:', error)
    }
  }, [teams, isInitialized])

  const deleteTeam = useCallback(async (id: string) => {
    if (teams.length <= 1 || !isInitialized) return // Don't allow deleting the last team
    
    try {
      // IndexedDB manager handles both team and rounds deletion
      await indexedDB.deleteTeam(id)
      
      const updatedTeams = teams.filter(team => team.id !== id)
      setTeams(updatedTeams)
      
      // If the deleted team was selected, switch to first available team
      if (selectedTeamId === id) {
        const newSelectedId = updatedTeams[0]?.id || ""
        if (newSelectedId) {
          setSelectedTeamId(newSelectedId)
          await indexedDB.setSetting('selectedTeamId', newSelectedId)
        }
      }
    } catch (error) {
      console.error('Failed to delete team:', error)
    }
  }, [teams, selectedTeamId, isInitialized])

  const handleSetSelectedTeamId = useCallback(async (id: string) => {
    setSelectedTeamId(id)
    if (isInitialized) {
      try {
        await indexedDB.setSetting('selectedTeamId', id)
      } catch (error) {
        console.error('Failed to save selected team:', error)
      }
    }
  }, [isInitialized])

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
    deleteTeam,
    isInitialized
  }

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  )
}
