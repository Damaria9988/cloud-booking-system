"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Input } from "@/components/ui/input"
import { Search, Mail, Phone, User, Calendar, Trash2, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { usePolling } from "@/hooks/use-polling"
import { useSocketIO } from "@/hooks/use-socketio"
import type { SocketIOMessage } from "@/hooks/use-socketio"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AddUserDialog } from "@/components/admin/add-user-dialog"
import { toast } from "sonner"

interface Customer {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string | null
  is_student: number
  is_admin: number
  created_at: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)

  const fetchCustomers = useCallback(async (showLoading = false) => {
    try {
      // Only show loading spinner on initial load, not on polling updates
      if (showLoading) {
        setLoading(true)
      }
      const response = await fetch("/api/admin/customers")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch customers")
      }

      setCustomers(data.customers || [])
      if (showLoading) {
        setLoading(false)
      }
    } catch (err) {
      console.error("Error fetching customers:", err)
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [])

  // Handle real-time updates via Socket.IO
  const handleCustomerUpdate = useCallback((message: SocketIOMessage) => {
    if (message.type === 'profile_updated') {
      const { userId, user } = message.data
      // Update the customer in the list immediately
      setCustomers((prevCustomers) =>
        prevCustomers.map((customer) =>
          customer.id === userId
            ? {
                ...customer,
                first_name: user.firstName,
                last_name: user.lastName,
                phone: user.phone || null,
              }
            : customer
        )
      )
    } else if (message.type === 'user_created') {
      const user = message.data.user
      // Add new user to the list immediately
      setCustomers((prevCustomers) => {
        // Check if user already exists (avoid duplicates)
        const exists = prevCustomers.some(c => c.id === user.id)
        if (exists) return prevCustomers
        
        // Add new user at the beginning of the list
        return [
          {
            id: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            phone: user.phone || null,
            is_student: user.isStudent ? 1 : 0,
            is_admin: user.isAdmin ? 1 : 0,
            created_at: user.createdAt || new Date().toISOString(),
          },
          ...prevCustomers,
        ]
      })
    } else if (message.type === 'user_deleted') {
      const { userId } = message.data
      // Remove deleted user from the list
      setCustomers((prevCustomers) =>
        prevCustomers.filter((customer) => customer.id !== userId)
      )
      // Refresh user count
      fetchCustomers(false)
    }
  }, [fetchCustomers])

  // Set up Socket.IO connection for real-time customer updates
  const { subscribe, unsubscribe, isConnected } = useSocketIO({
    autoConnect: true,
    autoReconnect: true,
    onMessage: handleCustomerUpdate,
    showToastNotifications: false,
  })

  // Subscribe to admin customers channel for profile updates
  useEffect(() => {
    if (isConnected) {
      subscribe('admin:customers')
      return () => unsubscribe('admin:customers')
    }
  }, [isConnected, subscribe, unsubscribe])

  // Initial load
  useEffect(() => {
    fetchCustomers(true)
  }, [])

  // Polling every 10 seconds (customers don't change as frequently)
  // Don't show loading spinner during polls
  usePolling(() => fetchCustomers(false), { interval: 10000 })

  useEffect(() => {
    const handleRefresh = () => fetchCustomers(true)
    window.addEventListener("admin:refresh-customers", handleRefresh)
    return () => window.removeEventListener("admin:refresh-customers", handleRefresh)
  }, [])

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/customers/${customerToDelete.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user")
      }

      toast.success("User deleted successfully")
      
      // Remove from list immediately
      setCustomers((prevCustomers) =>
        prevCustomers.filter((customer) => customer.id !== customerToDelete.id)
      )
      
      // Trigger refresh event
      window.dispatchEvent(new CustomEvent("admin:refresh-customers"))
    } catch (err) {
      console.error("Error deleting user:", err)
      toast.error(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setCustomerToDelete(null)
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase()
    const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase()
    return (
      fullName.includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      (customer.phone && customer.phone.includes(query))
    )
  })

  // Format date to avoid timezone issues - extract date part only
  const formatJoinDate = (dateStr: string) => {
    try {
      // Extract date and time parts
      let dateOnly = dateStr
      let timePart = ''
      
      if (dateStr.includes('T')) {
        const parts = dateStr.split('T')
        dateOnly = parts[0]
        timePart = parts[1]?.split('.')[0] || ''
      } else if (dateStr.includes(' ')) {
        const parts = dateStr.split(' ')
        dateOnly = parts[0]
        timePart = parts[1] || ''
      }
      
      // Parse as local date (not UTC) to preserve the actual date
      const [year, month, day] = dateOnly.split('-').map(Number)
      
      // If time is late in the day (after 18:00 UTC), it's likely the next day in many timezones
      // Add 1 day to compensate for timezone conversion issues
      if (timePart) {
        const [hours] = timePart.split(':').map(Number)
        if (hours >= 18) {
          // Add 1 day, handling month/year overflow automatically
          const date = new Date(year, month - 1, day + 1)
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
          })
        }
      }
      
      const date = new Date(year, month - 1, day)
      
      // Format as M/D/YYYY
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      })
    } catch {
      // Fallback to original formatting if parsing fails
      return new Date(dateStr).toLocaleDateString('en-US')
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground mt-2">View and manage all registered customers</p>
          </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => setAddUserDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCustomers.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">
                      {searchQuery ? "No customers found matching your search." : "No customers found."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredCustomers.map((customer) => (
                  <Card key={customer.id} className="hover:shadow-lg transition-shadow rounded-lg">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(customer)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            {customer.first_name} {customer.last_name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            {customer.is_admin === 1 && (
                              <Badge variant="default" className="text-xs">Admin</Badge>
                            )}
                            {customer.is_student === 1 && (
                              <Badge variant="secondary" className="text-xs">Student</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate" title={customer.email}>{customer.email}</span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm">{customer.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm">
                              Joined {formatJoinDate(customer.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add User Dialog */}
      <AddUserDialog
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        onSuccess={() => {
          fetchCustomers(false)
          window.dispatchEvent(new CustomEvent("admin:refresh-customers"))
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the account for{" "}
              <strong>
                {customerToDelete?.first_name} {customerToDelete?.last_name}
              </strong>{" "}
              ({customerToDelete?.email})? This action cannot be undone.
              <br />
              <br />
              <span className="text-destructive font-medium">
                Note: If the user has active bookings, they must be cancelled or completed first.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

