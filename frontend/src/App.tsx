import { useState, useEffect } from 'react'
import { Search, Plus, Settings, X, Target, Briefcase, BookOpen, Archive, CheckSquare, CheckCircle, Link, ChevronDown, ChevronRight } from 'lucide-react'
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
  const [showBucketAssignments, setShowBucketAssignments] = useState(false)
  // Predefined fields that cannot be removed from buckets
  const predefinedFields = ['priority', 'status', 'urgency', 'startDate', 'endDate', 'owner']
  const [showCustomFields, setShowCustomFields] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({})
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
    
    bucketFields[panelBucket]?.forEach(field => {
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
                          onClick={createCustomField}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setShowAddField(false)}
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
                  
                  {showCustomFields && (
                    <div className="border-t border-gray-200 p-3 space-y-2">
                      {customFields.map(field => (
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
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                
                // Validate form before proceeding
                if (!validateForm(formData)) {
                  return // Stop submission if validation fails
                }
                
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
                setFormErrors({}) // Clear form errors when closing
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
                        {field.label || field.name}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                        {formErrors[field.name] && (
                          <span className="text-red-500 text-xs ml-2">This field is required</span>
                        )}
                      </label>
                      {field.type === 'text' && (
                        <input
                          name={`custom_${field.name}`}
                          type="text"
                          required={field.required}
                          defaultValue={currentEditItem?.extraFields?.[field.name] || field.defaultValue || ''}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
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
                          defaultValue={currentEditItem?.extraFields?.[field.name] || field.defaultValue || ''}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                            formErrors[field.name] 
                              ? 'border-red-500 focus:border-red-500 bg-red-50' 
                              : 'border-gray-300 focus:border-blue-500'
                          }`}
                          onChange={() => setFormErrors(prev => ({...prev, [field.name]: false}))}
                        />
                      )}
                      {field.type === 'array' && (
                        <select
                          name={`custom_${field.name}`}
                          multiple={field.multiSelect}
                          required={field.required}
                          defaultValue={currentEditItem?.extraFields?.[field.name] || field.defaultValue || (field.multiSelect ? [] : '')}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                            formErrors[field.name] 
                              ? 'border-red-500 focus:border-red-500 bg-red-50' 
                              : 'border-gray-300 focus:border-blue-500'
                          }`}
                          onChange={() => setFormErrors(prev => ({...prev, [field.name]: false}))}
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
