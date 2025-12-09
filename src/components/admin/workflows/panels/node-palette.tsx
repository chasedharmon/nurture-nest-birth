'use client'

import { cn } from '@/lib/utils'
import { NODE_PALETTE, type WorkflowStepType } from '@/lib/workflows/types'
import {
  Zap,
  Mail,
  MessageSquare,
  CheckSquare,
  Edit,
  Plus,
  Clock,
  GitBranch,
  MessageCircle,
  Globe,
  Square,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

const iconMap: Record<string, React.ElementType> = {
  Zap,
  Mail,
  MessageSquare,
  CheckSquare,
  Edit,
  Plus,
  Clock,
  GitBranch,
  MessageCircle,
  Globe,
  Square,
}

interface NodePaletteProps {
  onDragStart?: (
    event: React.DragEvent,
    nodeType: WorkflowStepType,
    label: string
  ) => void
}

export function NodePalette({ onDragStart }: NodePaletteProps) {
  const triggers = NODE_PALETTE.filter(n => n.category === 'trigger')
  const actions = NODE_PALETTE.filter(n => n.category === 'action')
  const logic = NODE_PALETTE.filter(n => n.category === 'logic')
  const utility = NODE_PALETTE.filter(n => n.category === 'utility')

  const handleDragStart = (
    event: React.DragEvent,
    nodeType: WorkflowStepType,
    label: string
  ) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.setData('application/reactflow-label', label)
    event.dataTransfer.effectAllowed = 'move'
    onDragStart?.(event, nodeType, label)
  }

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Node Palette</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Drag nodes to the canvas
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Triggers */}
          <NodeCategory
            title="Triggers"
            nodes={triggers}
            onDragStart={handleDragStart}
          />

          {/* Actions */}
          <NodeCategory
            title="Actions"
            nodes={actions}
            onDragStart={handleDragStart}
          />

          {/* Logic */}
          <NodeCategory
            title="Logic"
            nodes={logic}
            onDragStart={handleDragStart}
          />

          {/* Utility */}
          <NodeCategory
            title="Utility"
            nodes={utility}
            onDragStart={handleDragStart}
          />
        </div>
      </ScrollArea>
    </div>
  )
}

interface NodeCategoryProps {
  title: string
  nodes: typeof NODE_PALETTE
  onDragStart: (
    event: React.DragEvent,
    nodeType: WorkflowStepType,
    label: string
  ) => void
}

function NodeCategory({ title, nodes, onDragStart }: NodeCategoryProps) {
  if (nodes.length === 0) return null

  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {title}
      </h4>
      <div className="space-y-1.5">
        {nodes.map(node => {
          const Icon = iconMap[node.icon] || Square
          return (
            <div
              key={node.type}
              draggable
              onDragStart={e => onDragStart(e, node.type, node.label)}
              className={cn(
                'flex items-center gap-2 p-2 rounded-md border bg-background',
                'cursor-grab active:cursor-grabbing',
                'hover:border-primary/50 hover:bg-accent transition-colors'
              )}
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{node.label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {node.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
