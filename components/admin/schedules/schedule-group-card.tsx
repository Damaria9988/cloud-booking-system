"use client"

import { Edit, Trash2, Calendar, Clock, Users, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ScheduleGroup {
  key: string
  routeId: number
  fromCity: string
  toCity: string
  operatorName: string
  vehicleType: string
  fromState: string
  toState: string
  schedules: any[]
}

interface ScheduleGroupCardProps {
  group: ScheduleGroup
  isExpanded: boolean
  onToggle: () => void
  onEdit: (schedule: any) => void
  onDelete: (schedule: any) => void
}

export function ScheduleGroupCard({
  group,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: ScheduleGroupCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Route Header - Clickable to expand/collapse */}
        <div 
          className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={onToggle}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">
                    {group.fromCity}, {group.fromState} → {group.toCity}, {group.toState}
                  </h3>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    {group.vehicleType}
                  </span>
                </div>
                <p className="text-lg text-muted-foreground mt-1">{group.operatorName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {group.schedules.length} schedule{group.schedules.length !== 1 ? 's' : ''} • 
                  {isExpanded ? ' Click to collapse' : ' Click to expand'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Schedules List - Collapsible */}
        {isExpanded && (
          <div className="border-t border-border">
            {group.schedules.map((schedule) => (
              <div key={schedule.id} className="p-6 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          schedule.is_cancelled === 1
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        }`}
                      >
                        {schedule.is_cancelled === 1 ? "Cancelled" : "Active"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {schedule.route_departure_time} - {schedule.route_arrival_time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {new Date(schedule.travel_date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {schedule.available_seats} available seats
                          {schedule.booked_seats !== undefined && (
                            <span className="text-muted-foreground"> ({schedule.booked_seats} booked)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(schedule)
                      }}
                      disabled={schedule.is_cancelled === 1}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="text-destructive bg-transparent hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(schedule)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
