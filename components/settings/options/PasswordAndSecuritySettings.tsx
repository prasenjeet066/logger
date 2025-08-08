"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Shield, Key, Loader2 } from "lucide-react"

export default function PasswordAndSecuritySettings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState < string | null > (null)
  const [success, setSuccess] = useState < string | null > (null)
  
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  
  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent < HTMLInputElement > ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    // Clear messages when user starts typing
    if (error) setError(null)
    if (success) setSuccess(null)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError("All fields are required")
      setLoading(false)
      return
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match")
      setLoading(false)
      return
    }
    
    if (formData.newPassword.length < 8) {
      setError("New password must be at least 8 characters long")
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to change password')
      }
      
      setSuccess("Password changed successfully!")
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const PasswordInput = ({
    id,
    label,
    value,
    onChange,
    show,
    onToggle
  }: {
    id: string
    label: string
    value: string
    onChange: (e: React.ChangeEvent < HTMLInputElement > ) => void
    show: boolean
    onToggle: () => void
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          disabled={loading}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Password & Security</h1>
        <p className="text-gray-600">Manage your password and security settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            <PasswordInput
              id="currentPassword"
              label="Current Password"
              value={formData.currentPassword}
              onChange={handleChange("currentPassword")}
              show={showCurrentPassword}
              onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
            />

            <PasswordInput
              id="newPassword"
              label="New Password"
              value={formData.newPassword}
              onChange={handleChange("newPassword")}
              show={showNewPassword}
              onToggle={() => setShowNewPassword(!showNewPassword)}
            />

            <PasswordInput
              id="confirmPassword"
              label="Confirm New Password"
              value={formData.confirmPassword}
              onChange={handleChange("confirmPassword")}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="min-w-[140px]"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600 mb-3">
                Add an extra layer of security to your account
              </p>
              <Button variant="outline" size="sm">
                Enable 2FA
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Login Sessions</h3>
              <p className="text-sm text-gray-600 mb-3">
                Manage your active login sessions across devices
              </p>
              <Button variant="outline" size="sm">
                View Sessions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}