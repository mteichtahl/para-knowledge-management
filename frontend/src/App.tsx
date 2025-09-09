import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import ForceGraph2D from 'react-force-graph-2d'
import { Search, Plus, Settings, X, Target, Briefcase, BookOpen, Archive, CheckSquare, CheckCircle, Link, ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from './components/DataTable'
import './App.css'

interface Item {
  id: string
  bucket: string
  title: string
  description?: string
  status?: string
  extraFields?: Record<string, any>
}

interface CustomField {
  id: string
  name: string
  type: string
  arrayOptions?: string[]
  multiSelect?: boolean
  defaultValue?: any
}

// Relationship types based on PARA methodology
const relationshipTypes = {
  'contains': 'Contains',
  'belongs-to': 'Belongs to', 
  'references': 'References',
  'depends-on': 'Depends on',
  'supports': 'Supports',
  'related-to': 'Related to'
}

const bucketConfig = {
  PROJECT: { 
    name: 'Projects', 
    icon: Target,
    color: 'text-blue-600',
    description: 'Short-term efforts with specific outcomes'
  },
  AREA: { 
    name: 'Areas', 
    icon: Briefcase,
    color: 'text-green-600',
    description: 'Ongoing responsibilities requiring attention'
  },
  RESOURCE: { 
    name: 'Resources', 
    icon: BookOpen,
    color: 'text-yellow-600',
    description: 'Topics of ongoing interest and learning'
  },
  ARCHIVE: { 
    name: 'Archives', 
    icon: Archive,
    color: 'text-gray-600',
    description: 'Inactive items for future reference'
  },
  ACTION: { 
    name: 'Actions', 
    icon: CheckSquare,
    color: 'text-red-600',
    description: 'Individual actionable tasks and next steps'
  }
}

const statuses = {
  PROJECT: ['Next Up', 'Doing', 'In Review', 'On Hold', 'Wont Do', 'Completed'],
  AREA: ['Next Up', 'Doing', 'In Review', 'On Hold', 'Wont Do', 'Completed'],
  RESOURCE: ['Next Up', 'Doing', 'In Review', 'On Hold', 'Wont Do', 'Completed'],
  ARCHIVE: ['Next Up', 'Doing', 'In Review', 'On Hold', 'Wont Do', 'Completed'],
  ACTION: ['Next Up', 'Doing', 'In Review', 'On Hold', 'Wont Do', 'Completed']
}

function App() {
  const [items, setItems] = useState<Item[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBucket, setSelectedBucket] = useState<string>('PROJECT')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | 'quarter'>('month')
  const [bucketFields, setBucketFields] = useState<Record<string, CustomField[]>>({})
  const [apiStatuses, setApiStatuses] = useState<Record<string, string[]>>({})
  const [formData, setFormData] = useState<{status: string, priority?: string, energy?: string, title?: string, description?: string}>({status: "Next Up"})
  const [showPanel, setShowPanel] = useState(false)
  const [panelMode, setPanelMode] = useState<'add' | 'edit' | 'fields'>('add')
  const [panelBucket, setPanelBucket] = useState<string>('PROJECT')
  const [currentEditItem, setCurrentEditItem] = useState<Item | null>(null)
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [showAddField, setShowAddField] = useState(false)
  const [showBucketAssignments, setShowBucketAssignments] = useState(false)
  // Predefined fields that cannot be removed from buckets
  const predefinedFields = ['priority', 'status', 'energy', 'startDate', 'endDate', 'owner']
  const [showCustomFields, setShowCustomFields] = useState(false)
  const [customFieldSearch, setCustomFieldSearch] = useState('')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({})
  const [availableItems, setAvailableItems] = useState<Item[]>([])
  const [selectedRelationships, setSelectedRelationships] = useState<string[]>([])
  const [relationshipType, setRelationshipType] = useState('contains')
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [itemRelationships, setItemRelationships] = useState<Record<string, any[]>>({})
  const [itemPositions, setItemPositions] = useState<Record<string, {x: number, y: number}>>({})
  const [selectedGraphItem, setSelectedGraphItem] = useState<string | null>(null)
  const [draggedGraphItem, setDraggedGraphItem] = useState<string | null>(null)
  const [itemOrder, setItemOrder] = useState<Record<string, string[]>>({})
  const [currentView, setCurrentView] = useState<'list' | 'priority' | 'status' | 'date' | 'timeline' | 'kanban' | 'graph'>('kanban')
  const [showCreateDropdown, setShowCreateDropdown] = useState(false)
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text',
    description: '',
    defaultValue: '',
    arrayOptions: '',
    multiSelect: false,
    required: false
  })

  useEffect(() => {
    loadItems()
    loadBucketFields()
    loadCustomFields()
    loadStatuses()
  }, [])

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (showCreateDropdown && !(event.target as Element).closest('.relative')) {
        setShowCreateDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCreateDropdown])

  // Update form data when editing item changes
  useEffect(() => {
    if (currentEditItem) {
      setFormData({
        status: currentEditItem.status || "Next Up",
        priority: currentEditItem.extraFields?.priority || undefined,
        energy: currentEditItem.extraFields?.energy || undefined,
        title: currentEditItem.title || '',
        description: currentEditItem.description || ''
      })
    } else {
      setFormData({status: "Next Up"})
    }
  }, [currentEditItem])

  const loadItems = async () => {
    try {
      const response = await fetch('/api/items')
      const data = await response.json()
      setItems(data)
      // Load relationships for each item
      data.forEach((item: Item) => {
        loadItemRelationships(item.id)
      })
    } catch (error) {
      console.error('Failed to load items:', error)
    }
  }

  const loadBucketFields = async () => {
    try {
      const bucketFieldsData: Record<string, CustomField[]> = {}
      for (const bucket of Object.keys(bucketConfig)) {
        try {
          const response = await fetch(`/api/bucket-fields/${bucket}`)
          if (response.ok) {
            const data = await response.json()
            bucketFieldsData[bucket] = data
          } else {
            bucketFieldsData[bucket] = []
          }
        } catch (bucketError) {
          bucketFieldsData[bucket] = []
        }
      }
      setBucketFields(bucketFieldsData)
    } catch (error) {
      console.error('Failed to load bucket fields:', error)
    }
  }

  const loadStatuses = async () => {
    try {
      const response = await fetch('/api/statuses')
      const data = await response.json()
      const statusesByBucket: Record<string, string[]> = {}
      data.forEach((status: any) => {
        if (!statusesByBucket[status.bucket]) {
          statusesByBucket[status.bucket] = []
        }
        statusesByBucket[status.bucket].push(status.name)
      })
      setApiStatuses(statusesByBucket)
    } catch (error) {
      console.error('Failed to load statuses:', error)
    }
  }

  const loadCustomFields = async () => {
    try {
      console.log('Loading custom fields...')
      const response = await fetch('/api/custom-fields')
      console.log('Custom fields response:', response.status, response.ok)
      if (response.ok) {
        const data = await response.json()
        console.log('Custom fields data:', data)
        setCustomFields(data)
      } else {
        console.error('Failed to load custom fields:', response.status)
      }
    } catch (error) {
      console.error('Failed to load custom fields:', error)
    }
  }

  const openAddPanel = (bucket: string) => {
    setPanelMode('add')
    setPanelBucket(bucket)
    setCurrentEditItem(null)
    setSelectedRelationships([])
    setShowPanel(true)
    loadAvailableItems()
  }

  const openEditPanel = (item: Item) => {
    setPanelMode('edit')
    setPanelBucket(item.bucket)
    setCurrentEditItem(item)
    setSelectedRelationships([])
    setShowPanel(true)
    loadAvailableItems()
  }

  const openFieldsPanel = () => {
    setPanelMode('fields')
    setShowPanel(true)
  }

  const closePanel = () => {
    setShowPanel(false)
    setCurrentEditItem(null)
    setFormData({status: "Next Up"})
    setFormErrors({})
    setSelectedRelationships([])
  }

  const autoSave = async (field: string, value: any) => {
    if (!currentEditItem) return
    
    try {
      const extraFields = { ...currentEditItem.extraFields }
      if (field === 'status') {
        await updateItem(currentEditItem.id, currentEditItem.title, currentEditItem.description, value, extraFields)
      } else if (field === 'title') {
        await updateItem(currentEditItem.id, value, currentEditItem.description, currentEditItem.status, extraFields)
      } else if (field === 'description') {
        await updateItem(currentEditItem.id, currentEditItem.title, value, currentEditItem.status, extraFields)
      } else {
        // Update extra field
        extraFields[field] = value
        await updateItem(currentEditItem.id, currentEditItem.title, currentEditItem.description, currentEditItem.status, extraFields)
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }

  const updateCustomField = async (fieldId: string, fieldData: any) => {
    try {
      const response = await fetch(`/api/custom-fields/${fieldId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fieldData)
      })

      if (response.ok) {
        await loadCustomFields()
        await loadBucketFields()
        setEditingField(null)
        setShowAddField(false)
        setNewField({ name: '', label: '', description: '', type: 'text', defaultValue: '', arrayOptions: '', multiSelect: false, required: false })
      } else {
        const errorText = await response.text()
        console.error('Failed to update custom field:', errorText)
        alert('Failed to update custom field: ' + errorText)
      }
    } catch (error) {
      console.error('Failed to update custom field:', error)
      alert('Failed to update custom field')
    }
  }

  const loadAvailableItems = async () => {
    try {
      const response = await fetch('/api/items')
      if (response.ok) {
        const data = await response.json()
        setAvailableItems(data)
      }
    } catch (error) {
      console.error('Failed to load available items:', error)
    }
  }

  const createCustomField = async () => {
    if (!newField.name.trim()) {
      alert('Field name is required')
      return
    }

    try {
      const fieldData = {
        name: newField.name.trim(),
        label: newField.label.trim() || undefined,
        description: newField.description.trim() || undefined,
        type: newField.type,
        defaultValue: newField.defaultValue.trim() || undefined,
        required: newField.required,
        arrayOptions: newField.type === 'array' ? newField.arrayOptions.split(',').map(s => s.trim()).filter(s => s) : undefined,
        multiSelect: newField.multiSelect
      }
      
      console.log('Creating field:', fieldData)
      
      const response = await fetch('/api/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldData)
      })

      if (response.ok) {
        console.log('Field created successfully')
        await loadCustomFields()
        setShowAddField(false)
        setNewField({ name: '', label: '', description: '', type: 'text', defaultValue: '', arrayOptions: '', multiSelect: false, required: false })
      } else {
        const errorText = await response.text()
        let errorMessage = 'Unknown error'
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorText
        } catch {
          errorMessage = errorText || `HTTP ${response.status}`
        }
        console.error('Failed to create field:', response.status, errorMessage)
        alert('Failed to create field: ' + errorMessage)
      }
    } catch (error) {
      console.error('Failed to create field:', error)
      alert('Failed to create field: ' + error)
    }
  }

  const validateForm = (formData: FormData) => {
    const errors: Record<string, boolean> = {}
    let hasErrors = false
    
    bucketFields[panelBucket]?.filter(field => 
      !['title', 'description', 'status'].includes(field.name.toLowerCase())
    ).forEach(field => {
      if (field.required) {
        const value = formData.get(`custom_${field.name}`)
        if (!value || value.toString().trim() === '') {
          errors[field.name] = true
          hasErrors = true
        }
      }
    })
    
    setFormErrors(errors)
    return !hasErrors
  }

  const toggleFieldRequired = async (fieldId: string, bucket: string, required: boolean) => {
    try {
      // First remove the existing assignment
      await fetch(`/api/bucket-fields/${bucket}/${fieldId}`, {
        method: 'DELETE'
      })
      
      // Then add it back with the new required setting
      const response = await fetch('/api/bucket-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucketType: bucket,
          customFieldId: fieldId,
          required: required
        })
      })
      
      if (response.ok) {
        await loadBucketFields()
      }
    } catch (error) {
      console.error('Failed to toggle field required status:', error)
    }
  }

  const toggleFieldForBucket = async (fieldId: string, bucket: string) => {
    try {
      const isAssigned = bucketFields[bucket]?.some(f => f.id === fieldId)
      
      if (isAssigned) {
        // Remove assignment
        const response = await fetch(`/api/bucket-fields/${bucket}/${fieldId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          await loadBucketFields()
        }
      } else {
        // Add assignment
        const response = await fetch('/api/bucket-fields', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bucketType: bucket,
            customFieldId: fieldId,
            required: false
          })
        })
        if (response.ok) {
          await loadBucketFields()
        }
      }
    } catch (error) {
      console.error('Failed to toggle field assignment:', error)
    }
  }

  const renderItemsByView = (items: Item[]) => {
    switch (currentView) {
      case 'list':
        return renderListView(items)
      case 'priority':
        return renderPriorityView(items)
      case 'status':
        return renderStatusView(items)
      case 'date':
        return renderDateView(items)
      case 'graph':
        return renderGraphView(items)
      case 'timeline':
        return renderTimelineView(items)
      case 'kanban':
        return renderKanbanView(items)
      default:
        return renderListView(items)
    }
  }

  const renderListView = (filteredItems: Item[]) => {
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
          return status ? (
            <div className="text-left">
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {status === 'Completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                {status}
              </span>
            </div>
          ) : null
        },
      },
      // Dynamic columns for all extraFields that have data
      ...(() => {
        const allExtraFields = new Set<string>()
        filteredItems.forEach(item => {
          if (item.extraFields) {
            Object.keys(item.extraFields).forEach(key => {
              if (item.extraFields![key] !== null && item.extraFields![key] !== undefined && item.extraFields![key] !== '') {
                allExtraFields.add(key)
              }
            })
          }
        })
        
        // Define preferred order for common fields
        const fieldOrder = ['priority', 'energy', 'startdate', 'startDate', 'enddate', 'endDate', 'owner', 'email']
        const sortedFields = Array.from(allExtraFields).sort((a, b) => {
          const aIndex = fieldOrder.indexOf(a)
          const bIndex = fieldOrder.indexOf(b)
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
          if (aIndex !== -1) return -1
          if (bIndex !== -1) return 1
          return a.localeCompare(b)
        })
        
        return sortedFields.map(fieldName => {
          // Find the field definition to get the label
          const fieldDef = bucketFields[selectedBucket]?.find(f => f.name === fieldName)
          const headerLabel = fieldDef?.label || fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
          
          return {
            accessorKey: `extraFields.${fieldName}`,
            header: headerLabel,
          cell: ({ row }: { row: any }) => {
            const value = row.original.extraFields?.[fieldName]
            if (!value) return null
            
            // Handle different field types
            if (Array.isArray(value)) {
              return (
                <div className="flex flex-wrap gap-1">
                  {value.map((item, idx) => (
                    <span key={idx} className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                      {item}
                    </span>
                  ))}
                </div>
              )
            }
            
            if (typeof value === 'boolean') {
              return (
                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                  value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {value ? 'Yes' : 'No'}
                </span>
              )
            }
            
            // Special styling for priority and energy
            if (fieldName === 'priority') {
              return (
                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                  value.toLowerCase() === 'high' ? 'bg-red-100 text-red-700' :
                  value.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {value}
                </span>
              )
            }
            
            if (fieldName === 'energy') {
              return (
                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                  value.toLowerCase() === 'high' ? 'bg-blue-100 text-blue-700' :
                  value.toLowerCase() === 'medium' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {value}
                </span>
              )
            }
            
            // Format dates
            if (fieldName.toLowerCase().includes('date') || 
                fieldName.toLowerCase().includes('deadline') ||
                fieldName.toLowerCase().includes('due') ||
                fieldName.toLowerCase().includes('start') ||
                fieldName.toLowerCase().includes('end') ||
                fieldName.toLowerCase().includes('created') ||
                fieldName.toLowerCase().includes('updated') ||
                fieldName === 'startDate' ||
                fieldName === 'endDate' ||
                fieldName === 'startdate' ||
                fieldName === 'enddate') {
              try {
                const date = new Date(value)
                if (!isNaN(date.getTime())) {
                  return <span className="text-sm">{date.toLocaleDateString('en-GB')}</span>
                }
              } catch {
                // Fall through to default
              }
            }
            
            // Default text display
            return <span className="text-sm">{value}</span>
          },
        }
      })
      })(),
      // Separate relationship columns for each bucket
      {
        id: "projects",
        header: "Projects",
        cell: ({ row }) => {
          const relationships = itemRelationships[row.original.id]
          const projectRels = relationships?.filter(rel => {
            const childBucket = rel.childBucket?.toLowerCase()
            const parentBucket = rel.parentBucket?.toLowerCase()
            return childBucket === 'projects' || parentBucket === 'projects' || 
                   childBucket === 'project' || parentBucket === 'project'
          }) || []
          return projectRels.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {projectRels.slice(0, 2).map((rel, idx) => (
                <span key={idx} className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                  {rel.childTitle || rel.parentTitle}
                </span>
              ))}
              {projectRels.length > 2 && (
                <span className="text-xs text-gray-400">+{projectRels.length - 2}</span>
              )}
            </div>
          ) : null
        },
      },
      {
        id: "areas",
        header: "Areas",
        cell: ({ row }) => {
          const relationships = itemRelationships[row.original.id]
          const areaRels = relationships?.filter(rel => {
            const childBucket = rel.childBucket?.toLowerCase()
            const parentBucket = rel.parentBucket?.toLowerCase()
            return childBucket === 'areas' || parentBucket === 'areas' || 
                   childBucket === 'area' || parentBucket === 'area'
          }) || []
          return areaRels.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {areaRels.slice(0, 2).map((rel, idx) => (
                <span key={idx} className="inline-flex items-center px-1.5 py-0.5 bg-green-50 text-green-700 text-xs rounded">
                  {rel.childTitle || rel.parentTitle}
                </span>
              ))}
              {areaRels.length > 2 && (
                <span className="text-xs text-gray-400">+{areaRels.length - 2}</span>
              )}
            </div>
          ) : null
        },
      },
      {
        id: "resources",
        header: "Resources",
        cell: ({ row }) => {
          const relationships = itemRelationships[row.original.id]
          const resourceRels = relationships?.filter(rel => {
            const childBucket = rel.childBucket?.toLowerCase()
            const parentBucket = rel.parentBucket?.toLowerCase()
            return childBucket === 'resources' || parentBucket === 'resources' || 
                   childBucket === 'resource' || parentBucket === 'resource'
          }) || []
          return resourceRels.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {resourceRels.slice(0, 2).map((rel, idx) => (
                <span key={idx} className="inline-flex items-center px-1.5 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded">
                  {rel.childTitle || rel.parentTitle}
                </span>
              ))}
              {resourceRels.length > 2 && (
                <span className="text-xs text-gray-400">+{resourceRels.length - 2}</span>
              )}
            </div>
          ) : null
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const relationships = itemRelationships[row.original.id]
          const actionRels = relationships?.filter(rel => {
            const childBucket = rel.childBucket?.toLowerCase()
            const parentBucket = rel.parentBucket?.toLowerCase()
            return childBucket === 'actions' || parentBucket === 'actions' || 
                   childBucket === 'action' || parentBucket === 'action'
          }) || []
          return actionRels.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {actionRels.slice(0, 2).map((rel, idx) => (
                <span key={idx} className="inline-flex items-center px-1.5 py-0.5 bg-red-50 text-red-700 text-xs rounded">
                  {rel.childTitle || rel.parentTitle}
                </span>
              ))}
              {actionRels.length > 2 && (
                <span className="text-xs text-gray-400">+{actionRels.length - 2}</span>
              )}
            </div>
          ) : null
        },
      },
    ]

    return (
      <DataTable 
        columns={columns} 
        data={filteredItems} 
        onRowClick={openEditPanel}
        itemRelationships={itemRelationships}
        currentBucket={selectedBucket}
        allItems={items}
      />
    )
  }

  const renderPriorityView = (items: Item[]) => {
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
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', item.id)
                      setDraggedItem(item.extraFields?.priority?.toLowerCase() || 'none')
                    }}
                    onDragEnd={() => setDraggedItem(null)}
                    onClick={() => openEditPanel(item)}
                    className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{item.title}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bucketConfig[item.bucket as keyof typeof bucketConfig].color}`}>
                        {React.createElement(bucketConfig[item.bucket as keyof typeof bucketConfig].icon)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded">{item.status}</span>
                      {item.extraFields?.energy && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                          {item.extraFields.energy}
                        </span>
                      )}
                    </div>
                  </div>
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

  const renderStatusView = (items: Item[]) => {
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
            {renderListView(groupItems)}
          </div>
        ))}
      </div>
    )
  }

  const renderGraphView = (allItems: Item[]) => {
    // Get related item IDs for selected item
    const getRelatedItemIds = (itemId: string): Set<string> => {
      const related = new Set<string>([itemId])
      const relationships = itemRelationships[itemId] || []
      relationships.forEach(rel => {
        related.add(rel.parentId)
        related.add(rel.childId)
      })
      // Also check if this item is referenced by others
      Object.entries(itemRelationships).forEach(([id, rels]) => {
        rels.forEach(rel => {
          if (rel.parentId === itemId || rel.childId === itemId) {
            related.add(id)
            related.add(rel.parentId)
            related.add(rel.childId)
          }
        })
      })
      return related
    }

    const relatedIds = selectedGraphItem ? getRelatedItemIds(selectedGraphItem) : new Set()
    const filteredItems = selectedGraphItem ? allItems.filter(item => relatedIds.has(item.id)) : allItems

    // Group items by bucket
    // Group items by bucket and apply custom ordering
    const bucketGroups = {
      'AREA': filteredItems.filter(item => item.bucket === 'AREA'),
      'PROJECT': filteredItems.filter(item => item.bucket === 'PROJECT'),
      'ACTION': filteredItems.filter(item => item.bucket === 'ACTION'),
      'RESOURCE': filteredItems.filter(item => item.bucket === 'RESOURCE'),
      'ARCHIVE': filteredItems.filter(item => item.bucket === 'ARCHIVE')
    }

    // Apply custom ordering if available
    Object.keys(bucketGroups).forEach(bucket => {
      const order = itemOrder[bucket]
      if (order) {
        bucketGroups[bucket as keyof typeof bucketGroups] = order
          .map(id => bucketGroups[bucket as keyof typeof bucketGroups].find(item => item.id === id))
          .filter(Boolean) as Item[]
      }
    })

    const bucketColors: Record<string, string> = {
      'PROJECT': '#3b82f6',
      'AREA': '#10b981', 
      'RESOURCE': '#f59e0b',
      'ARCHIVE': '#6b7280',
      'ACTION': '#ef4444'
    }

    // Get all relationships for drawing lines - filter based on selection
    const allRelationships: any[] = []
    Object.entries(itemRelationships).forEach(([itemId, relationships]) => {
      relationships.forEach(rel => {
        // Only include relationships where both items are in the filtered set
        const sourceInFiltered = filteredItems.some(item => item.id === rel.parentId)
        const targetInFiltered = filteredItems.some(item => item.id === rel.childId)
        if (sourceInFiltered && targetInFiltered) {
          allRelationships.push({
            source: rel.parentId,
            target: rel.childId,
            type: rel.relationship
          })
        }
      })
    })

    return (
      <div className="h-screen w-full bg-white p-8 overflow-auto relative">
        {selectedGraphItem && (
          <div className="mb-4">
            <button
              onClick={() => setSelectedGraphItem(null)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
            >
              ← Show All Items
            </button>
          </div>
        )}
        {/* SVG for connecting lines */}
        <svg className="absolute inset-0 pointer-events-none z-10" style={{ width: '100%', height: '100%' }}>
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <polygon points="0,0 0,6 8,3" fill="#64748b" />
            </marker>
          </defs>
          {allRelationships.map((rel, idx) => {
            const sourcePos = itemPositions[rel.source]
            const targetPos = itemPositions[rel.target]
            // Only draw lines if both positions exist and are for actual items
            const sourceItem = filteredItems.find(item => item.id === rel.source)
            const targetItem = filteredItems.find(item => item.id === rel.target)
            if (sourcePos && targetPos && sourceItem && targetItem) {
              // Determine connection points on card edges
              const isSourceLeft = sourcePos.x < targetPos.x
              const sourceEdgeX = isSourceLeft ? sourcePos.left + sourcePos.width : sourcePos.left
              const targetEdgeX = isSourceLeft ? targetPos.left : targetPos.left + targetPos.width
              
              // Route around items - go out horizontally, then vertically, then horizontally to target
              const horizontalOffset = 30 // Distance to go out from card edge
              const sourceOutX = isSourceLeft ? sourceEdgeX + horizontalOffset : sourceEdgeX - horizontalOffset
              const targetOutX = isSourceLeft ? targetEdgeX - horizontalOffset : targetEdgeX + horizontalOffset
              
              return (
                <g key={idx}>
                  <path
                    d={`M ${sourceEdgeX} ${sourcePos.y} 
                        L ${sourceOutX} ${sourcePos.y} 
                        L ${sourceOutX} ${targetPos.y} 
                        L ${targetOutX} ${targetPos.y}
                        L ${targetEdgeX} ${targetPos.y}`}
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeOpacity="0.7"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              )
            }
            return null
          })}
        </svg>

        <div className="grid grid-cols-5 gap-6 h-full relative z-20">
          {Object.entries(bucketGroups).map(([bucket, items]) => (
            <div key={bucket} className="flex flex-col">
              <div 
                className="text-center p-4 rounded-lg mb-4 text-white font-semibold"
                style={{ backgroundColor: bucketColors[bucket] }}
              >
                {bucket}S ({items.length})
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto">
                {items.map((item, itemIdx) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedGraphItem(item.id)}
                    onDragEnd={() => setDraggedGraphItem(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (draggedGraphItem && draggedGraphItem !== item.id) {
                        const currentOrder = itemOrder[bucket] || items.map(i => i.id)
                        const draggedIndex = currentOrder.indexOf(draggedGraphItem)
                        const targetIndex = currentOrder.indexOf(item.id)
                        
                        if (draggedIndex !== -1 && targetIndex !== -1) {
                          const newOrder = [...currentOrder]
                          newOrder.splice(draggedIndex, 1)
                          newOrder.splice(targetIndex, 0, draggedGraphItem)
                          
                          setItemOrder(prev => ({
                            ...prev,
                            [bucket]: newOrder
                          }))
                        }
                      }
                    }}
                    ref={(el) => {
                      if (el) {
                        const rect = el.getBoundingClientRect()
                        const containerRect = document.querySelector('.h-screen.w-full.bg-white.p-8')?.getBoundingClientRect()
                        if (containerRect) {
                          const newPos = {
                            x: rect.left - containerRect.left + rect.width / 2,
                            y: rect.top - containerRect.top + rect.height / 2,
                            width: rect.width,
                            height: rect.height,
                            left: rect.left - containerRect.left,
                            top: rect.top - containerRect.top
                          }
                          const currentPos = itemPositions[item.id]
                          if (!currentPos || Math.abs(currentPos.x - newPos.x) > 1 || Math.abs(currentPos.y - newPos.y) > 1) {
                            setItemPositions(prev => ({
                              ...prev,
                              [item.id]: newPos
                            }))
                          }
                        }
                      }
                    }}
                    onClick={() => {
                      setSelectedGraphItem(item.id)
                    }}
                    className={`p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 border-l-4 transition-colors ${
                      draggedGraphItem === item.id ? 'opacity-50' : ''
                    }`}
                    style={{ borderLeftColor: bucketColors[bucket] }}
                  >
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {item.title}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {item.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDateView = (items: Item[]) => {
    const localizer = momentLocalizer(moment)
    
    // Convert items to calendar events
    const events = items.map(item => {
      const startDate = item.extraFields?.startdate || item.extraFields?.startDate
      const endDate = item.extraFields?.deadline || item.extraFields?.enddate || item.extraFields?.endDate
      const singleDate = endDate || startDate
      
      if (singleDate) {
        return {
          id: item.id,
          title: item.title,
          start: new Date(startDate || singleDate),
          end: new Date(endDate || singleDate),
          resource: item,
          style: {
            backgroundColor: bucketConfig[item.bucket as keyof typeof bucketConfig]?.color,
            borderColor: bucketConfig[item.bucket as keyof typeof bucketConfig]?.color,
          }
        }
      }
      return null
    }).filter(Boolean)

    // Custom toolbar component
    const CustomToolbar = ({ label, onNavigate, onView, view }: any) => {
      const goToBack = () => {
        if (view === 'quarter') {
          onNavigate('PREV', moment(calendarDate).subtract(3, 'months').toDate())
        } else {
          onNavigate('PREV')
        }
      }
      
      const goToNext = () => {
        if (view === 'quarter') {
          onNavigate('NEXT', moment(calendarDate).add(3, 'months').toDate())
        } else {
          onNavigate('NEXT')
        }
      }
      
      const goToToday = () => {
        onNavigate('TODAY')
      }
      
      const getLabel = () => {
        if (view === 'quarter') {
          const quarter = Math.floor(moment(calendarDate).month() / 3) + 1
          return `Q${quarter} ${moment(calendarDate).year()}`
        }
        return label
      }
      
      return (
        <div className="rbc-toolbar">
          <span className="rbc-btn-group">
            <button type="button" onClick={goToBack}>‹</button>
            <button type="button" onClick={goToToday}>Today</button>
            <button type="button" onClick={goToNext}>›</button>
          </span>
          <span className="rbc-toolbar-label">{getLabel()}</span>
          <span className="rbc-btn-group">
            <button type="button" className={view === 'month' ? 'rbc-active' : ''} onClick={() => onView('month')}>Month</button>
            <button type="button" className={view === 'week' ? 'rbc-active' : ''} onClick={() => onView('week')}>Week</button>
            <button type="button" className={view === 'day' ? 'rbc-active' : ''} onClick={() => onView('day')}>Day</button>
            <button type="button" className={view === 'quarter' ? 'rbc-active' : ''} onClick={() => onView('quarter')}>Quarter</button>
          </span>
        </div>
      )
    }
    const QuarterView = ({ date, localizer, events }: any) => {
      const startOfQuarter = moment(date).startOf('quarter').toDate()
      const endOfQuarter = moment(date).endOf('quarter').toDate()
      const months = []
      
      for (let i = 0; i < 3; i++) {
        const monthStart = moment(startOfQuarter).add(i, 'month').startOf('month')
        months.push({
          name: monthStart.format('MMMM'),
          start: monthStart.toDate(),
          end: monthStart.endOf('month').toDate()
        })
      }
      
      return (
        <div className="quarter-view">
          <div className="grid grid-cols-3 gap-4 h-full">
            {months.map((month, idx) => {
              const monthEvents = events.filter((event: any) => 
                moment(event.start).isBetween(month.start, month.end, 'day', '[]')
              )
              
              return (
                <div key={idx} className="border border-gray-200 rounded p-2">
                  <h3 className="font-medium text-center mb-2">{month.name}</h3>
                  <div className="space-y-1">
                    {monthEvents.slice(0, 10).map((event: any) => (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: event.style.backgroundColor }}
                        onClick={() => openEditPanel(event.resource)}
                      >
                        {event.title}
                      </div>
                    ))}
                    {monthEvents.length > 10 && (
                      <div className="text-xs text-gray-500">+{monthEvents.length - 10} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    // Add required properties to QuarterView
    QuarterView.title = (date: Date) => {
      const quarter = Math.floor(moment(date).month() / 3) + 1
      return `Q${quarter} ${moment(date).year()}`
    }

    QuarterView.navigate = (date: Date, action: string) => {
      switch (action) {
        case 'PREV':
          return moment(date).subtract(3, 'months').toDate()
        case 'NEXT':
          return moment(date).add(3, 'months').toDate()
        case 'TODAY':
          return new Date()
        default:
          return date
      }
    }

    QuarterView.range = (date: Date) => {
      const start = moment(date).startOf('quarter').toDate()
      const end = moment(date).endOf('quarter').toDate()
      return { start, end }
    }
    
    return (
      <div className="h-screen">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={calendarDate}
          view={calendarView}
          onNavigate={setCalendarDate}
          onView={setCalendarView}
          onSelectEvent={(event) => openEditPanel(event.resource)}
          eventPropGetter={(event) => ({
            style: event.style
          })}
          views={{
            month: true,
            week: true,
            day: true,
            quarter: QuarterView
          }}
          components={{
            quarter: QuarterView,
            toolbar: CustomToolbar
          }}
        />
      </div>
    )
  }

  const renderTimelineView = (items: Item[]) => (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.id} className="flex items-start gap-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
          <div className="flex-1 pb-4 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <span className="text-xs text-gray-500">
                {item.extraFields?.deadline || new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
            {item.description && (
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            )}
            {item.status && (
              <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {item.status}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  const renderCrossBucketKanban = (items: Item[]) => {
    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {Object.entries(bucketConfig).map(([bucket, config]) => {
          const Icon = config.icon
          const bucketItems = items.filter(item => item.bucket === bucket)
          
          return (
            <div key={bucket} className="flex-shrink-0 w-80">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                    <h3 className="font-medium text-gray-900">
                      {config.name} ({bucketItems.length})
                    </h3>
                  </div>
                </div>
                
                <div 
                  className="space-y-3 min-h-[200px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault()
                    const itemId = e.dataTransfer.getData('text/plain')
                    const draggedItem = items.find(item => item.id === itemId)
                    if (draggedItem && draggedItem.bucket !== bucket) {
                      try {
                        await updateItem(draggedItem.id, draggedItem.title, draggedItem.description || '', draggedItem.status || '', draggedItem.extraFields || {}, bucket)
                        await loadItems()
                      } catch (error) {
                        console.error('Failed to update item bucket:', error)
                      }
                    }
                  }}
                >
                  {bucketItems.map(item => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', item.id)
                        setDraggedItem(item.bucket)
                      }}
                      onDragEnd={() => setDraggedItem(null)}
                      className="bg-white p-3 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openEditPanel(item)}
                    >
                      <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      )}
                      {item.extraFields?.priority && (
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          item.extraFields.priority === 'High' ? 'bg-red-100 text-red-700' :
                          item.extraFields.priority === 'Medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {item.extraFields.priority}
                        </span>
                      )}
                    </div>
                  ))}
                  {bucketItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No {config.name.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderKanbanView = (items: Item[]) => {
    // Get statuses for current bucket from API
    const currentBucketStatuses = apiStatuses[selectedBucket] || []
    
    // Create columns for each status, plus items without status
    const statusColumns: Record<string, Item[]> = {}
    
    // Initialize columns for all predefined statuses in current bucket
    currentBucketStatuses.forEach(status => {
      statusColumns[status] = []
    })
    
    // Group items by status and create columns for any additional statuses found
    items.forEach(item => {
      let status = item.status || 'No Status'
      
      // Normalize status - trim whitespace and check for case-insensitive match
      if (status !== 'No Status') {
        status = status.trim()
        // Check if there's a case-insensitive match with expected statuses
        const matchedStatus = currentBucketStatuses.find(s => 
          s.toLowerCase() === status.toLowerCase()
        )
        if (matchedStatus) {
          status = matchedStatus // Use the canonical status name
        }
      }
      
      if (!statusColumns[status]) {
        statusColumns[status] = []
      }
      statusColumns[status].push(item)
    })

    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {Object.entries(statusColumns).map(([status, columnItems]) => {
          const isHidden = hiddenColumns.has(status)
          
          return (
            <div key={status} className="flex-shrink-0 w-80">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">
                    {status} ({columnItems.length})
                  </h3>
                  <button
                    onClick={() => {
                      const newHidden = new Set(hiddenColumns)
                      if (isHidden) {
                        newHidden.delete(status)
                      } else {
                        newHidden.add(status)
                      }
                      setHiddenColumns(newHidden)
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title={isHidden ? 'Show column' : 'Hide column'}
                  >
                    {isHidden ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                
                {!isHidden && (
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
                    {columnItems.map(item => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', item.id)
                          setDraggedItem(item.status || 'No Status')
                        }}
                        onDragEnd={() => setDraggedItem(null)}
                        className="bg-white p-3 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => openEditPanel(item)}
                      >
                        <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        )}
                        {item.extraFields?.priority && (
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            item.extraFields.priority === 'High' ? 'bg-red-100 text-red-700' :
                            item.extraFields.priority === 'Medium' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {item.extraFields.priority}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const loadItemRelationships = async (itemId: string) => {
    try {
      const response = await fetch(`/api/relationships/${itemId}`)
      if (response.ok) {
        const relationships = await response.json()
        setItemRelationships(prev => ({
          ...prev,
          [itemId]: relationships
        }))
      }
    } catch (error) {
      console.error('Failed to load relationships:', error)
    }
  }

  const createRelationship = async (parentId: string, childId: string, relationship: string) => {
    try {
      const response = await fetch('/api/relationships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId,
          childId,
          relationship
        })
      })
      
      if (response.ok) {
        console.log('Relationship created successfully')
      } else {
        console.error('Failed to create relationship')
      }
    } catch (error) {
      console.error('Error creating relationship:', error)
    }
  }

  const createItem = async (bucket: string, title: string, description: string, status: string, extraFields: Record<string, any>) => {
    if (!title.trim()) return

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bucket, 
          title, 
          description, 
          statusName: status,
          extraFields 
        })
      })

      if (response.ok) {
        const newItem = await response.json()
        loadItems()
        return newItem
      }
    } catch (error) {
      console.error('Failed to create item:', error)
    }
    return null
  }

  const updateItem = async (itemId: string, title: string, description: string, status: string, extraFields: Record<string, any>, bucket?: string) => {
    try {
      const updateData: any = { 
        title, 
        description, 
        status, 
        extraFields 
      }
      
      if (bucket) {
        updateData.bucket = bucket
      }

      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        loadItems()
      }
    } catch (error) {
      console.error('Failed to update item:', error)
    }
  }

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const selectedBucketItems = filteredItems.filter(item => item.bucket === selectedBucket)

  return (
    <div className="h-screen bg-white">
      <style>{`
        select[multiple] option:checked {
          background: white !important;
          color: black !important;
        }
        select[multiple] option {
          background: white !important;
          color: black !important;
        }
      `}</style>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">PARA System</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:border-blue-500 focus:outline-none w-64"
                />
              </div>
              
              <button 
                onClick={openFieldsPanel}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <Settings className="w-4 h-4 mr-2" />
                Custom Fields
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              {Object.entries(bucketConfig).map(([bucket, config]) => {
                const Icon = config.icon
                const bucketItems = filteredItems.filter(item => item.bucket === bucket)
                const isSelected = selectedBucket === bucket

                return (
                  <button
                    key={bucket}
                    onClick={() => setSelectedBucket(bucket)}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-2 ${config.color}`} />
                    <span className="font-medium">{config.name}</span>
                    <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {bucketItems.length}
                    </span>
                  </button>
                )
              })}
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              
              {showCreateDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                  {Object.entries(bucketConfig).map(([bucket, config]) => {
                    const Icon = config.icon
                    return (
                      <button
                        key={bucket}
                        onClick={() => {
                          openAddPanel(bucket)
                          setShowCreateDropdown(false)
                        }}
                        className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <Icon className="w-4 h-4 mr-3" style={{ color: config.color }} />
                        <div>
                          <div className="font-medium text-gray-900">
                            New {config.name.slice(0, -1)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {config.description}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* View Selector */}
          <div className="flex items-center gap-6 mb-6">
            {[
              { key: 'list', label: 'List', icon: '☰' },
              { key: 'priority', label: 'Priority', icon: '⚡' },
              { key: 'status', label: 'Status', icon: '📊' },
              { key: 'date', label: 'Date', icon: '📅' },
              { key: 'graph', label: 'Graph', icon: '🕸️' },
              { key: 'timeline', label: 'Timeline', icon: '📈' },
              { key: 'kanban', label: 'Kanban', icon: '📋' }
            ].map(view => (
              <button
                key={view.key}
                onClick={() => setCurrentView(view.key as any)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  currentView === view.key 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <span className="w-5 h-5 mr-2 text-base flex items-center justify-center">{view.icon}</span>
                <span className="font-medium">{view.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedBucketItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {(() => {
                  const Icon = bucketConfig[selectedBucket as keyof typeof bucketConfig].icon
                  return <Icon className="w-12 h-12 mx-auto" />
                })()}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {bucketConfig[selectedBucket as keyof typeof bucketConfig].name.toLowerCase()} yet
              </h3>
              <p className="text-gray-600 mb-4">
                Get started by creating your first {bucketConfig[selectedBucket as keyof typeof bucketConfig].name.slice(0, -1).toLowerCase()}
              </p>
            </div>
          ) : (
            currentView === 'graph' ? renderItemsByView(items) : renderItemsByView(selectedBucketItems)
          )}
        </div>
      </div>

      {/* Overlay */}
      {showPanel && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => closePanel()}
        />
      )}

      {/* Right Slide-out Panel */}
      <div className={`fixed top-0 right-0 h-full w-[460px] bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 z-50 ${
        showPanel ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {panelMode === 'add' ? 'Add New Item' : panelMode === 'edit' ? `Update ${bucketConfig[panelBucket as keyof typeof bucketConfig]?.name.slice(0, -1)}` : 'Custom Fields'}
              </h2>
              <button
                onClick={() => closePanel()}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6">
            {panelMode === 'fields' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Custom Fields</h3>
                  <button
                    onClick={() => setShowAddField(true)}
                    className="flex items-center px-2.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>

                {showAddField && (
                  <div className="p-3 bg-gray-50 rounded-lg border space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Field name"
                        value={newField.name}
                        onChange={(e) => setNewField({...newField, name: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Label (optional)"
                        value={newField.label}
                        onChange={(e) => setNewField({...newField, label: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <select
                      value={newField.type}
                      onChange={(e) => setNewField({...newField, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="boolean">Boolean</option>
                      <option value="date">Date</option>
                      <option value="array">Array</option>
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newField.description}
                      onChange={(e) => setNewField({...newField, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    {newField.type === 'array' && (
                      <input
                        type="text"
                        placeholder="Options (comma-separated)"
                        value={newField.arrayOptions}
                        onChange={(e) => setNewField({...newField, arrayOptions: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                    
                    <div className="flex items-center justify-between">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newField.required}
                          onChange={(e) => setNewField({...newField, required: e.target.checked})}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                        />
                        Required
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={editingField ? () => updateCustomField(editingField, {
                            name: newField.name.trim(),
                            label: newField.label.trim() || undefined,
                            description: newField.description.trim() || undefined,
                            type: newField.type,
                            defaultValue: newField.defaultValue.trim() || undefined,
                            arrayOptions: newField.type === 'array' ? newField.arrayOptions.split(',').map(s => s.trim()).filter(s => s) : undefined,
                            multiSelect: newField.multiSelect
                          }) : createCustomField}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm transition-colors"
                        >
                          {editingField ? 'Update' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setShowAddField(false)
                            setEditingField(null)
                            setNewField({ name: '', label: '', description: '', type: 'text', defaultValue: '', arrayOptions: '', multiSelect: false, required: false })
                          }}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fields List */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setShowCustomFields(!showCustomFields)}
                    className="flex items-center justify-between w-full p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Custom Fields</span>
                      <span className="text-sm text-gray-500">({customFields.length})</span>
                    </div>
                    {showCustomFields ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  {/* Search box - always visible */}
                  <div className="px-3 pb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search custom fields..."
                        value={customFieldSearch}
                        onChange={(e) => {
                          setCustomFieldSearch(e.target.value)
                          if (e.target.value && !showCustomFields) {
                            setShowCustomFields(true)
                          }
                        }}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  {(showCustomFields || customFieldSearch) && (
                    <div className="border-t border-gray-200 p-3 space-y-2">
                      {(() => {
                        const filteredFields = customFields.filter(field => 
                          !customFieldSearch || 
                          (field.label || field.name).toLowerCase().includes(customFieldSearch.toLowerCase()) ||
                          field.description?.toLowerCase().includes(customFieldSearch.toLowerCase()) ||
                          field.type.toLowerCase().includes(customFieldSearch.toLowerCase())
                        )
                        
                        if (filteredFields.length === 0 && customFieldSearch) {
                          return (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              No fields match "{customFieldSearch}"
                            </div>
                          )
                        }
                        
                        return filteredFields.map(field => (
                        <div key={field.id} className="group border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 truncate">{field.label || field.name}</h4>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 shrink-0">
                                  {field.type}
                                </span>
                              </div>
                              {field.description && (
                                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{field.description}</p>
                              )}
                              {field.arrayOptions && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {field.arrayOptions.slice(0, 3).map((option, idx) => (
                                    <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                                      {option}
                                    </span>
                                  ))}
                                  {field.arrayOptions.length > 3 && (
                                    <span className="text-xs text-gray-400">+{field.arrayOptions.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {!predefinedFields.includes(field.name) && (
                              <button
                                onClick={() => {
                                  setNewField({
                                    name: field.name,
                                    label: field.label || '',
                                    description: field.description || '',
                                    type: field.type,
                                    defaultValue: field.defaultValue || '',
                                    arrayOptions: field.arrayOptions?.join(', ') || '',
                                    multiSelect: field.multiSelect || false,
                                    required: false
                                  })
                                  setEditingField(field.id)
                                  setShowAddField(true)
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-all"
                                title="Edit field"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          {/* Compact bucket assignments */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Buckets</span>
                            <div className="flex gap-2">
                              {Object.entries(bucketConfig).map(([bucket, config]) => {
                                const isAssigned = bucketFields[bucket]?.some(f => f.id === field.id);
                                const isRequired = bucketFields[bucket]?.find(f => f.id === field.id)?.required;
                                const isPredefined = predefinedFields.includes(field.name);
                                
                                return (
                                  <div key={bucket} className="flex flex-col items-center gap-1">
                                    <div className="relative">
                                      <button
                                        onClick={() => toggleFieldForBucket(field.id, bucket)}
                                        disabled={isPredefined && isAssigned}
                                        className={`relative flex items-center justify-center w-7 h-7 rounded text-xs font-medium transition-all ${
                                          isAssigned 
                                            ? `bg-gray-900 text-white shadow-sm ${isPredefined ? 'cursor-not-allowed opacity-75' : ''}` 
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                        title={`${config.name}${isAssigned ? (isRequired ? ' (Required)' : ' (Optional)') : ''}${isPredefined && isAssigned ? ' - Predefined field' : ''}`}
                                      >
                                        <config.icon className="w-3.5 h-3.5" />
                                        {isAssigned && isRequired && (
                                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full border border-white"></div>
                                        )}
                                        {isPredefined && isAssigned && (
                                          <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
                                        )}
                                      </button>
                                      {isAssigned && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFieldRequired(field.id, bucket, !isRequired);
                                          }}
                                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-white text-xs flex items-center justify-center transition-colors font-bold ${
                                            isRequired ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                                          }`}
                                          title={isRequired ? 'Required' : 'Optional'}
                                        >
                                          {isRequired ? '!' : '✓'}
                                        </button>
                                      )}
                                    </div>
                                    <div className="relative group/label">
                                      <span 
                                        className="text-xs text-gray-500 font-medium cursor-help"
                                      >
                                        {config.name.charAt(0)}
                                      </span>
                                      {/* Individual tooltip for this label only */}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/label:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                                        {config.name}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0 text-left">
                      Title
                    </label>
                    <input
                      name="title"
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={(e) => {
                        setFormData(prev => ({...prev, title: e.target.value}))
                        autoSave('title', e.target.value)
                      }}
                      placeholder={`What ${bucketConfig[panelBucket as keyof typeof bucketConfig]?.name.slice(0, -1).toLowerCase()} are you ${panelMode === 'add' ? 'adding' : 'editing'}?`}
                      className="w-4/5 px-2 py-1 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-start gap-4">
                    <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0 pt-2 text-left">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => {
                        setFormData(prev => ({...prev, description: e.target.value}))
                        autoSave('description', e.target.value)
                      }}
                      placeholder="Add details, context, or notes..."
                      className="w-4/5 px-2 py-1 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0 text-left">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={(e) => {
                        setFormData({...formData, status: e.target.value})
                        autoSave('status', e.target.value)
                      }}
                      className="w-4/5 px-2 py-1 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      {(apiStatuses[panelBucket] || []).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Fields */}
                  {bucketFields[panelBucket]?.filter(field => 
                    // Exclude fields that have the same name as built-in fields
                    !['title', 'description', 'status'].includes(field.name.toLowerCase())
                  ).map(field => (
                    <div key={field.id} className="flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0 text-left">
                        {field.label || field.name}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'text' && (
                        <input
                          name={`custom_${field.name}`}
                          type="text"
                          required={field.required}
                          value={currentEditItem?.extraFields?.[field.name] || field.defaultValue || ''}
                          onChange={(e) => {
                            setFormErrors(prev => ({...prev, [field.name]: false}))
                            // Update the current edit item state immediately
                            if (currentEditItem) {
                              setCurrentEditItem({
                                ...currentEditItem,
                                extraFields: {
                                  ...currentEditItem.extraFields,
                                  [field.name]: e.target.value
                                }
                              })
                            }
                            autoSave(field.name, e.target.value)
                          }}
                          className={`w-4/5 px-2 py-1 border rounded-lg focus:outline-none ${
                            formErrors[field.name] 
                              ? 'border-red-500 focus:border-red-500 bg-red-50' 
                              : 'border-gray-300 focus:border-blue-500'
                          }`}
                        />
                      )}
                      {field.type === 'email' && (
                        <input
                          name={`custom_${field.name}`}
                          type="email"
                          required={field.required}
                          defaultValue={currentEditItem?.extraFields?.[field.name] || field.defaultValue || ''}
                          className={`w-4/5 px-2 py-1 border rounded-lg focus:outline-none ${
                            formErrors[field.name] 
                              ? 'border-red-500 focus:border-red-500 bg-red-50' 
                              : 'border-gray-300 focus:border-blue-500'
                          }`}
                          onChange={() => setFormErrors(prev => ({...prev, [field.name]: false}))}
                        />
                      )}
                      {field.type === 'boolean' && (
                        <input
                          name={`custom_${field.name}`}
                          type="checkbox"
                          defaultChecked={currentEditItem?.extraFields?.[field.name] || field.defaultValue || false}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      )}
                      {field.type === 'date' && (
                        <input
                          name={`custom_${field.name}`}
                          type="date"
                          required={field.required}
                          value={currentEditItem?.extraFields?.[field.name] || field.defaultValue || ''}
                          onChange={(e) => {
                            setFormErrors(prev => ({...prev, [field.name]: false}))
                            // Update the current edit item state immediately
                            if (currentEditItem) {
                              setCurrentEditItem({
                                ...currentEditItem,
                                extraFields: {
                                  ...currentEditItem.extraFields,
                                  [field.name]: e.target.value
                                }
                              })
                            }
                            autoSave(field.name, e.target.value)
                          }}
                          className={`w-4/5 px-2 py-1 border rounded-lg focus:outline-none ${
                            formErrors[field.name] 
                              ? 'border-red-500 focus:border-red-500 bg-red-50' 
                              : 'border-gray-300 focus:border-blue-500'
                          }`}
                        />
                      )}
                      {field.type === 'array' && (
                        <select
                          name={`custom_${field.name}`}
                          multiple={field.multiSelect}
                          required={field.required}
                          value={field.name === 'priority' ? (formData.priority || '') : 
                                 field.name === 'energy' ? (formData.energy || '') :
                                 (currentEditItem?.extraFields?.[field.name] || field.defaultValue || (field.multiSelect ? [] : ''))}
                          onChange={(e) => {
                            setFormErrors(prev => ({...prev, [field.name]: false}))
                            if (field.name === 'priority') {
                              setFormData(prev => ({...prev, priority: e.target.value}))
                              autoSave('priority', e.target.value)
                            } else if (field.name === 'energy') {
                              setFormData(prev => ({...prev, energy: e.target.value}))
                              autoSave('energy', e.target.value)
                            }
                          }}
                          className={`w-4/5 px-2 py-1 border rounded-lg focus:outline-none ${
                            formErrors[field.name] 
                              ? 'border-red-500 focus:border-red-500 bg-red-50' 
                              : 'border-gray-300 focus:border-blue-500'
                          }`}
                        >
                          {field.arrayOptions?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}

                  {/* Dynamic Relationship Fields by Bucket - Integrated as Form Fields */}
                  {currentEditItem && (() => {
                    // Group existing relationships by bucket type
                    const relationshipsByBucket: Record<string, any[]> = {}
                    if (itemRelationships[currentEditItem.id]) {
                      itemRelationships[currentEditItem.id].forEach(rel => {
                        const relatedItem = rel.childId === currentEditItem.id ? 
                          { id: rel.parentId, title: rel.parentTitle, bucket: rel.parentBucket, relationship: rel.relationship } :
                          { id: rel.childId, title: rel.childTitle, bucket: rel.childBucket, relationship: rel.relationship }
                        
                        if (!relationshipsByBucket[relatedItem.bucket]) {
                          relationshipsByBucket[relatedItem.bucket] = []
                        }
                        relationshipsByBucket[relatedItem.bucket].push(relatedItem)
                      })
                    }

                    // Show fields for all bucket types (except current item's bucket)
                    const allBuckets = Object.keys(bucketConfig).filter(bucket => bucket !== currentEditItem.bucket)
                    
                    return allBuckets.map(bucket => {
                      const relatedItems = relationshipsByBucket[bucket] || []
                      return (
                        <div key={bucket} className="flex items-center gap-3 py-2">
                          <div className="flex items-center gap-2 w-1/5">
                            <label className="text-sm text-gray-700 font-medium">
                              {bucketConfig[bucket]?.name}
                            </label>
                          </div>
                          <div className="w-4/5">
                            <select
                              multiple
                              value={relatedItems.map(item => item.id)}
                              onChange={async (e) => {
                                const selectedIds = Array.from(e.target.selectedOptions, option => option.value)
                                const currentIds = relatedItems.map(item => item.id)
                                
                                // Find items to remove (were selected, now not)
                                const toRemove = currentIds.filter(id => !selectedIds.includes(id))
                                // Find items to add (not selected before, now selected)
                                const toAdd = selectedIds.filter(id => !currentIds.includes(id))
                                
                                try {
                                  // Remove relationships
                                  for (const itemId of toRemove) {
                                    const rel = itemRelationships[currentEditItem.id]?.find(r => 
                                      (r.childId === itemId && r.parentId === currentEditItem.id) ||
                                      (r.parentId === itemId && r.childId === currentEditItem.id)
                                    )
                                    if (rel) {
                                      await fetch(`/api/relationships/${rel.id}`, { method: 'DELETE' })
                                    }
                                  }
                                  
                                  // Add new relationships
                                  for (const itemId of toAdd) {
                                    await createRelationship(currentEditItem.id, itemId, 'contains')
                                  }
                                  
                                  // Reload relationships
                                  await loadItemRelationships(currentEditItem.id)
                                } catch (error) {
                                  console.error('Failed to update relationships:', error)
                                }
                              }}
                              onMouseDown={(e) => {
                                // Handle Cmd+click for deselection
                                if (e.metaKey || e.ctrlKey) {
                                  const option = e.target as HTMLOptionElement
                                  if (option.tagName === 'OPTION') {
                                    const itemId = option.value
                                    const isCurrentlySelected = relatedItems.some(rel => rel.id === itemId)
                                    
                                    if (isCurrentlySelected) {
                                      // Deselect this item
                                      setTimeout(async () => {
                                        try {
                                          const rel = itemRelationships[currentEditItem.id]?.find(r => 
                                            (r.childId === itemId && r.parentId === currentEditItem.id) ||
                                            (r.parentId === itemId && r.childId === currentEditItem.id)
                                          )
                                          if (rel) {
                                            await fetch(`/api/relationships/${rel.id}`, { method: 'DELETE' })
                                            await loadItemRelationships(currentEditItem.id)
                                          }
                                        } catch (error) {
                                          console.error('Failed to remove relationship:', error)
                                        }
                                      }, 0)
                                    }
                                  }
                                }
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              style={{
                                background: 'white'
                              }}
                              size={Math.min(Math.max(relatedItems.length + 1, 3), 6)}
                            >
                              {availableItems
                                .filter(item => item.bucket === bucket && item.id !== currentEditItem?.id)
                                .sort((a, b) => {
                                  const aIsSelected = relatedItems.some(rel => rel.id === a.id)
                                  const bIsSelected = relatedItems.some(rel => rel.id === b.id)
                                  if (aIsSelected && !bIsSelected) return -1
                                  if (!aIsSelected && bIsSelected) return 1
                                  return a.title.localeCompare(b.title)
                                })
                                .map(item => {
                                  const isSelected = relatedItems.some(rel => rel.id === item.id)
                                  return (
                                    <option 
                                      key={item.id} 
                                      value={item.id}
                                      style={{
                                        fontWeight: isSelected ? 'bold' : 'normal'
                                      }}
                                    >
                                      {isSelected ? '✓ ' : ''}{item.title}
                                    </option>
                                  )
                                })}
                            </select>
                            {relatedItems.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Hold Cmd + click to deselect items
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  })()}

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
