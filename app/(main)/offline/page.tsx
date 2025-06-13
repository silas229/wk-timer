import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WifiOff } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <WifiOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">Offline</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Sie sind momentan offline. Die App funktioniert weiterhin für Timer-Funktionen.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <div className="h-2 w-2 bg-green-600 rounded-full" />
                Timer funktionen verfügbar
              </div>
              <div className="flex items-center justify-center gap-2 text-green-600">
                <div className="h-2 w-2 bg-green-600 rounded-full" />
                Lokale Datenspeicherung aktiv
              </div>
              <div className="flex items-center justify-center gap-2 text-amber-600">
                <div className="h-2 w-2 bg-amber-600 rounded-full" />
                Synchronisation pausiert
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Ihre Daten werden automatisch synchronisiert, sobald Sie wieder online sind.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
