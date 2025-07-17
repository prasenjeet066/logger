"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Shield, Eye, Lock, Users, MessageSquare, Search, Download, Trash2, Save } from "lucide-react"

export function VerificationSettings() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [privacySettings, setPrivacySettings] = useState({
    privateAccount: false,
    allowMessages: true,
    showEmail: false,
    showLocation: true,
    showOnlineStatus: true,
    allowTagging: true,
    searchable: true,
    showFollowers: true,
    showFollowing: true,
    allowDataDownload: true,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/users/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(privacySettings),
      })

      if (!response.ok) throw new Error("Failed to update privacy settings")

      toast({
        title: "Success",
        description: "Privacy settings updated!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save privacy settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDataDownload = async () => {
    try {
      const response = await fetch("/api/users/data-export", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to request data export")

      toast({
        title: "Success",
        description: "Data export requested. You'll receive an email when ready.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request data export",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Account Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
           Verification 
          </CardTitle>
        </CardHeader>
       <CardContent>
         
       </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-32">
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
