"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Key, Smartphone, Monitor, MapPin, AlertTriangle, Check, X, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

export function SecuritySettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [activeSessions] = useState([
    {
      id: "1",
      device: "MacBook Pro",
      browser: "Chrome",
      location: "New York, NY",
      lastActive: "Active now",
      current: true,
    },
    {
      id: "2",
      device: "iPhone 14",
      browser: "Safari",
      location: "New York, NY",
      lastActive: "2 hours ago",
      current: false,
    },
    {
      id: "3",
      device: "Windows PC",
      browser: "Firefox",
      location: "Los Angeles, CA",
      lastActive: "1 day ago",
      current: false,
    },
  ])

  const passwordRequirements = [
    { text: "At least 8 characters", met: passwordData.newPassword.length >= 8 },
    { text: "Contains uppercase letter", met: /[A-Z]/.test(passwordData.newPassword) },
    { text: "Contains lowercase letter", met: /[a-z]/.test(passwordData.newPassword) },
    { text: "Contains number", met: /\d/.test(passwordData.newPassword) },
    { text: "Contains special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) },
  ]

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    if (!passwordRequirements.every((req) => req.met)) {
      toast.error("Password doesn't meet requirements")
      return
    }

    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Password updated successfully!")
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      toast.error("Failed to update password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success("Session terminated successfully")
    } catch (error) {
      toast.error("Failed to terminate session")
    }
  }

  const handleToggle2FA = async () => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setTwoFactorEnabled(!twoFactorEnabled)
      toast.success(twoFactorEnabled ? "2FA disabled" : "2FA enabled")
    } catch (error) {
      toast.error("Failed to update 2FA settings")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {passwordData.newPassword && (
              <div className="space-y-2 mt-3">
                <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
                <div className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {req.met ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                      <span className={req.met ? "text-green-700" : "text-red-700"}>{req.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button onClick={handlePasswordChange} disabled={isLoading} className="w-full">
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${twoFactorEnabled ? "bg-green-100" : "bg-gray-100"}`}>
                <Shield className={`h-4 w-4 ${twoFactorEnabled ? "text-green-600" : "text-gray-600"}`} />
              </div>
              <div>
                <p className="font-medium">Authenticator App</p>
                <p className="text-sm text-gray-600">
                  {twoFactorEnabled ? "2FA is enabled" : "Use an app like Google Authenticator"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {twoFactorEnabled && (
                <Badge className="bg-green-100 text-green-700">
                  <Check className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              )}
              <Switch checked={twoFactorEnabled} onCheckedChange={handleToggle2FA} disabled={isLoading} />
            </div>
          </div>

          {twoFactorEnabled && (
            <Alert className="mt-4">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is active. You'll need your authenticator app to sign in.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>Manage devices that are currently signed in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Monitor className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{session.device}</p>
                      {session.current && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{session.browser}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{session.location}</span>
                      <span>•</span>
                      <span>{session.lastActive}</span>
                    </div>
                  </div>
                </div>
                {!session.current && (
                  <Button variant="outline" size="sm" onClick={() => handleTerminateSession(session.id)}>
                    Terminate
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Security Alerts
          </CardTitle>
          <CardDescription>Recent security-related activities on your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Check className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Password changed successfully</p>
                <p className="text-xs text-green-600">2 hours ago from New York, NY</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Shield className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">New device signed in</p>
                <p className="text-xs text-blue-600">1 day ago from iPhone 14</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
