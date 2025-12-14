"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { calculateActivityTimes } from '@/lib/lap-activities';
import { SharedRoundCard } from '@/components/shared-round-card';

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

export default function EmbedRoundPage() {
  const params = useParams();
  const roundId = params.id as string;
  const [roundData, setRoundData] = useState<SharedRoundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Lade Durchgang…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!roundData) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">
          Durchgang nicht gefunden
        </p>
      </div>
    );
  }

  const activities = calculateActivityTimes(
    roundData.laps.map(lap => ({
      ...lap,
      timestamp: new Date(lap.timestamp)
    }))
  );

  return (
    <div className="p-2">
      <SharedRoundCard
        roundData={roundData}
        activities={activities}
      />
    </div>
  );
}
