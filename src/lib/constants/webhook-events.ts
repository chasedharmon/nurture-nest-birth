/**
 * Webhook Event definitions
 *
 * These constants define the available webhook events.
 */

export const WEBHOOK_EVENTS = {
  lead: {
    label: 'Leads',
    events: [
      { value: 'lead.created', label: 'Lead Created' },
      { value: 'lead.updated', label: 'Lead Updated' },
      { value: 'lead.status_changed', label: 'Lead Status Changed' },
      { value: 'lead.converted', label: 'Lead Converted' },
    ],
  },
  client: {
    label: 'Clients',
    events: [
      { value: 'client.created', label: 'Client Created' },
      { value: 'client.updated', label: 'Client Updated' },
    ],
  },
  appointment: {
    label: 'Appointments',
    events: [
      { value: 'appointment.scheduled', label: 'Appointment Scheduled' },
      { value: 'appointment.cancelled', label: 'Appointment Cancelled' },
      { value: 'appointment.completed', label: 'Appointment Completed' },
    ],
  },
  document: {
    label: 'Documents',
    events: [
      { value: 'document.uploaded', label: 'Document Uploaded' },
      { value: 'document.signed', label: 'Document Signed' },
    ],
  },
  invoice: {
    label: 'Invoices',
    events: [
      { value: 'invoice.created', label: 'Invoice Created' },
      { value: 'invoice.paid', label: 'Invoice Paid' },
      { value: 'invoice.overdue', label: 'Invoice Overdue' },
    ],
  },
  contract: {
    label: 'Contracts',
    events: [
      { value: 'contract.sent', label: 'Contract Sent' },
      { value: 'contract.signed', label: 'Contract Signed' },
    ],
  },
  message: {
    label: 'Messages',
    events: [{ value: 'message.received', label: 'Message Received' }],
  },
} as const

export type WebhookEventType =
  (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS]['events'][number]['value']
