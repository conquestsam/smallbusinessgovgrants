'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, LogIn, UserPlus, ChevronDown, Search } from 'lucide-react'
import { Button } from './button'

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navigationItems = [
    {
      name: 'Business Guide',
      href: '#',
      submenu: [
        { name: 'Starting a business', href: '#' },
        { name: 'Writing a business plan', href: '#' },
        { name: 'Choosing a business structure', href: '#' },
        { name: 'Business registration', href: '#' },
        { name: 'Managing a business', href: '#' }
      ]
    },
    {
      name: 'Funding Programs',
      href: '#',
      submenu: [
        { name: 'SBA loans', href: '#' },
        { name: 'Grants', href: '#' },
        { name: 'Microloans', href: '#' },
        { name: 'Investment capital', href: '#' }
      ]
    },
    {
      name: 'Federal Contracting',
      href: '#',
      submenu: [
        { name: 'Government contracting', href: '#' },
        { name: 'Contracting programs', href: '#' },
        { name: 'Subcontracting', href: '#' }
      ]
    },
    {
      name: 'Learning Platform',
      href: '#',
      submenu: [
        { name: 'Local assistance', href: '/local-assistance' },
        { name: 'Online learning', href: '/online-learning' },
        { name: 'Courses & events', href: '/courses-events' }
      ]
    },
    {
      name: 'Disaster assistance',
      href: '/disaster-assistance',
      submenu: [
        { name: 'Disaster loans', href: '#' },
        { name: 'Recovery resources', href: '#' },
        { name: 'Preparedness', href: '#' }
      ]
    }, 
    {
      name: 'Priorities',
      href: '#',
      submenu: [
        { name: 'Putting Americans First ', href: '#' },
        { name: 'Increasing access to capital', href: '#' },
        { name: 'Interagency capital for small businesses', href: '#' }
      ]
    }
  ];



  return (
       <header className="w-full bg-white shadow-sm border-b border-gray-200">
      {/* Top bar */}
      <div className="bg-gray-50 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex space-x-6">
              <span className="text-gray-600">An official website of the United States government</span>
            </div>
            <div className="flex space-x-4">
              <a href="/espanol" className="text-blue-600 hover:text-blue-800">Español</a>
              <a href="/contact" className="text-blue-600 hover:text-blue-800">Contact</a>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="https://www.sba.gov/themes/custom/sba/dist/img/logo-horizontal.svg" // Update this path to your actual logo file
              alt="SBA Grant Platform Logo"
              className="h-14 mr-10" // Adjust height and margin as needed
            />
            <div>
              {/* <h1 className="text-xl font-bold text-gray-900">U.S. Small Business Administration</h1> */}
              {/* <p className="text-sm text-gray-600">America's SBDC</p> */}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => setActiveDropdown(item.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center text-gray-700 hover:text-blue-600 font-medium">
                  {item.name}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                
                {activeDropdown === item.name && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      {item.submenu.map((subItem) => (
                        <a
                          key={subItem.name}
                          href={subItem.href}
                          className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                        >
                          {subItem.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
         

          {/* Search and Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" className="hidden md:flex">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden"
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-4">
              {navigationItems.map((item) => (
                <div key={item.name}>
                  <button 
                    className="flex items-center justify-between w-full text-left text-gray-700 font-medium py-2"
                    onClick={() => setActiveDropdown(activeDropdown === item.name ? null : item.name)}
                  >
                    {item.name}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {activeDropdown === item.name && (
                    <div className="ml-4 space-y-2">
                      {item.submenu.map((subItem) => (
                        <a
                          key={subItem.name}
                          href={subItem.href}
                          className="block text-gray-600 py-1 hover:text-blue-600"
                        >
                          {subItem.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex flex-col space-y-2 px-3 py-2">
                              <Button variant="outline" asChild>
                                <Link href="/login" className="flex items-center justify-center space-x-2">
                                  <LogIn className="w-4 h-4" />
                                  <span>Login</span>
                                </Link>
                              </Button>
                              <Button className='bg-blue-900' asChild>
                                <Link href="/register" className="flex items-center justify-center space-x-2">
                                  <UserPlus className="w-4 h-4" />
                                  <span>Sign Up</span>
                                </Link>
                              </Button>
                            </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}