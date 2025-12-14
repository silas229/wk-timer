import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateProps {
  isInitialized: boolean
}

export function LoadingState({ isInitialized }: LoadingStateProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {!isInitialized ? 'Lade Datenbank…' : 'Lade Durchgänge…'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
