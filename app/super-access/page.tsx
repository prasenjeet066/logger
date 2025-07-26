'use client'
import { useSession } from "next-auth/react"
import { useMobile } from "@/hooks/use-mobile"
import { signOut } from "next-auth/react"
import { Home, Users, Bot } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Header } from "@/components/dashboard/web/utils/header"
import { Header as AppHeader } from "@/components/dashboard/utils/header"

interface Bot {
  _id: string
  displayName: string
  dio: string
  username: string
  email: string
  script: string
  shell: string
  type: string
  avatarUrl: string | null
  coverUrl: string | null
  followersCount: number
  followingCount: number
  postsCount: number
  ownerId: {
    _id: string
    name?: string
    email?: string
  }
  createdAt: string
}

interface User {
  _id: string
  name?: string
  email?: string
  image?: string
}

export default function SuperAccess() {
  const { data: session, status } = useSession()
  const isMobile = useMobile()
  const router = useRouter()
  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'bots' | 'users'>('overview')
  const [isExpand, setIsExpand] = useState<boolean>(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    dio: '',
    username: '',
    password: '',
    email: '',
    script: '',
    shell: 'bash',
    type: 'inactive',
    avatarUrl: '',
    coverUrl: '',
    ownerId: ''
  })
  
  // Mock profile data - replace with actual user data from session
  const profileData = {
    name: session?.user?.name || 'Super Admin',
    email: session?.user?.email || 'admin@example.com',
    image: session?.user?.image || null,
    username: session?.user?.username || 'admin', // Add username
    avatarUrl: session?.user?.image || null // Add avatarUrl for compatibility
  }
  
  useEffect(() => {
    // Check if user has super access permissions
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // Add your super admin check logic here
    // For example: if (!session.user.isSuperAdmin) router.push('/')
    
    fetchBots()
  }, [session, status, router])
  
  const fetchBots = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bot')
      if (!response.ok) throw new Error('Failed to fetch bots')
      const data = await response.json()
      setBots(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }
  
  const handleDeleteBot = async (botId: string) => {
    if (!confirm('Are you sure you want to delete this bot?')) return
    
    try {
      const response = await fetch(`/api/bot/${botId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete bot')
      
      setBots(bots.filter(bot => bot._id !== botId))
      setShowModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bot')
    }
  }
  
  const handleViewBot = (bot: Bot) => {
    setSelectedBot(bot)
    setShowModal(true)
  }
  
  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.displayName || !formData.username || !formData.email || !formData.password) {
      setError('Please fill in all required fields')
      return
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }
    
    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }
    
    try {
      setCreateLoading(true)
      setError(null)
      
      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ownerId: session?.user?.id || formData.ownerId
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create bot')
      }
      
      const newBot = await response.json()
      setBots([...bots, newBot])
      setShowCreateModal(false)
      resetForm()
      
      // Show success message
      alert('Bot created successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bot')
    } finally {
      setCreateLoading(false)
    }
  }
  
  const resetForm = () => {
    setFormData({
      displayName: '',
      dio: '',
      username: '',
      password: '',
      email: '',
      script: '',
      shell: 'bash',
      type: 'inactive',
      avatarUrl: '',
      coverUrl: '',
      ownerId: ''
    })
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Fixed sidebar menu items with proper structure
  const sideMenus = [
    { 
      icon: Home, 
      label: "Overview", 
      href: null, 
      tabData: "overview" 
    },
    { 
      icon: Bot, 
      label: "Bots", 
      href: null, 
      tabData: "bots" 
    },
    { 
      icon: Users, 
      label: "User Management", 
      href: null, 
      tabData: "users" 
    },
  ]

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 font-english">
      {!isMobile ? (
        <Header 
          profile={profileData} 
          handleSignOut={handleSignOut}
          sidebarExpand={isExpand}
          setSidebarExpand={setIsExpand}
          onCreatePost={() => {
            // null
          }}
        />
      ) : (
        <AppHeader 
          profile={profileData} 
          handleSignOut={handleSignOut}
          appendSidebar={sideMenus}
          contextChangeTabs={[activeTab, setActiveTab]}
        />
      )}
      
      <div className="flex">
        {session?.user && !isMobile && (
          <Sidebar 
            profile={profileData} 
            onSignOut={handleSignOut} 
            isExpand={isExpand}
            newSidebar={sideMenus}
            contextChangeTabs={[activeTab, setActiveTab]}
          />
        )}
      
        {/* Mobile Navigation */}
        {isMobile && (
          <div className="w-full bg-white shadow-sm border-b">
            <div className="flex space-x-1 p-4">
              {['overview', 'bots', 'users'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                    activeTab === tab 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="w-full p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">System Overview</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Bots</h3>
                  <p className="text-3xl font-bold text-blue-600">{bots.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Bots</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {bots.filter(bot => bot.type === 'active').length}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Posts</h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {bots.reduce((sum, bot) => sum + bot.postsCount, 0)}
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {bots.slice(0, 5).map(bot => (
                    <div key={bot._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{bot.displayName}</p>
                        <p className="text-sm text-gray-600">@{bot.username}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(bot.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bots Tab */}
          {activeTab === 'bots' && (
            <div className='w-full'>
              <div className="flex justify-between items-center mb-6 w-full">
                <h1 className="text-2xl font-bold text-gray-900">Bot Management</h1>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-gray-800 text-white rounded-full transition-colors"
                  >
                    Create New Bot
                  </button>
                  <button
                    onClick={fetchBots}
                    className="px-4 py-2 bg-none text-gray-900 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-8">Loading bots...</div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bot Info
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stats
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bots.map((bot) => (
                          <tr key={bot._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={bot.avatarUrl || '/default-avatar.png'}
                                    alt={bot.displayName}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {bot.displayName}
                                  </div>
                                  <div className="text-sm text-gray-500">@{bot.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>Posts: {bot.postsCount}</div>
                              <div>Followers: {bot.followersCount}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                bot.type === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {bot.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(bot.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => handleViewBot(bot)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteBot(bot._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>
              <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
                <p className="text-gray-600">User management functionality coming soon...</p>
                <p className="text-sm text-gray-500 mt-2">
                  This section will allow you to manage user accounts, permissions, and access levels.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bot Details Modal */}
      {showModal && selectedBot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Bot Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedBot.avatarUrl || '/default-avatar.png'}
                    alt={selectedBot.displayName}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{selectedBot.displayName}</h3>
                    <p className="text-gray-600">@{selectedBot.username}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedBot.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedBot.type}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Shell</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedBot.shell}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <div className="mt-1 text-sm text-gray-900">{formatDate(selectedBot.createdAt)}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    {selectedBot.dio || 'No bio available'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Script</label>
                  <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded font-mono">
                    {selectedBot.script || 'No script available'}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleDeleteBot(selectedBot._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete Bot
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Bot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Create New Bot</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                    setError(null)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateBot} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                    
                    <div>
                      <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name *
                      </label>
                      <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Bot display name"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="unique_username"
                        pattern="[a-zA-Z0-9_]+"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Only letters, numbers, and underscores allowed</p>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="bot@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Secure password"
                        minLength={6}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="dio" className="block text-sm font-medium text-gray-700 mb-1">
                        Bio/Description
                      </label>
                      <textarea
                        id="dio"
                        name="dio"
                        value={formData.dio}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Bot description or bio"
                      />
                    </div>
                  </div>

                  {/* Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Configuration</h3>
                    
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                        Bot Type *
                      </label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="inactive">Inactive</option>
                        <option value="active">Active</option>
                        <option value="testing">Testing</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="shell" className="block text-sm font-medium text-gray-700 mb-1">
                        Shell *
                      </label>
                      <select
                        id="shell"
                        name="shell"
                        value={formData.shell}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="bash">Bash</option>
                        <option value="zsh">Zsh</option>
                        <option value="fish">Fish</option>
                        <option value="powershell">PowerShell</option>
                        <option value="cmd">CMD</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-1">
                        Avatar URL
                      </label>
                      <input
                        type="url"
                        id="avatarUrl"
                        name="avatarUrl"
                        value={formData.avatarUrl}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>

                    <div>
                      <label htmlFor="coverUrl" className="block text-sm font-medium text-gray-700 mb-1">
                        Cover URL
                      </label>
                      <input
                        type="url"
                        id="coverUrl"
                        name="coverUrl"
                        value={formData.coverUrl}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com/cover.jpg"
                      />
                    </div>

                    <div>
                      <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700 mb-1">
                        Owner ID (Optional)
                      </label>
                      <input
                        type="text"
                        id="ownerId"
                        name="ownerId"
                        value={formData.ownerId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Leave empty to use current user"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty to assign to current user</p>
                    </div>
                  </div>
                </div>

                {/* Script Section */}

                {/* Script Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Bot Script</h3>
                  <div>
                    <label htmlFor="script" className="block text-sm font-medium text-gray-700 mb-1">
                      Bot Script/Code *
                    </label>
                    <textarea
                      id="script"
                      name="script"
                      value={formData.script}
                      onChange={handleInputChange}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="Enter bot script or code here..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">The main script that defines bot behavior</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      resetForm()
                      setError(null)
                    }}
                    className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    disabled={createLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={createLoading}
                  >
                    {createLoading ? 'Creating...' : 'Create Bot'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}