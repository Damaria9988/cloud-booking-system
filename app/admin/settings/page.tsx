"use client"

import { useState } from "react"
import { Shield, Save, Bell, Globe, Lock, LogOut } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    bookingAlerts: true,
    systemUpdates: false,
    maintenanceMode: false,
  })

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-balance">Admin Settings</h1>
            <p className="text-muted-foreground">Manage your admin profile and system configurations</p>
          </div>

          {/* Profile Card */}
          <Card className="border-2 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-accent p-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 border-4 border-white/20">
                  <AvatarImage src="/admin-avatar.png" />
                  <AvatarFallback className="bg-white text-primary text-2xl">AD</AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">Admin User</h2>
                  <p className="text-white/80">admin@cloudticket.com</p>
                  <div className="mt-2 inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm">
                    <Shield className="w-4 h-4" />
                    Super Admin
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Settings Tabs */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Profile</CardTitle>
                  <CardDescription>Update your admin account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-name">Full Name</Label>
                      <Input id="admin-name" defaultValue="Admin User" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email</Label>
                      <Input id="admin-email" type="email" defaultValue="admin@cloudticket.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-phone">Phone</Label>
                      <Input id="admin-phone" defaultValue="+91 98765 43210" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-role">Role</Label>
                      <Input id="admin-role" defaultValue="Super Admin" disabled />
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Notification Preferences
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive updates via email</p>
                        </div>
                        <Switch
                          checked={settings.emailNotifications}
                          onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Booking Alerts</p>
                          <p className="text-sm text-muted-foreground">Get notified for new bookings</p>
                        </div>
                        <Switch
                          checked={settings.bookingAlerts}
                          onCheckedChange={(checked) => setSettings({ ...settings, bookingAlerts: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">System Updates</p>
                          <p className="text-sm text-muted-foreground">Platform maintenance notifications</p>
                        </div>
                        <Switch
                          checked={settings.systemUpdates}
                          onCheckedChange={(checked) => setSettings({ ...settings, systemUpdates: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <Button className="w-full sm:w-auto gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Tab */}
            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>Manage platform-wide settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Platform Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Maintenance Mode</p>
                          <p className="text-sm text-muted-foreground">Put the platform in maintenance mode</p>
                        </div>
                        <Switch
                          checked={settings.maintenanceMode}
                          onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Commission Settings</h3>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bus-commission">Bus Booking Commission (%)</Label>
                        <Input id="bus-commission" type="number" defaultValue="5" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="train-commission">Train Booking Commission (%)</Label>
                        <Input id="train-commission" type="number" defaultValue="3" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="flight-commission">Flight Booking Commission (%)</Label>
                        <Input id="flight-commission" type="number" defaultValue="7" />
                      </div>
                    </div>
                  </div>

                  <Button className="w-full sm:w-auto gap-2">
                    <Save className="w-4 h-4" />
                    Update Configuration
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your password and account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Change Password
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-admin-password">Current Password</Label>
                        <Input id="current-admin-password" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-admin-password">New Password</Label>
                        <Input id="new-admin-password" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-admin-password">Confirm New Password</Label>
                        <Input id="confirm-admin-password" type="password" />
                      </div>
                    </div>
                    <Button className="gap-2">
                      <Lock className="w-4 h-4" />
                      Update Password
                    </Button>
                  </div>

                  <div className="pt-6 border-t">
                    <Button variant="destructive" className="gap-2">
                      <LogOut className="w-4 h-4" />
                      Logout from Admin Panel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
