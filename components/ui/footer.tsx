'use client'

import Link from 'next/link'
import { Facebook, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">SBA Grant Platform</h3>
            <p className="text-blue-100 mb-4">
              Empowering small businesses through accessible grant funding and expert support.
            </p>
            <div className="flex space-x-4">
              <Facebook className="w-6 h-6 text-blue-100 hover:text-white cursor-pointer" />
              <Twitter className="w-6 h-6 text-blue-100 hover:text-white cursor-pointer" />
              <Linkedin className="w-6 h-6 text-blue-100 hover:text-white cursor-pointer" />
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-blue-100">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-blue-100">
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <img 
              src="https://www.sba.gov/themes/custom/sba/dist/img/logo-horizontal.svg" // Update this path to your actual logo file
              alt="SBA Grant Platform Logo"
              className="h-14 mr-10 bg-white" // Adjust height and margin as needed
            />
            <div className="space-y-2 text-blue-100">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>support@sbagranta.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>1-800-SBA-GRANT</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Washington, DC</span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-100">
          <p>&copy; 2024 SBA Grant Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}