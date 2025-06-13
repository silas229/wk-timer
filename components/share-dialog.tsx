import { useState, useEffect } from 'react';
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
import { formatTime } from '@/lib/lap-activities';

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  round: SavedRound;
  onShare: (description: string) => Promise<string | null>;
}

export function ShareDialog({ isOpen, onOpenChange, round, onShare }: ShareDialogProps) {
  const [description, setDescription] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [sharedUrl, setSharedUrl] = useState<string | null>(round.sharedUrl || null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [canUseNativeShare, setCanUseNativeShare] = useState(false);

  // Check if native sharing is supported
  useEffect(() => {
    setCanUseNativeShare(
      typeof navigator !== 'undefined' &&
      'share' in navigator &&
      typeof navigator.share === 'function'
    );
  }, []);

  // Initialize dialog state when round changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setSharedUrl(round.sharedUrl || null);
      setDescription(round.description || '');
    }
  }, [isOpen, round.sharedUrl, round.description]);

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
    const urlToCopy = sharedUrl || round.sharedUrl;
    if (urlToCopy) {
      try {
        await navigator.clipboard.writeText(urlToCopy);
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const handleNativeShare = async () => {
    const urlToShare = sharedUrl || round.sharedUrl;
    if (!urlToShare || !canUseNativeShare) return;

    try {
      await navigator.share({
        title: `Durchgang von ${round.teamName}`,
        url: urlToShare,
      });
    } catch (error) {
      // User cancelled or error occurred
      console.log('Native share cancelled or failed:', error);
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
            {round.sharedUrl ? 'Geteilter Durchgang' : 'Durchgang teilen'}
          </DialogTitle>
          <DialogDescription>
            {round.sharedUrl
              ? 'Dieser Durchgang wurde bereits geteilt. Kopiere den Link und teile ihn mit anderen.'
              : 'Teile diesen Durchgang mit anderen. Der Link wird öffentlich zugänglich sein.'
            }
          </DialogDescription>
        </DialogHeader>

        {!sharedUrl && !round.sharedUrl ? (
          <>
            <div className="space-y-3">
              <div className="grid w-full max-w-sm items-center gap-3">
                <Label htmlFor="description">Beschreibung (optional)</Label>
                <Input
                  id="description"
                  placeholder="Beschreibe diesen Durchgang..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {description.length}/200 Zeichen
                </p>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium">{round.teamName}</p>
                <p className="text-xs text-muted-foreground">
                  Zeit: {formatTime(round.totalTime)}
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

              {(round.description || description) && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">Beschreibung:</p>
                  <p className="text-sm">{round.description || description}</p>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Input
                  value={sharedUrl || round.sharedUrl || ''}
                  readOnly
                  className="font-mono text-xs"
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

                {/* Native Share Button - only show if supported */}
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
