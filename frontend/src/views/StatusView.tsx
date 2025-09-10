import React from 'react'
import { ListView } from './ListView'

interface Item {
  id: string
  bucket: string
  title: string
  description?: string
  status?: string
  extraFields?: Record<string, any>
  createdAt?: string
}

interface StatusViewProps {
  items: Item[]
  selectedBucket: string
  editingCell: {itemId: string, field: string} | null
  setEditingCell: (cell: {itemId: string, field: string} | null) => void
  editingValue: Record<string, string>
  setEditingValue: (value: Record<string, string>) => void
  bucketFields: Record<string, any[]>
  apiStatuses: Record<string, string[]>
  updateItem: (id: string, title: string, description: string, status: string, extraFields: Record<string, any>) => Promise<void>
  loadItems: () => Promise<void>
  openEditPanel: (item: Item) => void
  itemRelationships: Record<string, any[]>
  notesCounts: Record<string, number>
  setSelectedItemForNotes: (id: string) => void
  loadNotes: (id: string) => Promise<void>
  setShowNotesPanel: (show: boolean) => void
}

export const StatusView: React.FC<StatusViewProps> = (props) => {
  const { items } = props
  
  const statusGroups = items.reduce((groups, item) => {
    const status = item.status || 'No Status'
    if (!groups[status]) groups[status] = []
    groups[status].push(item)
    return groups
  }, {} as Record<string, Item[]>)

  return (
    <div className="space-y-6">
      {Object.entries(statusGroups).map(([status, groupItems]) => (
        <div key={status}>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {status} ({groupItems.length})
          </h3>
          <ListView {...props} items={groupItems} />
        </div>
      ))}
    </div>
  )
}
