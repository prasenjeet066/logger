import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EditProfile } from '@/components/settings/options/EditProfile'
import { Search, Settings, MoreHorizontal, UserPlus, ArrowLeft, User, Lock, Key, Pen, Shield, Bell, CreditCard, HelpCircle } from "lucide-react"
import VerificationRequest from "@/components/settings/options/VerificationRequest"
import PrivacyAndPersonalSettings from '@/components/settings/options/PrivacyAndPersonalSettings'
interface AccountSettingsProps {
  userData: any
  sendPathLink: (config: {
    name: string | string[]
    _component: React.ReactNode
    icon: any
  }) => void
}

export default function AccountSettings({
  userData,
  sendPathLink
}: AccountSettingsProps) {
  
  const onEditClick = () => {
    sendPathLink({
      name: ['Account', 'Edit Profile'],
      _component: <EditProfile user={userData} />,
      icon: Pen
    })
  }
  const onVerify = () => {
    sendPathLink({
      name : ['Account','Verification'],
      _component: <VerificationRequest userId = {userData._id}/>,
      icon : Shield
    })
  }
  const onPrivacyClick = () => {
    sendPathLink({
      name: ['Account', 'Privacy Settings'],
      _component: <PrivacyAndPersonalSettings/>, // You can create this component
      icon: Shield
    })
  }
  
  const onNotificationsClick = () => {
    sendPathLink({
      name: ['Account', 'Notifications'],
      _component: <div>Notifications Component</div>, // You can create this component
      icon: Bell
    })
  }
  
  const onBillingClick = () => {
    sendPathLink({
      name: ['Account', 'Billing & Payments'],
      _component: <div>Billing Component</div>, // You can create this component
      icon: CreditCard
    })
  }
  
  const onHelpClick = () => {
    sendPathLink({
      name: ['Account', 'Help & Support'],
      _component: <div>Help & Support Component</div>, // You can create this component
      icon: HelpCircle
    })
  }
  
  return (
    <div className="space-y-6">
      {/* Profile Summary Card */}
      <div className="w-full max-w-md mx-auto rounded-lg bg-indigo-50 flex items-center p-6 gap-4">
        <Avatar className="w-20 h-20 border-4 border-white cursor-pointer flex-shrink-0">
          <AvatarImage src={userData.avatarUrl} alt={userData.displayName} />
          <AvatarFallback className="text-xl bg-indigo-200 text-indigo-800">
            {userData.displayName?.charAt(0)?.toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-semibold text-lg text-gray-800 border-b border-indigo-200 pb-2 truncate">
            {userData.displayName}
          </span>
          <span className="text-sm text-gray-600 mt-1 mb-3 truncate">
            @{userData.username || "No username"}
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
          </button>)}

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