'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { USER_ROLES } from '@/utils/constants'
import { 
  LogOut, Loader2, UtensilsCrossed, Bell, BellOff, 
  Fullscreen, Minimize, Clock, Menu, X, ChefHat 
} from 'lucide-react'
import { format } from 'date-fns'

export default function KitchenLayout({ children }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const [isFullScreen, setIsFullScreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== USER_ROLES.KITCHEN_STAFF) {
        router.replace('/login')
      }
    }
  }, [user, loading, router])

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Fullscreen toggle handler
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err))
      setIsFullScreen(true)
    } else {
      document.exitFullscreen().catch(err => console.error(err))
      setIsFullScreen(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-[rgb(0,173,181)] mx-auto mb-4" />
          <p className="text-white text-sm sm:text-base font-medium">Loading Kitchen Display...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 z-40 px-4 sm:px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[rgb(0,173,181)]/20 rounded-lg">
            <ChefHat className="h-6 w-6 sm:h-7 sm:w-7 text-[rgb(0,173,181)]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">Kitchen Display</h2>
            <p className="text-xs text-gray-400">{user.name || 'Kitchen Staff'}</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Minimal & Kitchen-focused */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 sm:w-80 bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 flex flex-col shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo/Header - Enhanced */}
        <div className="p-6 sm:p-8 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[rgb(0,173,181)] to-[rgb(0,153,161)] rounded-xl shadow-lg">
              <ChefHat className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate">Kitchen Display</h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 font-medium truncate">
                {user.name || 'Kitchen Staff'}
              </p>
            </div>
          </div>
        </div>

        {/* Live Clock Display - Prominent */}
        <div className="p-6 border-b border-gray-700/50 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[rgb(0,173,181)]/10 rounded-lg">
                <Clock className="h-5 w-5 text-[rgb(0,173,181)]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Current Time</p>
                <p className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">
                  {format(currentTime, 'HH:mm:ss')}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400 font-medium">
            {format(currentTime, 'EEEE, MMMM dd, yyyy')}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 sm:px-6 py-6 space-y-3 overflow-y-auto">
          <SidebarItem
            icon={<UtensilsCrossed size={20} />}
            label="Kitchen Orders"
            active={pathname === '/kitchen' || pathname === '/kitchen/orders'}
            onClick={() => router.push('/kitchen/orders')}
          />
          {/* Add more kitchen-specific pages later */}
        </nav>

        {/* Bottom Controls - Enhanced */}
        <div className="border-t border-gray-700 p-4 sm:p-6 space-y-3 bg-gray-900/50">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              soundEnabled 
                ? 'bg-[rgb(0,173,181)]/20 text-[rgb(0,173,181)] hover:bg-[rgb(0,173,181)]/30' 
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              {soundEnabled ? <Bell size={18} /> : <BellOff size={18} />}
              <span>{soundEnabled ? 'Sound Enabled' : 'Sound Disabled'}</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${soundEnabled ? 'bg-green-500' : 'bg-gray-500'}`} />
          </button>

          {/* Full Screen Toggle */}
          <button
            onClick={toggleFullScreen}
            className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-all"
          >
            <div className="flex items-center gap-3">
              {isFullScreen ? <Minimize size={18} /> : <Fullscreen size={18} />}
              <span>{isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
            </div>
          </button>

          {/* Logout - Prominent */}
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pt-20 lg:pt-0">
        {children}
      </main>
    </div>
  )
}

/* Sidebar Item Component - Enhanced */
function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-xl px-4 py-4 text-sm font-bold transition-all transform ${
        active
          ? 'bg-gradient-to-r from-[rgb(0,173,181)] to-[rgb(0,153,161)] text-white shadow-lg scale-[1.02]'
          : 'text-gray-300 hover:bg-gray-700/70 hover:text-white hover:scale-[1.01]'
      }`}
    >
      <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
        {icon}
      </span>
      <span className="text-left">{label}</span>
      {active && (
        <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />
      )}
    </button>
  )
}