import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { VerificationBadge } from "@/components/badge/verification-badge"
import { Pen, Shield, Bell, CreditCard, HelpCircle } from "lucide-react"

interface AccountSettingsProps {
  userData: any
}

export default function AccountSettings({ userData }: AccountSettingsProps) {
  const router = useRouter()
  
  const onEditClick = () => {
    router.push('/settings/edit_profile')
  }
  
  const onVerify = () => {
    router.push('/settings/verification_request')
  }
  
  const onPrivacyClick = () => {
    router.push('/settings/privacy_and_personal')
  }
  
  const onSecurityClick = () => {
    router.push('/settings/password_and_security')
  }
  
  const onNotificationsClick = () => {
    // TODO: Implement notifications settings
    console.log('Notifications settings not implemented yet')
  }
  
  const onBillingClick = () => {
    // TODO: Implement billing settings
    console.log('Billing settings not implemented yet')
  }
  
  const onHelpClick = () => {
    // TODO: Implement help settings
    console.log('Help settings not implemented yet')
  }
  
  return (
    <div className="space-y-6">
      {/* Profile Summary Card */}
      <div className="w-full max-w-md mx-auto rounded-lg bg-indigo-50 flex items-center p-6 gap-4">
        <Avatar className="w-20 h-20 border-4 border-white cursor-pointer flex-shrink-0">
          <AvatarImage src={userData?.avatarUrl} alt={userData?.displayName || 'User'} />
          <AvatarFallback className="text-xl bg-indigo-200 text-indigo-800">
            {userData?.displayName?.charAt(0)?.toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2 font-semibold text-lg text-gray-800 border-b border-indigo-200 pb-2">
            <span className="truncate">{userData?.displayName || 'Unknown User'}</span>
            {userData?.isVerified && (
              <VerificationBadge verified={true} size={16} className="h-4 w-4 flex-shrink-0" />
            )}
          </div>
          <span className="text-sm text-gray-600 mt-1 mb-3 truncate">
            @{userData?.username || "No username"}
          </span>
          <button
            onClick={onEditClick}
            className="
              flex items-center justify-center w-full bg-indigo-600 text-white rounded-full px-4 py-2
              hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              transition-all duration-200 font-medium text-sm
            "
          >
            <Pen className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {!userData?.isVerified && (
            <button 
              onClick={onVerify}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150 text-left"
            >
              <div className="flex items-center gap-3">
                <Pen className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Verify Your Profile</p>
                  <p className="text-sm text-gray-500">Verify your account and get a blue badge in your profile</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <button 
            onClick={onPrivacyClick}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150 text-left"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Privacy Settings</p>
                <p className="text-sm text-gray-500">Control who can see your profile and content</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button 
            onClick={onSecurityClick}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150 text-left"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Password & Security</p>
                <p className="text-sm text-gray-500">Change your password and security settings</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button 
            onClick={onNotificationsClick}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150 text-left"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Notifications</p>
                <p className="text-sm text-gray-500">Manage your notification preferences</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button 
            onClick={onBillingClick}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150 text-left"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Billing & Payments</p>
                <p className="text-sm text-gray-500">Manage your subscription and billing</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button 
            onClick={onHelpClick}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150 text-left"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Help & Support</p>
                <p className="text-sm text-gray-500">Get help and contact support</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}