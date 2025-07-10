import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-pink-100">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="bg-white shadow-xl rounded-3xl p-8 border-2 border-pink-100">
          <div className="text-8xl mb-6">🤔</div>
          <h1 className="text-4xl font-extrabold mb-4 text-pink-600 drop-shadow-lg tracking-wide">
            Oops! Page Not Found
          </h1>
          <p className="text-pink-700 mb-8 text-lg">
            The page you're looking for doesn't exist.
          </p>
          <Link
            href="/"
            className="inline-block bg-pink-500 text-white px-8 py-3 rounded-full font-bold text-lg shadow hover:bg-pink-600 transition-all duration-200"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  )
} 