'use client'

import { useState } from 'react'
import { trackFAQExpand } from '@/lib/analytics'

/**
 * FAQ Accordion Component
 *
 * Collapsible FAQ items with smooth animations and analytics tracking.
 */

export interface FAQItem {
  question: string
  answer: string | React.ReactNode
  category?: string
}

interface FAQAccordionProps {
  items: FAQItem[]
  defaultOpen?: number
  className?: string
}

export function FAQAccordion({
  items,
  defaultOpen,
  className = '',
}: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen ?? null)

  const toggleItem = (index: number, question: string) => {
    const newIndex = openIndex === index ? null : index

    // Track when user expands an FAQ
    if (newIndex !== null) {
      trackFAQExpand({ question })
    }

    setOpenIndex(newIndex)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item, index) => (
        <FAQItem
          key={index}
          item={item}
          isOpen={openIndex === index}
          onToggle={() => toggleItem(index, item.question)}
        />
      ))}
    </div>
  )
}

interface FAQItemProps {
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
}

function FAQItem({ item, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-serif text-lg font-semibold text-foreground">
          {item.question}
        </span>
        <svg
          className={`h-5 w-5 flex-shrink-0 text-primary transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-border px-6 pb-6 pt-4">
          {typeof item.answer === 'string' ? (
            <p className="text-muted-foreground leading-relaxed">
              {item.answer}
            </p>
          ) : (
            <div className="prose prose-sm max-w-none text-muted-foreground">
              {item.answer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
