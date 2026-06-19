import { Link, useLocation } from 'react-router-dom'
import { Youtube, Twitter, Github, Linkedin } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const footerLinks = {
  product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'API', href: '/#' },
    { label: 'Security', href: '/#' },
  ],
  company: [
    { label: 'About', href: '/#' },
    { label: 'Blog', href: '/#' },
    { label: 'Careers', href: '/#' },
    { label: 'Contact', href: '/#' },
  ],
  resources: [
    { label: 'Documentation', href: '/help' },
    { label: 'Help Center', href: '/help' },
    { label: 'Community', href: '/#' },
    { label: 'Status', href: '/#' },
  ],
  legal: [
    { label: 'Privacy', href: '/#' },
    { label: 'Terms', href: '/#' },
    { label: 'Cookie Policy', href: '/#' },
  ],
}

const socialLinks = [
  { icon: Twitter, href: '/#', label: 'Twitter' },
  { icon: Github, href: '/#', label: 'GitHub' },
  { icon: Linkedin, href: '/#', label: 'LinkedIn' },
]

export function Footer() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  if (!isHome && location.pathname !== '/help') return null

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Youtube className="w-5 h-5 text-black" />
              </div>
              <span className="text-lg font-bold text-white">TubeScale</span>
            </Link>
            <p className="text-sm text-zinc-400 mb-4 max-w-xs">
              Scale your YouTube empire with AI-powered video creation and multi-channel management.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator />

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} TubeScale. All rights reserved.
          </p>
          <p className="text-sm text-zinc-500">
            Built for creators who think big.
          </p>
        </div>
      </div>
    </footer>
  )
}
