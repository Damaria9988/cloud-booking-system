import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bus, Clock, Calendar, MapPin, Train, Plane } from "lucide-react"

interface TripDetailsProps {
  trip: {
    operator: string
    from: string
    to: string
    departureTime: string
    arrivalTime: string
    date: string
    duration: string
    type: string
    mode?: string
  }
}

export function TripDetails({ trip }: TripDetailsProps) {
  const getModeIcon = () => {
    switch (trip.mode) {
      case "train":
        return <Train className="h-6 w-6 text-primary" />
      case "flight":
        return <Plane className="h-6 w-6 text-primary" />
      default:
        return <Bus className="h-6 w-6 text-primary" />
    }
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-background to-muted/30">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border-2 border-primary/20">
              {getModeIcon()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{trip.operator}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs font-semibold">
                  {trip.type}
                </Badge>
                <Badge variant="outline" className="text-xs font-semibold capitalize">
                  {trip.mode === 'bus' && <Bus className="h-3 w-3 mr-1" />}
                  {trip.mode === 'train' && <Train className="h-3 w-3 mr-1" />}
                  {trip.mode === 'flight' && <Plane className="h-3 w-3 mr-1" />}
                  {trip.mode || "bus"} Travel
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:flex gap-6">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold">{trip.from}</div>
                <div className="text-xs text-muted-foreground">{trip.departureTime}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-accent" />
              </div>
              <div>
                <div className="font-semibold">{trip.duration}</div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold">{trip.to}</div>
                <div className="text-xs text-muted-foreground">{trip.arrivalTime}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-accent" />
              </div>
              <div>
                <div className="font-semibold">{trip.date}</div>
                <div className="text-xs text-muted-foreground">Travel Date</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
