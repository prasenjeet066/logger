"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, QrCode, Smartphone, ArrowLeft } from "lucide-react"
import Image from "next/image"
import QRCode from 'qrcode'

export default function TwoFactorSetupPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [qrCode, setQrCode] = useState("")
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("")
  const [secret, setSecret] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup')

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in")
    }
  }, [status, router])

  const handleSetup2FA = async () => {
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setQrCode(data.otpauth)
        setSecret(data.secret)
        
        // Generate QR code data URL
        try {
          const qrDataUrl = await QRCode.toDataURL(data.otpauth)
          setQrCodeDataUrl(qrDataUrl)
        } catch (error) {
          console.error('Failed to generate QR code:', error)
        }
        
        setStep('verify')
      } else {
        const error = await response.json()
        setMessage(error.error || 'Failed to setup 2FA')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify2FA = async () => {
    if (!verificationCode.trim()) {
      setMessage('Please enter the verification code')
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode }),
      })

      if (response.ok) {
        setIs2FAEnabled(true)
        setStep('complete')
        setMessage('2FA has been successfully enabled!')
      } else {
        const error = await response.json()
        setMessage(error.error || 'Invalid verification code')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
      })

      if (response.ok) {
        setIs2FAEnabled(false)
        setMessage('2FA has been disabled')
      } else {
        const error = await response.json()
        setMessage(error.error || 'Failed to disable 2FA')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/settings')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>
          <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
          <p className="text-gray-600 mt-2">
            Add an extra layer of security to your account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {step === 'setup' && 'Enable 2FA'}
              {step === 'verify' && 'Verify Setup'}
              {step === 'complete' && '2FA Enabled'}
            </CardTitle>
            <CardDescription>
              {step === 'setup' && 'Scan the QR code with your authenticator app'}
              {step === 'verify' && 'Enter the 6-digit code from your authenticator app'}
              {step === 'complete' && 'Your account is now protected with 2FA'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {step === 'setup' && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">To enable 2FA, you'll need:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>A smartphone with an authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Your phone to scan a QR code</li>
                  </ul>
                </div>
                
                <Button
                  onClick={handleSetup2FA}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <QrCode className="mr-2 h-4 w-4" />
                  Setup 2FA
                </Button>
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-4">
                               <div className="text-center">
                 {qrCodeDataUrl ? (
                   <div className="bg-white p-4 rounded-lg border inline-block">
                     <Image
                       src={qrCodeDataUrl}
                       alt="QR Code for 2FA setup"
                       width={128}
                       height={128}
                       className="mx-auto"
                     />
                     <p className="text-xs text-gray-500 mt-2">Scan this QR code with your authenticator app</p>
                   </div>
                 ) : (
                   <div className="bg-white p-4 rounded-lg border inline-block">
                     <QrCode className="h-32 w-32 text-gray-400" />
                     <p className="text-xs text-gray-500 mt-2">Loading QR code...</p>
                   </div>
                 )}
               </div>

                <div className="text-sm bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">Manual Entry (if QR code doesn't work):</p>
                  <code className="text-xs break-all">{secret}</code>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="text-center text-lg font-mono tracking-widest"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setVerificationCode(value)
                    }}
                    placeholder="000000"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                <Button
                  onClick={handleVerify2FA}
                  disabled={isLoading || !verificationCode.trim()}
                  className="w-full"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Smartphone className="mr-2 h-4 w-4" />
                  Verify & Enable
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setStep('setup')}
                  className="w-full"
                >
                  Back
                </Button>
              </div>
            )}

            {step === 'complete' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <Shield className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 font-medium">2FA Successfully Enabled!</p>
                    <p className="text-green-600 text-sm mt-1">
                      Your account is now protected with two-factor authentication
                    </p>
                  </div>
                </div>

                <div className="text-sm bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Keep your authenticator app secure</li>
                    <li>You'll need this app to sign in from now on</li>
                    <li>Consider backing up your recovery codes</li>
                  </ul>
                </div>

                <Button
                  onClick={() => router.push('/settings')}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}