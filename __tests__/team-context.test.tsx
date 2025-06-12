import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { TeamProvider, useTeam } from '@/components/team-context'

// Mock the indexedDB module
vi.mock('@/lib/indexeddb', () => ({
  indexedDB: {
    getAllTeams: vi.fn(() => Promise.resolve([])),
    saveTeam: vi.fn(() => Promise.resolve()),
    updateTeam: vi.fn(() => Promise.resolve()),
    deleteTeam: vi.fn(() => Promise.resolve()),
    getSetting: vi.fn(() => Promise.resolve(null)),
    saveSetting: vi.fn(() => Promise.resolve()),
    setSetting: vi.fn(() => Promise.resolve()),
  },
  initializeDB: vi.fn(() => Promise.resolve()),
}))

// Test component that uses the team context
function TestComponent() {
  const { teams, selectedTeamId, isInitialized, getCurrentTeam } = useTeam()

  return (
    <div>
      <div data-testid="initialized">{isInitialized ? 'true' : 'false'}</div>
      <div data-testid="teams-count">{teams.length}</div>
      <div data-testid="selected-team">{selectedTeamId}</div>
      <div data-testid="current-team">{getCurrentTeam()?.name || 'none'}</div>
    </div>
  )
}

describe('TeamProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide initial state', async () => {
    render(
      <TeamProvider>
        <TestComponent />
      </TeamProvider>
    )

    // Initially should not be initialized
    expect(screen.getByTestId('initialized')).toHaveTextContent('false')
    expect(screen.getByTestId('teams-count')).toHaveTextContent('0')
    expect(screen.getByTestId('selected-team')).toHaveTextContent('')
    expect(screen.getByTestId('current-team')).toHaveTextContent('none')

    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('true')
    })
  })

  it('should throw error when useTeam is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTeam must be used within a TeamProvider')

    consoleSpy.mockRestore()
  })

  it('should initialize correctly', async () => {
    const { initializeDB } = await import('@/lib/indexeddb')

    render(
      <TeamProvider>
        <TestComponent />
      </TeamProvider>
    )

    // Wait for initialization
    await waitFor(() => {
      expect(initializeDB).toHaveBeenCalledOnce()
      expect(screen.getByTestId('initialized')).toHaveTextContent('true')
    })
  })
})

describe('Team Context Functionality', () => {
  const mockTeam = {
    id: 'team-1',
    name: 'Test Team',
    color: '#ff0000',
    createdAt: new Date('2024-01-01'),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle team selection', async () => {
    const { indexedDB } = await import('@/lib/indexeddb')
    vi.mocked(indexedDB.getAllTeams).mockResolvedValue([mockTeam])

    function TestTeamSelection() {
      const { teams, selectedTeamId, setSelectedTeamId, getCurrentTeam } = useTeam()

      return (
        <div>
          <div data-testid="teams-count">{teams.length}</div>
          <button
            onClick={() => setSelectedTeamId('team-1')}
            data-testid="select-team"
          >
            Select Team
          </button>
          <div data-testid="selected-team">{selectedTeamId}</div>
          <div data-testid="current-team-name">{getCurrentTeam()?.name || 'none'}</div>
        </div>
      )
    }

    render(
      <TeamProvider>
        <TestTeamSelection />
      </TeamProvider>
    )

    // Wait for initialization first
    await waitFor(() => {
      expect(screen.getByTestId('teams-count')).toHaveTextContent('1')
    })

    // Click to select team
    const selectButton = screen.getByTestId('select-team')
    fireEvent.click(selectButton)

    // Wait for state update
    await waitFor(() => {
      expect(screen.getByTestId('selected-team')).toHaveTextContent('team-1')
    })
  })
})
