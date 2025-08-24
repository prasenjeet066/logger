"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertTriangle, 
  Lock, 
  User, 
  Shield, 
  ArrowLeft, 
  RefreshCw,
  Mail,
  Key
} from "lucide-react"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorDetails = (errorType: string | null) => {
    switch (errorType) {
      case 'Configuration':
        return {
          title: 'Server Configuration Error',
          description: 'There is a problem with the server configuration. Please try again later.',
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          solutions: [
            'Check if the server is running properly',
            'Contact support if the problem persists',
            'Try again in a few minutes'
          ]
        }
      
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description: 'You do not have permission to access this resource.',
          icon: Lock,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          solutions: [
            'Make sure you have the correct permissions',
            'Contact your administrator',
            'Try signing in with a different account'
          ]
        }
      
      case 'Verification':
        return {
          title: 'Verification Required',
          description: 'Your account needs to be verified before you can sign in.',
          icon: Mail,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          solutions: [
            'Check your email for verification link',
            'Click the verification link in your email',
            'Check your spam folder if you don\'t see the email'
          ]
        }
      
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'OAuthAccountNotLinked':
        return {
          title: 'OAuth Authentication Error',
          description: 'There was a problem with the OAuth authentication process.',
          icon: Shield,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          solutions: [
            'Try signing in with email and password instead',
            'Make sure you\'re using the same account',
            'Contact support if the problem persists'
          ]
        }
      
      case 'EmailSignin':
        return {
          title: 'Email Sign-in Error',
          description: 'There was a problem sending the sign-in email.',
          icon: Mail,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          solutions: [
            'Check your email address is correct',
            'Try again in a few minutes',
            'Contact support if the problem persists'
          ]
        }
      
      case 'CredentialsSignin':
        return {
          title: 'Invalid Credentials',
          description: 'The email or password you entered is incorrect.',
          icon: Key,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          solutions: [
            'Double-check your email and password',
            'Make sure Caps Lock is off',
            'Try resetting your password if you forgot it'
          ]
        }
      
      case 'SessionRequired':
        return {
          title: 'Session Required',
          description: 'You need to be signed in to access this page.',
          icon: User,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          solutions: [
            'Sign in to your account',
            'Create a new account if you don\'t have one',
            'Try refreshing the page'
          ]
        }
      
      case 'Default':
      default:
        return {
          title: 'Authentication Error',
          description: 'An unexpected error occurred during authentication.',
          icon: AlertTriangle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          solutions: [
            'Try refreshing the page',
            'Clear your browser cache and cookies',
            'Contact support if the problem persists'
          ]
        }
    }
  }

  const errorDetails = getErrorDetails(error)
  const IconComponent = errorDetails.icon

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className={`w-16 h-16 ${errorDetails.bgColor} ${errorDetails.borderColor} border-2 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <IconComponent className={`w-8 h-8 ${errorDetails.color}`} />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {errorDetails.title}
            </CardTitle>
            <CardDescription className="text-gray-600 text-base">
              {errorDetails.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Code */}
            {error && (
              <Alert className={`${errorDetails.bgColor} ${errorDetails.borderColor} border`}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Error Code: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{error}</code>
                </AlertDescription>
              </Alert>
            )}

            {/* Solutions */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Try these solutions:</h4>
              <ul className="space-y-2">
                {errorDetails.solutions.map((solution, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                    <span>{solution}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Link href="/auth/sign-in">
                <Button className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
              
              <Link href="/auth/sign-up">
                <Button variant="outline" className="w-full">
                  Create New Account
                </Button>
              </Link>
            </div>

            {/* Additional Help */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">
                Still having trouble?
              </p>
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}