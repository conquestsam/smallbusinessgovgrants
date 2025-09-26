// components/ui/visitorNotification.tsx
'use client'

import { useEffect } from 'react'

export default function VisitorNotification() {
  useEffect(() => {
    const sendVisitorData = async () => {
      console.log('🌐 VisitorNotification component mounted');
      
      try {
        const visitorData = {
          userAgent: navigator.userAgent || 'Unknown',
          pageUrl: window.location.href,
          referrer: document.referrer,
          language: navigator.language || 'Unknown',
          platform: navigator.platform || 'Unknown'
        }

        console.log('📊 Collected visitor data:', visitorData);

        // Send to our server-side API route
        const response = await fetch('/api/visitor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(visitorData),
        })

        console.log('📡 API response status:', response.status);
        
        const result = await response.json();
        console.log('📨 API response data:', result);

        if (!response.ok) {
          throw new Error(`API error: ${response.status} - ${JSON.stringify(result)}`);
        }

        console.log('✅ Visitor data sent successfully');

      } catch (error) {
        console.error('❌ Error sending visitor data:', error)
      }
    }

    // Add a small delay to ensure the page is fully loaded
    const timer = setTimeout(() => {
      console.log('⏰ Sending visitor data after delay...');
      sendVisitorData();
    }, 1000);

    return () => clearTimeout(timer);
  }, [])

  return null
}