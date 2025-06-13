"use client"

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Check } from 'lucide-react';
import { calculateActivityTimes, formatTime } from '@/lib/lap-activities';
import { ActivityList } from '@/components/history/activity-list';

interface SharedRoundData {
  id: string; // UUID that serves as both local and shareable ID
  completedAt: string;
  totalTime: number;
  laps: Array<{
    lapNumber: number;
    time: number;
    timestamp: string;
  }>;
  teamName: string;
  description?: string;
}

export default function SharedRoundPage() {
  const params = useParams();
  const roundId = params.id as string;
  const [roundData, setRoundData] = useState<SharedRoundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  useEffect(() => {
    const fetchSharedRound = async () => {
      try {
        const response = await fetch(`/api/share-round?id=${roundId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Diese geteilte Runde wurde nicht gefunden.');
          } else {
            setError('Fehler beim Laden der geteilten Runde.');
          }
          return;
        }

        const data = await response.json();
        setRoundData(data);
      } catch (err) {
        console.error('Error fetching shared round:', err);
        setError('Fehler beim Laden der geteilten Runde.');
      } finally {
        setLoading(false);
      }
    };

    if (roundId) {
      fetchSharedRound();
    }
  }, [roundId]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <p className="text-lg">Lade geteilte Runde...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Fehler</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!roundData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Runde nicht gefunden</h1>
          <p className="text-muted-foreground">
            Die angeforderte geteilte Runde konnte nicht gefunden werden.
          </p>
        </div>
      </div>
    );
  }

  const activities = calculateActivityTimes(
    roundData.laps.map(lap => ({
      ...lap,
      timestamp: new Date(lap.timestamp)
    }))
  );

  const completedAt = new Date(roundData.completedAt);

  return (
    <div className="flex items-start justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Geteilte Runde</h1>
          <p className="text-muted-foreground">
            Diese Runde wurde von einem anderen Nutzer geteilt
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="w-full">
                <div className="flex items-center gap-3 mb-1">
                  <CardTitle className="text-lg">
                    {roundData.teamName} • {completedAt.toLocaleDateString('de-DE')}
                    <Button
                      onClick={handleCopyUrl}
                      variant="ghost"
                      size="icon"
                      className="ml-2 float-right text-muted-foreground hover:text-foreground"
                    >
                      {copiedToClipboard ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Share2 className="h-4 w-4" />
                      )}
                      <span className="sr-only">Link kopieren</span>
                    </Button>
                  </CardTitle>
                </div>
                <span className="font-mono text-xl font-bold">{formatTime(roundData.totalTime, 'full')}</span>
                {roundData.description && (
                  <p className="text-sm mt-2 p-2 bg-muted rounded">
                    {roundData.description}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ActivityList
              activities={activities}
              comparison={null}
              layout="single-column"
            />
          </CardContent>
        </Card>

        {copiedToClipboard && (
          <p className="text-center text-sm text-green-600">
            Link wurde in die Zwischenablage kopiert!
          </p>
        )}
      </div>
    </div>
  );
}
