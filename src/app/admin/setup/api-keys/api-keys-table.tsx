'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Key,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  Ban,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import type { ApiKey } from '@/app/actions/api-keys'
import { EditApiKeyDialog } from './edit-api-key-dialog'
import { ViewApiKeyDialog } from './view-api-key-dialog'
import { RevokeApiKeyDialog } from './revoke-api-key-dialog'
import { RegenerateApiKeyDialog } from './regenerate-api-key-dialog'
import { DeleteApiKeyDialog } from './delete-api-key-dialog'

interface ApiKeysTableProps {
  keys: ApiKey[]
}

export function ApiKeysTable({ keys }: ApiKeysTableProps) {
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null)
  const [dialogOpen, setDialogOpen] = useState<
    'view' | 'edit' | 'revoke' | 'regenerate' | 'delete' | null
  >(null)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusBadge = (key: ApiKey) => {
    if (key.revoked_at) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Revoked
        </Badge>
      )
    }
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return (
        <Badge
          variant="outline"
          className="gap-1 border-yellow-300 bg-yellow-50 text-yellow-700"
        >
          <Clock className="h-3 w-3" />
          Expired
        </Badge>
      )
    }
    if (!key.is_active) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Ban className="h-3 w-3" />
          Inactive
        </Badge>
      )
    }
    return (
      <Badge
        variant="outline"
        className="gap-1 border-green-300 bg-green-50 text-green-700"
      >
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    )
  }

  const getPermissionsSummary = (permissions: Record<string, string[]>) => {
    const entries = Object.entries(permissions)
    if (entries.length === 0) return 'No permissions'
    if (entries.length === 1) {
      const [resource, actions] = entries[0]!
      return `${resource}: ${actions.join(', ')}`
    }
    return `${entries.length} resources`
  }

  const openDialog = (key: ApiKey, type: typeof dialogOpen) => {
    setSelectedKey(key)
    setDialogOpen(type)
  }

  const closeDialog = () => {
    setSelectedKey(null)
    setDialogOpen(null)
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map(key => (
            <TableRow key={key.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{key.name}</p>
                  {key.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {key.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {key.key_prefix}...
                  </code>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(key)}</TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {getPermissionsSummary(key.permissions)}
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(key.last_used_at)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {key.expires_at ? formatDate(key.expires_at) : 'Never'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openDialog(key, 'view')}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openDialog(key, 'edit')}
                      disabled={!!key.revoked_at}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => openDialog(key, 'regenerate')}
                      disabled={!!key.revoked_at}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate Key
                    </DropdownMenuItem>
                    {!key.revoked_at && (
                      <DropdownMenuItem
                        onClick={() => openDialog(key, 'revoke')}
                        className="text-yellow-600"
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Revoke
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => openDialog(key, 'delete')}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialogs */}
      <ViewApiKeyDialog
        apiKey={selectedKey}
        open={dialogOpen === 'view'}
        onOpenChange={open => !open && closeDialog()}
      />
      <EditApiKeyDialog
        apiKey={selectedKey}
        open={dialogOpen === 'edit'}
        onOpenChange={open => !open && closeDialog()}
      />
      <RevokeApiKeyDialog
        apiKey={selectedKey}
        open={dialogOpen === 'revoke'}
        onOpenChange={open => !open && closeDialog()}
      />
      <RegenerateApiKeyDialog
        apiKey={selectedKey}
        open={dialogOpen === 'regenerate'}
        onOpenChange={open => !open && closeDialog()}
      />
      <DeleteApiKeyDialog
        apiKey={selectedKey}
        open={dialogOpen === 'delete'}
        onOpenChange={open => !open && closeDialog()}
      />
    </>
  )
}
