import Link from "next/link"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 font-inter text-gray-900">
      <link href="https://fonts.googleapis.com/css2?family=Alkatra&family=Tiro+Bangla&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Fixed Header: Clean, minimalist, and responsive */}
      <header className="fixed top-0 left-0 w-full bg-white bg-opacity-95 backdrop-blur-sm shadow-sm z-50 py-4 px-6 md:px-8">
        <div className="container mx-auto flex justify-between items-center max-w-6xl">
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight logo-font">
            Zeeta
          </h1>
          <nav>
            <ul className="flex space-x-4 sm:space-x-6">
              <li>
                <Link href="/auth/sign-in" className="text-gray-700 hover:text-black transition-colors duration-200 font-medium text-base sm:text-lg">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/auth/sign-up" className="text-gray-700 hover:text-black transition-colors duration-200 font-medium text-base sm:text-lg">
                  Get Started
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main content container with responsive padding and top margin for fixed header */}
      <div className="container mx-auto px-4 py-16 pt-28 sm:pt-36 max-w-6xl">
        {/* Centered content area */}
        <div className="max-w-3xl mx-auto text-center">
          {/* Main heading with refined size and spacing */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight" style={{ fontFamily: "Alkatra, cursive" }}>
            Join the <span className="text-gray-700">Conversation</span>.
          </h1>
          {/* Sub-paragraph with improved line height and responsive text size */}
          <p className="text-lg sm:text-xl leading-relaxed text-gray-700 mb-12 max-w-2xl mx-auto">
            Share your thoughts. Connect with others. A microblogging experience reimagined for the modern world.
          </p>

          {/* Action buttons section with improved spacing and hover effects */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-20 sm:mb-28">
            {/* "Get Started" button: Dark background, light text */}
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center justify-center text-lg sm:text-xl px-8 sm:px-10 py-3 sm:py-4
                         bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full shadow-lg
                         transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
            >
              Get Started
            </Link>
            {/* "Sign In" button: Light background, dark text, subtle border */}
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center justify-center text-lg sm:text-xl px-8 sm:px-10 py-3 sm:py-4
                         bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold rounded-full shadow-lg
                         transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 