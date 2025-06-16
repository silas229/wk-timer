"use client"

import { useState, useEffect, useCallback } from "react"
import { Share2, Edit3, Copy, Check, Loader2Icon, BadgeInfo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorPointsInput } from "@/components/ui/error-points-input"
import { useTeam } from "@/components/team-context"
import { calculateTotalScore, formatPoints, calculateTargetTimeMs, type ScoringParameters } from "@/lib/scoring"
import { formatTime } from "@/lib/lap-activities"
import type { SavedRound } from "@/lib/indexeddb"

interface RoundDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  round: SavedRound | null
  onUpdateRound: (roundId: string, updatedRound: Partial<SavedRound>) => Promise<void>
  onShareRound: (round: SavedRound, description: string) => Promise<string | null>
}

export function RoundDetailsDialog({
  open,
  onOpenChange,
  round,
  onUpdateRound,
  onShareRound
}: RoundDetailsDialogProps) {
  const { getCurrentTeam } = useTeam()

  // Form state
  const [description, setDescription] = useState("")
  const [aPartErrorPoints, setAPartErrorPoints] = useState("")
  const [knotTime, setKnotTime] = useState("")
  const [aPartPenaltySeconds, setAPartPenaltySeconds] = useState("")
  const [bPartErrorPoints, setBPartErrorPoints] = useState("")
  const [overallImpression, setOverallImpression] = useState("")

  // UI state
  const [isSharing, setIsSharing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)
  const [canUseNativeShare, setCanUseNativeShare] = useState(false)

  // Check if native sharing is supported
  useEffect(() => {
    setCanUseNativeShare(
      typeof navigator !== 'undefined' &&
      'share' in navigator &&
      typeof navigator.share === 'function'
    );
  }, []);

  // Initialize form when round changes
  useEffect(() => {
    if (!round) return

    setDescription(round.description || "")
    setAPartErrorPoints(round.aPartErrorPoints?.toString() || "")
    setKnotTime(round.knotTime?.toString() || "")
    setAPartPenaltySeconds(round.aPartPenaltySeconds?.toString() || "0")
    setBPartErrorPoints(round.bPartErrorPoints?.toString() || "")
    setOverallImpression(round.overallImpression?.toFixed(1) || "1.0")
    setHasUnsavedChanges(false)
  }, [round])

  // Track changes
  useEffect(() => {
    if (!round) return

    const hasChanges =
      description !== (round.description || "") ||
      aPartErrorPoints !== (round.aPartErrorPoints?.toString() || "") ||
      knotTime !== (round.knotTime?.toString() || "") ||
      aPartPenaltySeconds !== (round.aPartPenaltySeconds?.toString() || "0") ||
      bPartErrorPoints !== (round.bPartErrorPoints?.toString() || "") ||
      overallImpression !== (round.overallImpression?.toFixed(1) || "1.0")

    setHasUnsavedChanges(hasChanges)
  }, [round, description, aPartErrorPoints, knotTime, aPartPenaltySeconds, bPartErrorPoints, overallImpression])

  const handleSave = useCallback(async () => {
    if (!round) return

    setIsSaving(true)
    try {
      const updatedData: Partial<SavedRound> = {
        description: description.trim() || undefined,
        aPartErrorPoints: aPartErrorPoints ? parseFloat(aPartErrorPoints) : undefined,
        knotTime: knotTime ? parseFloat(knotTime) : undefined,
        aPartPenaltySeconds: aPartPenaltySeconds ? parseFloat(aPartPenaltySeconds) : undefined,
        bPartErrorPoints: bPartErrorPoints ? parseFloat(bPartErrorPoints) : undefined,
        overallImpression: overallImpression ? parseFloat(overallImpression) : undefined,
      }

      await onUpdateRound(round.id, updatedData)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error saving round:', error)
    } finally {
      setIsSaving(false)
    }
  }, [round, description, aPartErrorPoints, knotTime, aPartPenaltySeconds, bPartErrorPoints, overallImpression, onUpdateRound])

  const handleShare = useCallback(async () => {
    if (!round) return

    // Confirmation for first-time sharing
    if (!round.sharedUrl) {
      const confirmShare = window.confirm(
        "Nach dem Teilen können die Daten nicht mehr geändert werden.\n\nBist du sicher, dass alle Werte korrekt sind und du den Durchgang teilen möchtest?"
      )
      if (!confirmShare) return
    }

    // Save first if there are unsaved changes
    if (hasUnsavedChanges) {
      await handleSave()
    }

    setIsSharing(true)
    try {
      await onShareRound(round, description)
      // Link wird automatisch über round.sharedUrl angezeigt
    } catch (error) {
      console.error('Error sharing round:', error)
    } finally {
      setIsSharing(false)
    }
  }, [round, hasUnsavedChanges, handleSave, onShareRound, description])

  const handleCopyUrl = useCallback(async () => {
    const urlToCopy = round?.sharedUrl
    if (urlToCopy) {
      try {
        await navigator.clipboard.writeText(urlToCopy)
        setCopiedToClipboard(true)
        setTimeout(() => setCopiedToClipboard(false), 2000)
      } catch (error) {
        console.error('Error copying to clipboard:', error)
      }
    }
  }, [round?.sharedUrl])

  const handleNativeShare = useCallback(async () => {
    const urlToShare = round?.sharedUrl
    if (!urlToShare || !canUseNativeShare || !round) return

    try {
      await navigator.share({
        title: `Durchgang von ${round.teamName}`,
        url: urlToShare,
      })
    } catch (error) {
      // User cancelled or error occurred
      console.log('Native share cancelled or failed:', error)
    }
  }, [round, canUseNativeShare])

  if (!round) return null

  const currentTeam = getCurrentTeam()
  const teamAverageAge = currentTeam?.averageAge

  // Calculate scoring
  const scoringParams: ScoringParameters = {
    teamAverageAge,
    aPartErrorPoints: aPartErrorPoints ? parseFloat(aPartErrorPoints) : undefined,
    knotTime: knotTime ? parseFloat(knotTime) : undefined,
    aPartPenaltySeconds: aPartPenaltySeconds ? parseFloat(aPartPenaltySeconds) : undefined,
    bPartTime: round.totalTime,
    bPartErrorPoints: bPartErrorPoints ? parseFloat(bPartErrorPoints) : undefined,
    overallImpression: overallImpression ? parseFloat(overallImpression) : undefined,
  }

  const scoringResult = calculateTotalScore(scoringParams)
  const isShared = !!round.sharedUrl
  const canEdit = !isShared

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeInfo className="h-5 w-5" />
            Durchgangsdetails - {round.teamName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <Label className="text-sm font-medium">Datum</Label>
            <div className="text-sm text-muted-foreground">
              {round.completedAt.toLocaleDateString('de-DE')} {round.completedAt.toLocaleTimeString('de-DE')}
            </div>
          </div>

          {/* Team Info */}
          {!teamAverageAge && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ Durchschnittsalter des Teams fehlt. Für die Punkteberechnung im B-Teil ist das Durchschnittsalter erforderlich.
              </p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional: Beschreibung für Durchgang"
              autoComplete="off"
              disabled={!canEdit}
            />
          </div>

          {/* A-Teil (Knoten) */}
          <div className="space-y-4">
            <h3 className="font-semibold">A-Teil (Knoten)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ErrorPointsInput
                id="aPartErrorPoints"
                label="Fehlerpunkte A-Teil"
                value={aPartErrorPoints}
                onChange={setAPartErrorPoints}
                disabled={!canEdit}
                className="md:col-span-2"
              />
              <div className="space-y-2">
                <Label htmlFor="knotTime">Knotenzeit (Sekunden)</Label>
                <Input
                  id="knotTime"
                  type="number"
                  min="0"
                  step="1"
                  value={knotTime}
                  onChange={(e) => setKnotTime(e.target.value)}
                  placeholder="0"
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aPartPenaltySeconds">Strafsekunden Zeitüberschreitung</Label>
                <Input
                  id="aPartPenaltySeconds"
                  type="number"
                  min="0"
                  step="1"
                  value={aPartPenaltySeconds}
                  onChange={(e) => setAPartPenaltySeconds(e.target.value)}
                  placeholder="0"
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>

          {/* B-Teil (Staffellauf) */}
          <div className="space-y-4">
            <h3 className="font-semibold">B-Teil (Staffellauf)</h3>

            {/* Sollzeit-Anzeige */}
            {teamAverageAge && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Sollzeit:</span> {formatTime(calculateTargetTimeMs(teamAverageAge)!)}
                  </div>
                  <div>
                    <span className="font-medium">Ist-Zeit:</span> {formatTime(round.totalTime)}
                    <span className={`ml-2 ${round.totalTime <= calculateTargetTimeMs(teamAverageAge)! ? 'text-green-600' : 'text-red-600'}`}>
                      ({round.totalTime <= calculateTargetTimeMs(teamAverageAge)! ? '-' : '+'}{Math.abs(Math.round((round.totalTime - calculateTargetTimeMs(teamAverageAge)!) / 1000))}s)
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ErrorPointsInput
                id="bPartErrorPoints"
                label="Fehlerpunkte B-Teil"
                value={bPartErrorPoints}
                onChange={setBPartErrorPoints}
                disabled={!canEdit}
                className="md:col-span-2"
              />
              <div className="space-y-2">
                <Label htmlFor="overallImpression">Gesamteindruck (A- und B-Teil)</Label>
                <Input
                  id="overallImpression"
                  type="number"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  value={overallImpression}
                  onChange={(e) => setOverallImpression(e.target.value)}
                  placeholder="1,0"
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>

          {/* Scoring Results */}
          {scoringResult.canCalculate && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-3">
              <h3 className="font-semibold text-green-800">Punkteberechnung</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">A-Teil</div>
                  <div className="text-lg font-mono">{formatPoints(scoringResult.aPartPoints)} Punkte</div>
                </div>
                <div>
                  <div className="font-medium">B-Teil</div>
                  <div className="text-lg font-mono">{formatPoints(scoringResult.bPartPoints)} Punkte</div>
                </div>
                <div>
                  <div className="font-medium">Gesamteindruck</div>
                  <div className="text-lg font-mono">{formatPoints(scoringResult.overallImpression)}</div>
                </div>
                <div className="col-span-3 text-center">
                  <div className="font-medium">Gesamt</div>
                  <div className="text-xl font-mono font-bold text-green-700">
                    {formatPoints(scoringResult.totalPoints)} Punkte
                  </div>
                </div>
              </div>
            </div>
          )}

          {!scoringResult.canCalculate && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-600">
                💡 Für eine vollständige Punkteberechnung müssen alle Felder ausgefüllt werden.
              </p>
            </div>
          )}

          {/* Warning before sharing */}
          {!isShared && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Wichtig:</strong> Nach dem Teilen können die Daten nicht mehr geändert werden. Bitte stelle sicher, dass alle Werte korrekt sind, bevor du den Durchgang teilst.
              </p>
            </div>
          )}

          {isShared && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                ℹ️ Dieser Durchgang wurde bereits geteilt. Die Werte können nicht mehr bearbeitet werden.
              </p>
            </div>
          )}

          {/* Share Section */}
          {round.sharedUrl && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">Geteilter Link</h3>

              {round.description && (
                <div className="p-3 bg-white rounded border">
                  <p className="text-sm font-medium text-gray-700">Beschreibung:</p>
                  <p className="text-sm text-gray-600">{round.description}</p>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Input
                  value={round.sharedUrl}
                  readOnly
                  className="font-mono text-xs bg-white"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyUrl}
                  className="shrink-0"
                  title="Link kopieren"
                >
                  {copiedToClipboard ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>

                {canUseNativeShare && (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleNativeShare}
                    className="shrink-0"
                    title="Mit anderen Apps teilen"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {copiedToClipboard && (
                <p className="text-xs text-green-600">
                  Link wurde in die Zwischenablage kopiert!
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {canEdit && (
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              variant="outline"
            >
              {isSaving ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <Edit3 />
              )}
              Speichern
            </Button>
          )}

          {!isShared && (
            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSharing ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <Share2 />
              )}
              Teilen
            </Button>
          )}

          <Button onClick={() => onOpenChange(false)} variant="ghost">
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
