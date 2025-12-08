'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Trash2,
  Copy,
  Settings,
  GripVertical,
  Hash,
  BarChart3,
  Table2,
  FileText,
  List,
  GitBranch,
  Gauge,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { cn } from '@/lib/utils'
import type { EditorWidget } from './dashboard-editor'
import type { WidgetType, Report } from '@/lib/supabase/types'

// Grid constants
const GRID_COLS = 12
const CELL_HEIGHT = 60 // pixels per grid unit
const GAP = 8 // pixels between cells

interface WidgetGridEditorProps {
  widgets: EditorWidget[]
  selectedWidgetId: string | null
  onSelectWidget: (id: string | null) => void
  onUpdatePosition: (
    id: string,
    position: {
      grid_x: number
      grid_y: number
      grid_width: number
      grid_height: number
    }
  ) => void
  onDeleteWidget: (id: string) => void
  onDuplicateWidget: (id: string) => void
  isPreview?: boolean
  availableReports: Report[]
}

interface DragState {
  widgetId: string
  type: 'move' | 'resize'
  startX: number
  startY: number
  startGridX: number
  startGridY: number
  startWidth: number
  startHeight: number
}

const WIDGET_ICONS: Record<WidgetType, React.ElementType> = {
  metric: Hash,
  chart: BarChart3,
  table: Table2,
  report: FileText,
  list: List,
  funnel: GitBranch,
  gauge: Gauge,
  calendar: Calendar,
}

export function WidgetGridEditor({
  widgets,
  selectedWidgetId,
  onSelectWidget,
  onUpdatePosition,
  onDeleteWidget,
  onDuplicateWidget,
  isPreview = false,
  availableReports,
}: WidgetGridEditorProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [previewPosition, setPreviewPosition] = useState<{
    grid_x: number
    grid_y: number
    grid_width: number
    grid_height: number
  } | null>(null)

  // Calculate grid dimensions
  const maxY = Math.max(
    ...widgets.map(w => w.grid_y + w.grid_height),
    8 // Minimum height
  )

  const gridHeight = maxY * CELL_HEIGHT + (maxY - 1) * GAP + CELL_HEIGHT * 2 // Extra space at bottom

  const getGridPosition = useCallback((clientX: number, clientY: number) => {
    if (!gridRef.current) return { x: 0, y: 0 }

    const rect = gridRef.current.getBoundingClientRect()
    const cellWidth = (rect.width - (GRID_COLS - 1) * GAP) / GRID_COLS

    const x = Math.max(
      0,
      Math.min(
        GRID_COLS - 1,
        Math.round((clientX - rect.left) / (cellWidth + GAP))
      )
    )
    const y = Math.max(
      0,
      Math.round((clientY - rect.top) / (CELL_HEIGHT + GAP))
    )

    return { x, y }
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, widgetId: string, type: 'move' | 'resize') => {
      if (isPreview) return
      e.preventDefault()
      e.stopPropagation()

      const widget = widgets.find(w => w.id === widgetId)
      if (!widget) return

      setDragState({
        widgetId,
        type,
        startX: e.clientX,
        startY: e.clientY,
        startGridX: widget.grid_x,
        startGridY: widget.grid_y,
        startWidth: widget.grid_width,
        startHeight: widget.grid_height,
      })

      onSelectWidget(widgetId)
    },
    [widgets, isPreview, onSelectWidget]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState || isPreview) return

      const { x, y } = getGridPosition(e.clientX, e.clientY)

      if (dragState.type === 'move') {
        const widget = widgets.find(w => w.id === dragState.widgetId)
        if (!widget) return

        const newX = Math.max(0, Math.min(GRID_COLS - widget.grid_width, x))
        const newY = Math.max(0, y)

        setPreviewPosition({
          grid_x: newX,
          grid_y: newY,
          grid_width: widget.grid_width,
          grid_height: widget.grid_height,
        })
      } else {
        // Resize - simplified calculation
        const widthDelta = x - dragState.startGridX - dragState.startWidth + 1
        const heightDelta = y - dragState.startGridY - dragState.startHeight + 1

        setPreviewPosition({
          grid_x: dragState.startGridX,
          grid_y: dragState.startGridY,
          grid_width: Math.max(
            1,
            Math.min(
              GRID_COLS - dragState.startGridX,
              dragState.startWidth + widthDelta
            )
          ),
          grid_height: Math.max(1, dragState.startHeight + heightDelta),
        })
      }
    },
    [dragState, isPreview, getGridPosition, widgets]
  )

  const handleMouseUp = useCallback(() => {
    if (!dragState || !previewPosition) {
      setDragState(null)
      setPreviewPosition(null)
      return
    }

    onUpdatePosition(dragState.widgetId, previewPosition)
    setDragState(null)
    setPreviewPosition(null)
  }, [dragState, previewPosition, onUpdatePosition])

  const getWidgetStyle = (widget: EditorWidget) => {
    const isBeingDragged = dragState?.widgetId === widget.id && previewPosition
    const position = isBeingDragged ? previewPosition : widget

    return {
      gridColumn: `${position.grid_x + 1} / span ${position.grid_width}`,
      gridRow: `${position.grid_y + 1} / span ${position.grid_height}`,
      opacity: isBeingDragged ? 0.7 : 1,
      zIndex: isBeingDragged ? 100 : 1,
    }
  }

  const renderWidgetContent = (widget: EditorWidget) => {
    const Icon = WIDGET_ICONS[widget.widget_type]

    // In preview mode, we could render actual widget content
    // For now, show placeholder
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Icon className="h-8 w-8 mb-2" />
        <span className="text-sm font-medium">{widget.title}</span>
        {widget.data_source === 'report' && widget.report_id && (
          <span className="text-xs mt-1">
            Report:{' '}
            {availableReports.find(r => r.id === widget.report_id)?.name ||
              'Unknown'}
          </span>
        )}
      </div>
    )
  }

  if (widgets.length === 0 && !isPreview) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No widgets yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Click on a widget type in the left panel to add it to your
            dashboard. You can then drag and resize widgets to arrange your
            layout.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={gridRef}
      className="relative"
      style={{ minHeight: gridHeight }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Grid Background (only in edit mode) */}
      {!isPreview && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: `calc((100% - ${(GRID_COLS - 1) * GAP}px) / ${GRID_COLS} + ${GAP}px) ${CELL_HEIGHT + GAP}px`,
            opacity: 0.3,
          }}
        />
      )}

      {/* Widgets Grid */}
      <div
        className="relative grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridAutoRows: CELL_HEIGHT,
        }}
      >
        {widgets.map(widget => {
          const isSelected = selectedWidgetId === widget.id

          return (
            <ContextMenu key={widget.id}>
              <ContextMenuTrigger asChild>
                <Card
                  className={cn(
                    'relative overflow-hidden transition-all cursor-pointer',
                    isSelected &&
                      !isPreview &&
                      'ring-2 ring-primary ring-offset-2',
                    dragState?.widgetId === widget.id && 'cursor-grabbing'
                  )}
                  style={getWidgetStyle(widget)}
                  onClick={() => !isPreview && onSelectWidget(widget.id)}
                >
                  {/* Drag Handle (edit mode only) */}
                  {!isPreview && (
                    <div
                      className="absolute top-0 left-0 right-0 h-8 flex items-center px-2 bg-muted/50 cursor-grab active:cursor-grabbing"
                      onMouseDown={e => handleMouseDown(e, widget.id, 'move')}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-xs font-medium truncate flex-1">
                        {widget.title}
                      </span>
                      {isSelected && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={e => {
                              e.stopPropagation()
                              onDuplicateWidget(widget.id)
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={e => {
                              e.stopPropagation()
                              onDeleteWidget(widget.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Widget Content */}
                  <CardContent
                    className={cn(
                      'h-full flex items-center justify-center',
                      !isPreview && 'pt-8'
                    )}
                  >
                    {renderWidgetContent(widget)}
                  </CardContent>

                  {/* Resize Handle (edit mode, selected only) */}
                  {!isPreview && isSelected && (
                    <div
                      className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-primary rounded-tl-md"
                      onMouseDown={e => handleMouseDown(e, widget.id, 'resize')}
                    />
                  )}
                </Card>
              </ContextMenuTrigger>

              {!isPreview && (
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => onSelectWidget(widget.id)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onDuplicateWidget(widget.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    className="text-destructive"
                    onClick={() => onDeleteWidget(widget.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              )}
            </ContextMenu>
          )
        })}
      </div>

      {/* Drop Preview Ghost */}
      {dragState && previewPosition && (
        <div
          className="absolute border-2 border-dashed border-primary rounded-lg pointer-events-none"
          style={{
            left: `calc((100% / ${GRID_COLS}) * ${previewPosition.grid_x})`,
            top: previewPosition.grid_y * (CELL_HEIGHT + GAP),
            width: `calc((100% / ${GRID_COLS}) * ${previewPosition.grid_width} - ${GAP}px)`,
            height:
              previewPosition.grid_height * CELL_HEIGHT +
              (previewPosition.grid_height - 1) * GAP,
            backgroundColor: 'hsl(var(--primary) / 0.1)',
          }}
        />
      )}
    </div>
  )
}
