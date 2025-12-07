'use client'

import { InlineWidget } from 'react-calendly'

interface CalendlyWidgetProps {
  url: string
  minHeight?: number
}

export function CalendlyWidget({ url, minHeight = 630 }: CalendlyWidgetProps) {
  return (
    <div className="calendly-widget-container">
      <InlineWidget
        url={url}
        styles={{
          height: `${minHeight}px`,
          minWidth: '100%',
        }}
      />
    </div>
  )
}
