import React from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '../components/DataTable'
import { CheckCircle, MessageSquare, CalendarDays, Clock } from 'lucide-react'

interface Item {
  id: string
  bucket: string
  title: string
  description?: string
  status?: string
  extraFields?: Record<string, any>
  createdAt?: string
}

interface ListViewProps {
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

export const ListView: React.FC<ListViewProps> = ({
  items,
  selectedBucket,
  editingCell,
  setEditingCell,
  editingValue,
  setEditingValue,
  bucketFields,
  apiStatuses,
  updateItem,
  loadItems,
  openEditPanel,
  itemRelationships,
  notesCounts,
  setSelectedItemForNotes,
  loadNotes,
  setShowNotesPanel
}) => {
  const columns: ColumnDef<Item>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="text-left min-w-[300px] max-w-[400px]">
          <div className="font-medium">{row.getValue("title")}</div>
          {row.original.description && (
            <p className="text-sm text-gray-600 mt-1 truncate">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const isEditing = editingCell?.itemId === row.original.id && editingCell?.field === 'status'
        
        if (isEditing) {
          const currentBucketStatuses = apiStatuses[selectedBucket] || []
          const statusOptions = currentBucketStatuses.length > 0 ? currentBucketStatuses : 
            ['Planning', 'In Progress', 'On Hold', 'Completed']
          
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <select
                value={status || ''}
                onChange={async (e) => {
                  e.stopPropagation()
                  try {
                    await updateItem(row.original.id, row.original.title, row.original.description || '', e.target.value, row.original.extraFields || {})
                    setEditingCell(null)
                    loadItems()
                  } catch (error) {
                    console.error('Failed to update status:', error)
                    setEditingCell(null)
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setEditingCell(null), 100)
                }}
                autoFocus
                className="px-2 py-1 text-xs border rounded"
              >
                <option value="">Select status</option>
                {statusOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )
        }
        
        return status ? (
          <div 
            className="text-left cursor-pointer hover:bg-gray-50 p-1 rounded"
            onClick={(e) => {
              e.stopPropagation()
              setEditingCell({itemId: row.original.id, field: 'status'})
            }}
          >
            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              {status === 'Completed' && <CheckCircle className="w-3 h-3 mr-1" />}
              {status}
            </span>
          </div>
        ) : (
          <div 
            className="text-left cursor-pointer hover:bg-gray-50 p-1 rounded text-gray-400"
            onClick={(e) => {
              e.stopPropagation()
              setEditingCell({itemId: row.original.id, field: 'status'})
            }}
          >
            Click to set status
          </div>
        )
      },
    },
    {
      id: "notes",
      header: "",
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setSelectedItemForNotes(row.original.id)
            loadNotes(row.original.id)
            setShowNotesPanel(true)
          }}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
          title="Notes"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      ),
      size: 40,
    },
    // Custom fields columns
    ...((bucketFields && bucketFields[selectedBucket]) || []).map((field: any) => ({
      accessorKey: `extraFields.${field.name}`,
      header: field.label || field.name,
      cell: ({ row }: any) => {
        const value = row.original.extraFields?.[field.name]
        const isEditing = editingCell?.itemId === row.original.id && editingCell?.field === field.name
        
        if (isEditing) {
          if (field.type === 'boolean') {
            return (
              <div onClick={(e) => e.stopPropagation()}>
                <select
                  value={value ? 'true' : 'false'}
                  onChange={async (e) => {
                    const newValue = e.target.value === 'true'
                    await updateItem(row.original.id, row.original.title, row.original.description || '', row.original.status || '', {
                      ...row.original.extraFields,
                      [field.name]: newValue
                    })
                    setEditingCell(null)
                    loadItems()
                  }}
                  className="w-full p-1 border rounded text-sm"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            )
          }
          
          if (field.type === 'array') {
            return (
              <div onClick={(e) => e.stopPropagation()}>
                <select
                  value={Array.isArray(value) ? value.join(',') : value || ''}
                  onChange={async (e) => {
                    const newValue = field.multiSelect ? e.target.value.split(',').filter(Boolean) : e.target.value
                    await updateItem(row.original.id, row.original.title, row.original.description || '', row.original.status || '', {
                      ...row.original.extraFields,
                      [field.name]: newValue
                    })
                    setEditingCell(null)
                    loadItems()
                  }}
                  className="w-full p-1 border rounded text-sm"
                >
                  <option value="">Select...</option>
                  {field.arrayOptions?.map((option: string) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            )
          }
          
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <input
                type={field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
                value={value || ''}
                onChange={async (e) => {
                  await updateItem(row.original.id, row.original.title, row.original.description || '', row.original.status || '', {
                    ...row.original.extraFields,
                    [field.name]: e.target.value
                  })
                  setEditingCell(null)
                  loadItems()
                }}
                onBlur={() => setEditingCell(null)}
                className="w-full p-1 border rounded text-sm"
                autoFocus
              />
            </div>
          )
        }
        
        // Display mode with click to edit
        const displayValue = (() => {
          if (field.type === 'boolean') {
            return (
              <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {value ? '✓ Yes' : '✗ No'}
              </span>
            )
          }
          
          if (field.type === 'date') {
            return value ? new Date(value).toLocaleDateString() : ''
          }
          
          if (field.type === 'array') {
            const arrayValue = Array.isArray(value) ? value : (value ? [value] : [])
            return arrayValue.map((item: string, index: number) => (
              <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mr-1">
                {item}
              </span>
            ))
          }
          
          if (field.name === 'priority') {
            return value ? (
              <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                value === 'High' ? 'bg-red-100 text-red-700' :
                value === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {value}
              </span>
            ) : ''
          }
          
          return value || ''
        })()
        
        return (
          <div 
            className="text-left cursor-pointer hover:bg-gray-50 p-1 rounded"
            onClick={(e) => {
              e.stopPropagation()
              setEditingCell({itemId: row.original.id, field: field.name})
            }}
          >
            {displayValue || <span className="text-gray-400">Click to set</span>}
          </div>
        )
      },
    })),
  ]

  return (
    <DataTable 
      columns={columns} 
      data={items} 
      onRowClick={openEditPanel}
      itemRelationships={itemRelationships}
      currentBucket={selectedBucket}
      allItems={items}
    />
  )
}
