import React from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'

interface ViewSelectorProps {
  currentView: string
  setCurrentView: (view: string) => void
  hiddenColumns: Set<string>
  setHiddenColumns: (columns: Set<string>) => void
  availableColumns: string[]
  bucketConfig: any
  openAddPanel: (bucket: string) => void
}

export function ViewSelector({
  currentView,
  setCurrentView,
  hiddenColumns,
  setHiddenColumns,
  availableColumns,
  bucketConfig,
  openAddPanel
}: ViewSelectorProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-6">
        {[
          { key: 'kanban', label: 'Kanban', icon: '▢' },
          { key: 'list', label: 'List', icon: '≡' },
          { key: 'priority', label: 'By Priority', icon: '!' },
          { key: 'status', label: 'By Status', icon: '●' },
          { key: 'date', label: 'By Date', icon: '◐' },
          { key: 'timeline', label: 'Timeline', icon: '—' },
          { key: 'graph', label: 'Graph', icon: '○' }
        ].map(view => (
          <Button
            key={view.key}
            onClick={() => setCurrentView(view.key)}
            variant={currentView === view.key ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            <span className="text-base">{view.icon}</span>
            <span className="font-medium">{view.label}</span>
          </Button>
        ))}
      </div>
      
      {currentView === 'kanban' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              Columns
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {availableColumns.map(status => (
              <div key={status} className="flex items-center space-x-2 px-2 py-1">
                <input
                  type="checkbox"
                  id={`column-${status}`}
                  checked={!hiddenColumns.has(status)}
                  onChange={(e) => {
                    const newHidden = new Set(hiddenColumns)
                    if (e.target.checked) {
                      newHidden.delete(status)
                    } else {
                      newHidden.add(status)
                    }
                    setHiddenColumns(newHidden)
                  }}
                  className="w-4 h-4"
                />
                <label htmlFor={`column-${status}`} className="text-sm cursor-pointer flex-1">
                  {status}
                </label>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {Object.entries(bucketConfig).map(([bucket, config]: [string, any]) => {
            const Icon = config.icon
            return (
              <DropdownMenuItem
                key={bucket}
                onClick={() => openAddPanel(bucket)}
                className="flex items-center p-3 cursor-pointer"
              >
                <Icon className="w-4 h-4 mr-3" style={{ color: config.color }} />
                <div className="font-medium text-gray-900">
                  {config.name.slice(0, -1)}
                </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
