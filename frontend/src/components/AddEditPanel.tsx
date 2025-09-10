import React from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet'

interface AddEditPanelProps {
  showPanel: boolean
  setShowPanel: (show: boolean) => void
  panelMode: 'add' | 'edit' | 'fields'
  panelBucket: string
  bucketConfig: any
  formData: any
  setFormData: (data: any) => void
  bucketFields: Record<string, any[]>
  apiStatuses: Record<string, string[]>
  formErrors: Record<string, boolean>
  availableItems: any[]
  selectedRelationships: string[]
  setSelectedRelationships: (relationships: string[]) => void
  createItem: (bucket: string, title: string, description: string, status: string, extraFields: Record<string, any>) => Promise<any>
  updateItem: (item: any) => Promise<void>
  currentEditItem: any
  loadItems: () => Promise<void>
  addRelationship: (parentId: string, childId: string, relationshipType: string) => Promise<void>
}

export function AddEditPanel({
  showPanel,
  setShowPanel,
  panelMode,
  panelBucket,
  bucketConfig,
  formData,
  setFormData,
  bucketFields,
  apiStatuses,
  formErrors,
  availableItems,
  selectedRelationships,
  setSelectedRelationships,
  createItem,
  updateItem,
  currentEditItem,
  loadItems,
  addRelationship
}: AddEditPanelProps) {
  const renderFieldInput = (field: any, value: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value || false}
              onCheckedChange={onChange}
            />
            <label htmlFor={field.name} className="text-sm font-medium">
              {field.label || field.name}
            </label>
          </div>
        )
      case 'array':
        return (
          <div>
            <label className="block text-sm font-medium mb-1">
              {field.label || field.name}
            </label>
            <Select
              value={Array.isArray(value) ? value.join(',') : value || ''}
              onValueChange={(val) => onChange(field.multiSelect ? val.split(',').filter(Boolean) : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label || field.name}`} />
              </SelectTrigger>
              <SelectContent>
                {field.arrayOptions?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 'date':
        return (
          <div>
            <label className="block text-sm font-medium mb-1">
              {field.label || field.name}
            </label>
            <Input
              type="date"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        )
      default:
        return (
          <div>
            <label className="block text-sm font-medium mb-1">
              {field.label || field.name}
            </label>
            <Input
              type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.description || `Enter ${field.label || field.name}`}
            />
          </div>
        )
    }
  }

  return (
    <Sheet open={showPanel} onOpenChange={setShowPanel}>
      <SheetContent className="w-[460px] sm:max-w-[460px]">
        <SheetHeader>
          <SheetTitle>
            {panelMode === 'add' 
              ? `Add new ${bucketConfig[panelBucket as keyof typeof bucketConfig]?.name.slice(0, -1).toLowerCase()}` 
              : `Update ${bucketConfig[panelBucket as keyof typeof bucketConfig]?.name.slice(0, -1)}`
            }
          </SheetTitle>
          {panelMode === 'add' && (
            <p className="text-sm text-gray-600 mt-2">
              Create a new {bucketConfig[panelBucket as keyof typeof bucketConfig]?.description.toLowerCase()}
            </p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pt-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter title"
                className={formErrors.title ? 'border-red-500' : ''}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter description"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {(apiStatuses[panelBucket] || []).map((status: string) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {bucketFields[panelBucket]?.map((field: any) => (
              <div key={field.id}>
                {renderFieldInput(
                  field,
                  formData.extraFields?.[field.name],
                  (value) => setFormData({
                    ...formData,
                    extraFields: {
                      ...formData.extraFields,
                      [field.name]: value
                    }
                  })
                )}
              </div>
            ))}

            {/* Relationships Section */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Relationships</h4>
              <div className="space-y-3">
                {Object.entries(bucketConfig).map(([bucket, config]) => {
                  const bucketItems = availableItems.filter(item => item.bucket === bucket && item.id !== currentEditItem?.id)
                  if (bucketItems.length === 0) return null
                  
                  const Icon = config.icon
                  return (
                    <details key={bucket} className="border rounded">
                      <summary className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <span className="font-medium">{config.name}</span>
                        <span className="text-xs text-gray-500 ml-auto">
                          ({selectedRelationships.filter(id => bucketItems.some(item => item.id === id)).length}/{bucketItems.length})
                        </span>
                      </summary>
                      <div className="p-2 pt-0 space-y-1 max-h-32 overflow-y-auto">
                        {bucketItems.map((item: any) => (
                          <div key={item.id} className="flex items-center space-x-2 py-1">
                            <Checkbox
                              id={`rel-${item.id}`}
                              checked={selectedRelationships.includes(item.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedRelationships([...selectedRelationships, item.id])
                                } else {
                                  setSelectedRelationships(selectedRelationships.filter(id => id !== item.id))
                                }
                              }}
                            />
                            <label htmlFor={`rel-${item.id}`} className="text-sm cursor-pointer flex-1">
                              {item.title}
                            </label>
                          </div>
                        ))}
                      </div>
                    </details>
                  )
                })}
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={async () => {
                  console.log('Selected relationships:', selectedRelationships)
                  
                  if (panelMode === 'edit' && currentEditItem) {
                    await updateItem({
                      ...currentEditItem,
                      title: formData.title,
                      description: formData.description,
                      status: formData.status,
                      extraFields: formData.extraFields || {}
                    })
                    
                    // Update relationships for edit mode too
                    if (selectedRelationships.length > 0) {
                      // Clear existing relationships first
                      try {
                        await fetch(`/api/relationships/${currentEditItem.id}`, { method: 'DELETE' })
                      } catch (error) {
                        console.log('No existing relationships to clear')
                      }
                      
                      // Add new relationships
                      for (const relatedId of selectedRelationships) {
                        console.log('Adding relationship:', currentEditItem.id, '->', relatedId)
                        await addRelationship(currentEditItem.id, relatedId, 'related')
                      }
                    }
                  } else {
                    const newItem = await createItem(
                      panelBucket,
                      formData.title,
                      formData.description || '',
                      formData.status,
                      formData.extraFields || {}
                    )
                    
                    // Add relationships
                    if (newItem && selectedRelationships.length > 0) {
                      for (const relatedId of selectedRelationships) {
                        console.log('Adding relationship:', newItem.id, '->', relatedId)
                        await addRelationship(newItem.id, relatedId, 'related')
                      }
                    }
                  }
                  
                  await loadItems()
                  setShowPanel(false)
                  setFormData({status: "Next Up"})
                  setSelectedRelationships([])
                }}
                disabled={!formData.title?.trim()}
                className="flex items-center gap-2 w-full"
              >
                <Plus className="w-4 h-4" />
                {panelMode === 'edit' ? 'Update' : 'Create'} {bucketConfig[panelBucket as keyof typeof bucketConfig]?.name.slice(0, -1)}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
