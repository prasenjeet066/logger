"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { VerificationBadge } from "@/components/badge/verification-badge"
import { Shield, Save } from "lucide-react"
import { format } from "date-fns"

interface VerificationStatus {
  id?: string
  letterIs?: string
  selectedPlan?: string
  statusIs?: 'A' | 'P' | 'R' | 'C'
  createdAt?: string
}

const statusMessages = {
  'P': { label: 'Pending Review', color: 'bg-yellow-500' },
  'A': { label: 'Approved', color: 'bg-green-500' },
  'R': { label: 'Rejected', color: 'bg-red-500' },
  'C': { label: 'Cancelled', color: 'bg-gray-500' }
}

const plans = [
  { id: 'free', label: 'Free Plan' },
  { id: 'pro', label: 'Pro Plan' },
  { id: 'enterprise', label: 'Enterprise Plan' }
]

export function VerificationSettings() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [verificationLetter, setVerificationLetter] = useState("")
  const [selectedPlan, setSelectedPlan] = useState("")
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)

  // Fetch current verification status on component mount
  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch('/api/verification')
      if (!response.ok) throw new Error('Failed to fetch verification status')
      
      const data = await response.json()
      if (data && data.length > 0) {
        // Get the most recent verification
        const latestVerification = data[0]
        setVerificationStatus(latestVerification)
      }
    } catch (error) {
      console.error('Error fetching verification:', error)
      toast({
        title: "Error",
        description: "Failed to fetch verification status",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          letterIs: verificationLetter,
          selectedPlan,
          // Include current UTC time in the format YYYY-MM-DD HH:MM:SS
          timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
        }),
      })

      if (!response.ok) throw new Error('Failed to submit verification request')

      const data = await response.json()
      setVerificationStatus(data)
      
      toast({
        title: "Success",
        description: "Verification request submitted successfully!",
      })

      // Clear the form
      setVerificationLetter("")
      setSelectedPlan("")
    } catch (error) {
      console.error('Error submitting verification:', error)
      toast({
        title: "Error",
        description: "Failed to submit verification request",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Function to cancel verification request
  const handleCancel = async () => {
    if (!verificationStatus?.id) return

    try {
      const response = await fetch(`/api/verification`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: verificationStatus.id,
          statusIs: 'C'
        }),
      })

      if (!response.ok) throw new Error('Failed to cancel verification')

      const data = await response.json()
      setVerificationStatus(data)
      
      toast({
        title: "Success",
        description: "Verification request cancelled",
      })
    } catch (error) {
      console.error('Error cancelling verification:', error)
      toast({
        title: "Error",
        description: "Failed to cancel verification request",
        variant: "destructive",
      })
    }
  }

  const renderStatus = () => {
    if (!verificationStatus) return null

    const status = statusMessages[verificationStatus.statusIs || 'P']
    return (
      <div className="mb-6 p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${status.color}`} />
          <span className="font-medium">{status.label}</span>
        </div>
        {verificationStatus.createdAt && (
          <p className="text-sm text-gray-500">
            Submitted on: {format(new Date(verificationStatus.createdAt), 'PPpp')}
          </p>
        )}
        {verificationStatus.statusIs === 'P' && (
          <Button
            variant="outline"
            className="mt-2"
            onClick={handleCancel}
          >
            Cancel Request
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verification Status
            {verificationStatus?.statusIs === 'A' && <VerificationBadge />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStatus()}

          {(!verificationStatus || verificationStatus.statusIs === 'R' || verificationStatus.statusIs === 'C') && (
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Selected Plan
                </label>
                <Select
                  value={selectedPlan}
                  onValueChange={setSelectedPlan}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Verification Letter
                </label>
                <Textarea
                  value={verificationLetter}
                  onChange={(e) => setVerificationLetter(e.target.value)}
                  placeholder="Please explain why you should be verified..."
                  className="h-32"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={saving || !verificationLetter || !selectedPlan}
                className="w-full"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Submit Verification Request
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}