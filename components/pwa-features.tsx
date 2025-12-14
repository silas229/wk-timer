'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Smartphone,
  Download,
  Wifi,
  Clock,
  X,
  ChevronRight
} from 'lucide-react'
import { usePWA } from '@/hooks/use-pwa'

export function PWAFeatures() {
  const [isOpen, setIsOpen] = useState(false)
  const { isInstalled, canInstall } = usePWA()

  if (isInstalled) return null

  const features = [
    {
      id: "app-experience",
      icon: <Smartphone className="h-5 w-5" />,
      title: "App-ähnliche Erfahrung",
      description: "Funktioniert wie eine native App auf Ihrem Gerät"
    },
    {
      id: "offline",
      icon: <Wifi className="h-5 w-5" />,
      title: "Offline-Funktionalität",
      description: "Timer funktioniert auch ohne Internetverbindung"
    },
    {
      id: "quick-start",
      icon: <Clock className="h-5 w-5" />,
      title: "Schneller Start",
      description: "Direkter Zugriff vom Homescreen"
    },
    {
      id: "no-app-store",
      icon: <Download className="h-5 w-5" />,
      title: "Kein App Store nötig",
      description: "Installation direkt über den Browser"
    }
  ]

  return (
    <>
      {!isOpen && canInstall && (
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="fixed bottom-20 right-4 z-40 rounded-full p-3 shadow-lg"
          size="sm"
        >
          <Download className="h-4 w-4" />
        </Button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">PWA Features</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Installiere Wettkämpfe Timer als Progressive Web App für die beste Erfahrung:
              </p>

              <div className="space-y-3">
                {features.map((feature) => (
                  <div key={feature.id} className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {canInstall && (
                <div className="pt-4 border-t">
                  <div className="text-xs text-muted-foreground mb-2">
                    So kann die App installiert werden:
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-3 w-3" />
                      Tippe auf "Installieren" wenn die Aufforderung erscheint
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-3 w-3" />
                      Oder nutze das Browser-Menü (⋮) → "Zum Startbildschirm hinzufügen"
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={() => setIsOpen(false)}
                className="w-full"
              >
                Verstanden
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
