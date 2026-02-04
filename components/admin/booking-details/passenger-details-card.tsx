/**
 * Passenger Details Card Component
 * Displays list of passengers with their information
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"

interface Passenger {
  firstName: string
  lastName: string
  age: number
  gender: string
  seatNumber: string
  passengerType?: string
}

interface PassengerDetailsCardProps {
  passengers: Passenger[]
}

export function PassengerDetailsCard({ passengers }: PassengerDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Passenger Details ({passengers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {passengers && passengers.length > 0 ? (
          <div className="space-y-4">
            {passengers.map((passenger, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-border bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {passenger.firstName} {passenger.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Passenger {index + 1}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3 mt-3 ml-13">
                      <div>
                        <p className="text-xs text-muted-foreground">Age</p>
                        <p className="font-medium">{passenger.age} years</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Gender</p>
                        <p className="font-medium capitalize">{passenger.gender}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Seat</p>
                        <Badge variant="outline" className="font-mono font-bold">
                          {passenger.seatNumber}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No passenger details available</p>
        )}
      </CardContent>
    </Card>
  )
}
