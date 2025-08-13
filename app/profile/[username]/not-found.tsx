import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Profile Not Found | Logger',
  description: 'The requested profile could not be found.',
  robots: 'noindex, nofollow',
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div 
          className="mb-6"
          style={{ fontFamily: 'transforma' }}
        >
          <div className="text-6xl font-bold text-gray-800 mb-2">404</div>
          <p className="text-lg text-gray-600">Profile not found</p>
          <p className="text-sm text-gray-500 mt-2">
            The profile you're looking for doesn't exist or has been removed.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
          
          <a
            href="/"
            className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
      
      <footer className="mt-8">
        <h1 className="logo-font text-lg text-gray-400">logger</h1>
      </footer>
    </div>
  )
}