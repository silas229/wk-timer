import { Metadata } from 'next';
import { calculateActivityTimes } from '@/lib/lap-activities';
import { SharedRoundCard } from '@/components/shared-round-card';
import { SharedRoundData } from '@/lib/round-storage';
import { getRoundStorage } from '@/lib/round-storage-factory';
import { getBaseUrl } from '@/lib/base-url';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Fetch shared round data directly from storage
async function fetchSharedRound(id: string): Promise<SharedRoundData | null> {
  try {
    const storage = getRoundStorage();
    return await storage.retrieve(id);
  } catch (error) {
    console.error('Error fetching shared round:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const roundData = await fetchSharedRound(id);

  if (!roundData) {
    return {
      title: 'Durchgang nicht gefunden | Wettkämpfe Timer',
      description: 'Der angeforderte geteilte Durchgang konnte nicht gefunden werden.',
    };
  }

  const title = `${roundData.teamName} - Geteilter Durchgang | Wettkämpfe Timer`;
  const description = roundData.description ?? `Geteilter Durchgang von ${roundData.teamName}`;
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/shared/${id}`;

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
        'application/json+oembed': `${baseUrl}/api/oembed?url=${encodeURIComponent(url)}&format=json`,
      },
    },
  };
}

export default async function SharedRoundPage({ params }: PageProps) {
  const { id } = await params;
  const roundData = await fetchSharedRound(id);

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
          <h1 className="text-2xl font-bold mb-2">Geteilter Durchgang{roundData.teamName ? ` von ${roundData.teamName}` : ''}</h1>
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
