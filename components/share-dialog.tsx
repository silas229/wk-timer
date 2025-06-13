import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SavedRound } from '@/lib/indexeddb';

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  round: SavedRound;
  onShare: (description: string) => Promise<string | null>;
}

export function ShareDialog({ isOpen, onOpenChange, round, onShare }: ShareDialogProps) {
  const [description, setDescription] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const url = await onShare(description);
      if (url) {
        setSharedUrl(url);
      }
    } catch (error) {
      console.error('Error sharing round:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyUrl = async () => {
    if (sharedUrl) {
      try {
        await navigator.clipboard.writeText(sharedUrl);
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const handleClose = () => {
    setDescription('');
    setSharedUrl(null);
    setCopiedToClipboard(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Runde teilen
          </DialogTitle>
          <DialogDescription>
            Teilen Sie diese Runde mit anderen. Der Link wird öffentlich zugänglich sein.
          </DialogDescription>
        </DialogHeader>

        {!sharedUrl ? (
          <>
            <div className="space-y-3">
              <div>
                <Label htmlFor="description">Beschreibung (optional)</Label>
                <Input
                  id="description"
                  placeholder="Beschreiben Sie diese Runde..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {description.length}/200 Zeichen
                </p>
              </div>
              
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium">{round.teamName}</p>
                <p className="text-xs text-muted-foreground">
                  Zeit: {Math.floor(round.totalTime / 60000)}:{String(Math.floor((round.totalTime % 60000) / 1000)).padStart(2, '0')}.{String(Math.floor((round.totalTime % 1000) / 10)).padStart(2, '0')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {round.completedAt.toLocaleDateString('de-DE')} um {round.completedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Abbrechen
              </Button>
              <Button onClick={handleShare} disabled={isSharing}>
                {isSharing ? 'Wird geteilt...' : 'Teilen'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <Label>Geteilte Runde</Label>
                <p className="text-sm text-muted-foreground">
                  Ihre Runde wurde erfolgreich geteilt! Kopieren Sie den Link und teilen Sie ihn mit anderen.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Input
                  value={sharedUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyUrl}
                  className="shrink-0"
                >
                  {copiedToClipboard ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {copiedToClipboard && (
                <p className="text-xs text-green-600">
                  Link wurde in die Zwischenablage kopiert!
                </p>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>
                Schließen
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
