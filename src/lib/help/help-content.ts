/**
 * Context-aware help content for admin pages
 * Maps URL paths to helpful tips and quick links
 */

export interface HelpTip {
  title: string
  description: string
  link?: {
    label: string
    href: string
  }
}

export interface HelpContent {
  title: string
  tips: HelpTip[]
  quickLinks?: {
    label: string
    href: string
  }[]
}

export const helpContentByPath: Record<string, HelpContent> = {
  '/admin': {
    title: 'Dashboard',
    tips: [
      {
        title: 'Monitor your pipeline',
        description:
          'The dashboard shows your key metrics at a glance. Track leads, revenue, and upcoming births all in one place.',
      },
      {
        title: 'Quick navigation',
        description:
          'Press ? at any time to see keyboard shortcuts for fast navigation.',
      },
      {
        title: 'New to the CRM?',
        description:
          'Start by completing your setup checklist to configure your business settings.',
        link: {
          label: 'Go to Setup',
          href: '/admin/setup',
        },
      },
    ],
    quickLinks: [
      { label: 'Add a Lead', href: '/admin/leads/new' },
      { label: 'View All Leads', href: '/admin/leads' },
      { label: 'Settings', href: '/admin/setup' },
    ],
  },
  '/admin/leads': {
    title: 'Leads',
    tips: [
      {
        title: 'Track your pipeline',
        description:
          'Use stages like Inquiry, Consultation Scheduled, and Client to track where each lead is in your process.',
      },
      {
        title: 'Filter and search',
        description:
          'Use the filter bar to find leads by status, source, or any custom field.',
      },
      {
        title: 'Bulk actions',
        description:
          'Select multiple leads to update their status, assign them, or send communications in bulk.',
      },
    ],
    quickLinks: [
      { label: 'Add New Lead', href: '/admin/leads/new' },
      { label: 'Import Leads', href: '/admin/setup/migration' },
    ],
  },
  '/admin/workflows': {
    title: 'Workflows',
    tips: [
      {
        title: 'Automate follow-ups',
        description:
          'Create workflows to automatically send emails, create tasks, or update records when triggers occur.',
      },
      {
        title: 'Start with templates',
        description:
          'Use pre-built workflow templates to get started quickly with common automation patterns.',
        link: {
          label: 'Browse Templates',
          href: '/admin/workflows/templates',
        },
      },
      {
        title: 'Test before activating',
        description:
          'Use the test mode to see what actions would be taken without actually executing them.',
      },
    ],
    quickLinks: [
      { label: 'Create Workflow', href: '/admin/workflows/new' },
      { label: 'Workflow Templates', href: '/admin/workflows/templates' },
    ],
  },
  '/admin/reports': {
    title: 'Reports',
    tips: [
      {
        title: 'Build custom reports',
        description:
          'Create reports to analyze leads, revenue, conversions, and more. Save and schedule reports for regular delivery.',
      },
      {
        title: 'Visualize your data',
        description:
          'Choose from charts, tables, and other visualizations to present your data clearly.',
      },
      {
        title: 'Export your data',
        description:
          'Export reports to CSV or PDF for sharing with your team or accountant.',
      },
    ],
    quickLinks: [
      { label: 'Create Report', href: '/admin/reports/new' },
      { label: 'View Dashboards', href: '/admin/dashboards' },
    ],
  },
  '/admin/messages': {
    title: 'Messages',
    tips: [
      {
        title: 'Real-time messaging',
        description:
          'Chat with clients in real-time. Messages are delivered instantly and stay organized by conversation.',
      },
      {
        title: 'Message from anywhere',
        description:
          'Access the messages panel from any page using the message icon in the header.',
      },
      {
        title: 'Typing indicators',
        description:
          'See when clients are typing a response to keep conversations flowing smoothly.',
      },
    ],
  },
  '/admin/team': {
    title: 'Team',
    tips: [
      {
        title: 'Manage your team',
        description:
          'Add team members, assign roles, and track who is assigned to each client.',
      },
      {
        title: 'On-call schedule',
        description:
          'Set up on-call schedules so clients know who is available to support them.',
      },
      {
        title: 'Time tracking',
        description:
          'Track time spent with clients for billing and workload management.',
      },
    ],
    quickLinks: [
      { label: 'Invite Team Member', href: '/admin/setup/users' },
      { label: 'On-Call Schedule', href: '/admin/team/oncall' },
    ],
  },
  '/admin/setup': {
    title: 'Setup',
    tips: [
      {
        title: 'Configure your business',
        description:
          'Set up your organization profile, services, email templates, and more.',
      },
      {
        title: 'Customize workflows',
        description:
          'Configure automation rules for your specific business processes.',
      },
      {
        title: 'Manage integrations',
        description:
          'Connect external services like payment processors and calendars.',
      },
    ],
    quickLinks: [
      { label: 'Organization', href: '/admin/setup/organization' },
      { label: 'Services', href: '/admin/setup/services' },
      { label: 'Email Templates', href: '/admin/setup/email-templates' },
    ],
  },
}

export function getHelpContentForPath(path: string): HelpContent {
  // Try exact match first
  if (helpContentByPath[path]) {
    return helpContentByPath[path]
  }

  // Try parent path (e.g., /admin/leads/123 -> /admin/leads)
  const segments = path.split('/')
  while (segments.length > 2) {
    segments.pop()
    const parentPath = segments.join('/')
    if (helpContentByPath[parentPath]) {
      return helpContentByPath[parentPath]
    }
  }

  // Default help content
  return {
    title: 'Help',
    tips: [
      {
        title: 'Need help?',
        description:
          'Navigate to a specific page to see context-aware tips and resources.',
      },
      {
        title: 'Keyboard shortcuts',
        description: 'Press ? to see available keyboard shortcuts.',
      },
    ],
    quickLinks: [
      { label: 'Dashboard', href: '/admin' },
      { label: 'Setup', href: '/admin/setup' },
    ],
  }
}
