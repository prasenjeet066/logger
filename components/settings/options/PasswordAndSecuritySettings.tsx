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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const [twoFASecret, setTwoFASecret] = useState<string | null>(null)
  const [twoFAQr, setTwoFAQr] = useState<string | null>(null)
  const [twoFACode, setTwoFACode] = useState("")
  const [sessions, setSessions] = useState<Array<{ sessionId: string }>>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (error) setError(null)
    if (success) setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

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

  const setup2FA = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to setup 2FA')
      const data = await res.json()
      setTwoFASecret(data.secret)
      setTwoFAQr(data.otpauth)
      setSuccess('2FA secret generated. Scan in your authenticator app.')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const verify2FA = async () => {
    if (!twoFACode) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFACode })
      })
      const data = await res.json()
      if (!res.ok || !data.verified) throw new Error(data.error || 'Invalid code')
      setSuccess('2FA verified and enabled!')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async () => {
    setSessionsLoading(true)
    try {
      const res = await fetch('/api/users/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } finally {
      setSessionsLoading(false)
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
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
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
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={setup2FA} disabled={loading}>Generate Secret</Button>
                <Input placeholder="6-digit code" className="w-32" value={twoFACode} onChange={e => setTwoFACode(e.target.value)} />
                <Button size="sm" onClick={verify2FA} disabled={loading || !twoFACode}>Verify</Button>
              </div>
              {twoFAQr && (
                <div className="mt-2 text-sm break-all">
                  Provisioning URI: {twoFAQr}
                </div>
              )}
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">Login Sessions</h3>
                  <p className="text-sm text-gray-600 mb-3">Manage your active login sessions across devices</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadSessions} disabled={sessionsLoading}>
                  {sessionsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                </Button>
              </div>
              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <p className="text-sm text-gray-500">No sessions to display</p>
                ) : (
                  sessions.map((s) => (
                    <div key={s.sessionId} className="text-sm text-gray-700 border rounded p-2">Session: {s.sessionId}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}