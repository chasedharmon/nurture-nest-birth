'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ClientDetailTabsProps {
  overviewTab: React.ReactNode
  teamTab: React.ReactNode
  servicesTab: React.ReactNode
  meetingsTab: React.ReactNode
  documentsTab: React.ReactNode
  paymentsTab: React.ReactNode
  invoicesTab: React.ReactNode
  contractsTab: React.ReactNode
  activityTab: React.ReactNode
  notesTab: React.ReactNode
  defaultTab?: string
  onTabChange?: (tab: string) => void
}

export function ClientDetailTabs({
  overviewTab,
  teamTab,
  servicesTab,
  meetingsTab,
  documentsTab,
  paymentsTab,
  invoicesTab,
  contractsTab,
  activityTab,
  notesTab,
  defaultTab = 'overview',
  onTabChange,
}: ClientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    onTabChange?.(value)
  }

  return (
    <Tabs
      defaultValue="overview"
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="services">Services</TabsTrigger>
        <TabsTrigger value="meetings">Meetings</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="invoices">Invoices</TabsTrigger>
        <TabsTrigger value="contracts">Contracts</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        {overviewTab}
      </TabsContent>

      <TabsContent value="team" className="mt-6">
        {teamTab}
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

      <TabsContent value="invoices" className="mt-6">
        {invoicesTab}
      </TabsContent>

      <TabsContent value="contracts" className="mt-6">
        {contractsTab}
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
