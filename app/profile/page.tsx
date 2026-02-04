"use client"

import { useState, useEffect, useRef } from "react"
import { User, Mail, Phone, MapPin, Bell, Lock, Shield, LogOut, Save, Edit, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function ProfileSettingsPage() {
  const auth = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })
  const [loading, setLoading] = useState(true)

  const [notifications, setNotifications] = useState({
    bookingConfirmation: true,
    promotions: true,
    reminders: true,
    newsletter: false,
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [originalProfile, setOriginalProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })
  const [originalPasswordForm, setOriginalPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const isEditingRef = useRef(false)
  const previousNameRef = useRef("")

  // Update ref when editing state changes
  useEffect(() => {
    isEditingRef.current = isEditingProfile
  }, [isEditingProfile])

  // Fetch user profile data (only on initial load, not when editing)
  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth || auth.loading || isEditingRef.current) return

      if (!auth.user) {
        router.push("/?auth=required")
        return
      }

      try {
        const response = await fetch("/api/auth/profile")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch profile")
        }

        if (data.user) {
          const profileData = {
            name: `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim() || "User",
            email: data.user.email || "",
            phone: data.user.phone || "",
            address: "", // Address is not stored in users table
          }
          // Only update if not currently editing
          if (!isEditingRef.current) {
            setProfile(profileData)
            setOriginalProfile(profileData)
            previousNameRef.current = profileData.name
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast.error("Failed to load profile data")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [auth?.user?.id, router]) // Only depend on user ID, not the entire auth object

  // Update profile when auth user changes (from Socket.IO), but only if not editing
  useEffect(() => {
    if (!auth?.user || isEditingRef.current || loading) return

    const newName = `${auth.user.firstName || ""} ${auth.user.lastName || ""}`.trim() || "User"
    const newEmail = auth.user.email || ""
    
    // Only update if the name actually changed from the previous value (not from user typing)
    if (previousNameRef.current !== newName && profile.name !== newName) {
      setProfile((prev) => ({
        ...prev,
        name: newName,
        email: newEmail || prev.email,
      }))
      setOriginalProfile((prev) => ({
        ...prev,
        name: newName,
        email: newEmail || prev.email,
      }))
      previousNameRef.current = newName
    }
  }, [auth?.user?.firstName, auth?.user?.lastName, loading])

  // Get user initials for avatar
  const getUserInitials = () => {
    if (profile.name) {
      const names = profile.name.split(" ")
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }
      return names[0][0].toUpperCase()
    }
    return "U"
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!auth || !auth.user) {
      toast.error("Please login to update your profile")
      return
    }

    setSavingProfile(true)
    try {
      const nameParts = profile.name.split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: profile.phone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile")
      }

      toast.success("Profile updated successfully!")
      
      // Profile update is broadcast via Socket.IO for instant updates
      // Auth context will automatically update via Socket.IO listener
      // No need to manually refresh - Socket.IO handles it in real-time
      
      // Update local state with saved data
      if (data.user) {
        const updatedProfile = {
          name: `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim() || "User",
          email: data.user.email || profile.email,
          phone: data.user.phone || "",
          address: profile.address,
        }
        setProfile(updatedProfile)
        setOriginalProfile(updatedProfile)
        setIsEditingProfile(false) // Exit edit mode after successful save
      }
    } catch (error: any) {
      console.error("Profile save error:", error)
      toast.error(error.message || "Failed to update profile")
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Please fill in all password fields")
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirmation do not match")
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long")
      return
    }

    setChangingPassword(true)
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      })

      // Check if response has content before parsing JSON
      const contentType = response.headers.get("content-type")
      let data: any = {}
      
      if (contentType && contentType.includes("application/json")) {
        const text = await response.text()
        if (text) {
          try {
            data = JSON.parse(text)
          } catch (parseError) {
            console.error("Failed to parse JSON response:", parseError)
            data = { error: "Invalid response from server" }
          }
        }
      }

      if (!response.ok) {
        // Show specific error message for incorrect current password
        const errorMessage = data.error || "Failed to change password"
        if (response.status === 401 && errorMessage.includes("incorrect")) {
          toast.error("Current password is incorrect. Please try again.")
        } else {
          toast.error(errorMessage)
        }
        return // Don't throw error, just show toast and return
      }

      toast.success("Password changed successfully! Please login again.")
      
      // Clear form and exit edit mode
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setOriginalPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setIsEditingPassword(false)

      // Logout and redirect using hard navigation to avoid router issues
      try {
        // Call logout API but don't wait for it
        fetch("/api/auth/logout", { method: "POST" }).catch(() => {
          // Ignore logout API errors
        })
        // Clear user state immediately
        auth?.logout().catch(() => {
          // Ignore logout errors, just clear local state
        })
        // Use hard redirect to avoid router state issues
        if (typeof window !== 'undefined') {
          window.location.href = "/?auth=required"
        }
      } catch (error) {
        // If anything fails, still redirect
        if (typeof window !== 'undefined') {
          window.location.href = "/?auth=required"
        }
      }
    } catch (error: any) {
      // Only log unexpected errors (not validation errors which are handled above)
      console.error("Unexpected password change error:", error)
      toast.error(error.message || "Failed to change password")
    } finally {
      setChangingPassword(false)
    }
  }

  const handleLogout = () => {
    // Clear user state immediately for instant logout
    auth?.logout().catch(() => {
      // Ignore errors, just clear local state
    })
    
    // Call logout API in background (don't wait for it)
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {
      // Ignore logout API errors - user is already logged out locally
    })
    
    // Redirect immediately using hard navigation for instant response
    if (typeof window !== 'undefined') {
      window.location.href = "/"
    } else {
      router.push("/")
    }
  }

  // Handle redirect if not authenticated
  useEffect(() => {
    if (!auth || auth.loading || loading) return
    
    if (!auth.user) {
      router.push("/?auth=required")
    }
  }, [auth, loading, router])

  if (!auth || auth.loading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!auth || !auth.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-balance">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>

          {/* Profile Overview Card */}
          <Card className="mb-6 overflow-hidden border-2 shadow-lg">
            <div className="bg-gradient-to-r from-primary to-accent p-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 border-4 border-white/20">
                  <AvatarImage src="/diverse-user-avatars.png" />
                  <AvatarFallback className="bg-white text-primary text-2xl">{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">{profile.name || "User"}</h2>
                  <p className="text-white/80">{profile.email || "Loading..."}</p>
                  {auth?.user?.isStudent && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm">
                      <Shield className="w-4 h-4" />
                      Student Verified
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              {/* Preferences tab commented out */}
              {/* <TabsTrigger value="preferences">Preferences</TabsTrigger> */}
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </div>
                    {!loading && (
                      <div className="flex items-center gap-2">
                        {isEditingProfile ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setProfile(originalProfile)
                                setIsEditingProfile(false)
                              }}
                              disabled={savingProfile}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              form="profile-form"
                              disabled={savingProfile}
                              className="gap-2"
                            >
                              <Save className="w-4 h-4" />
                              {savingProfile ? "Saving..." : "Save Changes"}
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditingProfile(true)}
                            className="gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading profile...</p>
                    </div>
                  ) : (
                    <form id="profile-form" onSubmit={handleProfileSave} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="name"
                              value={profile.name}
                              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                              className="pl-10"
                              disabled={!isEditingProfile}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              value={profile.email}
                              disabled
                              className="pl-10 bg-muted"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="phone"
                              value={profile.phone}
                              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                              className="pl-10"
                              disabled={!isEditingProfile}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="address"
                              value={profile.address}
                              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                              className="pl-10"
                              disabled={!isEditingProfile}
                            />
                          </div>
                        </div>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>Manage your password and security options</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditingPassword ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setPasswordForm(originalPasswordForm)
                              setIsEditingPassword(false)
                            }}
                            disabled={changingPassword}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            form="password-form"
                            disabled={changingPassword}
                            className="gap-2"
                          >
                            <Lock className="w-4 h-4" />
                            {changingPassword ? "Updating..." : "Update Password"}
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setOriginalPasswordForm({ ...passwordForm })
                            setIsEditingPassword(true)
                          }}
                          className="gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form 
                    id="password-form" 
                    onSubmit={handlePasswordChange} 
                    className="space-y-4"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                  >
                    <h3 className="font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Change Password
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input 
                          id="current-password" 
                          type="password" 
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          disabled={!isEditingPassword}
                          autoComplete="off"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input 
                          id="new-password" 
                          type="password" 
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          disabled={!isEditingPassword}
                          autoComplete="off"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          minLength={6}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input 
                          id="confirm-password" 
                          type="password" 
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          disabled={!isEditingPassword}
                          autoComplete="off"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          minLength={6}
                          required
                        />
                      </div>
                    </div>
                  </form>

                  <div className="pt-6 border-t">
                    <Button variant="destructive" className="gap-2" onClick={handleLogout}>
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab - Commented out */}
            {/* <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose what updates you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          <Bell className="w-4 h-4" />
                          Booking Confirmations
                        </div>
                        <p className="text-sm text-muted-foreground">Get notified about booking confirmations</p>
                      </div>
                      <Switch
                        checked={notifications.bookingConfirmation}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, bookingConfirmation: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">Trip Reminders</div>
                        <p className="text-sm text-muted-foreground">Receive reminders before your trip</p>
                      </div>
                      <Switch
                        checked={notifications.reminders}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, reminders: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">Promotions & Offers</div>
                        <p className="text-sm text-muted-foreground">Get updates about discounts and deals</p>
                      </div>
                      <Switch
                        checked={notifications.promotions}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, promotions: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">Newsletter</div>
                        <p className="text-sm text-muted-foreground">Weekly travel tips and updates</p>
                      </div>
                      <Switch
                        checked={notifications.newsletter}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, newsletter: checked })}
                      />
                    </div>
                  </div>

                  <Button className="w-full sm:w-auto gap-2">
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent> */}
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  )
}
