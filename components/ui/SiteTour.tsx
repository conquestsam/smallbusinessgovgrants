'use client';

import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { Button, Group, Tooltip } from '@mantine/core';
import { IconRoute } from '@tabler/icons-react';

interface SiteTourProps {
  /** Page context for step selection */
  page?: 'dashboard' | 'funding' | 'applications' | 'support' | 'admin' | 'withdraw';
}

export function SiteTour({ page = 'dashboard' }: SiteTourProps) {
  const [hasSeenTour, setHasSeenTour] = useState(true);

  useEffect(() => {
    const tourKey = `sba-tour-${page}`;
    const seen = localStorage.getItem(tourKey);
    if (!seen) {
      setHasSeenTour(false);
      const timer = setTimeout(() => {
        startTour(tourKey);
      }, 1500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const startTour = (tourKey: string) => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayColor: 'rgba(0, 46, 109, 0.6)',
      stagePadding: 10,
      stageRadius: 12,
      popoverClass: 'sba-tour-popover',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Get Started!',
      onDestroyed: () => {
        localStorage.setItem(tourKey, 'true');
        setHasSeenTour(true);
      },
      steps: getTourSteps(page),
    });
    driverObj.drive();
  };

  const handleRestartTour = () => {
    const tourKey = `sba-tour-${page}`;
    localStorage.removeItem(tourKey);
    setHasSeenTour(false);
    startTour(tourKey);
  };

  return (
    <Group justify="flex-end" mb="xs">
      <Tooltip label="Restart page tour" withArrow>
        <Button
          variant="subtle"
          color="gray"
          size="compact-xs"
          leftSection={<IconRoute size={14} />}
          onClick={handleRestartTour}
          style={{ opacity: 0.6, transition: 'opacity 0.2s' }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.6'; }}
        >
          Tour
        </Button>
      </Tooltip>
    </Group>
  );
}

function getTourSteps(page: string) {
  const dashboardSteps = [
    {
      element: '.mantine-AppShell-navbar',
      popover: {
        title: '📍 Navigation Sidebar',
        description: 'Access all platform features from here — grants, funding, applications, support, and settings.',
        side: 'right' as const,
        align: 'start' as const,
      },
    },
    {
      element: '.mantine-AppShell-header',
      popover: {
        title: '🔒 Secure Header',
        description: 'Your account menu, notifications, and global search are always available here.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      popover: {
        title: '📊 Your Dashboard',
        description: 'This is your command center. View application status, account balance, recent activity, and quick actions — all at a glance.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      popover: {
        title: '💰 Funding & Deposits',
        description: 'Navigate to Funding to deposit via bank transfer, cryptocurrency, or card payments through our secure Stripe integration.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      popover: {
        title: '📋 Grant Applications',
        description: 'Submit new grant applications and track their progress through the review pipeline. You\'ll receive notifications at every stage.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      popover: {
        title: '🎉 You\'re All Set!',
        description: 'Explore the platform at your own pace. If you need help, visit the Support Portal anytime. Welcome aboard!',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
  ];

  const fundingSteps = [
    {
      popover: {
        title: '💳 Funding & Deposits',
        description: 'This page lets you add funds to your account through multiple secure payment methods.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      popover: {
        title: '🏦 Payment Methods',
        description: 'Choose from bank transfers, cryptocurrency, or instant card payments via Stripe. Each card shows processing time and fees.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      popover: {
        title: '📋 Copy Account Details',
        description: 'For bank and crypto payments, use the copy button to easily copy account numbers, wallet addresses, and routing details.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      popover: {
        title: '🔒 Secure Transactions',
        description: 'All transactions are SSL encrypted and PCI-DSS Level 1 compliant. Your financial data is always protected.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      popover: {
        title: '✅ Payment Verification',
        description: 'After making your payment, click "Select Gateway" to submit proof of payment. Automated payments clear instantly, manual ones within 24 hours.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
  ];

  const applicationsSteps = [
    {
      popover: {
        title: '📋 Application Management',
        description: 'View and manage all your grant applications in one place. Track status, amounts, and review history.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      popover: {
        title: '📊 Application Status',
        description: 'Each application shows its current status: Pending, Under Review, Approved, or Rejected. Status updates trigger email notifications.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      popover: {
        title: '💵 Request Withdrawals',
        description: 'Once approved, you can request fund withdrawals directly from this page. Multiple payment methods are supported.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      popover: {
        title: '📄 Documents & Details',
        description: 'Click any application to see full details including financial info, documents, and the complete review timeline.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
  ];

  const supportSteps = [
    {
      popover: {
        title: '🎧 Support Portal',
        description: 'Welcome to the SBA Support Portal. Create tickets, track issues, and get help from our team.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      popover: {
        title: '📝 Create a Ticket',
        description: 'Submit a new support ticket with category, priority level, and description. Our team responds within 24 hours.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      popover: {
        title: '💬 Real-Time Chat',
        description: 'Once a ticket is created, communicate with our support team through real-time messaging within each ticket.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
  ];

  const withdrawSteps = [
    {
      popover: {
        title: '💸 Withdrawal History',
        description: 'View all your past and pending withdrawal requests with real-time status tracking.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      popover: {
        title: '📊 Track Payments',
        description: 'Monitor the status of each withdrawal — from submission through processing to completion.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
  ];

  switch (page) {
    case 'dashboard':
    case 'admin':
      return dashboardSteps;
    case 'funding':
      return fundingSteps;
    case 'applications':
      return applicationsSteps;
    case 'support':
      return supportSteps;
    case 'withdraw':
      return withdrawSteps;
    default:
      return dashboardSteps;
  }
}

/** Helper to manually re-trigger the tour */
export function resetSiteTour(page = 'dashboard') {
  localStorage.removeItem(`sba-tour-${page}`);
  window.location.reload();
}
