import { useState, useEffect } from 'react'
import { Plus, X, Save } from 'lucide-react'

interface CustomField {
  id: string
  name: string
  type: string
  arrayOptions?: string[]
  multiSelect?: boolean
  defaultValue?: any
}

const buckets = ['PROJECT', 'AREA', 'ACTION', 'RESOURCE', 'ARCHIVE']

function Fields() {
  const [fields, setFields] = useState<CustomField[]>([])
  const [bucketFields, setBucketFields] = useState<Record<string, string[]>>({})
  const [showAddField, setShowAddField] = useState(false)
  const [newField, setNewField] = useState({
    name: '',
    type: 'text',
    arrayOptions: '',
    multiSelect: false,
    defaultValue: ''
  })

  useEffect(() => {
    loadFields()
    loadBucketFields()
  }, [])

  const loadFields = async () => {
    try {
      const response = await fetch('/api/custom-fields')
      if (response.ok) {
        const data = await response.json()
        setFields(data)
      }
    } catch (error) {
      console.error('Failed to load fields:', error)
    }
  }

  const loadBucketFields = async () => {
    try {
      const bucketFieldsData: Record<string, string[]> = {}
      for (const bucket of buckets) {
        try {
          const response = await fetch(`/api/bucket-fields/${bucket}`)
          if (response.ok) {
            const data = await response.json()
            bucketFieldsData[bucket] = data.map((f: any) => f.id)
          } else {
            console.warn(`Failed to load fields for bucket ${bucket}:`, response.status)
            bucketFieldsData[bucket] = []
          }
        } catch (bucketError) {
          console.warn(`Error loading fields for bucket ${bucket}:`, bucketError)
          bucketFieldsData[bucket] = []
        }
      }
      setBucketFields(bucketFieldsData)
    } catch (error) {
      console.error('Failed to load bucket fields:', error)
    }
  }

  const createField = async () => {
    try {
      const fieldData = {
        ...newField,
        arrayOptions: newField.type === 'array' ? newField.arrayOptions.split(',').map(s => s.trim()) : undefined
      }
      
      const response = await fetch('/api/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldData)
      })

      if (response.ok) {
        loadFields()
        setShowAddField(false)
        setNewField({ name: '', type: 'text', arrayOptions: '', multiSelect: false, defaultValue: '' })
      }
    } catch (error) {
      console.error('Failed to create field:', error)
    }
  }

  const toggleFieldForBucket = async (fieldId: string, bucket: string) => {
    try {
      const isAssigned = bucketFields[bucket]?.includes(fieldId)
      
      if (isAssigned) {
        // Remove field from bucket
        const response = await fetch(`/api/bucket-fields/${bucket}/${fieldId}`, {
          method: 'DELETE'
        })
        if (response.ok) loadBucketFields()
      } else {
        // Add field to bucket
        const response = await fetch('/api/bucket-fields', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucketType: bucket, customFieldId: fieldId })
        })
        if (response.ok) loadBucketFields()
      }
    } catch (error) {
      console.error('Failed to toggle field:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Custom Fields</h1>
                <p className="text-gray-600 mt-1">Manage custom fields and assign them to buckets</p>
              </div>
              <button
                onClick={() => setShowAddField(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </button>
            </div>
          </div>

          <div className="p-6">
            {showAddField && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-medium mb-4">Add New Field</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={newField.name}
                      onChange={(e) => setNewField({...newField, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={newField.type}
                      onChange={(e) => setNewField({...newField, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="text">Text</option>
                      <option value="boolean">Boolean</option>
                      <option value="date">Date</option>
                      <option value="array">Array</option>
                    </select>
                  </div>
                  {newField.type === 'array' && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Options (comma-separated)</label>
                      <input
                        type="text"
                        value={newField.arrayOptions}
                        onChange={(e) => setNewField({...newField, arrayOptions: e.target.value})}
                        placeholder="low, medium, high"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={createField}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={() => setShowAddField(false)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Field Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Projects</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Areas</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Resources</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Archives</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map(field => (
                    <tr key={field.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium">{field.name}</td>
                      <td className="py-3 px-4 text-gray-600">{field.type}</td>
                      {buckets.map(bucket => (
                        <td key={bucket} className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={bucketFields[bucket]?.includes(field.id) || false}
                            onChange={() => toggleFieldForBucket(field.id, bucket)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Fields
