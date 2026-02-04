"use client"

import { useState } from "react"
import { Plus, Search, Loader2, Filter } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { AddScheduleDialog } from "@/components/admin/add-schedule-dialog"
import { EditScheduleDialog } from "@/components/admin/edit-schedule-dialog"
import { ScheduleGroupCard, ScheduleDialogs, useSchedules } from "@/components/admin/schedules"
import { toast } from "sonner"

export default function ManageSchedulesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null)
  const [showNext30Days, setShowNext30Days] = useState(true)
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  // Error dialog state
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")

  // Use custom hook for schedule data
  const {
    groupedSchedules,
    loading,
    expandedRoutes,
    toggleRoute,
    fetchSchedules,
  } = useSchedules({ showNext30Days })

  const handleEdit = (schedule: any) => {
    setSelectedSchedule(schedule)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (schedule: any) => {
    setScheduleToDelete(schedule)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!scheduleToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/schedules/${scheduleToDelete.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete schedule")
      }

      toast.success("Schedule deleted successfully")
      fetchSchedules(true)
      window.dispatchEvent(new CustomEvent("admin:refresh-stats"))
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete schedule"
      setErrorMessage(errorMsg)
      setErrorDialogOpen(true)
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setScheduleToDelete(null)
    }
  }

  // Filter groups by search query
  const filteredGroups = groupedSchedules.filter((group) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const routeName = `${group.fromCity} → ${group.toCity}`.toLowerCase()
    return routeName.includes(query) || group.operatorName?.toLowerCase().includes(query)
  })

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 flex flex-col p-6 lg:p-8 overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 pb-4">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold text-balance">Manage Schedules</h1>
                <p className="text-muted-foreground">Create and manage departure schedules</p>
              </div>
              <Button className="gap-2" size="lg" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Schedule
              </Button>
              <AddScheduleDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSuccess={() => {
                  window.dispatchEvent(new CustomEvent("admin:refresh-schedules"))
                  window.dispatchEvent(new CustomEvent("admin:refresh-stats"))
                }}
              />
              <EditScheduleDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                schedule={selectedSchedule}
                onSuccess={() => {
                  fetchSchedules(true)
                  setIsEditDialogOpen(false)
                  setSelectedSchedule(null)
                }}
              />
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search schedules by route or operator..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={showNext30Days ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowNext30Days(!showNext30Days)}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      {showNext30Days ? "Next 30 Days" : "All Dates"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-8 pb-6">
          <div className="max-w-7xl mx-auto space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGroups.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <p className="text-muted-foreground">
                        {showNext30Days 
                          ? "No schedules found for the next 30 days. Create your first schedule above." 
                          : "No schedules found. Create your first schedule above."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredGroups.map((group) => (
                    <ScheduleGroupCard
                      key={group.key}
                      group={group}
                      isExpanded={expandedRoutes.has(group.key)}
                      onToggle={() => toggleRoute(group.key)}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <ScheduleDialogs
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        scheduleToDelete={scheduleToDelete}
        deleting={deleting}
        onDeleteConfirm={handleDeleteConfirm}
        errorDialogOpen={errorDialogOpen}
        setErrorDialogOpen={setErrorDialogOpen}
        errorMessage={errorMessage}
      />
    </div>
  )
}
