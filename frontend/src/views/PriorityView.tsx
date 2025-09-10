import React from 'react'
import { Card, CardContent, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Zap, CalendarDays, MessageSquare, Clock } from 'lucide-react'

interface Item {
  id: string
  bucket: string
  title: string
  description?: string
  status?: string
  extraFields?: Record<string, any>
  createdAt?: string
}

interface PriorityViewProps {
  items: Item[]
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

export const PriorityView: React.FC<PriorityViewProps> = ({
  items,
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
  const priorityGroups = {
    high: items.filter(item => item.extraFields?.priority?.toLowerCase() === 'high'),
    medium: items.filter(item => item.extraFields?.priority?.toLowerCase() === 'medium'),
    low: items.filter(item => item.extraFields?.priority?.toLowerCase() === 'low'),
    none: items.filter(item => !item.extraFields?.priority)
  }

  const priorityOrder = ['high', 'medium', 'low', 'none']
  const priorityLabels = { high: 'High Priority', medium: 'Medium Priority', low: 'Low Priority', none: 'No Priority' }
  const priorityColors = { 
    high: 'border-red-200 bg-red-50', 
    medium: 'border-orange-200 bg-orange-50', 
    low: 'border-blue-200 bg-blue-50', 
    none: 'border-gray-200 bg-gray-50' 
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {priorityOrder.map(priority => {
        const groupItems = priorityGroups[priority as keyof typeof priorityGroups]
        return (
          <div key={priority} className={`flex-shrink-0 w-80 border rounded-lg ${priorityColors[priority as keyof typeof priorityColors]}`}>
            <div className="p-4 border-b border-current border-opacity-20">
              <h3 className={`font-medium text-sm ${
                priority === 'high' ? 'text-red-700' : 
                priority === 'medium' ? 'text-orange-700' : 
                priority === 'low' ? 'text-blue-700' : 'text-gray-700'
              }`}>
                {priorityLabels[priority as keyof typeof priorityLabels]} ({groupItems.length})
              </h3>
            </div>
            <div 
              className={`p-4 space-y-3 min-h-[200px] transition-colors rounded-lg ${
                draggedItem && draggedItem !== priority ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => {
                e.preventDefault()
                if (draggedItem && draggedItem !== priority) {
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
                if (draggedItem && draggedItem.extraFields?.priority?.toLowerCase() !== priority) {
                  try {
                    const newPriority = priority === 'none' ? undefined : (priority.charAt(0).toUpperCase() + priority.slice(1))
                    const updatedFields = { ...draggedItem.extraFields, priority: newPriority }
                    await updateItem(draggedItem.id, draggedItem.title, draggedItem.description || '', draggedItem.status || '', updatedFields)
                    await loadItems()
                  } catch (error) {
                    console.error('Failed to update item priority:', error)
                  }
                }
                setDraggedItem(null)
              }}
            >
              {groupItems.map(item => (
                <Card
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item.id)
                    setDraggedItem(item.extraFields?.priority?.toLowerCase() || 'none')
                  }}
                  onDragEnd={() => setDraggedItem(null)}
                  onClick={() => openEditPanel(item)}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-3 relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedItemForNotes(item.id)
                        loadNotes(item.id)
                        setShowNotesPanel(true)
                      }}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
                      title="View notes"
                    >
                      <MessageSquare className="w-3 h-3" />
                      {notesCounts[item.id] > 0 && (
                        <span className="text-[10px] text-gray-600">
                          {notesCounts[item.id]}
                        </span>
                      )}
                    </button>
                    <CardTitle className="text-sm font-medium text-gray-900 mb-1 text-left flex items-center gap-1">
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{item.status}</Badge>
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
              {groupItems.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No items with {priority === 'none' ? 'no' : priority} priority
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
