"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Tag, Percent, Calendar, Users, Loader2, ToggleLeft, ToggleRight, MoreVertical } from "lucide-react"
import { usePolling } from "@/hooks/use-polling"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
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

interface PromoCode {
  id: number
  code: string
  discount_type: string
  discount_value: number
  user_type: string
  valid_from: string
  valid_until: string
  usage_limit: number | null
  used_count: number
  min_amount: number | null
  max_discount: number | null
  is_active: number
  created_at: string
  updated_at: string | null
}

export default function PromotionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [promotions, setPromotions] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null)
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [promoToDelete, setPromoToDelete] = useState<PromoCode | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch promo codes with polling for real-time updates
  const fetchPromoCodes = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      const response = await fetch("/api/admin/promo")
      const data = await response.json()
      
      if (response.ok) {
        setPromotions(data.promos || [])
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch promo codes",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching promo codes:", error)
      toast({
        title: "Error",
        description: "Failed to load promo codes",
        variant: "destructive",
      })
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // Initial fetch on mount
  useEffect(() => {
    fetchPromoCodes(true)
  }, [])

  // Polling every 15 seconds for real-time updates (reduced frequency to prevent excessive loading)
  usePolling(() => fetchPromoCodes(false), { interval: 15000 })

  // Listen for manual refresh events
  useEffect(() => {
    const handleRefresh = () => fetchPromoCodes(true)
    window.addEventListener("admin:refresh-promotions", handleRefresh)
    return () => window.removeEventListener("admin:refresh-promotions", handleRefresh)
  }, [])

  // Reset loading state when dialogs open
  useEffect(() => {
    if (isAddDialogOpen) {
      setSubmitting(false)
    }
  }, [isAddDialogOpen])

  useEffect(() => {
    if (isEditDialogOpen) {
      setSubmitting(false)
    }
  }, [isEditDialogOpen])


  const handleCreatePromo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      code: formData.get("code") as string,
      discountType: formData.get("discountType") as string,
      discountValue: parseFloat(formData.get("discountValue") as string),
      userType: formData.get("userType") as string,
      validFrom: formData.get("validFrom") as string,
      validUntil: formData.get("validUntil") as string,
      usageLimit: formData.get("usageLimit") ? parseInt(formData.get("usageLimit") as string) : null,
      minAmount: formData.get("minAmount") ? parseFloat(formData.get("minAmount") as string) : null,
      maxDiscount: formData.get("maxDiscount") ? parseFloat(formData.get("maxDiscount") as string) : null,
      isActive: true,
    }

    try {
      const response = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Promo code created successfully",
        })
        setIsAddDialogOpen(false)
        setSubmitting(false)
        fetchPromoCodes(true)
        window.dispatchEvent(new CustomEvent("admin:refresh-promotions"))
        e.currentTarget.reset()
      } else {
        const errorMsg = result.error || "Failed to create promo code"
        // Show specific message for duplicate promo codes
        if (errorMsg.includes("already exists") || errorMsg.includes("duplicate") || errorMsg.includes("Promo code already exists")) {
          toast({
            title: "Duplicate Promo Code",
            description: "A promo code with this name already exists. Please use a different code.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: errorMsg,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error creating promo code:", error)
      toast({
        title: "Error",
        description: "Failed to create promo code",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditPromo = (promo: PromoCode) => {
    setEditingPromo(promo)
    setIsEditDialogOpen(true)
  }

  const handleUpdatePromo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingPromo) return

    setSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      code: formData.get("code") as string,
      discountType: formData.get("discountType") as string,
      discountValue: parseFloat(formData.get("discountValue") as string),
      userType: formData.get("userType") as string,
      validFrom: formData.get("validFrom") as string,
      validUntil: formData.get("validUntil") as string,
      usageLimit: formData.get("usageLimit") ? parseInt(formData.get("usageLimit") as string) : null,
      minAmount: formData.get("minAmount") ? parseFloat(formData.get("minAmount") as string) : null,
      maxDiscount: formData.get("maxDiscount") ? parseFloat(formData.get("maxDiscount") as string) : null,
    }

    try {
      const response = await fetch(`/api/admin/promo/${editingPromo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Promo code updated successfully",
        })
        setIsEditDialogOpen(false)
        setEditingPromo(null)
        fetchPromoCodes()
      } else {
        const errorMsg = result.error || "Failed to update promo code"
        // Show specific message for duplicate promo codes
        if (errorMsg.includes("already exists") || errorMsg.includes("duplicate") || errorMsg.includes("Promo code already exists")) {
          toast({
            title: "Duplicate Promo Code",
            description: "A promo code with this name already exists. Please use a different code.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: errorMsg,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error updating promo code:", error)
      toast({
        title: "Error",
        description: "Failed to update promo code",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePromo = (promo: PromoCode) => {
    setPromoToDelete(promo)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!promoToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/promo/${promoToDelete.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Promo code deleted successfully",
        })
        fetchPromoCodes(true)
        window.dispatchEvent(new CustomEvent("admin:refresh-promotions"))
        setDeleteDialogOpen(false)
        setPromoToDelete(null)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete promo code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting promo code:", error)
      toast({
        title: "Error",
        description: "Failed to delete promo code",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleTogglePromo = async (promoId: number) => {
    try {
      const response = await fetch(`/api/admin/promo/${promoId}/toggle`, {
        method: "PATCH",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Promo code status updated",
        })
        fetchPromoCodes(true)
        window.dispatchEvent(new CustomEvent("admin:refresh-promotions"))
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to update promo code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error toggling promo code:", error)
      toast({
        title: "Error",
        description: "Failed to update promo code",
        variant: "destructive",
      })
    }
  }

  const filteredPromotions = promotions.filter((promo) =>
    promo.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activePromos = promotions.filter((p) => p.is_active === 1).length
  const totalRedemptions = promotions.reduce((sum, p) => sum + p.used_count, 0)
  const avgDiscount = promotions.length > 0
    ? promotions.reduce((sum, p) => sum + parseFloat(p.discount_value.toString()), 0) / promotions.length
    : 0

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-balance">Discounts & Promotions</h1>
              <p className="text-muted-foreground">Manage promo codes and special offers</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" size="lg">
                  <Plus className="w-4 h-4" />
                  Create Promotion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Promotion</DialogTitle>
                  <DialogDescription>Set up a new discount code or offer</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePromo} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Promo Code *</Label>
                      <Input 
                        id="code" 
                        name="code"
                        placeholder="SUMMER50" 
                        className="uppercase" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userType">User Type *</Label>
                      <Select name="userType" defaultValue="all" required>
                        <SelectTrigger id="userType">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="student">Students Only</SelectItem>
                          <SelectItem value="first-time">First Time Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discountType">Discount Type *</Label>
                      <Select name="discountType" defaultValue="percent" required>
                        <SelectTrigger id="discountType">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discountValue">Discount Value *</Label>
                      <Input 
                        id="discountValue" 
                        name="discountValue"
                        placeholder="25" 
                        type="number" 
                        step="0.01"
                        min="0"
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="validFrom">Valid From *</Label>
                      <Input 
                        id="validFrom" 
                        name="validFrom"
                        type="date" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="validUntil">Valid Until *</Label>
                      <Input 
                        id="validUntil" 
                        name="validUntil"
                        type="date" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="usageLimit">Max Usage (Optional)</Label>
                      <Input 
                        id="usageLimit" 
                        name="usageLimit"
                        placeholder="Leave empty for unlimited" 
                        type="number"
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minAmount">Min. Purchase Amount (Optional)</Label>
                      <Input 
                        id="minAmount" 
                        name="minAmount"
                        placeholder="0" 
                        type="number" 
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxDiscount">Max Discount Cap (Optional)</Label>
                    <Input 
                      id="maxDiscount" 
                      name="maxDiscount"
                      placeholder="Leave empty for no cap" 
                      type="number" 
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Promotion"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) {
              setEditingPromo(null)
              setSubmitting(false)
            }
          }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Promotion</DialogTitle>
                <DialogDescription>Update promo code details</DialogDescription>
              </DialogHeader>
              {editingPromo && (
                <form onSubmit={handleUpdatePromo} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-code">Promo Code *</Label>
                      <Input 
                        id="edit-code" 
                        name="code"
                        placeholder="SUMMER50" 
                        className="uppercase" 
                        required 
                        defaultValue={editingPromo.code}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-userType">User Type *</Label>
                      <Select name="userType" defaultValue={editingPromo.user_type} required>
                        <SelectTrigger id="edit-userType">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="student">Students Only</SelectItem>
                          <SelectItem value="first-time">First Time Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-discountType">Discount Type *</Label>
                      <Select name="discountType" defaultValue={editingPromo.discount_type} required>
                        <SelectTrigger id="edit-discountType">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-discountValue">Discount Value *</Label>
                      <Input 
                        id="edit-discountValue" 
                        name="discountValue"
                        placeholder="25" 
                        type="number" 
                        step="0.01"
                        min="0"
                        required 
                        defaultValue={editingPromo.discount_value}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-validFrom">Valid From *</Label>
                      <Input 
                        id="edit-validFrom" 
                        name="validFrom"
                        type="date" 
                        required 
                        defaultValue={editingPromo.valid_from.includes('T') ? editingPromo.valid_from.split('T')[0] : editingPromo.valid_from}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-validUntil">Valid Until *</Label>
                      <Input 
                        id="edit-validUntil" 
                        name="validUntil"
                        type="date" 
                        required 
                        defaultValue={editingPromo.valid_until.includes('T') ? editingPromo.valid_until.split('T')[0] : editingPromo.valid_until}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-usageLimit">Max Usage (Optional)</Label>
                      <Input 
                        id="edit-usageLimit" 
                        name="usageLimit"
                        placeholder="Leave empty for unlimited" 
                        type="number"
                        min="1"
                        defaultValue={editingPromo.usage_limit || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-minAmount">Min. Purchase Amount (Optional)</Label>
                      <Input 
                        id="edit-minAmount" 
                        name="minAmount"
                        placeholder="0" 
                        type="number" 
                        step="0.01"
                        min="0"
                        defaultValue={editingPromo.min_amount || ""}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-maxDiscount">Max Discount Cap (Optional)</Label>
                    <Input 
                      id="edit-maxDiscount" 
                      name="maxDiscount"
                      placeholder="Leave empty for no cap" 
                      type="number" 
                      step="0.01"
                      min="0"
                      defaultValue={editingPromo.max_discount || ""}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditDialogOpen(false)
                        setEditingPromo(null)
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Promotion"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Promos</p>
                    <p className="text-2xl font-bold">{loading ? "..." : activePromos}</p>
                  </div>
                  <Tag className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Redemptions</p>
                    <p className="text-2xl font-bold">{loading ? "..." : totalRedemptions.toLocaleString()}</p>
                  </div>
                  <Users className="w-8 h-8 text-accent" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Discount</p>
                    <p className="text-2xl font-bold">{loading ? "..." : `${avgDiscount.toFixed(0)}%`}</p>
                  </div>
                  <Percent className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Promos</p>
                    <p className="text-2xl font-bold">{loading ? "..." : promotions.length}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search promotions by code or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Promotions Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Promotions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredPromotions.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  {searchQuery ? "No promotions match your search" : "No promotions yet. Create your first one!"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-semibold">Code</th>
                        <th className="text-left p-4 font-semibold">Type</th>
                        <th className="text-left p-4 font-semibold">Discount</th>
                        <th className="text-left p-4 font-semibold">Valid Period</th>
                        <th className="text-left p-4 font-semibold">Usage</th>
                        <th className="text-left p-4 font-semibold">Status</th>
                        <th className="text-left p-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPromotions.map((promo) => (
                        <tr key={promo.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4 text-primary" />
                              <span className="font-mono font-semibold">{promo.code}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="capitalize">{promo.user_type.replace("-", " ")}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-accent">
                              {promo.discount_type === "percent"
                                ? `${promo.discount_value}%`
                                : `$${promo.discount_value}`}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <div>{new Date(promo.valid_from).toLocaleDateString()}</div>
                              <div className="text-muted-foreground">
                                to {new Date(promo.valid_until).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              {promo.used_count} / {promo.usage_limit || "∞"}
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                promo.is_active
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                  : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {promo.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleTogglePromo(promo.id)}
                                title={promo.is_active ? "Disable" : "Enable"}
                              >
                                {promo.is_active ? (
                                  <ToggleRight className="w-4 h-4 text-green-500" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4 text-gray-500" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Promo Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete promo code <strong>{promoToDelete?.code}</strong>?
              <br />
              <br />
              <span className="text-destructive font-medium">
                This action cannot be undone. If the promo code has been used, it cannot be deleted.
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
                "Delete Promo Code"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
