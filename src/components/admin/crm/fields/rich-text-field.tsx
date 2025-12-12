'use client'

import { useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Bold, Italic, List, ListOrdered, Link } from 'lucide-react'
import type { BaseFieldProps } from './field-types'

/**
 * RichTextField - Rich text editor with basic formatting
 *
 * For now, uses a simple textarea with markdown-style formatting hints.
 * Can be upgraded to a full WYSIWYG editor later (Tiptap, Lexical, etc.)
 */
export function RichTextField({
  field,
  value,
  onChange,
  disabled,
  readOnly,
  error,
  className,
}: BaseFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const currentValue =
    value !== null && value !== undefined ? String(value) : ''

  const insertMarkdown = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = currentValue.substring(start, end)
    const newText =
      currentValue.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      currentValue.substring(end)

    onChange(newText)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, end + prefix.length)
    }, 0)
  }

  if (readOnly) {
    return (
      <div
        className={cn(
          'text-sm py-2 prose prose-sm max-w-none dark:prose-invert',
          className
        )}
        dangerouslySetInnerHTML={{
          __html: simpleMarkdownToHtml(String(value || '')),
        }}
      />
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 p-1 border rounded-md bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => insertMarkdown('**')}
          disabled={disabled}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => insertMarkdown('_')}
          disabled={disabled}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => insertMarkdown('\n- ', '')}
          disabled={disabled}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => insertMarkdown('\n1. ', '')}
          disabled={disabled}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => insertMarkdown('[', '](url)')}
          disabled={disabled}
          title="Link"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      <Textarea
        ref={textareaRef}
        data-field-id={field.id}
        value={currentValue}
        onChange={e => onChange(e.target.value || null)}
        disabled={disabled}
        placeholder={`Enter ${field.label.toLowerCase()}...`}
        aria-invalid={!!error}
        rows={6}
        className="resize-y min-h-[150px] font-mono text-sm"
      />

      <p className="text-xs text-muted-foreground">
        Supports **bold**, _italic_, [links](url), and lists
      </p>
    </div>
  )
}

/**
 * Simple markdown to HTML converter for read-only display
 */
function simpleMarkdownToHtml(text: string): string {
  if (!text) return ''

  return (
    text
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Links
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" class="text-primary underline">$1</a>'
      )
      // Line breaks
      .replace(/\n/g, '<br />')
      // Bullet lists (basic)
      .replace(/^- (.*?)(<br \/>|$)/gm, '<li>$1</li>')
  )
}
