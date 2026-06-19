import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/videos', label: 'Videos' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/settings', label: 'Settings' },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="16" height="16" rx="3" stroke="#18181b" strokeWidth="2" fill="none"/>
                <line x1="12" y1="9" x2="12" y2="15" stroke="#18181b" strokeWidth="2" strokeLinecap="round"/>
                <line x1="9" y1="12" x2="15" y2="12" stroke="#18181b" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-[#E8E8E8]">Post</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {!isHome && navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === link.href
                    ? 'text-[#E8E8E8] bg-[#141414]'
                    : 'text-[#909090] hover:text-[#E8E8E8] hover:bg-[#1A1A1A]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isHome ? (
              <>
                <Link to="/login">
                  <Button variant="secondary" size="sm">Sign In</Button>
                </Link>
                <Link to="/login">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            ) : (
              <Link to="/help">
                <Button variant="secondary" size="sm">Help</Button>
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[#1A1A1A] bg-[#0A0A0A]"
          >
            <nav className="flex flex-col p-4 gap-2">
              {isHome ? (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-3 text-sm font-medium text-[#0A0A0A] bg-[#E8E8E8] rounded-xl text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="px-4 py-3 text-sm font-medium text-[#909090] hover:text-[#E8E8E8] bg-[#141414] rounded-xl text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                        location.pathname === link.href
                          ? 'text-[#E8E8E8] bg-[#141414]'
                          : 'text-[#909090] hover:text-[#E8E8E8] hover:bg-[#1A1A1A]'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    to="/help"
                    className="px-4 py-3 text-sm font-medium text-[#909090] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Help
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
