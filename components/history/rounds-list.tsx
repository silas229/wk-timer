import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { RoundCard } from "./round-card"
import { compareRounds } from "@/lib/lap-activities"
import type { SavedRound } from "@/lib/indexeddb"
import type { RoundComparison } from "@/lib/lap-activities"

interface Team {
  id: string
  name: string
  color: string
  createdAt: Date
}

interface RoundsListProps {
  filteredRounds: SavedRound[]
  savedRounds: SavedRound[]
  teams: Team[]
  onDeleteRound: (roundId: string) => void
  onShareRound?: (round: SavedRound) => void
}

export function RoundsList({
  filteredRounds,
  savedRounds,
  teams,
  onDeleteRound,
  onShareRound
}: RoundsListProps) {
  const formatDayHeader = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'full'
    }).format(date)
  }

  const getPreviousTeamComparison = (currentRound: SavedRound): RoundComparison | null => {
    // Find all rounds completed before this round for the same team
    const previousRounds = savedRounds
      .filter(round =>
        round.teamId === currentRound.teamId &&
        round.completedAt.getTime() < currentRound.completedAt.getTime()
      )
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())

    const previousRound = previousRounds[0] || null

    return compareRounds(currentRound, previousRound)
  }

  // Group rounds by day
  const groupedRounds = () => {
    const groups: { [key: string]: SavedRound[] } = {}

    filteredRounds.forEach(round => {
      const dateKey = round.completedAt.toDateString()
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey]!.push(round)
    })

    // Sort each group by time (newest first)
    Object.keys(groups).forEach(dateKey => {
      groups[dateKey]!.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
    })

    // Sort groups by date (newest first)
    const sortedGroups = Object.entries(groups).sort(([a], [b]) =>
      new Date(b).getTime() - new Date(a).getTime()
    )

    return sortedGroups
  }
  return (
    <Accordion
      type="multiple"
      defaultValue={(() => {
        const groups = groupedRounds()
        return groups.length > 0 && groups[0]?.[0] ? [groups[0][0]] : []
      })()}
      className="space-y-4"
    >
      {groupedRounds().map(([dateKey, roundsForDay]) => (
        <AccordionItem key={dateKey} value={dateKey} className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="text-left">
              <h3 className="text-lg font-semibold">
                {formatDayHeader(new Date(dateKey))}
              </h3>
              <p className="text-sm text-muted-foreground">
                {roundsForDay.length} {roundsForDay.length === 1 ? 'Durchgang' : 'Durchgänge'}
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3 pt-2">
              {roundsForDay.map((round) => {
                const previousComparison = getPreviousTeamComparison(round)
                return (
                  <RoundCard
                    key={round.id}
                    round={round}
                    comparison={previousComparison}
                    teams={teams}
                    onDeleteRound={onDeleteRound}
                    onShareRound={onShareRound}
                  />
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
