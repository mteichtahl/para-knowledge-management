import React from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onRowClick?: (row: TData) => void
  itemRelationships?: Record<string, any[]>
  currentBucket?: string
  allItems?: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  itemRelationships = {},
  currentBucket,
  allItems = [],
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [columnOrder, setColumnOrder] = React.useState<string[]>([
    'title',
    'status', 
    'extraFields.priority',
    'extraFields.energy',
    'extraFields.startdate',
    'extraFields.enddate',
    'extraFields.owner',
    'extraFields.email'
  ])
  const [statusFilter, setStatusFilter] = React.useState<string[]>([])
  const [energyFilter, setEnergyFilter] = React.useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = React.useState<string[]>([])
  const [projectsFilter, setProjectsFilter] = React.useState<string[]>([])
  const [areasFilter, setAreasFilter] = React.useState<string[]>([])
  const [resourcesFilter, setResourcesFilter] = React.useState<string[]>([])
  const [actionsFilter, setActionsFilter] = React.useState<string[]>([])
  const [showStatusDropdown, setShowStatusDropdown] = React.useState(false)
  const [showEnergyDropdown, setShowEnergyDropdown] = React.useState(false)
  const [showPriorityDropdown, setShowPriorityDropdown] = React.useState(false)
  const [showProjectsDropdown, setShowProjectsDropdown] = React.useState(false)
  const [showAreasDropdown, setShowAreasDropdown] = React.useState(false)
  const [showResourcesDropdown, setShowResourcesDropdown] = React.useState(false)
  const [showActionsDropdown, setShowActionsDropdown] = React.useState(false)

  // Get unique values for filters
  const statusOptions = React.useMemo(() => {
    const statuses = new Set<string>()
    data.forEach((item: any) => {
      if (item.status) statuses.add(item.status)
    })
    return Array.from(statuses).sort()
  }, [data])

  const energyOptions = React.useMemo(() => {
    const energies = new Set<string>()
    data.forEach((item: any) => {
      if (item.extraFields?.energy) energies.add(item.extraFields.energy)
    })
    return Array.from(energies).sort()
  }, [data])

  const priorityOptions = React.useMemo(() => {
    const priorities = new Set<string>()
    data.forEach((item: any) => {
      if (item.extraFields?.priority) priorities.add(item.extraFields.priority)
    })
    return Array.from(priorities).sort()
  }, [data])

  const projectsOptions = React.useMemo(() => {
    const projects: {id: string, title: string}[] = []
    allItems.forEach((item: any) => {
      const bucket = item.bucket?.toLowerCase()
      if (bucket === 'projects' || bucket === 'project') {
        projects.push({ id: item.id, title: item.title })
      }
    })
    return projects
  }, [allItems])

  const areasOptions = React.useMemo(() => {
    const areas: {id: string, title: string}[] = []
    allItems.forEach((item: any) => {
      const bucket = item.bucket?.toLowerCase()
      if (bucket === 'areas' || bucket === 'area') {
        areas.push({ id: item.id, title: item.title })
      }
    })
    return areas
  }, [allItems])

  const resourcesOptions = React.useMemo(() => {
    const resources: {id: string, title: string}[] = []
    allItems.forEach((item: any) => {
      const bucket = item.bucket?.toLowerCase()
      if (bucket === 'resources' || bucket === 'resource') {
        resources.push({ id: item.id, title: item.title })
      }
    })
    return resources
  }, [allItems])

  const actionsOptions = React.useMemo(() => {
    const actions: {id: string, title: string}[] = []
    allItems.forEach((item: any) => {
      const bucket = item.bucket?.toLowerCase()
      if (bucket === 'actions' || bucket === 'action') {
        actions.push({ id: item.id, title: item.title })
      }
    })
    return actions
  }, [allItems])

  // Filter data based on selected filters
  const filteredData = React.useMemo(() => {
    return data.filter((item: any) => {
      const statusMatch = statusFilter.length === 0 || statusFilter.includes(item.status)
      const energyMatch = energyFilter.length === 0 || energyFilter.includes(item.extraFields?.energy)
      const priorityMatch = priorityFilter.length === 0 || priorityFilter.includes(item.extraFields?.priority)
      
      // Check if item has relationships to selected bucket items
      const relationships = itemRelationships[item.id] || []
      const projectsMatch = projectsFilter.length === 0 || projectsFilter.some(projectId => 
        relationships.some(rel => rel.childId === projectId || rel.parentId === projectId)
      )
      const areasMatch = areasFilter.length === 0 || areasFilter.some(areaId => 
        relationships.some(rel => rel.childId === areaId || rel.parentId === areaId)
      )
      const resourcesMatch = resourcesFilter.length === 0 || resourcesFilter.some(resourceId => 
        relationships.some(rel => rel.childId === resourceId || rel.parentId === resourceId)
      )
      const actionsMatch = actionsFilter.length === 0 || actionsFilter.some(actionId => 
        relationships.some(rel => rel.childId === actionId || rel.parentId === actionId)
      )
      
      return statusMatch && energyMatch && priorityMatch && projectsMatch && areasMatch && resourcesMatch && actionsMatch
    })
  }, [data, statusFilter, energyFilter, priorityFilter, projectsFilter, areasFilter, resourcesFilter, actionsFilter, itemRelationships])

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.filter-dropdown')) {
        setShowStatusDropdown(false)
        setShowPriorityDropdown(false)
        setShowEnergyDropdown(false)
        setShowProjectsDropdown(false)
        setShowAreasDropdown(false)
        setShowResourcesDropdown(false)
        setShowActionsDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    state: {
      globalFilter,
      columnOrder,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 py-4">
        <input
          placeholder="Search items..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        {/* Quick Filters */}
        <div className="relative filter-dropdown">
          <button
            onClick={() => {
              setShowStatusDropdown(!showStatusDropdown)
              setShowProjectsDropdown(false)
              setShowAreasDropdown(false)
              setShowResourcesDropdown(false)
              setShowActionsDropdown(false)
              setShowPriorityDropdown(false)
              setShowEnergyDropdown(false)
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center gap-2"
          >
            Status {statusFilter.length > 0 && `(${statusFilter.length})`}
            <span className="text-xs">▼</span>
          </button>
          {showStatusDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[150px]">
              {statusOptions.map(status => (
                <label key={status} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusFilter.includes(status)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setStatusFilter([...statusFilter, status])
                      } else {
                        setStatusFilter(statusFilter.filter(s => s !== status))
                      }
                    }}
                    className="mr-2"
                  />
                  {status}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="relative filter-dropdown">
          <button
            onClick={() => {
              setShowPriorityDropdown(!showPriorityDropdown)
              setShowProjectsDropdown(false)
              setShowAreasDropdown(false)
              setShowResourcesDropdown(false)
              setShowActionsDropdown(false)
              setShowStatusDropdown(false)
              setShowEnergyDropdown(false)
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center gap-2"
          >
            Priority {priorityFilter.length > 0 && `(${priorityFilter.length})`}
            <span className="text-xs">▼</span>
          </button>
          {showPriorityDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[150px]">
              {priorityOptions.map(priority => (
                <label key={priority} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={priorityFilter.includes(priority)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPriorityFilter([...priorityFilter, priority])
                      } else {
                        setPriorityFilter(priorityFilter.filter(p => p !== priority))
                      }
                    }}
                    className="mr-2"
                  />
                  {priority}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="relative filter-dropdown">
          <button
            onClick={() => {
              setShowEnergyDropdown(!showEnergyDropdown)
              setShowProjectsDropdown(false)
              setShowAreasDropdown(false)
              setShowResourcesDropdown(false)
              setShowActionsDropdown(false)
              setShowStatusDropdown(false)
              setShowPriorityDropdown(false)
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center gap-2"
          >
            Energy {energyFilter.length > 0 && `(${energyFilter.length})`}
            <span className="text-xs">▼</span>
          </button>
          {showEnergyDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[150px]">
              {energyOptions.map(energy => (
                <label key={energy} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={energyFilter.includes(energy)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEnergyFilter([...energyFilter, energy])
                      } else {
                        setEnergyFilter(energyFilter.filter(e => e !== energy))
                      }
                    }}
                    className="mr-2"
                  />
                  {energy}
                </label>
              ))}
            </div>
          )}
        </div>

        {currentBucket !== 'PROJECT' && (
          <div className="relative filter-dropdown">
            <button
              onClick={() => {
                setShowProjectsDropdown(!showProjectsDropdown)
                setShowAreasDropdown(false)
                setShowResourcesDropdown(false)
                setShowActionsDropdown(false)
                setShowStatusDropdown(false)
                setShowPriorityDropdown(false)
                setShowEnergyDropdown(false)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center gap-2"
            >
              Projects {projectsFilter.length > 0 && `(${projectsFilter.length})`}
              <span className="text-xs">▼</span>
            </button>
            {showProjectsDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[200px] max-h-60 overflow-y-auto">
                <div className="px-3 py-2 text-xs text-gray-500 border-b">
                  {projectsOptions.length} items
                </div>
                {projectsOptions
                  .map(project => {
                    const relatedCount = data.filter((item: any) => {
                      const relationships = itemRelationships[item.id] || []
                      return relationships.some(rel => rel.childId === project.id || rel.parentId === project.id)
                    }).length
                    return { ...project, relatedCount }
                  })
                  .sort((a, b) => {
                    if (a.relatedCount > 0 && b.relatedCount === 0) return -1
                    if (a.relatedCount === 0 && b.relatedCount > 0) return 1
                    return a.title.localeCompare(b.title)
                  })
                  .map(project => (
                    <label key={project.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={projectsFilter.includes(project.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProjectsFilter([...projectsFilter, project.id])
                            } else {
                              setProjectsFilter(projectsFilter.filter(p => p !== project.id))
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="truncate">{project.title}</span>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">({project.relatedCount})</span>
                    </label>
                  ))}
              </div>
            )}
          </div>
        )}

        {currentBucket !== 'AREA' && (
          <div className="relative filter-dropdown">
            <button
              onClick={() => {
                setShowAreasDropdown(!showAreasDropdown)
                setShowProjectsDropdown(false)
                setShowResourcesDropdown(false)
                setShowActionsDropdown(false)
                setShowStatusDropdown(false)
                setShowPriorityDropdown(false)
                setShowEnergyDropdown(false)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center gap-2"
            >
              Areas {areasFilter.length > 0 && `(${areasFilter.length})`}
              <span className="text-xs">▼</span>
            </button>
            {showAreasDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[200px] max-h-60 overflow-y-auto">
                <div className="px-3 py-2 text-xs text-gray-500 border-b">
                  {areasOptions.length} items
                </div>
                {areasOptions
                  .map(area => {
                    const relatedCount = data.filter((item: any) => {
                      const relationships = itemRelationships[item.id] || []
                      return relationships.some(rel => rel.childId === area.id || rel.parentId === area.id)
                    }).length
                    return { ...area, relatedCount }
                  })
                  .sort((a, b) => {
                    if (a.relatedCount > 0 && b.relatedCount === 0) return -1
                    if (a.relatedCount === 0 && b.relatedCount > 0) return 1
                    return a.title.localeCompare(b.title)
                  })
                  .map(area => (
                    <label key={area.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={areasFilter.includes(area.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAreasFilter([...areasFilter, area.id])
                            } else {
                              setAreasFilter(areasFilter.filter(a => a !== area.id))
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="truncate">{area.title}</span>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">({area.relatedCount})</span>
                    </label>
                  ))}
              </div>
            )}
          </div>
        )}

        {currentBucket !== 'RESOURCE' && (
          <div className="relative filter-dropdown">
            <button
              onClick={() => {
                setShowResourcesDropdown(!showResourcesDropdown)
                setShowProjectsDropdown(false)
                setShowAreasDropdown(false)
                setShowActionsDropdown(false)
                setShowStatusDropdown(false)
                setShowPriorityDropdown(false)
                setShowEnergyDropdown(false)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center gap-2"
            >
              Resources {resourcesFilter.length > 0 && `(${resourcesFilter.length})`}
              <span className="text-xs">▼</span>
            </button>
            {showResourcesDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[200px] max-h-60 overflow-y-auto">
                <div className="px-3 py-2 text-xs text-gray-500 border-b">
                  {resourcesOptions.length} items
                </div>
                {resourcesOptions
                  .map(resource => {
                    const relatedCount = data.filter((item: any) => {
                      const relationships = itemRelationships[item.id] || []
                      return relationships.some(rel => rel.childId === resource.id || rel.parentId === resource.id)
                    }).length
                    return { ...resource, relatedCount }
                  })
                  .sort((a, b) => {
                    if (a.relatedCount > 0 && b.relatedCount === 0) return -1
                    if (a.relatedCount === 0 && b.relatedCount > 0) return 1
                    return a.title.localeCompare(b.title)
                  })
                  .map(resource => (
                    <label key={resource.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={resourcesFilter.includes(resource.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setResourcesFilter([...resourcesFilter, resource.id])
                            } else {
                              setResourcesFilter(resourcesFilter.filter(r => r !== resource.id))
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="truncate">{resource.title}</span>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">({resource.relatedCount})</span>
                    </label>
                  ))}
              </div>
            )}
          </div>
        )}

        {currentBucket !== 'ACTION' && (
          <div className="relative filter-dropdown">
            <button
              onClick={() => {
                setShowActionsDropdown(!showActionsDropdown)
                setShowProjectsDropdown(false)
                setShowAreasDropdown(false)
                setShowResourcesDropdown(false)
                setShowStatusDropdown(false)
                setShowPriorityDropdown(false)
                setShowEnergyDropdown(false)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center gap-2"
            >
              Actions {actionsFilter.length > 0 && `(${actionsFilter.length})`}
              <span className="text-xs">▼</span>
            </button>
            {showActionsDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[200px] max-h-60 overflow-y-auto">
                <div className="px-3 py-2 text-xs text-gray-500 border-b">
                  {actionsOptions.length} items
                </div>
                {actionsOptions
                  .map(action => {
                    const relatedCount = data.filter((item: any) => {
                      const relationships = itemRelationships[item.id] || []
                      return relationships.some(rel => rel.childId === action.id || rel.parentId === action.id)
                    }).length
                    return { ...action, relatedCount }
                  })
                  .sort((a, b) => {
                    if (a.relatedCount > 0 && b.relatedCount === 0) return -1
                    if (a.relatedCount === 0 && b.relatedCount > 0) return 1
                    return a.title.localeCompare(b.title)
                  })
                  .map(action => (
                    <label key={action.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={actionsFilter.includes(action.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setActionsFilter([...actionsFilter, action.id])
                            } else {
                              setActionsFilter(actionsFilter.filter(a => a !== action.id))
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="truncate">{action.title}</span>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">({action.relatedCount})</span>
                    </label>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Clear Filters Button */}
        {(statusFilter.length > 0 || priorityFilter.length > 0 || energyFilter.length > 0 || projectsFilter.length > 0 || areasFilter.length > 0 || resourcesFilter.length > 0 || actionsFilter.length > 0) && (
          <button
            onClick={() => {
              setStatusFilter([])
              setPriorityFilter([])
              setEnergyFilter([])
              setProjectsFilter([])
              setAreasFilter([])
              setResourcesFilter([])
              setActionsFilter([])
              setShowStatusDropdown(false)
              setShowPriorityDropdown(false)
              setShowEnergyDropdown(false)
              setShowProjectsDropdown(false)
              setShowAreasDropdown(false)
              setShowResourcesDropdown(false)
              setShowActionsDropdown(false)
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Filters
          </button>
        )}
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="min-w-[120px]">
                      {header.isPlaceholder ? null : (
                        <div
                          className={header.column.getCanSort() ? "cursor-pointer select-none flex items-center gap-1" : "flex items-center gap-1"}
                          onClick={header.column.getToggleSortingHandler()}
                          draggable={!header.column.getIsPinned()}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', header.column.id)
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            const draggedColumnId = e.dataTransfer.getData('text/plain')
                            const targetColumnId = header.column.id
                            
                            if (draggedColumnId !== targetColumnId) {
                              const currentOrder = table.getState().columnOrder
                              const draggedIndex = currentOrder.indexOf(draggedColumnId)
                              const targetIndex = currentOrder.indexOf(targetColumnId)
                              
                              if (draggedIndex !== -1 && targetIndex !== -1) {
                                const newOrder = [...currentOrder]
                                newOrder.splice(draggedIndex, 1)
                                newOrder.splice(targetIndex, 0, draggedColumnId)
                                setColumnOrder(newOrder)
                              } else {
                                // Initialize column order if not set
                                const allColumnIds = table.getAllColumns().map(col => col.id)
                                const newOrder = [...allColumnIds]
                                const draggedIdx = newOrder.indexOf(draggedColumnId)
                                const targetIdx = newOrder.indexOf(targetColumnId)
                                if (draggedIdx !== -1 && targetIdx !== -1) {
                                  newOrder.splice(draggedIdx, 1)
                                  newOrder.splice(targetIdx, 0, draggedColumnId)
                                  setColumnOrder(newOrder)
                                }
                              }
                            }
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="text-xs">
                              {{
                                asc: '↑',
                                desc: '↓',
                              }[header.column.getIsSorted() as string] ?? '↕'}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="min-w-[120px]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} item(s)
        </div>
        <div className="space-x-2">
          <button
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <button
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
