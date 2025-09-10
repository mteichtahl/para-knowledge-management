import React from 'react'

interface Item {
  id: string
  bucket: string
  title: string
  description?: string
  status?: string
  extraFields?: Record<string, any>
  createdAt?: string
}

interface TimelineViewProps {
  items: Item[]
}

export const TimelineView: React.FC<TimelineViewProps> = ({ items }) => {
  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.id} className="flex items-start gap-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
          <div className="flex-1 pb-4 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <span className="text-xs text-gray-500">
                {item.extraFields?.deadline || (item.createdAt && new Date(item.createdAt).toLocaleDateString('en-AU'))}
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
}
