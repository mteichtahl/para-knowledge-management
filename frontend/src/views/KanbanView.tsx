import React from 'react'
import { Card, CardContent, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { AlertTriangle, Zap, CalendarDays, MessageSquare, Clock } from 'lucide-react'

interface Item {
  id: string
  bucket: string
  title: string
  description?: string
  status?: string
  extraFields?: Record<string, any>
  createdAt?: string
}

interface KanbanViewProps {
  items: Item[]
  selectedBucket: string
  apiStatuses: Record<string, string[]>
  bucketFields: Record<string, any[]>
  hiddenColumns: Set<string>
  columnOrder: Record<string, string[]>
  draggedItem: string | null
  setDraggedItem: (item: string | null) => void
  updateItem: (id: string, title: string, description: string, status: string, extraFields: Record<string, any>) => Promise<void>
  loadItems: () => Promise<void>
  openEditPanel: (item: Item) => void
  notesCounts: Record<string, number>
  setSelectedItemForNotes: (id: string) => void
  loadNotes: (id: string) => Promise<void>
  setShowNotesPanel: (show: boolean) => void
  isItemOverdue: (item: Item) => boolean
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  items,
  selectedBucket,
  apiStatuses,
  bucketFields,
  hiddenColumns,
  columnOrder,
  draggedItem,
  setDraggedItem,
  updateItem,
  loadItems,
  openEditPanel,
  notesCounts,
  setSelectedItemForNotes,
  loadNotes,
  setShowNotesPanel,
  isItemOverdue
}) => {
  const currentBucketStatuses = apiStatuses[selectedBucket] || []
  
  const statusColumns: Record<string, Item[]> = {}
  
  currentBucketStatuses.forEach(status => {
    statusColumns[status] = []
  })
  
  items.forEach(item => {
    let status = item.status || 'No Status'
    
    if (status !== 'No Status') {
      status = status.trim()
      const matchedStatus = currentBucketStatuses.find(s => 
        s.toLowerCase() === status.toLowerCase()
      )
      if (matchedStatus) {
        status = matchedStatus
      }
    }
    
    if (!statusColumns[status]) {
      statusColumns[status] = []
    }
    statusColumns[status].push(item)
  })

  const bucketKey = selectedBucket
  const defaultOrder = ["Next Up", "Planning", "In Progress", "In Review", "Completed", "On Hold", "Wont Do"]
  const savedOrder = columnOrder[bucketKey] || defaultOrder
  const allColumns = Object.keys(statusColumns)
  const orderedColumns = [
    ...savedOrder.filter(col => allColumns.includes(col)),
    ...allColumns.filter(col => !savedOrder.includes(col))
  ]

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {orderedColumns.filter(status => !hiddenColumns.has(status)).map((status) => {
        const columnItems = statusColumns[status] || []
        
        return (
          <div key={status} className="flex-shrink-0 w-80">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">
                  {status} ({columnItems.length})
                </h3>
              </div>
              
              <div 
                className={`space-y-3 min-h-[100px] transition-colors rounded-lg p-2 ${
                  draggedItem && draggedItem !== status ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => {
                  e.preventDefault()
                  if (draggedItem && draggedItem !== status) {
                    e.currentTarget.classList.add('bg-blue-100')
                  }
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('bg-blue-100')
                }}
                onDrop={async (e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('bg-blue-100')
                  const itemId = e.dataTransfer.getData('text/plain')
                  const draggedItem = items.find(item => item.id === itemId)
                  if (draggedItem && draggedItem.status !== status) {
                    try {
                      await updateItem(draggedItem.id, draggedItem.title, draggedItem.description || '', status, draggedItem.extraFields || {})
                      await loadItems()
                    } catch (error) {
                      console.error('Failed to update item status:', error)
                    }
                  }
                  setDraggedItem(null)
                }}
              >
                {columnItems
                  .sort((a, b) => {
                    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 }
                    const aPriority = priorityOrder[a.extraFields?.priority as keyof typeof priorityOrder] || 0
                    const bPriority = priorityOrder[b.extraFields?.priority as keyof typeof priorityOrder] || 0
                    
                    if (aPriority !== bPriority) {
                      return bPriority - aPriority
                    }
                    
                    const aDate = a.extraFields?.deadline || a.createdAt
                    const bDate = b.extraFields?.deadline || b.createdAt
                    return new Date(bDate || 0).getTime() - new Date(aDate || 0).getTime()
                  })
                  .map(item => (
                  <Card
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', item.id)
                      setDraggedItem(item.status || 'No Status')
                    }}
                    onDragEnd={() => setDraggedItem(null)}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openEditPanel(item)}
                  >
                    <CardContent className="p-3 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedItemForNotes(item.id)
                          loadNotes(item.id)
                          setShowNotesPanel(true)
                        }}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded flex items-center gap-1"
                        title="Notes"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {notesCounts[item.id] > 0 && (
                          <span className="text-[10px] text-gray-600">
                            {notesCounts[item.id]}
                          </span>
                        )}
                      </button>
                      <CardTitle className="text-sm font-medium text-gray-900 mb-1 text-left pr-8 flex items-center gap-1">
                        {item.title}
                        {isItemOverdue(item) && (
                          <div className="relative w-4 h-4">
                            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                              <Clock className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                        )}
                      </CardTitle>
                      {(item.extraFields?.startDate || item.extraFields?.endDate) && (
                        <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {item.extraFields?.startDate && new Date(item.extraFields.startDate).toLocaleDateString('en-AU')}
                          {item.extraFields?.startDate && item.extraFields?.endDate && ' - '}
                          {item.extraFields?.endDate && new Date(item.extraFields.endDate).toLocaleDateString('en-AU')}
                        </div>
                      )}
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-2 text-left">{item.description}</p>
                      )}
                      
                      {/* Custom fields */}
                      {bucketFields && bucketFields[selectedBucket] && bucketFields[selectedBucket].map((field: any) => {
                        const value = item.extraFields?.[field.name]
                        if (!value || field.name === 'priority' || field.name === 'energy') return null
                        
                        return (
                          <div key={field.name} className="text-xs text-gray-500 mb-1">
                            <span className="font-medium">{field.label || field.name}:</span>{' '}
                            {field.type === 'boolean' ? (value ? '✓' : '✗') :
                             field.type === 'date' ? new Date(value).toLocaleDateString() :
                             field.type === 'array' ? (Array.isArray(value) ? value.join(', ') : value) :
                             value}
                          </div>
                        )
                      })}
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.extraFields?.priority && (
                          <Badge variant={
                            item.extraFields.priority === 'High' ? 'destructive' :
                            item.extraFields.priority === 'Medium' ? 'secondary' :
                            'default'
                          } className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {item.extraFields.priority}
                          </Badge>
                        )}
                        {item.extraFields?.energy && (
                          <Badge variant="outline" className="bg-orange-100 text-orange-700 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {item.extraFields.energy}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
