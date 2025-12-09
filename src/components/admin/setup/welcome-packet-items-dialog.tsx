'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  getWelcomePacketItems,
  createWelcomePacketItem,
  updateWelcomePacketItem,
  deleteWelcomePacketItem,
  reorderWelcomePacketItems,
} from '@/app/actions/setup'
import type {
  WelcomePacket,
  WelcomePacketItem,
  WelcomePacketItemType,
} from '@/lib/supabase/types'
import {
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  FileText,
  Mail,
  ClipboardList,
  MessageSquare,
  CheckSquare,
  Clock,
  Edit2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'

const itemFormSchema = z.object({
  item_type: z.enum([
    'document',
    'email',
    'form',
    'custom_message',
    'action_item',
  ]),
  custom_title: z.string().min(1, 'Title is required').max(200),
  custom_content: z.string().max(2000).optional(),
  delay_hours: z.number().min(0).max(720), // Max 30 days
  is_required: z.boolean(),
})

type ItemFormData = z.infer<typeof itemFormSchema>

const itemTypeOptions: {
  value: WelcomePacketItemType
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}[] = [
  {
    value: 'custom_message',
    label: 'Welcome Message',
    icon: MessageSquare,
    description: 'A personalized message to welcome the client',
  },
  {
    value: 'action_item',
    label: 'Action Item',
    icon: CheckSquare,
    description: 'A task for the client to complete',
  },
  {
    value: 'document',
    label: 'Document',
    icon: FileText,
    description: 'A document to share with the client',
  },
  {
    value: 'email',
    label: 'Email',
    icon: Mail,
    description: 'Send an automated email',
  },
  {
    value: 'form',
    label: 'Form',
    icon: ClipboardList,
    description: 'An intake form for the client to fill out',
  },
]

function getItemTypeInfo(type: WelcomePacketItemType) {
  const found = itemTypeOptions.find(opt => opt.value === type)
  // Provide default fallback since we know itemTypeOptions has at least one entry
  return (
    found ?? {
      value: 'custom_message' as WelcomePacketItemType,
      label: 'Custom Message',
      icon: MessageSquare,
      description: 'A custom message',
    }
  )
}

interface WelcomePacketItemsDialogProps {
  children: React.ReactNode
  packet: WelcomePacket
}

export function WelcomePacketItemsDialog({
  children,
  packet,
}: WelcomePacketItemsDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<WelcomePacketItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<WelcomePacketItem | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      item_type: 'custom_message',
      custom_title: '',
      custom_content: '',
      delay_hours: 0,
      is_required: false,
    },
  })

  const loadItems = useCallback(async () => {
    setIsLoading(true)
    const result = await getWelcomePacketItems(packet.id)
    if (result.success && result.items) {
      setItems(result.items)
    }
    setIsLoading(false)
  }, [packet.id])

  useEffect(() => {
    if (open) {
      loadItems()
    }
  }, [open, loadItems])

  const resetForm = () => {
    form.reset({
      item_type: 'custom_message',
      custom_title: '',
      custom_content: '',
      delay_hours: 0,
      is_required: false,
    })
    setEditingItem(null)
    setShowAddForm(false)
  }

  const onSubmit = async (data: ItemFormData) => {
    setIsSaving(true)
    setServerError(null)

    try {
      if (editingItem) {
        const result = await updateWelcomePacketItem(editingItem.id, {
          item_type: data.item_type,
          custom_title: data.custom_title,
          custom_content: data.custom_content || null,
          delay_hours: data.delay_hours,
          is_required: data.is_required,
        })

        if (result.success) {
          await loadItems()
          resetForm()
        } else {
          setServerError(result.error || 'Failed to update item')
        }
      } else {
        const result = await createWelcomePacketItem({
          packet_id: packet.id,
          item_type: data.item_type,
          custom_title: data.custom_title,
          custom_content: data.custom_content || null,
          delay_hours: data.delay_hours,
          is_required: data.is_required,
          sort_order: items.length,
        })

        if (result.success) {
          await loadItems()
          resetForm()
        } else {
          setServerError(result.error || 'Failed to create item')
        }
      }
    } catch {
      setServerError('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (item: WelcomePacketItem) => {
    setEditingItem(item)
    form.reset({
      item_type: item.item_type,
      custom_title: item.custom_title || '',
      custom_content: item.custom_content || '',
      delay_hours: item.delay_hours,
      is_required: item.is_required,
    })
    setShowAddForm(true)
  }

  const handleDelete = async (itemId: string) => {
    const result = await deleteWelcomePacketItem(itemId)
    if (result.success) {
      await loadItems()
    } else {
      setServerError(result.error || 'Failed to delete item')
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const newItems = [...items]
    const itemAtIndex = newItems[index]
    const itemAbove = newItems[index - 1]
    if (itemAtIndex && itemAbove) {
      newItems[index] = itemAbove
      newItems[index - 1] = itemAtIndex
      setItems(newItems)
      await reorderWelcomePacketItems(
        packet.id,
        newItems.map(i => i.id)
      )
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index === items.length - 1) return
    const newItems = [...items]
    const itemAtIndex = newItems[index]
    const itemBelow = newItems[index + 1]
    if (itemAtIndex && itemBelow) {
      newItems[index] = itemBelow
      newItems[index + 1] = itemAtIndex
      setItems(newItems)
      await reorderWelcomePacketItems(
        packet.id,
        newItems.map(i => i.id)
      )
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
      setServerError(null)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Packet Items</DialogTitle>
          <DialogDescription>
            Add, edit, and reorder items in &quot;{packet.name}&quot;
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Items List */}
          <ScrollArea className="flex-1 min-h-[200px] max-h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No items in this packet yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Add items to send to clients
                </p>
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {items.map((item, index) => {
                  const typeInfo = getItemTypeInfo(item.item_type)
                  const Icon = typeInfo.icon

                  return (
                    <Card key={item.id} className="group">
                      <CardContent className="flex items-start gap-3 p-3">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <button
                            type="button"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === items.length - 1}
                            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="rounded-lg bg-muted p-2">
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {item.custom_title}
                            </span>
                            {item.is_required && (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{typeInfo.label}</span>
                            {item.delay_hours > 0 && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.delay_hours}h delay
                                </span>
                              </>
                            )}
                          </div>
                          {item.custom_content && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {item.custom_content}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          {/* Add/Edit Form */}
          {showAddForm ? (
            <Card>
              <CardContent className="p-4">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {editingItem ? 'Edit Item' : 'Add New Item'}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={resetForm}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="item_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Type *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {itemTypeOptions.map(option => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    <div className="flex items-center gap-2">
                                      <option.icon className="h-4 w-4" />
                                      {option.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="delay_hours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delay (hours)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="720"
                                {...field}
                                value={field.value ?? 0}
                                onChange={e =>
                                  field.onChange(
                                    e.target.value === ''
                                      ? 0
                                      : parseInt(e.target.value)
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Hours after trigger to send
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="custom_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Welcome to the Family!"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="custom_content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add detailed content or instructions..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Use {'{{client_name}}'}, {'{{due_date}}'}, etc. for
                            dynamic content
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_required"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                          <div>
                            <FormLabel>Required</FormLabel>
                            <FormDescription>
                              Client must complete this item
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {editingItem ? 'Save Changes' : 'Add Item'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
