import { Metadata } from 'next';
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

interface PageProps {
  params: {
    id: string;
  };
}

const base_url = process.env.BASE_URL || 'http://localhost:3000';
// Fetch shared round data on the server
async function fetchSharedRound(id: string): Promise<SharedRoundData | null> {
  try {
    const response = await fetch(`${base_url}/api/share-round?id=${id}`, {
      cache: 'no-store' // Always fetch fresh data
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching shared round:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const roundData = await fetchSharedRound(params.id);

  if (!roundData) {
    return {
      title: 'Durchgang nicht gefunden | Wettkämpfe Timer',
      description: 'Der angeforderte geteilte Durchgang konnte nicht gefunden werden.',
    };
  }

  const title = `${roundData.teamName} - Geteilter Durchgang | Wettkämpfe Timer`;
  const description = roundData.description ?? `Geteilter Durchgang von ${roundData.teamName}`;
  const url = `${base_url}/shared/${params.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      types: {
        'application/json+oembed': `${base_url}/api/oembed?url=${encodeURIComponent(url)}&format=json`,
      },
    },
  };
}

export default async function SharedRoundPage({ params }: PageProps) {
  const roundData = await fetchSharedRound(params.id);

  if (!roundData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Durchgang nicht gefunden</h1>
          <p className="text-muted-foreground">
            Der angeforderte geteilte Durchgang konnte nicht gefunden werden.
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

  return (
    <div className="flex items-start justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Geteilter Durchgang</h1>
          <p className="text-muted-foreground">
            Dieser Durchgang wurde von einem anderen Nutzer geteilt
          </p>
        </div>

        <SharedRoundCard
          roundData={roundData}
          activities={activities}
        />
      </div>
    </div>
  );
}
