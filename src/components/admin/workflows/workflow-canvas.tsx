'use client'

import { useCallback, useRef, useState, useMemo } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type NodeChange,
  type EdgeChange,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { BaseNode } from './nodes'
import { NodePalette, PropertiesPanel } from './panels'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'
import type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowStepType,
  StepConfig,
  WorkflowWithSteps,
  CanvasData,
} from '@/lib/workflows/types'

const nodeTypes = {
  trigger: BaseNode,
  send_email: BaseNode,
  send_sms: BaseNode,
  create_task: BaseNode,
  update_field: BaseNode,
  create_record: BaseNode,
  wait: BaseNode,
  decision: BaseNode,
  send_message: BaseNode,
  webhook: BaseNode,
  end: BaseNode,
}

interface WorkflowCanvasProps {
  workflow: WorkflowWithSteps
  onSave: (
    steps: Array<{
      step_key: string
      step_type: string
      step_order: number
      step_config: StepConfig
      position_x: number
      position_y: number
      next_step_key?: string | null
    }>,
    canvasData: CanvasData
  ) => Promise<void>
  emailTemplates?: { id: string; name: string }[]
  isSaving?: boolean
}

function WorkflowCanvasInner({
  workflow,
  onSave,
  emailTemplates = [],
  isSaving = false,
}: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()
  const [hasChanges, setHasChanges] = useState(false)

  // Convert workflow steps to ReactFlow nodes
  const initialNodes: WorkflowNode[] = useMemo(() => {
    return workflow.steps.map(step => ({
      id: step.step_key,
      type: step.step_type,
      position: { x: step.position_x, y: step.position_y },
      data: {
        label: getLabelForStepType(step.step_type, step.step_config),
        stepType: step.step_type as WorkflowStepType,
        stepKey: step.step_key,
        config: step.step_config as StepConfig,
        condition: step.condition || undefined,
        branches: step.branches || undefined,
      },
    }))
  }, [workflow.steps])

  // Convert workflow steps to ReactFlow edges
  const initialEdges: WorkflowEdge[] = useMemo(() => {
    const edges: WorkflowEdge[] = []

    workflow.steps.forEach(step => {
      // Handle regular next_step_key connections
      if (step.next_step_key) {
        edges.push({
          id: `${step.step_key}-${step.next_step_key}`,
          source: step.step_key,
          target: step.next_step_key,
          animated: false,
        })
      }

      // Handle decision branches
      if (step.branches) {
        step.branches.forEach(branch => {
          edges.push({
            id: `${step.step_key}-${branch.next_step_key}-${branch.condition}`,
            source: step.step_key,
            sourceHandle: branch.condition === 'true' ? 'yes' : 'no',
            target: branch.next_step_key,
            animated: false,
            data: { condition: branch.condition },
            style:
              branch.condition === 'true'
                ? { stroke: '#22c55e' }
                : { stroke: '#ef4444' },
          })
        })
      }
    })

    return edges
  }, [workflow.steps])

  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes)
  const [edges, setEdges] = useState<WorkflowEdge[]>(initialEdges)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)

  const onNodesChange = useCallback((changes: NodeChange<WorkflowNode>[]) => {
    setNodes(nds => applyNodeChanges(changes, nds) as WorkflowNode[])
    setHasChanges(true)
  }, [])

  const onEdgesChange = useCallback((changes: EdgeChange<WorkflowEdge>[]) => {
    setEdges(eds => applyEdgeChanges(changes, eds) as WorkflowEdge[])
    setHasChanges(true)
  }, [])

  const onConnect = useCallback((connection: Connection) => {
    setEdges(
      eds =>
        addEdge(
          {
            ...connection,
            animated: false,
          },
          eds
        ) as WorkflowEdge[]
    )
    setHasChanges(true)
  }, [])

  const onNodeClick = useCallback((_: React.MouseEvent, node: WorkflowNode) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData(
        'application/reactflow'
      ) as WorkflowStepType
      const label = event.dataTransfer.getData('application/reactflow-label')

      if (!type) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      // Generate unique step key
      const stepKey = `${type}_${Date.now()}`

      const newNode: WorkflowNode = {
        id: stepKey,
        type,
        position,
        data: {
          label: label || type,
          stepType: type,
          stepKey,
          config: {},
        },
      }

      setNodes(nds => nds.concat(newNode))
      setHasChanges(true)
    },
    [screenToFlowPosition]
  )

  const handleUpdateNode = useCallback((nodeId: string, config: StepConfig) => {
    setNodes(nds =>
      nds.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              config,
              label: getLabelForStepType(node.data.stepType, config),
            },
          }
        }
        return node
      })
    )
    setSelectedNode(prev =>
      prev && prev.id === nodeId
        ? {
            ...prev,
            data: {
              ...prev.data,
              config,
              label: getLabelForStepType(prev.data.stepType, config),
            },
          }
        : prev
    )
    setHasChanges(true)
  }, [])

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(node => node.id !== nodeId))
    setEdges(eds =>
      eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
    )
    setSelectedNode(null)
    setHasChanges(true)
  }, [])

  const handleSave = useCallback(async () => {
    // Convert nodes/edges back to step format
    const steps = nodes.map((node, index) => {
      // Find outgoing edges
      const outgoingEdges = edges.filter(e => e.source === node.id)
      let next_step_key: string | null = null

      // For non-decision nodes, use the first edge
      if (node.data.stepType !== 'decision' && outgoingEdges.length > 0) {
        next_step_key = outgoingEdges[0]?.target ?? null
      }

      return {
        step_key: node.data.stepKey,
        step_type: node.data.stepType,
        step_order: index + 1,
        step_config: node.data.config,
        position_x: Math.round(node.position.x),
        position_y: Math.round(node.position.y),
        next_step_key,
        // For decision nodes, include branches
        ...(node.data.stepType === 'decision' && {
          branches: outgoingEdges.map(edge => ({
            condition: edge.sourceHandle === 'yes' ? 'true' : 'false',
            next_step_key: edge.target,
          })),
        }),
      }
    })

    const canvasData: CanvasData = {}

    await onSave(steps, canvasData)
    setHasChanges(false)
  }, [nodes, edges, onSave])

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Node Palette */}
      <NodePalette />

      {/* Main Canvas */}
      <div className="flex-1 h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{
            type: 'smoothstep',
          }}
          className="bg-dots-pattern"
        >
          <Controls position="bottom-left" />
          <MiniMap
            position="bottom-right"
            nodeStrokeWidth={3}
            className="!bg-background"
          />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

          {/* Save Button Panel */}
          <Panel position="top-right" className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Workflow'}
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Right Sidebar - Properties Panel */}
      <PropertiesPanel
        selectedNode={selectedNode}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        emailTemplates={emailTemplates}
      />
    </div>
  )
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  )
}

// Helper function to generate labels
function getLabelForStepType(
  stepType: WorkflowStepType,
  config: StepConfig
): string {
  switch (stepType) {
    case 'trigger':
      return 'Trigger'
    case 'send_email':
      return config.template_name || 'Send Email'
    case 'send_sms':
      return config.template_name || 'Send SMS'
    case 'create_task':
      return config.title || 'Create Task'
    case 'update_field':
      return config.field ? `Update ${config.field}` : 'Update Field'
    case 'create_record':
      return config.record_type
        ? `Create ${config.record_type}`
        : 'Create Record'
    case 'wait':
      if (config.wait_days) return `Wait ${config.wait_days} day(s)`
      if (config.wait_hours) return `Wait ${config.wait_hours} hour(s)`
      if (config.wait_until_field)
        return `Wait until ${config.wait_until_field}`
      return 'Wait'
    case 'decision':
      if (config.condition_field) {
        return `If ${config.condition_field}`
      }
      return 'Decision'
    case 'send_message':
      return 'Portal Message'
    case 'webhook':
      return config.webhook_url ? 'Webhook' : 'Webhook'
    case 'end':
      return 'End'
    default:
      return stepType
  }
}
