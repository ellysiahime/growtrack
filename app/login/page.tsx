'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-pink-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white shadow-xl rounded-3xl p-8 border-2 border-pink-100">
          <h1 className="text-3xl font-extrabold mb-8 text-center text-pink-600 drop-shadow-lg tracking-wide">
          🧠📊 GrowTrack
          </h1>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-pink-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-pink-300 rounded-full px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium transition-all duration-200"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-pink-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-pink-300 rounded-full px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium transition-all duration-200"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-red-600 text-center font-bold text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-pink-500 text-white py-3 rounded-full font-bold text-lg shadow hover:bg-pink-600 disabled:opacity-50 transition-all duration-200"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
