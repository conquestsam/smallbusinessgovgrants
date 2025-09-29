'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const faqs = [
  {
    question: 'What types of businesses are eligible for grants?',
    answer: 'Small businesses, startups, and established companies across various industries may be eligible. Eligibility depends on factors such as business size, industry, and specific grant requirements.'
  },
  {
    question: 'How long does the application process take?',
    answer: 'The application process typically takes 3-5 business days for initial review. Complex applications may require additional time for thorough evaluation.'
  },
  {
    question: 'What documents do I need to submit?',
    answer: 'Required documents include business registration, tax returns, bank statements, business financials, and a detailed business plan. Specific requirements may vary by grant type.'
  },
  {
    question: 'Is there a fee to apply?',
    answer: 'Our grant application is completely free, But we do charge for the application submission to get reviewed.'
  },
  {
    question: 'Can I apply for multiple grants?',
    answer: 'Yes, you can apply for multiple grants as long as you meet the eligibility criteria for each program. Each application will be reviewed independently.'
  },
  {
    question: 'How will I know if my application is approved?',
    answer: 'You will receive email notifications about your application status. You can also check your dashboard for real-time updates on your application progress.'
  }
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Get answers to common questions about our grant process
          </p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border rounded-lg">
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-lg font-semibold text-blue-900">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-blue-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-blue-600" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}