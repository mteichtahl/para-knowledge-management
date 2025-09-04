import { useState, useEffect } from 'react'
import { Search, Plus, Settings, X, Target, Briefcase, BookOpen, Archive, CheckSquare, CheckCircle, Link } from 'lucide-react'
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
  PROJECT: ['Planning', 'In Progress', 'On Hold', 'Completed'],
  AREA: ['Active', 'Needs Attention', 'Maintaining'],
  RESOURCE: ['Available', 'In Use', 'Outdated'],
  ARCHIVE: ['Archived'],
  ACTION: ['Next', 'Waiting', 'Someday', 'Done']
}

function App() {
  const [items, setItems] = useState<Item[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBucket, setSelectedBucket] = useState<string>('PROJECT')
  const [bucketFields, setBucketFields] = useState<Record<string, CustomField[]>>({})
  const [showPanel, setShowPanel] = useState(false)
  const [panelMode, setPanelMode] = useState<'add' | 'edit' | 'fields'>('add')
  const [panelBucket, setPanelBucket] = useState<string>('PROJECT')
  const [currentEditItem, setCurrentEditItem] = useState<Item | null>(null)
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [showAddField, setShowAddField] = useState(false)
  const [newField, setNewField] = useState({
    name: '',
    type: 'text',
    arrayOptions: '',
    multiSelect: false,
    defaultValue: ''
  })

  useEffect(() => {
    loadItems()
    loadBucketFields()
    loadCustomFields()
  }, [])

  const loadItems = async () => {
    try {
      const response = await fetch('/api/items')
      const data = await response.json()
      setItems(data)
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
    setShowPanel(true)
  }

  const openEditPanel = (item: Item) => {
    setPanelMode('edit')
    setPanelBucket(item.bucket)
    setCurrentEditItem(item)
    setShowPanel(true)
  }

  const openFieldsPanel = () => {
    setPanelMode('fields')
    setShowPanel(true)
  }

  const createCustomField = async () => {
    if (!newField.name.trim()) {
      alert('Field name is required')
      return
    }

    try {
      const fieldData = {
        name: newField.name.trim(),
        type: newField.type,
        arrayOptions: newField.type === 'array' ? newField.arrayOptions.split(',').map(s => s.trim()).filter(s => s) : undefined,
        multiSelect: newField.multiSelect,
        defaultValue: newField.defaultValue || null
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
        setNewField({ name: '', type: 'text', arrayOptions: '', multiSelect: false, defaultValue: '' })
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

  const toggleFieldForBucket = async (fieldId: string, bucket: string) => {
    // For now, just update the UI state locally without making API calls
    // This allows users to see the intended behavior
    const currentAssignments = bucketFields[bucket] || []
    const isAssigned = currentAssignments.some(f => f.id === fieldId)
    
    if (isAssigned) {
      // Remove from local state
      setBucketFields(prev => ({
        ...prev,
        [bucket]: prev[bucket]?.filter(f => f.id !== fieldId) || []
      }))
      console.log(`Removed field ${fieldId} from bucket ${bucket} (local only)`)
    } else {
      // Add to local state
      const field = customFields.find(f => f.id === fieldId)
      if (field) {
        setBucketFields(prev => ({
          ...prev,
          [bucket]: [...(prev[bucket] || []), field]
        }))
        console.log(`Added field ${fieldId} to bucket ${bucket} (local only)`)
      }
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
        loadItems()
      }
    } catch (error) {
      console.error('Failed to create item:', error)
    }
  }

  const updateItem = async (itemId: string, title: string, description: string, status: string, extraFields: Record<string, any>) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          description, 
          status, 
          extraFields 
        })
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

          <div className="flex items-center gap-6 mb-4">
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

          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">
                {bucketConfig[selectedBucket as keyof typeof bucketConfig].description}
              </p>
            </div>
            
            <button
              onClick={() => openAddPanel(selectedBucket)}
              className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New {bucketConfig[selectedBucket as keyof typeof bucketConfig].name.slice(0, -1)}
            </button>
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
            <div className="space-y-2">
              {selectedBucketItems.map(item => (
                <div
                  key={item.id}
                  className="group flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  onClick={() => openEditPanel(item)}
                >
                  <div className="flex-1">
                    <div className="text-gray-900 font-medium">
                      {item.title}
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      {item.status && (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {item.status === 'Completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                    >
                      <Link className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      {showPanel && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setShowPanel(false)}
        />
      )}

      {/* Right Slide-out Panel */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 z-50 ${
        showPanel ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {panelMode === 'add' ? 'Add New Item' : panelMode === 'edit' ? 'Edit Item' : 'Custom Fields'}
              </h2>
              <button
                onClick={() => setShowPanel(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {panelMode === 'fields' ? 'Manage custom fields and assign them to buckets' : bucketConfig[panelBucket as keyof typeof bucketConfig]?.name}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {panelMode === 'fields' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Custom Fields</h3>
                  <button
                    onClick={() => setShowAddField(true)}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Field
                  </button>
                </div>

                {showAddField && (
                  <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={newField.name}
                        onChange={(e) => setNewField({...newField, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={newField.type}
                        onChange={(e) => setNewField({...newField, type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="text">Text</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                        <option value="array">Array</option>
                      </select>
                    </div>
                    {newField.type === 'array' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Options (comma-separated)</label>
                        <input
                          type="text"
                          value={newField.arrayOptions}
                          onChange={(e) => setNewField({...newField, arrayOptions: e.target.value})}
                          placeholder="low, medium, high"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={createCustomField}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowAddField(false)}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {customFields.map(field => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{field.name}</h4>
                          <p className="text-sm text-gray-600">{field.type}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-sm">
                        {Object.entries(bucketConfig).map(([bucket, config]) => (
                          <label key={bucket} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={bucketFields[bucket]?.some(f => f.id === field.id) || false}
                              onChange={() => toggleFieldForBucket(field.id, bucket)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded mr-2"
                            />
                            <span className="text-xs">{config.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const title = formData.get('title') as string
                const description = formData.get('description') as string
                const status = formData.get('status') as string
                
                const extraFields: Record<string, any> = {}
                bucketFields[panelBucket]?.forEach(field => {
                  const value = formData.get(`custom_${field.name}`)
                  if (value !== null) {
                    if (field.type === 'boolean') {
                      extraFields[field.name] = value === 'on'
                    } else {
                      extraFields[field.name] = value
                    }
                  }
                })

                if (panelMode === 'add') {
                  createItem(panelBucket, title, description, status, extraFields)
                } else if (currentEditItem) {
                  updateItem(currentEditItem.id, title, description, status, extraFields)
                }
                setShowPanel(false)
              }}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      name="title"
                      type="text"
                      required
                      defaultValue={currentEditItem?.title || ''}
                      placeholder={`What ${bucketConfig[panelBucket as keyof typeof bucketConfig]?.name.slice(0, -1).toLowerCase()} are you ${panelMode === 'add' ? 'adding' : 'editing'}?`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={4}
                      defaultValue={currentEditItem?.description || ''}
                      placeholder="Add details, context, or notes..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={currentEditItem?.status || statuses[panelBucket as keyof typeof statuses][0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      {statuses[panelBucket as keyof typeof statuses].map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Fields */}
                  {bucketFields[panelBucket]?.map(field => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.name}
                      </label>
                      {field.type === 'text' && (
                        <input
                          name={`custom_${field.name}`}
                          type="text"
                          defaultValue={currentEditItem?.extraFields?.[field.name] || field.defaultValue || ''}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
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
                          defaultValue={currentEditItem?.extraFields?.[field.name] || field.defaultValue || ''}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      )}
                      {field.type === 'array' && (
                        <select
                          name={`custom_${field.name}`}
                          multiple={field.multiSelect}
                          defaultValue={currentEditItem?.extraFields?.[field.name] || field.defaultValue || (field.multiSelect ? [] : '')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        >
                          {field.arrayOptions?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {panelMode === 'add' ? 'Create' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPanel(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
