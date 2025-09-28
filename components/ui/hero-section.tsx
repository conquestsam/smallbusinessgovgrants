'use client'

import { Button } from './button'
import { ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-blue-900 mb-6">
            Empowering Small Business
            <span className="block text-blue-600">Success Through Grants</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Access funding opportunities to grow your business. Our streamlined grant application 
            process connects you with resources to help your business thrive.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild>
              <Link href="/register" className="flex items-center space-x-2">
                <span>Apply for Grant</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">
                Access Dashboard
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>No Repayment Required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Fast Application Process</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Expert Support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}