"use client"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Building2, Mail, Phone, Star, Loader2 } from "lucide-react"
import { toast } from "sonner"
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

interface Operator {
  id: number
  name: string
  email: string | null
  phone: string | null
  rating: number
  total_reviews: number
  created_at: string
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [operatorToDelete, setOperatorToDelete] = useState<Operator | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchOperators = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      const response = await fetch("/api/admin/operators")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch operators")
      }

      setOperators(data.operators || [])
      if (showLoading) setLoading(false)
    } catch (err) {
      console.error("Error fetching operators:", err)
      toast.error("Failed to load operators")
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchOperators(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Operator name is required")
      return
    }

    try {
      const url = editingOperator
        ? `/api/admin/operators/${editingOperator.id}`
        : "/api/admin/operators"

      const method = editingOperator ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || "Failed to save operator"
        // Show toast for duplicate or other errors
        if (errorMsg.includes("already exists") || errorMsg.includes("duplicate")) {
          toast.error("Duplicate Operator", {
            description: "An operator with this name already exists. Please use a different name.",
          })
        } else {
          toast.error("Failed to Save Operator", {
            description: errorMsg,
          })
        }
        return
      }

      toast.success(editingOperator ? "Operator updated successfully" : "Operator created successfully")
      setDialogOpen(false)
      resetForm()
      fetchOperators(false)
    } catch (err: any) {
      console.error("Error saving operator:", err)
      const errorMsg = err.message || "Failed to save operator"
      if (errorMsg.includes("already exists") || errorMsg.includes("duplicate")) {
        toast.error("Duplicate Operator", {
          description: "An operator with this name already exists. Please use a different name.",
        })
      } else {
        toast.error("Failed to Save Operator", {
          description: errorMsg,
        })
      }
    }
  }

  const handleEdit = (operator: Operator) => {
    setEditingOperator(operator)
    setFormData({
      name: operator.name,
      email: operator.email || "",
      phone: operator.phone || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = (operator: Operator) => {
    setOperatorToDelete(operator)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!operatorToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/operators/${operatorToDelete.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete operator")
      }

      toast.success("Operator deleted successfully")
      fetchOperators(false)
      setDeleteDialogOpen(false)
      setOperatorToDelete(null)
    } catch (err: any) {
      console.error("Error deleting operator:", err)
      toast.error(err.message || "Failed to delete operator")
    } finally {
      setDeleting(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "" })
    setEditingOperator(null)
  }

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      <AdminSidebar />

      <main className="flex-1 flex flex-col p-6 lg:p-8 overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 pb-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Operators</h1>
              <p className="text-muted-foreground mt-2">Manage bus/train operators</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Operator
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingOperator ? "Edit Operator" : "Add New Operator"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Operator Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., RedBus Express, VRL Travels"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@operator.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-accent hover:bg-accent/90">
                      {editingOperator ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Operators List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : operators.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No operators found. Add your first operator to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {operators.map((operator) => (
                  <Card key={operator.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{operator.name}</h3>
                            {operator.rating > 0 && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>{operator.rating.toFixed(1)}</span>
                                <span>({operator.total_reviews} reviews)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {operator.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{operator.email}</span>
                          </div>
                        )}
                        {operator.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{operator.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(operator)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(operator)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Operator Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Operator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{operatorToDelete?.name}</strong>?
              <br />
              <br />
              <span className="text-destructive font-medium">
                This action cannot be undone. If the operator has associated routes, they must be deleted first.
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
                "Delete Operator"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
