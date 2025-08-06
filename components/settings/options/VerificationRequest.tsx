"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, XCircle, Clock, Shield } from "lucide-react"
import { Spinner } from "@/components/loader/spinner"

interface VerificationRequestProps {
  userId: string
}

interface Document {
  name: string
  fileUrl: string
}

interface VerificationStatus {
  hasRequest: boolean
  status?: 'pending' | 'rejected' | 'approved'
  userMessage?: string
  documents?: Document[]
  requestPlan?: string
}

export default function VerificationRequest({ userId }: VerificationRequestProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({ hasRequest: false })
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    userMessage: "",
    requestPlan: "basic",
    documentTypes: [] as string[],
    documents: [] as Document[]
  })

  const documentTypeOptions = [
    "Government ID",
    "Passport",
    "Driver's License",
    "Professional Certificate",
    "Business License",
    "Press Credentials",
    "Academic Credentials",
    "Other Official Document"
  ]

  const verificationPlans = [
    { value: "basic", label: "Basic Verification", description: "Standard blue checkmark for verified accounts" },
    { value: "business", label: "Business Verification", description: "Gold checkmark for business accounts" },
    { value: "creator", label: "Creator Verification", description: "Purple checkmark for content creators" },
    { value: "organization", label: "Organization Verification", description: "Gray checkmark for organizations" }
  ]

  useEffect(() => {
    fetchVerificationStatus()
  }, [userId])

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/verification/status?userId=${userId}`)
      
      if (response.ok) {
        const data = await response.json()
        setVerificationStatus(data)
        
        if (data.hasRequest) {
          setFormData({
            userMessage: data.userMessage || "",
            requestPlan: data.requestPlan || "basic",
            documentTypes: data.documentTypes || [],
            documents: data.documents || []
          })
        }
      }
    } catch (error) {
      console.error("Error fetching verification status:", error)
      setError("Failed to load verification status")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingFile(true)
    setError(null)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file
        if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
          throw new Error('Only images and PDF files are allowed')
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error('File size must be less than 10MB')
        }

        const formData = new FormData()
        formData.append('files', file)
        formData.append('type', 'verification_document')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Failed to upload file')
        }

        const result = await response.json()
        return {
          name: file.name,
          fileUrl: result.url
        }
      })

      const uploadedDocs = await Promise.all(uploadPromises)
      
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...uploadedDocs]
      }))

    } catch (error: any) {
      setError(error.message || 'Failed to upload files')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleRemoveDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }))
  }

  const handleDocumentTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      documentTypes: prev.documentTypes.includes(type) 
        ? prev.documentTypes.filter(t => t !== type)
        : [...prev.documentTypes, type]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (formData.documents.length === 0) {
      setError("Please upload at least one verification document")
      setSubmitting(false)
      return
    }

    if (formData.documentTypes.length === 0) {
      setError("Please select at least one document type")
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit verification request')
      }

      // Refresh status
      await fetchVerificationStatus()
      
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <Shield className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Account Verification</h1>
        <p className="text-gray-600">Request verification for your account to get a verified badge</p>
      </div>

      {/* Current Status Card */}
      {verificationStatus.hasRequest && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(verificationStatus.status || 'pending')}
                Verification Request Status
              </CardTitle>
              {getStatusBadge(verificationStatus.status || 'pending')}
            </div>
          </CardHeader>
          <CardContent className='border-none shadow-none'>
            <div className="space-y-2">
              <p><strong>Plan:</strong> {verificationStatus.requestPlan}</p>
              {verificationStatus.userMessage && (
                <p><strong>Message:</strong> {verificationStatus.userMessage}</p>
              )}
              {verificationStatus.status === 'rejected' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">
                    Your verification request was rejected. You can submit a new request with updated information.
                  </p>
                </div>
              )}
              {verificationStatus.status === 'approved' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-700 text-sm">
                    Congratulations! Your account has been verified. The verified badge will appear on your profile shortly.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show form only if no pending request or if rejected */}
      {(!verificationStatus.hasRequest || verificationStatus.status === 'rejected') && (
        <Card>
          <CardHeader>
            <CardTitle className='text-md'>Request Verification</CardTitle>
            <CardDescription>
              Fill out this form to request account verification. Please provide accurate information and valid documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Verification Plan */}
              <div className="space-y-2">
                <Label>Verification Plan</Label>
                <Select 
                  value={formData.requestPlan} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, requestPlan: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select verification plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {verificationPlans.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>
                        <div>
                          <div className="font-medium">{plan.label}</div>
                          <div className="text-sm text-gray-500">{plan.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Document Types */}
              <div className="space-y-2">
                <Label>Document Types (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {documentTypeOptions.map((type) => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.documentTypes.includes(type)}
                        onChange={() => handleDocumentTypeChange(type)}
                        className="rounded"
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Upload Documents</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="document-upload"
                    disabled={uploadingFile}
                  />
                  <label htmlFor="document-upload" className="cursor-pointer">
                    {uploadingFile ? (
                      <Spinner />
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Click to upload documents (images or PDFs, max 10MB each)
                        </p>
                      </>
                    )}
                  </label>
                </div>

                {/* Uploaded Documents */}
                {formData.documents.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Documents</Label>
                    {formData.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{doc.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDocument(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="userMessage">Additional Message (Optional)</Label>
                <Textarea
                  id="userMessage"
                  value={formData.userMessage}
                  onChange={(e) => setFormData(prev => ({ ...prev, userMessage: e.target.value }))}
                  placeholder="Tell us why you deserve verification and any additional context..."
                  rows={4}
                  maxLength={160}
                  disabled={submitting}
                />
                <p className="text-sm text-gray-500">
                  {formData.userMessage.length}/160 characters
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t">
                <Button 
                  type="submit" 
                  disabled={submitting || uploadingFile}
                  className="min-w-[140px]"
                >
                  {submitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verification Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900">Required Documents:</h4>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Government-issued photo ID (passport, driver's license, etc.)</li>
              <li>Proof of identity or professional credentials</li>
              <li>Any relevant business or organization documentation</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Processing Time:</h4>
            <p className="mt-1">Verification requests typically take 3-7 business days to review.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Important Notes:</h4>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>All information must be accurate and match your profile</li>
              <li>Documents must be clear and readable</li>
              <li>Only one verification request can be submitted at a time</li>
              <li>Verification badges may be revoked if terms are violated</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}