'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ClientDetailTabsProps {
  overviewTab: React.ReactNode
  servicesTab: React.ReactNode
  meetingsTab: React.ReactNode
  documentsTab: React.ReactNode
  paymentsTab: React.ReactNode
  activityTab: React.ReactNode
  notesTab: React.ReactNode
}

export function ClientDetailTabs({
  overviewTab,
  servicesTab,
  meetingsTab,
  documentsTab,
  paymentsTab,
  activityTab,
  notesTab,
}: ClientDetailTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="services">Services</TabsTrigger>
        <TabsTrigger value="meetings">Meetings</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        {overviewTab}
      </TabsContent>

      <TabsContent value="services" className="mt-6">
        {servicesTab}
      </TabsContent>

      <TabsContent value="meetings" className="mt-6">
        {meetingsTab}
      </TabsContent>

      <TabsContent value="documents" className="mt-6">
        {documentsTab}
      </TabsContent>

      <TabsContent value="payments" className="mt-6">
        {paymentsTab}
      </TabsContent>

      <TabsContent value="activity" className="mt-6">
        {activityTab}
      </TabsContent>

      <TabsContent value="notes" className="mt-6">
        {notesTab}
      </TabsContent>
    </Tabs>
  )
}
