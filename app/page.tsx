'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// import { supabase } from '@/lib/supabase'
// import Header from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, DollarSign, Shield, ArrowRight } from 'lucide-react'
import VisitorNotification from '@/components/ui/visitorNotification'
import { Navigation } from '@/components/ui/navigation'
import { HeroSection } from '@/components/ui/hero-section'
import { FAQSection } from '@/components/ui/faq-section'
import { Footer } from '@/components/ui/footer'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  // useEffect(() => {
  //   const checkUser = async () => {
  //     const { data: { user } } = await supabase.auth.getUser()
  //     setUser(user)

  //     if (user) {
  //       const { data: profile } = await supabase
  //         .from('profiles')
  //         .select('*')
  //         .eq('user_id', user.id)
  //         .single()
  //       setProfile(profile)

  //       // Redirect based on role
  //       if (profile?.role === 'admin') {
  //         router.push('/admin')
  //       } else {
  //         router.push('/dashboard')
  //       }
  //     }
  //   }

  //   checkUser()
  // }, [router])

  // if (user) {
  //   return <div>Redirecting...</div>
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <VisitorNotification/>
      <Navigation /> 
      <HeroSection />
      {/* <Header /> */}
      
      {/* Hero Section */}
      {/* <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-800 mb-6">
            SBA Loan Application Portal
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Streamline your small business loan application process with our secure, government-style platform. 
            Get the funding you need to grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
              onClick={() => router.push('/register')}
            >
              Start Application
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg"
              onClick={() => router.push('/login')}
            >
              Existing Users
            </Button>
          </div>
        </div>
      </section> */}

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Built with security and efficiency in mind, following government standards for grant processing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Easy Application</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>]
                  Streamlined application process with step-by-step guidance and document upload
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Expert Review</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Professional Grant officers review each application with personalized feedback
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Fast Funding</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Quick approval process with funds available for withdrawal upon approval
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">Secure Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Bank-level security with encrypted data transmission and secure document storage
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Simple 4-Step Process
            </h2>
            <p className="text-xl text-slate-600">
              From application to funding in as little as 24 hours
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Register & Apply",
                description: "Create your account and fill out the grant application form"
              },
              {
                step: "2",
                title: "Upload Documents",
                description: "Securely upload required financial documents and statements"
              },
              {
                step: "3",
                title: "Review Process",
                description: "Our team reviews your application and provides feedback"
              },
              {
                step: "4",
                title: "Get Funded",
                description: "Upon approval, request withdrawal of your approved funds"
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses that have successfully secured funding through our platform
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
            onClick={() => router.push('/register')}
          >
            Apply Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
      <FAQSection />
      <Footer />
    </div>
  )
}