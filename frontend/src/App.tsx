import React, { useState, useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import ForceGraph2D from 'react-force-graph-2d'
import { Search, Plus, Settings, X, Target, Briefcase, BookOpen, Archive, CheckSquare, CheckCircle, Link, ChevronDown, ChevronRight, Edit, Trash2, Menu, AlertTriangle, Zap, CalendarDays, MessageSquare, Clock } from 'lucide-react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from './components/DataTable'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from './components/ui/sidebar'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Textarea } from './components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Checkbox } from './components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog'
import { Badge } from './components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { ThemeToggle } from './components/theme-toggle'
import ReactMarkdown from 'react-markdown'
import MDEditor from '@uiw/react-md-editor'
import './App.css'

interface Item {
  id: string
  bucket: string
  title: string
  description?: string
  status?: string
  tags?: string[]
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
  ACTION: { 
    name: 'Actions', 
    icon: CheckSquare,
    color: 'text-red-600',
    description: 'Individual actionable tasks and next steps'
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
  }
}

const statuses = {
  PROJECT: ['Next Up', 'In Progress', 'In Review', 'On Hold', 'Wont Do', 'Completed'],
  AREA: ['Next Up', 'In Progress', 'In Review', 'On Hold', 'Wont Do', 'Completed'],
  RESOURCE: ['Next Up', 'In Progress', 'In Review', 'On Hold', 'Wont Do', 'Completed'],
  ARCHIVE: ['Next Up', 'In Progress', 'In Review', 'On Hold', 'Wont Do', 'Completed'],
  ACTION: ['Next Up', 'In Progress', 'In Review', 'On Hold', 'Wont Do', 'Completed']
}

const D3NetworkGraph: React.FC<{ items: Item[], itemRelationships: Record<string, any[]>, bucketConfig: any }> = ({ items, itemRelationships, bucketConfig }) => {
  const graphRef = useRef<HTMLDivElement>(null)
  const [visibleBuckets, setVisibleBuckets] = useState<Set<string>>(new Set(['PROJECT', 'AREA', 'RESOURCE', 'ARCHIVE', 'ACTION']))
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  
  const bucketColors = {
    'PROJECT': '#3b82f6',
    'AREA': '#10b981', 
    'RESOURCE': '#f59e0b',
    'ARCHIVE': '#6b7280',
    'ACTION': '#ef4444'
  }

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery])

  const toggleBucket = (bucket: string) => {
    const newVisible = new Set(visibleBuckets)
    if (newVisible.has(bucket)) {
      newVisible.delete(bucket)
    } else {
      newVisible.add(bucket)
    }
    setVisibleBuckets(newVisible)
  }
  
  useEffect(() => {
    if (!graphRef.current) return
    
    // Clear previous graph
    d3.select(graphRef.current).selectAll("*").remove()
    
    // Filter items by visible buckets first
    let filteredItems = items.filter(item => visibleBuckets.has(item.bucket))
    
    // If there's a search query, find matching items and their connections
    if (debouncedSearchQuery.trim()) {
      const matchingItems = filteredItems.filter(item => 
        item.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
      
      // Get all connected item IDs
      const connectedItemIds = new Set(matchingItems.map(item => item.id))
      
      // Add all items connected to matching items
      Object.entries(itemRelationships).forEach(([itemId, relationships]) => {
        relationships.forEach(rel => {
          if (connectedItemIds.has(rel.parentId)) {
            connectedItemIds.add(rel.childId)
          }
          if (connectedItemIds.has(rel.childId)) {
            connectedItemIds.add(rel.parentId)
          }
        })
      })
      
      // Filter to only show matching items and their connections
      filteredItems = filteredItems.filter(item => connectedItemIds.has(item.id))
    }
    
    const filteredItemIds = new Set(filteredItems.map(item => item.id))
    
    // Prepare data
    const nodes = filteredItems.map(item => ({
      id: item.id,
      title: item.title,
      bucket: item.bucket,
      status: item.status,
      color: bucketColors[item.bucket as keyof typeof bucketColors] || '#6b7280'
    }))
    
    const links: any[] = []
    Object.entries(itemRelationships).forEach(([itemId, relationships]) => {
      relationships.forEach(rel => {
        // Only include links where both nodes are visible
        if (filteredItemIds.has(rel.parentId) && filteredItemIds.has(rel.childId)) {
          links.push({
            source: rel.parentId,
            target: rel.childId,
            relationship: rel.relationship
          })
        }
      })
    })
    
    // Create SVG
    const width = 1200
    const height = 800
    const svg = d3.select(graphRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "#f8f9fa")
    
    // Add zoom and pan behavior
    const g = svg.append("g")
    
    svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
      }))
    
    // Add arrow marker
    g.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", -1.5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999")
    
    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
    
    // Create curved links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(links)
      .enter().append("path")
      .attr("fill", "none")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#end)")
    
    // Create nodes
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .call(d3.drag()
        .on("start", (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on("drag", (event, d: any) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on("end", (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        }))
      .on("click", (event, d: any) => {
        // Get connected node IDs
        const connectedNodes = new Set([d.id])
        links.forEach((link: any) => {
          if (link.source.id === d.id) connectedNodes.add(link.target.id)
          if (link.target.id === d.id) connectedNodes.add(link.source.id)
        })
        
        // Update node opacity
        node.select("circle")
          .style("opacity", (n: any) => connectedNodes.has(n.id) ? 1 : 0.1)
        
        node.select("text")
          .style("opacity", (n: any) => connectedNodes.has(n.id) ? 1 : 0.1)
        
        // Update link opacity
        link.style("opacity", (l: any) => 
          connectedNodes.has(l.source.id) && connectedNodes.has(l.target.id) ? 0.6 : 0.1
        )
      })
      .on("mouseover", (event, d: any) => {
        // Get connected links
        const connectedLinks = links.filter((l: any) => 
          l.source.id === d.id || l.target.id === d.id
        )
        
        // Highlight connected links
        link.style("stroke", (l: any) => 
          connectedLinks.includes(l) ? "#000" : "#999"
        )
        .style("stroke-width", (l: any) => 
          connectedLinks.includes(l) ? "4" : "1.5"
        )
        .style("opacity", (l: any) => 
          connectedLinks.includes(l) ? 1 : 0.3
        )
        
        // Add pulsing animation to connected links
        link.filter((l: any) => connectedLinks.includes(l))
          .style("animation", "pulse 1s infinite")
      })
      .on("mouseout", (event, d: any) => {
        // Reset all links
        link.style("stroke", "#999")
          .style("stroke-width", "1.5")
          .style("opacity", 0.6)
          .style("animation", "none")
      })
    
    // Add circles to nodes
    node.append("circle")
      .attr("r", 8)
      .attr("fill", (d: any) => d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
    
    // Add labels to nodes
    node.append("text")
      .text((d: any) => d.title)
      .attr("x", 12)
      .attr("y", "0.31em")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("fill", "#333")
      .clone(true).lower()
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 3)
    
    // Double-click to reset
    svg.on("dblclick", () => {
      node.select("circle").style("opacity", 1)
      node.select("text").style("opacity", 1)
      link.style("opacity", 0.6)
    })
    
    // Update positions on tick
    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
        const dx = d.target.x - d.source.x
        const dy = d.target.y - d.source.y
        const dr = Math.sqrt(dx * dx + dy * dy) * 2
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`
      })
      
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`)
    })
    
    // Auto-fit view after simulation settles
    simulation.on("end", () => {
      if (nodes.length > 0) {
        const bounds = {
          minX: Math.min(...nodes.map(d => d.x)) - 50,
          maxX: Math.max(...nodes.map(d => d.x)) + 50,
          minY: Math.min(...nodes.map(d => d.y)) - 50,
          maxY: Math.max(...nodes.map(d => d.y)) + 50
        }
        
        const boundsWidth = bounds.maxX - bounds.minX
        const boundsHeight = bounds.maxY - bounds.minY
        const centerX = (bounds.minX + bounds.maxX) / 2
        const centerY = (bounds.minY + bounds.maxY) / 2
        
        const scale = Math.min(width / boundsWidth, height / boundsHeight) * 0.9
        const translateX = width / 2 - centerX * scale
        const translateY = height / 2 - centerY * scale
        
        svg.transition()
          .duration(750)
          .call(
            d3.zoom().transform,
            d3.zoomIdentity.translate(translateX, translateY).scale(scale)
          )
      }
    })
    
  }, [items, itemRelationships, bucketConfig, visibleBuckets, debouncedSearchQuery])

  return (
    <div className="w-full h-full relative">
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
      
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        {/* Search bar */}
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-2 border rounded-lg shadow-sm text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {/* Filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Filter Buckets ({visibleBuckets.size}/5) ▼
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-48">
            {Object.entries(bucketColors).map(([bucket, color]) => (
              <DropdownMenuItem
                key={bucket}
                onClick={() => toggleBucket(bucket)}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <Checkbox
                  checked={visibleBuckets.has(bucket)}
                  onChange={() => toggleBucket(bucket)}
                />
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-sm">{bucket}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div ref={graphRef} className="w-full h-full"></div>
    </div>
  )
}

function App() {
  const [items, setItems] = useState<Item[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBucket, setSelectedBucket] = useState<string>('PROJECT')
  const [editingCell, setEditingCell] = useState<{itemId: string, field: string} | null>(null)
  const [editingValue, setEditingValue] = useState<Record<string, string>>({})
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | 'quarter'>('month')
  const [bucketFields, setBucketFields] = useState<Record<string, CustomField[]>>({})
  const [apiStatuses, setApiStatuses] = useState<Record<string, string[]>>({})
  const [formData, setFormData] = useState<{status: string, priority?: string, energy?: string, title?: string, description?: string, tags?: string[], extraFields?: Record<string, any>}>({status: "Next Up"})
  const [tagsInput, setTagsInput] = useState('')
  const [allTags, setAllTags] = useState<string[]>([])
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [panelMode, setPanelMode] = useState<'add' | 'edit' | 'fields'>('add')
  const [panelBucket, setPanelBucket] = useState<string>('PROJECT')
  const [currentEditItem, setCurrentEditItem] = useState<Item | null>(null)
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [showAddField, setShowAddField] = useState(false)
  const [showBucketAssignments, setShowBucketAssignments] = useState(false)
  // Predefined fields that cannot be removed from buckets
  const predefinedFields = ['priority', 'status', 'energy', 'startDate', 'endDate', 'owner', 'link', 'email']
  const [showCustomFields, setShowCustomFields] = useState(true)
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
  const [currentView, setCurrentView] = useState<'list' | 'priority' | 'status' | 'date' | 'timeline' | 'kanban' | 'graph' | 'tags' | 'energy'>('kanban')

  // Set default view based on selected bucket
  useEffect(() => {
    if (selectedBucket === 'AREA') {
      setCurrentView('list')
    } else if (selectedBucket === 'RESOURCE') {
      setCurrentView('list')
    } else {
      setCurrentView('kanban')
    }
  }, [selectedBucket])
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set(['Completed', 'On Hold', 'Wont Do']))
  const [columnOrder, setColumnOrder] = useState<Record<string, string[]>>({})
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [notesCounts, setNotesCounts] = useState<Record<string, number>>({})
  const [showNotesPanel, setShowNotesPanel] = useState(false)
  const [selectedItemForNotes, setSelectedItemForNotes] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [editingNote, setEditingNote] = useState<{id: string, content: string} | null>(null)
  const [systemSummary, setSystemSummary] = useState<string>('')
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [showSummaryPanel, setShowSummaryPanel] = useState(false)
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

  // Initialize editing value when editing starts
  useEffect(() => {
    if (editingCell) {
      const editKey = `${editingCell.itemId}-${editingCell.field}`
      if (!editingValue[editKey]) {
        // Find the current value for this field
        const item = items.find(i => i.id === editingCell.itemId)
        if (item) {
          const currentValue = item.extraFields?.[editingCell.field] || ''
          setEditingValue(prev => ({ ...prev, [editKey]: currentValue }))
        }
      }
    }
  }, [editingCell, items])

  // Global escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPanel) {
          setShowPanel(false)
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showPanel])

  // Update form data when editing item changes
  useEffect(() => {
    if (currentEditItem) {
      setFormData({
        status: currentEditItem.status || "Next Up",
        title: currentEditItem.title || '',
        description: currentEditItem.description || '',
        tags: currentEditItem.tags || [],
        priority: currentEditItem.extraFields?.priority,
        energy: currentEditItem.extraFields?.energy,
        extraFields: {
          ...currentEditItem.extraFields,
          priority: currentEditItem.extraFields?.priority,
          energy: currentEditItem.extraFields?.energy
        }
      })
      setTagsInput('')
    } else {
      setFormData({status: "Next Up", tags: []})
      setTagsInput('')
    }
  }, [currentEditItem])

  const loadAllTags = (itemsData: Item[]) => {
    const tagSet = new Set<string>()
    itemsData.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => tagSet.add(tag))
      }
    })
    setAllTags(Array.from(tagSet).sort())
  }

  const loadItems = async () => {
    try {
      const response = await fetch('/api/items')
      const data = await response.json()
      setItems(data)
      loadAllTags(data)
      // Load notes counts
      loadNotesCounts(data)
      // Load relationships for each item
      await Promise.all(data.map(item => loadItemRelationships(item.id)))
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
  const isItemOverdue = (item: Item) => {
    if (!item.extraFields?.endDate) return false
    const excludedStatuses = ['Wont Do', 'Completed', 'On Hold']
    if (excludedStatuses.includes(item.status || '')) return false
    const endDate = new Date(item.extraFields.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return endDate <= today
  }

  const openAddPanel = (bucket: string) => {
    setPanelMode('add')
    setPanelBucket(bucket)
    setCurrentEditItem(null)
    setSelectedRelationships([])
    setFormData({
      status: "Next Up",
      tags: [],
      extraFields: {
        priority: "Medium",
        energy: "Medium"
      }
    })
    setShowPanel(true)
    loadAvailableItems()
  }

  const openEditPanel = async (item: Item) => {
    setPanelMode('edit')
    setPanelBucket(item.bucket)
    setCurrentEditItem(item)
    
    // Load existing relationships
    try {
      const response = await fetch(`/api/relationships/${item.id}`)
      if (response.ok) {
        const relationships = await response.json()
        const relationshipIds = relationships.map((rel: any) => rel.childId)
        setSelectedRelationships(relationshipIds)
      } else {
        setSelectedRelationships([])
      }
    } catch (error) {
      console.error('Error loading relationships:', error)
      setSelectedRelationships([])
    }
    
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
    setFormData({status: "Next Up", tags: []})
    setTagsInput('')
    setFormErrors({})
    setSelectedRelationships([])
  }

  const autoSave = async (field: string, value: any) => {
    if (!currentEditItem) return
    
    try {
      const extraFields = { ...currentEditItem.extraFields }
      if (field === 'status') {
        await updateItem(currentEditItem.id, currentEditItem.title, currentEditItem.description, value, extraFields, undefined, currentEditItem.tags)
      } else if (field === 'title') {
        await updateItem(currentEditItem.id, value, currentEditItem.description, currentEditItem.status, extraFields, undefined, currentEditItem.tags)
      } else if (field === 'description') {
        await updateItem(currentEditItem.id, currentEditItem.title, value, currentEditItem.status, extraFields, undefined, currentEditItem.tags)
      } else if (field === 'tags') {
        await updateItem(currentEditItem.id, currentEditItem.title, currentEditItem.description, currentEditItem.status, extraFields, undefined, value)
      } else {
        // Update extra field
        extraFields[field] = value
        await updateItem(currentEditItem.id, currentEditItem.title, currentEditItem.description, currentEditItem.status, extraFields, undefined, currentEditItem.tags)
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
        return (
          <div className="h-screen w-full bg-white p-8 overflow-auto">
            {selectedGraphItem && (
              <div className="mb-4">
                <button
                  onClick={() => setSelectedGraphItem(null)}
                  className="px-4 py-2 bg-white hover:bg-gray-100 rounded-lg text-sm border shadow-sm"
                >
                  ← Show All Items
                </button>
              </div>
            )}
            <D3NetworkGraph items={items} itemRelationships={itemRelationships} bucketConfig={bucketConfig} />
          </div>
        )
      case 'timeline':
        return renderTimelineView(items)
      case 'tags':
        return renderTagsView(items)
      case 'kanban':
        return renderKanbanView(items)
      case 'energy':
        return renderEnergyView(items)
      default:
        return renderListView(items)
    }
  }

  const renderTagsView = (items: Item[]) => {
    // Get all unique tags
    const allTagsSet = new Set<string>()
    items.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => allTagsSet.add(tag))
      }
    })
    
    const allTagsList = Array.from(allTagsSet).sort()
    
    // Group items by tags
    const tagGroups: Record<string, Item[]> = {}
    const untaggedItems: Item[] = []
    
    // Initialize tag groups
    allTagsList.forEach(tag => {
      tagGroups[tag] = []
    })
    
    // Categorize items
    items.forEach(item => {
      if (!item.tags || item.tags.length === 0) {
        untaggedItems.push(item)
      } else {
        item.tags.forEach(tag => {
          if (tagGroups[tag]) {
            tagGroups[tag].push(item)
          }
        })
      }
    })
    
    // Add untagged group if there are untagged items
    if (untaggedItems.length > 0) {
      tagGroups['No Tags'] = untaggedItems
    }
    
    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {Object.entries(tagGroups).map(([tag, tagItems]) => (
          <div key={tag} className="flex-shrink-0 w-80 border border-blue-200 bg-blue-50 rounded-lg">
            <div className="p-4 border-b border-blue-200">
              <h3 className="font-medium text-sm text-blue-700">
                {tag} ({tagItems.length})
              </h3>
            </div>
            <div className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              {tagItems.map(item => (
                <Card 
                  key={item.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow bg-white"
                  onClick={() => openEditPanel(item)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item.id)
                    setDraggedItem(item.id)
                  }}
                  onDragEnd={() => setDraggedItem(null)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-left flex-1">{item.title}</h4>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedItemForNotes(item.id)
                            loadNotes(item.id)
                            setShowNotesPanel(true)
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
                          title="View notes"
                        >
                          <MessageSquare className="w-3 h-3" />
                          {notesCounts[item.id] > 0 && (
                            <span className="text-[10px] text-gray-600">
                              {notesCounts[item.id]}
                            </span>
                          )}
                        </button>
                        {item.bucket !== 'ARCHIVE' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              archiveItem(item)
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Archive item"
                          >
                            <Archive className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
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
                    {item.tags && item.tags.length > 0 && tag !== 'No Tags' && (
                      <div className="flex items-center gap-1 flex-wrap mt-2">
                        {item.tags.filter(t => t !== tag).map(otherTag => (
                          <Badge key={otherTag} variant="outline" className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5">
                            {otherTag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {tagItems.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No items with "{tag}" tag
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderListView = (filteredItems: Item[]) => {
    const columns: ColumnDef<Item>[] = [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="text-left min-w-[300px] max-w-[400px]">
            <div className="font-medium flex items-center gap-2">
              {row.getValue("title")}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedItemForNotes(row.original.id)
                  loadNotes(row.original.id)
                  setShowNotesPanel(true)
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded flex items-center gap-1"
                title="Notes"
              >
                <MessageSquare className="w-3 h-3" />
                {notesCounts[row.original.id] > 0 && (
                  <span className="text-[10px] text-gray-600">
                    {notesCounts[row.original.id]}
                  </span>
                )}
              </button>
            </div>
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
          const isEditing = editingCell?.itemId === row.original.id && editingCell?.field === 'status'
          
          if (isEditing) {
            const currentBucketStatuses = apiStatuses[selectedBucket] || []
            // Add fallback statuses if none are loaded
            const statusOptions = currentBucketStatuses.length > 0 ? currentBucketStatuses : 
              ['Planning', 'In Progress', 'On Hold', 'Completed']
            
            return (
              <div onClick={(e) => e.stopPropagation()}>
                <select
                  value={status || ''}
                  onChange={async (e) => {
                    e.stopPropagation()
                    try {
                      await updateItem(row.original.id, row.original.title, row.original.description, e.target.value, row.original.extraFields || {})
                      setEditingCell(null)
                      loadItems()
                    } catch (error) {
                      console.error('Failed to update status:', error)
                      setEditingCell(null)
                    }
                  }}
                  onBlur={(e) => {
                    // Only close if not clicking on an option
                    setTimeout(() => setEditingCell(null), 100)
                  }}
                  autoFocus
                  className="px-2 py-1 text-xs border rounded"
                >
                  <option value="">Select status</option>
                  {statusOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )
          }
          
          return status ? (
            <div 
              className="text-left cursor-pointer hover:bg-gray-50 p-1 rounded"
              onClick={(e) => {
                e.stopPropagation()
                setEditingCell({itemId: row.original.id, field: 'status'})
              }}
            >
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {status === 'Completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                {status}
              </span>
            </div>
          ) : (
            <div 
              className="text-left cursor-pointer hover:bg-gray-50 p-1 rounded text-gray-400"
              onClick={(e) => {
                e.stopPropagation()
                setEditingCell({itemId: row.original.id, field: 'status'})
              }}
            >
              Click to set status
            </div>
          )
        },
      },
      // Dynamic columns for all bucket fields (not just those with data)
      ...(() => {
        const bucketFieldsForBucket = bucketFields[selectedBucket] || []
        const allExtraFields = new Set<string>()
        
        // Add all defined bucket fields
        bucketFieldsForBucket.forEach(field => {
          allExtraFields.add(field.name)
        })
        
        // Also add any extra fields that have data but aren't in bucket fields
        filteredItems.forEach(item => {
          if (item.extraFields) {
            Object.keys(item.extraFields).forEach(key => {
              // Exclude tags since we have a dedicated tags column
              if (key !== 'tags' && item.extraFields![key] !== null && item.extraFields![key] !== undefined && item.extraFields![key] !== '') {
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
            const isEditing = editingCell?.itemId === row.original.id && editingCell?.field === fieldName
            
            if (isEditing) {
              // Handle different field types for editing
              if (fieldDef?.type === 'array' || fieldName === 'priority' || fieldName === 'energy') {
                // Get options from field definition or use defaults for common fields
                let options = fieldDef?.options || []
                if (fieldName === 'priority' && options.length === 0) {
                  options = ['high', 'medium', 'low']
                }
                if (fieldName === 'energy' && options.length === 0) {
                  options = ['high', 'medium', 'low']
                }
                
                return (
                  <div onClick={(e) => e.stopPropagation()}>
                    <select
                      value={Array.isArray(value) ? value[0] || '' : value || ''}
                      onChange={async (e) => {
                        e.stopPropagation()
                        try {
                          const newValue = fieldDef?.allowMultiple ? [e.target.value] : e.target.value
                          const updatedExtraFields = { ...row.original.extraFields, [fieldName]: newValue }
                          await updateItem(row.original.id, row.original.title, row.original.description, row.original.status, updatedExtraFields)
                          setEditingCell(null)
                          loadItems()
                        } catch (error) {
                          console.error('Failed to update field:', error)
                          setEditingCell(null)
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setEditingCell(null), 100)
                      }}
                      autoFocus
                      className="px-2 py-1 text-xs border rounded w-full"
                    >
                      <option value="">Select {fieldName}</option>
                      {options.map(option => (
                        <option key={option} value={option}>
                          {fieldName === 'priority' || fieldName === 'energy' ? 
                            option.charAt(0).toUpperCase() + option.slice(1) : 
                            option
                          }
                        </option>
                      ))}
                    </select>
                  </div>
                )
              }
              
              if (fieldDef?.type === 'boolean') {
                return (
                  <div onClick={(e) => e.stopPropagation()}>
                    <select
                      value={value ? 'true' : 'false'}
                      onChange={async (e) => {
                        e.stopPropagation()
                        try {
                          const updatedExtraFields = { ...row.original.extraFields, [fieldName]: e.target.value === 'true' }
                          await updateItem(row.original.id, row.original.title, row.original.description, row.original.status, updatedExtraFields)
                          setEditingCell(null)
                          loadItems()
                        } catch (error) {
                          console.error('Failed to update field:', error)
                          setEditingCell(null)
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setEditingCell(null), 100)
                      }}
                      autoFocus
                      className="px-2 py-1 text-xs border rounded"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                )
              }
              
              // Default text input
              const editKey = `${row.original.id}-${fieldName}`
              const currentEditingValue = editingValue[editKey] ?? value ?? ''
              
              return (
                <div onClick={(e) => e.stopPropagation()}>
                  <input
                    type={fieldDef?.type === 'date' ? 'date' : fieldDef?.type === 'datetime' ? 'datetime-local' : 'text'}
                    value={fieldDef?.type === 'date' || fieldDef?.type === 'datetime' ? (value || '') : currentEditingValue}
                    onChange={(e) => {
                      if (fieldDef?.type === 'date' || fieldDef?.type === 'datetime') {
                        // For date inputs, save immediately on change
                        const updatedExtraFields = { ...row.original.extraFields, [fieldName]: e.target.value }
                        updateItem(row.original.id, row.original.title, row.original.description, row.original.status, updatedExtraFields)
                          .then(() => {
                            setEditingCell(null)
                            loadItems()
                          })
                          .catch((error) => {
                            console.error('Failed to update field:', error)
                            setEditingCell(null)
                          })
                      } else {
                        // For text inputs, just update local state
                        setEditingValue(prev => ({ ...prev, [editKey]: e.target.value }))
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur()
                      }
                      if (e.key === 'Escape') {
                        setEditingCell(null)
                        setEditingValue(prev => {
                          const newState = { ...prev }
                          delete newState[editKey]
                          return newState
                        })
                      }
                    }}
                    onBlur={async (e) => {
                      // Only save text fields on blur (dates are saved on change)
                      if (fieldDef?.type !== 'date' && fieldDef?.type !== 'datetime') {
                        try {
                          const updatedExtraFields = { ...row.original.extraFields, [fieldName]: currentEditingValue }
                          await updateItem(row.original.id, row.original.title, row.original.description, row.original.status, updatedExtraFields)
                          setEditingCell(null)
                          setEditingValue(prev => {
                            const newState = { ...prev }
                            delete newState[editKey]
                            return newState
                          })
                          loadItems()
                        } catch (error) {
                          console.error('Failed to update field:', error)
                          setEditingCell(null)
                          setEditingValue(prev => {
                            const newState = { ...prev }
                            delete newState[editKey]
                            return newState
                          })
                        }
                      } else {
                        setEditingCell(null)
                      }
                    }}
                    autoFocus
                    className="px-2 py-1 text-xs border rounded w-full"
                  />
                </div>
              )
            }
            
            if (!value) {
              return (
                <div 
                  className="text-gray-400 cursor-pointer hover:bg-gray-50 p-1 rounded text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingCell({itemId: row.original.id, field: fieldName})
                  }}
                >
                  Click to set
                </div>
              )
            }
            
            // Handle different field types for display
            if (Array.isArray(value)) {
              return (
                <div 
                  className="flex flex-wrap gap-1 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingCell({itemId: row.original.id, field: fieldName})
                  }}
                >
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
                <span 
                  className={`inline-flex items-center px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${
                    value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingCell({itemId: row.original.id, field: fieldName})
                  }}
                >
                  {value ? 'Yes' : 'No'}
                </span>
              )
            }
            
            // Special styling for priority and energy
            if (fieldName === 'priority') {
              return (
                <span 
                  className={`inline-flex items-center px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${
                    value.toLowerCase() === 'high' ? 'bg-red-100 text-red-700' :
                    value.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingCell({itemId: row.original.id, field: fieldName})
                  }}
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </span>
              )
            }
            
            if (fieldName === 'energy') {
              return (
                <span 
                  className={`inline-flex items-center px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${
                  value.toLowerCase() === 'high' ? 'bg-blue-100 text-blue-700' :
                  value.toLowerCase() === 'medium' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingCell({itemId: row.original.id, field: fieldName})
                  }}
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
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
                  return (
                    <span 
                      className="text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingCell({itemId: row.original.id, field: fieldName})
                      }}
                    >
                      {date.toLocaleDateString('en-AU')}
                    </span>
                  )
                }
              } catch {
                // Fall through to default
              }
            }
            
            // Default text display
            return (
              <span 
                className="text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingCell({itemId: row.original.id, field: fieldName})
                }}
              >
                {value}
              </span>
            )
          },
        }
      })
      })(),
      // Tags column
      {
        accessorKey: "tags",
        header: "Tags",
        size: 300,
        cell: ({ row }) => {
          const tags = row.original.tags || []
          const isEditing = editingCell?.itemId === row.original.id && editingCell?.field === 'tags'
          
          if (isEditing) {
            return (
              <div onClick={(e) => e.stopPropagation()} className="relative">
                <div className="flex flex-wrap gap-1 mb-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="outline" className="bg-blue-50 text-blue-600 text-xs flex items-center gap-1">
                      {tag}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={async () => {
                          const newTags = tags.filter(t => t !== tag)
                          try {
                            await updateItem(row.original.id, row.original.title, row.original.description, row.original.status, row.original.extraFields || {}, undefined, newTags)
                            loadItems()
                          } catch (error) {
                            console.error('Failed to update tags:', error)
                          }
                        }}
                      />
                    </Badge>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Type tag and press Enter"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const newTag = e.currentTarget.value.trim()
                      if (!tags.includes(newTag)) {
                        const newTags = [...tags, newTag]
                        try {
                          await updateItem(row.original.id, row.original.title, row.original.description, row.original.status, row.original.extraFields || {}, undefined, newTags)
                          e.currentTarget.value = ''
                          loadItems()
                        } catch (error) {
                          console.error('Failed to update tags:', error)
                        }
                      }
                    }
                    if (e.key === 'Escape') {
                      setEditingCell(null)
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setEditingCell(null), 100)
                  }}
                  autoFocus
                  className="px-2 py-1 text-xs border rounded w-full"
                />
              </div>
            )
          }
          
          return tags.length > 0 ? (
            <div 
              className="flex flex-wrap gap-1 cursor-pointer hover:bg-gray-50 p-1 rounded"
              onClick={(e) => {
                e.stopPropagation()
                setEditingCell({itemId: row.original.id, field: 'tags'})
              }}
            >
              {tags.map(tag => (
                <Badge key={tag} variant="outline" className="bg-blue-50 text-blue-600 text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <div 
              className="text-gray-400 cursor-pointer hover:bg-gray-50 p-1 rounded text-xs"
              onClick={(e) => {
                e.stopPropagation()
                setEditingCell({itemId: row.original.id, field: 'tags'})
              }}
            >
              Click to add tags
            </div>
          )
        },
      },
      // Separate relationship columns for each bucket
      {
        id: "projects",
        header: "Projects",
        size: 350,
        cell: ({ row }) => {
          const relationships = itemRelationships[row.original.id]
          const projectRels = relationships?.filter(rel => {
            // Show relationships where current item is parent OR child, but the other item is a project
            return ((rel.parentId === row.original.id && (rel.childBucket?.toLowerCase() === 'project' || rel.childBucket?.toLowerCase() === 'projects')) ||
                    (rel.childId === row.original.id && (rel.parentBucket?.toLowerCase() === 'project' || rel.parentBucket?.toLowerCase() === 'projects')))
          }) || []
          
          return projectRels.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {projectRels.map((rel, idx) => (
                <span key={idx} className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                  {rel.parentId === row.original.id ? rel.childTitle : rel.parentTitle}
                </span>
              ))}
            </div>
          ) : null
        },
      },
      {
        id: "areas",
        header: "Areas",
        size: 350,
        cell: ({ row }) => {
          const relationships = itemRelationships[row.original.id]
          const areaRels = relationships?.filter(rel => {
            // Show relationships where current item is parent OR child, but the other item is an area
            return ((rel.parentId === row.original.id && (rel.childBucket?.toLowerCase() === 'area' || rel.childBucket?.toLowerCase() === 'areas')) ||
                    (rel.childId === row.original.id && (rel.parentBucket?.toLowerCase() === 'area' || rel.parentBucket?.toLowerCase() === 'areas')))
          }) || []
          
          return areaRels.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {areaRels.map((rel, idx) => (
                <span key={idx} className="inline-flex items-center px-1.5 py-0.5 bg-green-50 text-green-700 text-xs rounded">
                  {rel.parentId === row.original.id ? rel.childTitle : rel.parentTitle}
                </span>
              ))}
            </div>
          ) : null
        },
      },
      {
        id: "resources",
        header: "Resources",
        size: 350,
        cell: ({ row }) => {
          const relationships = itemRelationships[row.original.id]
          const resourceRels = relationships?.filter(rel => {
            // Show relationships where current item is parent OR child, but the other item is a resource
            return ((rel.parentId === row.original.id && (rel.childBucket?.toLowerCase() === 'resource' || rel.childBucket?.toLowerCase() === 'resources')) ||
                    (rel.childId === row.original.id && (rel.parentBucket?.toLowerCase() === 'resource' || rel.parentBucket?.toLowerCase() === 'resources')))
          }) || []
          
          return resourceRels.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {resourceRels.map((rel, idx) => (
                <span key={idx} className="inline-flex items-center px-1.5 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded">
                  {rel.parentId === row.original.id ? rel.childTitle : rel.parentTitle}
                </span>
              ))}
            </div>
          ) : null
        },
      },
      {
        id: "actions",
        header: "Actions",
        size: 350,
        cell: ({ row }) => {
          const relationships = itemRelationships[row.original.id]
          const actionRels = relationships?.filter(rel => {
            // Show relationships where current item is parent OR child, but the other item is an action
            return ((rel.parentId === row.original.id && (rel.childBucket?.toLowerCase() === 'action' || rel.childBucket?.toLowerCase() === 'actions')) ||
                    (rel.childId === row.original.id && (rel.parentBucket?.toLowerCase() === 'action' || rel.parentBucket?.toLowerCase() === 'actions')))
          }) || []
          
          return actionRels.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {actionRels.map((rel, idx) => (
                <span key={idx} className="inline-flex items-center px-1.5 py-0.5 bg-red-50 text-red-700 text-xs rounded">
                  {rel.parentId === row.original.id ? rel.childTitle : rel.parentTitle}
                </span>
              ))}
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
      medium: 'border-yellow-200 bg-yellow-50', 
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
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedItemForNotes(item.id)
                            loadNotes(item.id)
                            setShowNotesPanel(true)
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
                          title="View notes"
                        >
                          <MessageSquare className="w-3 h-3" />
                          {notesCounts[item.id] > 0 && (
                            <span className="text-[10px] text-gray-600">
                              {notesCounts[item.id]}
                            </span>
                          )}
                        </button>
                        {item.bucket !== 'ARCHIVE' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              archiveItem(item)
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Archive item"
                          >
                            <Archive className="w-3 h-3" />
                          </button>
                        )}
                      </div>
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
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mt-2">
                          {item.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              {status} <span className="text-sm text-gray-500">({groupItems.length})</span>
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
    
    // Configure moment formats for react-big-calendar
    moment.locale('en', {
      week: {
        dow: 0, // Sunday is the first day of the week
        doy: 1  // First week of the year must contain January 1st
      }
    })
    
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
                {item.extraFields?.deadline || new Date(item.createdAt).toLocaleDateString('en-AU')}
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
                    <Card
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', item.id)
                        setDraggedItem(item.bucket)
                      }}
                      onDragEnd={() => setDraggedItem(null)}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openEditPanel(item)}
                    >
                      <CardContent className="p-3">
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
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mt-2">
                            {item.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
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
  const renderEnergyView = (items: Item[]) => {
    const energyLevels = ['High', 'Medium', 'Low']
    const energyColors = {
      'High': 'border-red-200 bg-red-50',
      'Medium': 'border-yellow-200 bg-yellow-50',
      'Low': 'border-blue-200 bg-blue-50'
    }
    const energyTextColors = {
      'High': 'text-red-700',
      'Medium': 'text-yellow-700',
      'Low': 'text-blue-700'
    }
    
    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {energyLevels.map(energy => (
          <div key={energy} className={`flex-shrink-0 w-80 border rounded-lg ${energyColors[energy]}`}>
            <div className="p-4 border-b border-current border-opacity-20">
              <h3 className={`font-medium text-sm ${energyTextColors[energy]}`}>{energy} Energy</h3>
            </div>
            <div className="p-4 space-y-2">
              {items
                .filter(item => item.extraFields?.energy === energy)
                .map(item => (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openEditPanel(item)}
                  >
                    <div className="font-medium">{item.title}</div>
                    {item.description && (
                      <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                    )}
                    <div className="flex gap-2 mt-2">
                      {item.extraFields?.priority && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.extraFields.priority.toLowerCase() === 'high' ? 'bg-red-100 text-red-700' :
                          item.extraFields.priority.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {item.extraFields.priority}
                        </span>
                      )}
                      {item.status && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
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

    // Get ordered columns
    const bucketKey = selectedBucket
    const defaultOrder = ["Next Up", "Planning", "In Progress", "In Review", "Completed", "On Hold", "Wont Do"]
    const savedOrder = columnOrder[bucketKey] || defaultOrder
    const allColumns = Object.keys(statusColumns)
    const orderedColumns = [
      ...savedOrder.filter(col => allColumns.includes(col)),
      ...allColumns.filter(col => !savedOrder.includes(col))
    ]

    // Set available columns for the dropdown (will be used by parent component)
    if (availableColumns.join(',') !== orderedColumns.join(',')) {
      setTimeout(() => setAvailableColumns(orderedColumns), 0)
    }

    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {orderedColumns.filter(status => !hiddenColumns.has(status)).map((status) => {
          const columnItems = statusColumns[status] || []
          
          return (
            <div key={status} className="flex-shrink-0 w-80">
              <div className="bg-gray-50 rounded-lg p-4">
                <div 
                  className="flex items-center justify-between mb-4 cursor-move"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', status)
                    setDraggedColumn(status)
                  }}
                  onDragEnd={() => setDraggedColumn(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const draggedStatus = e.dataTransfer.getData('text/plain')
                    if (draggedStatus && draggedStatus !== status) {
                      const newOrder = [...orderedColumns]
                      const draggedIndex = newOrder.indexOf(draggedStatus)
                      const targetIndex = newOrder.indexOf(status)
                      
                      newOrder.splice(draggedIndex, 1)
                      newOrder.splice(targetIndex, 0, draggedStatus)
                      
                      setColumnOrder({
                        ...columnOrder,
                        [bucketKey]: newOrder
                      })
                    }
                  }}
                >
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
                        // Sort by priority first (High > Medium > Low > none)
                        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 }
                        const aPriority = priorityOrder[a.extraFields?.priority as keyof typeof priorityOrder] || 0
                        const bPriority = priorityOrder[b.extraFields?.priority as keyof typeof priorityOrder] || 0
                        
                        if (aPriority !== bPriority) {
                          return bPriority - aPriority // High to low
                        }
                        
                        // Then sort by date (newest first)
                        const aDate = a.extraFields?.deadline || a.createdAt
                        const bDate = b.extraFields?.deadline || b.createdAt
                        return new Date(bDate).getTime() - new Date(aDate).getTime()
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
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedItemForNotes(item.id)
                                loadNotes(item.id)
                                setShowNotesPanel(true)
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded flex items-center gap-1"
                              title="Notes"
                            >
                              <MessageSquare className="w-3 h-3" />
                              {notesCounts[item.id] > 0 && (
                                <span className="text-[10px] text-gray-600">
                                  {notesCounts[item.id]}
                                </span>
                              )}
                            </button>
                            {item.bucket !== 'ARCHIVE' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  archiveItem(item)
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Archive item"
                              >
                                <Archive className="w-3 h-3" />
                              </button>
                            )}
                          </div>
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
                          {selectedBucket === 'ACTION' && (
                            <div className="text-xs text-gray-500 mb-2">
                              {(() => {
                                const relationships = itemRelationships[item.id] || []
                                const projectRels = relationships.filter(rel => {
                                  return rel.childBucket === 'PROJECT' || rel.parentBucket === 'PROJECT'
                                })
                                const projectNames = projectRels.map(rel => {
                                  return rel.parentId === item.id ? rel.childTitle : rel.parentTitle
                                }).filter(name => name)
                                
                                return projectNames.length > 0 
                                  ? `Belongs to: ${projectNames.join(', ')}`
                                  : 'No associated projects'
                              })()}
                            </div>
                          )}
                          {selectedBucket === 'PROJECT' && (
                            <div className="text-xs text-gray-500 mb-2">
                              {(() => {
                                const relationships = itemRelationships[item.id] || []
                                const allItems = items // Use the full items array
                                console.log('All items:', allItems.map(i => ({ id: i.id, title: i.title, bucket: i.bucket })))
                                console.log('Current item:', item)
                                console.log('Relationships:', relationships)
                                const areaRels = relationships.filter(rel => {
                                  return rel.childBucket === 'AREA' || rel.parentBucket === 'AREA'
                                })
                                console.log('Area relationships:', areaRels)
                                const areaNames = areaRels.map(rel => {
                                  const otherItemId = rel.parentId === item.id ? rel.childId : rel.parentId
                                  return rel.parentId === item.id ? rel.childTitle : rel.parentTitle
                                }).filter(name => name)
                                console.log('Area names:', areaNames)
                                
                                return areaNames.length > 0 
                                  ? `Belongs to: ${areaNames.join(', ')}`
                                  : 'No associated areas'
                              })()}
                            </div>
                          )}
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
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap mt-2">
                              {item.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
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

  const generateSummary = async () => {
    setLoadingSummary(true)
    setSystemSummary('')
    setShowSummaryPanel(true)
    
    try {
      const response = await fetch('/api/summary', { method: 'POST' })
      
      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          setSystemSummary(prev => prev + chunk)
        }
      }
    } catch (error) {
      console.error('Failed to generate summary:', error)
      setSystemSummary('Error generating summary. Please try again.')
    } finally {
      setLoadingSummary(false)
    }
  }

  const loadNotesCounts = async (itemsList: Item[]) => {
    try {
      const counts: Record<string, number> = {}
      await Promise.all(itemsList.map(async (item) => {
        const response = await fetch(`/api/notes/${item.id}`)
        if (response.ok) {
          const data = await response.json()
          counts[item.id] = data.length
        }
      }))
      setNotesCounts(counts)
    } catch (error) {
      console.error('Failed to load notes counts:', error)
    }
  }

  const loadNotes = async (itemId: string) => {
    try {
      const response = await fetch(`/api/notes/${itemId}`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error('Failed to load notes:', error)
    }
  }

  const createNote = async (itemId: string, content: string) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, content })
      })
      if (response.ok) {
        await loadNotes(itemId)
        loadNotesCounts(items)
      }
    } catch (error) {
      console.error('Failed to create note:', error)
    }
  }

  const updateNote = async (noteId: string, content: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      if (response.ok && selectedItemForNotes) {
        await loadNotes(selectedItemForNotes)
      }
    } catch (error) {
      console.error('Failed to update note:', error)
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
      if (response.ok && selectedItemForNotes) {
        await loadNotes(selectedItemForNotes)
        loadNotesCounts(items)
      }
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
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

  const createItem = async (bucket: string, title: string, description: string, status: string, extraFields: Record<string, any>, tags?: string[]) => {
    console.log('createItem called with:', { bucket, title, description, status, extraFields })
    if (!title.trim()) {
      console.log('Title is empty, returning')
      return
    }

    try {
      console.log('Making fetch request to /api/items')
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bucket, 
          title, 
          description, 
          statusName: status,
          extraFields,
          tags: tags || []
        })
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        const newItem = await response.json()
        console.log('New item created:', newItem)
        loadItems()
        return newItem
      } else {
        console.error('Response not ok:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Failed to create item:', error)
    }
    return null
  }

  const archiveItem = async (item: Item) => {
    try {
      console.log('Archiving item:', item.id, item.title, 'from bucket:', item.bucket)
      
      // Move the item to Archive bucket
      await updateItem(item.id, item.title, item.description, item.status, item.extraFields || {}, 'ARCHIVE', item.tags)
      
      // Handle cascading archival based on bucket type
      if (item.bucket === 'AREA') {
        console.log('Archiving area relationships')
        // Archive all relationships when archiving an area
        const relationships = itemRelationships[item.id] || []
        for (const rel of relationships) {
          const relatedItemId = rel.parentId === item.id ? rel.childId : rel.parentId
          const relatedItem = items.find(i => i.id === relatedItemId)
          if (relatedItem && relatedItem.bucket !== 'ARCHIVE') {
            console.log('Archiving related item:', relatedItem.id, relatedItem.title)
            await updateItem(relatedItem.id, relatedItem.title, relatedItem.description, relatedItem.status, relatedItem.extraFields || {}, 'ARCHIVE', relatedItem.tags)
          }
        }
      } else if (item.bucket === 'PROJECT') {
        console.log('Archiving project actions and resources')
        // Archive actions and resources when archiving a project
        const relationships = itemRelationships[item.id] || []
        for (const rel of relationships) {
          const relatedItemId = rel.parentId === item.id ? rel.childId : rel.parentId
          const relatedItem = items.find(i => i.id === relatedItemId)
          if (relatedItem && (relatedItem.bucket === 'ACTION' || relatedItem.bucket === 'RESOURCE') && relatedItem.bucket !== 'ARCHIVE') {
            console.log('Archiving related action/resource:', relatedItem.id, relatedItem.title)
            await updateItem(relatedItem.id, relatedItem.title, relatedItem.description, relatedItem.status, relatedItem.extraFields || {}, 'ARCHIVE', relatedItem.tags)
          }
        }
      }
      
      console.log('Archive operation completed')
      // Reload items to reflect changes
      loadItems()
    } catch (error) {
      console.error('Failed to archive item:', error)
    }
  }

  const updateItem = async (itemId: string, title: string, description: string, status: string, extraFields: Record<string, any>, bucket?: string, tags?: string[]) => {
    try {
      const updateData: any = { 
        title, 
        description, 
        status, 
        extraFields
      }
      
      if (tags !== undefined) {
        updateData.tags = tags
      }
      
      if (bucket !== undefined) {
        updateData.bucket = bucket
      }

      console.log('Updating item:', itemId, 'with data:', updateData)

      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        console.log('Item updated successfully')
        loadItems()
      } else {
        console.error('Failed to update item:', response.status, response.statusText)
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
    <SidebarProvider>
      <style>{`
        select[multiple] option:checked {
          background: white !important;
          color: black !important;
        }
        select[multiple] option {
          background: white !important;
          color: black !important;
        }
        :root {
          --sidebar-width: 200px;
          --sidebar-width-icon: 3rem;
        }
        .relative.w-\\[--sidebar-width\\].bg-transparent {
          display: block !important;
          width: 100px !important;
        }
        [data-sidebar="inset"] {
          margin-left: 0 !important;
          padding-left: 0 !important;
        }
        .group[data-state="collapsed"] ~ [data-sidebar="inset"] {
          width: 90% !important;
          margin: 0 auto !important;
        }
        .group[data-state="collapsed"] .relative.w-\\[--sidebar-width\\].bg-transparent {
          width: 0px !important;
        }
      `}</style>
      <div className="h-screen bg-white w-full flex">
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-lg font-semibold text-gray-900 px-4 py-2">PAARA System</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-4 py-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {['PROJECT', 'AREA', 'ACTION', 'RESOURCE', 'ARCHIVE'].map((bucket) => {
                    const config = bucketConfig[bucket as keyof typeof bucketConfig]
                    const Icon = config.icon
                    const bucketItems = filteredItems.filter(item => item.bucket === bucket)
                    const isSelected = selectedBucket === bucket

                    return (
                      <SidebarMenuItem key={bucket}>
                        <SidebarMenuButton
                          onClick={() => setSelectedBucket(bucket)}
                          isActive={isSelected}
                          className="w-full"
                        >
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          <span>{config.name}</span>
                          <span className="ml-auto text-xs text-gray-600">
                            {bucketItems.length}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <ThemeToggle />
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset style={{ marginLeft: '16rem', maxWidth: 'calc(100vw - 24rem)' }}>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              {(() => {
                const config = bucketConfig[selectedBucket as keyof typeof bucketConfig]
                return (
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 text-left">
                      {config.name}
                    </h1>
                    <p className="text-sm text-gray-600 text-left">
                      {config.description}
                    </p>
                  </div>
                )
              })()}
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <Button 
                onClick={generateSummary}
                disabled={loadingSummary}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                {loadingSummary ? 'Generating...' : 'AI Summary'}
              </Button>
              <Button 
                onClick={openFieldsPanel}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Custom Fields
              </Button>
            </div>
          </header>
          
          <div className="flex-1 overflow-auto pr-5 py-2">
            <div className="w-full">
              <div className="flex flex-col h-full w-full">

          {/* View Selector and Create Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              {(selectedBucket === 'RESOURCE' ? [
                { key: 'list', label: 'List', icon: '≡' },
                { key: 'graph', label: 'Graph', icon: '○' }
              ] : [
                { key: 'kanban', label: 'Kanban', icon: '▢' },
                { key: 'list', label: 'List', icon: '≡' },
                { key: 'priority', label: 'By Priority', icon: '!' },
                { key: 'energy', label: 'By Energy', icon: '⚡' },
                { key: 'status', label: 'By Status', icon: '●' },
                { key: 'date', label: 'By Date', icon: '◐' },
                { key: 'timeline', label: 'Timeline', icon: '—' },
                { key: 'tags', label: 'By Tags', icon: '#' },
                { key: 'graph', label: 'Graph', icon: '○' }
              ]).map(view => (
                <Button
                  key={view.key}
                  onClick={() => setCurrentView(view.key as any)}
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
                {Object.entries(bucketConfig).map(([bucket, config]) => {
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

        {/* Content */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
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

      <Sheet open={showPanel} onOpenChange={setShowPanel}>
        <SheetContent className="w-[460px] sm:max-w-[460px]">
          <SheetHeader>
            <SheetTitle>
              {panelMode === 'add' ? `Add new ${bucketConfig[panelBucket as keyof typeof bucketConfig]?.name.slice(0, -1).toLowerCase()}` : panelMode === 'edit' ? `Update ${bucketConfig[panelBucket as keyof typeof bucketConfig]?.name.slice(0, -1)}` : 'Custom Fields'}
            </SheetTitle>
            {panelMode === 'add' && (
              <p className="text-sm text-gray-600 mt-2">
                Create a new {bucketConfig[panelBucket as keyof typeof bucketConfig]?.description.toLowerCase()}
              </p>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto pt-6">
            {panelMode === 'fields' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Custom Fields</h3>
                  <Button
                    onClick={() => setShowAddField(true)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>

                {showAddField && (
                  <div className="p-3 bg-gray-50 rounded-lg border space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="text"
                        placeholder="Field name"
                        value={newField.name}
                        onChange={(e) => setNewField({...newField, name: e.target.value})}
                      />
                      <Input
                        type="text"
                        placeholder="Label (optional)"
                        value={newField.label}
                        onChange={(e) => setNewField({...newField, label: e.target.value})}
                      />
                    </div>
                    
                    <Select
                      value={newField.type}
                      onValueChange={(value) => setNewField({...newField, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="array">Array</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      type="text"
                      placeholder="Description (optional)"
                      value={newField.description}
                      onChange={(e) => setNewField({...newField, description: e.target.value})}
                    />
                    
                    {newField.type === 'array' && (
                      <Input
                        type="text"
                        placeholder="Options (comma-separated)"
                        value={newField.arrayOptions}
                        onChange={(e) => setNewField({...newField, arrayOptions: e.target.value})}
                      />
                    )}
                    
                    <div className="flex items-center justify-between">
                      <label className="flex items-center text-sm gap-2">
                        <Checkbox
                          checked={newField.required}
                          onCheckedChange={(checked) => setNewField({...newField, required: !!checked})}
                        />
                        Required
                      </label>
                      <div className="flex gap-2">
                        <Button
                          onClick={editingField ? () => updateCustomField(editingField, {
                            name: newField.name.trim(),
                            label: newField.label.trim() || undefined,
                            description: newField.description.trim() || undefined,
                            type: newField.type,
                            defaultValue: newField.defaultValue.trim() || undefined,
                            arrayOptions: newField.type === 'array' ? newField.arrayOptions.split(',').map(s => s.trim()).filter(s => s) : undefined,
                            multiSelect: newField.multiSelect
                          }) : createCustomField}
                          size="sm"
                        >
                          {editingField ? 'Update' : 'Save'}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowAddField(false)
                            setEditingField(null)
                            setNewField({ name: '', label: '', description: '', type: 'text', defaultValue: '', arrayOptions: '', multiSelect: false, required: false })
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fields List */}
                <div className="border border-gray-200 rounded-lg">
                  <Button
                    onClick={() => setShowCustomFields(!showCustomFields)}
                    variant="ghost"
                    className="flex items-center justify-between w-full p-3 h-auto"
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
                  </Button>
                  
                  {/* Search box - always visible */}
                  <div className="px-3 pb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search custom fields..."
                        value={customFieldSearch}
                        onChange={(e) => {
                          setCustomFieldSearch(e.target.value)
                          if (e.target.value && !showCustomFields) {
                            setShowCustomFields(true)
                          }
                        }}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {(showCustomFields || customFieldSearch) && (
                    <div className="border-t border-gray-200 p-3 space-y-2 flex-1 overflow-y-auto">
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
                        <Card key={field.id} className="group hover:border-gray-300 transition-all">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-gray-900 truncate">{field.label || field.name}</h4>
                                  <Badge variant="secondary" className="shrink-0">
                                    {field.type}
                                  </Badge>
                                </div>
                                {field.description && (
                                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{field.description}</p>
                                )}
                                {field.arrayOptions && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {field.arrayOptions.slice(0, 3).map((option, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {option}
                                      </Badge>
                                    ))}
                                  {field.arrayOptions.length > 3 && (
                                    <span className="text-xs text-gray-400">+{field.arrayOptions.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {!predefinedFields.includes(field.name) && (
                              <div className="flex gap-1">
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
                                  className="p-1 text-gray-600 hover:text-gray-800 transition-all"
                                  title="Edit field"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={async () => {
                                    const itemsUsingField = items.filter(item => 
                                      item.extraFields && field.name in item.extraFields
                                    )
                                    if (itemsUsingField.length === 0) {
                                      if (confirm(`Delete field "${field.label || field.name}"?`)) {
                                        try {
                                          const response = await fetch(`/api/custom-fields/${field.id}`, {
                                            method: 'DELETE'
                                          })
                                          if (response.ok) {
                                            await loadCustomFields()
                                            await loadBucketFields()
                                          }
                                        } catch (error) {
                                          console.error('Failed to delete field:', error)
                                        }
                                      }
                                    }
                                  }}
                                  disabled={items.some(item => item.extraFields && field.name in item.extraFields)}
                                  className={`p-1 transition-all ${
                                    items.some(item => item.extraFields && field.name in item.extraFields)
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'text-gray-600 hover:text-red-600 cursor-pointer'
                                  }`}
                                  title={
                                    items.some(item => item.extraFields && field.name in item.extraFields)
                                      ? `Used by: ${items.filter(item => item.extraFields && field.name in item.extraFields).map(item => item.title).join(', ')}`
                                      : 'Delete field'
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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
                          </CardContent>
                        </Card>
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
                    <Input
                      name="title"
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={(e) => {
                        setFormData(prev => ({...prev, title: e.target.value}))
                        autoSave('title', e.target.value)
                      }}
                      placeholder={`What ${bucketConfig[panelBucket as keyof typeof bucketConfig]?.name.slice(0, -1).toLowerCase()} are you ${panelMode === 'add' ? 'adding' : 'editing'}?`}
                      className="w-4/5"
                    />
                  </div>

                  <div className="flex items-start gap-4">
                    <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0 pt-2 text-left">
                      Description
                    </label>
                    <Textarea
                      name="description"
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => {
                        setFormData(prev => ({...prev, description: e.target.value}))
                        autoSave('description', e.target.value)
                      }}
                      placeholder="Add details, context, or notes..."
                      className="w-4/5 resize-none"
                    />
                  </div>

                  <div className="flex items-start gap-4">
                    <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0 pt-2 text-left">
                      Tags
                    </label>
                    <div className="w-4/5 relative">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(formData.tags || []).map(tag => (
                          <Badge key={tag} variant="outline" className="bg-blue-100 text-blue-700 text-xs flex items-center gap-1">
                            {tag}
                            <X 
                              className="w-3 h-3 cursor-pointer" 
                              onClick={() => {
                                const newTags = (formData.tags || []).filter(t => t !== tag)
                                setFormData(prev => ({...prev, tags: newTags}))
                                if (currentEditItem) {
                                  autoSave('tags', newTags)
                                }
                              }}
                            />
                          </Badge>
                        ))}
                      </div>
                      <Input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => {
                          setTagsInput(e.target.value)
                          setShowTagSuggestions(true)
                        }}
                        onFocus={() => setShowTagSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault()
                            const newTag = tagsInput.trim()
                            if (newTag && !(formData.tags || []).includes(newTag)) {
                              const newTags = [...(formData.tags || []), newTag]
                              setFormData(prev => ({...prev, tags: newTags}))
                              if (currentEditItem) {
                                autoSave('tags', newTags)
                              }
                            }
                            setTagsInput('')
                            setShowTagSuggestions(false)
                          }
                        }}
                        className="text-xs"
                      />
                      {showTagSuggestions && (
                        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                          {tagsInput ? (
                            // Show filtered tags when typing
                            allTags
                              .filter(tag => 
                                tag.toLowerCase().includes(tagsInput.toLowerCase()) && 
                                !(formData.tags || []).includes(tag)
                              )
                              .map(tag => (
                                <div
                                  key={tag}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs"
                                  onClick={() => {
                                    const newTags = [...(formData.tags || []), tag]
                                    setFormData(prev => ({...prev, tags: newTags}))
                                    if (currentEditItem) {
                                      autoSave('tags', newTags)
                                    }
                                    setTagsInput('')
                                    setShowTagSuggestions(false)
                                  }}
                                >
                                  {tag}
                                </div>
                              ))
                          ) : (
                            // Show all available tags when no input
                            allTags
                              .filter(tag => !(formData.tags || []).includes(tag))
                              .map(tag => (
                                <div
                                  key={tag}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs"
                                  onClick={() => {
                                    const newTags = [...(formData.tags || []), tag]
                                    setFormData(prev => ({...prev, tags: newTags}))
                                    if (currentEditItem) {
                                      autoSave('tags', newTags)
                                    }
                                    setTagsInput('')
                                    setShowTagSuggestions(false)
                                  }}
                                >
                                  {tag}
                                </div>
                              ))
                          )}
                          {tagsInput.trim() && 
                           !allTags.some(tag => tag.toLowerCase() === tagsInput.toLowerCase()) && 
                           !(formData.tags || []).includes(tagsInput.trim()) && (
                            <div
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs border-t border-gray-200 text-blue-600"
                              onClick={() => {
                                const newTag = tagsInput.trim()
                                const newTags = [...(formData.tags || []), newTag]
                                setFormData(prev => ({...prev, tags: newTags}))
                                if (currentEditItem) {
                                  autoSave('tags', newTags)
                                }
                                setTagsInput('')
                                setShowTagSuggestions(false)
                              }}
                            >
                              Create "{tagsInput.trim()}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0 text-left">
                      Status
                    </label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => {
                        setFormData({...formData, status: value})
                        autoSave('status', value)
                      }}
                    >
                      <SelectTrigger className="w-4/5">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {(apiStatuses[panelBucket] || []).map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      {field.type === 'url' && (
                        <input
                          name={`custom_${field.name}`}
                          type="url"
                          required={field.required}
                          value={currentEditItem?.extraFields?.[field.name] || field.defaultValue || ''}
                          onChange={(e) => {
                            setFormErrors(prev => ({...prev, [field.name]: false}))
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
                          placeholder="https://example.com"
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
                          value={panelMode === 'add' ? (formData.extraFields?.[field.name] || field.defaultValue || '') : (currentEditItem?.extraFields?.[field.name] || field.defaultValue || '')}
                          onChange={(e) => {
                            setFormErrors(prev => ({...prev, [field.name]: false}))
                            
                            if (panelMode === 'add') {
                              // For new items, update formData
                              setFormData(prev => ({
                                ...prev,
                                extraFields: {
                                  ...prev.extraFields,
                                  [field.name]: e.target.value
                                }
                              }))
                            } else {
                              // For editing, update currentEditItem
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
                            }
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
                          value={field.name === 'priority' ? (formData.extraFields?.priority || 'Medium') : 
                                 field.name === 'energy' ? (formData.extraFields?.energy || 'Medium') :
                                 (panelMode === 'add' ? (formData.extraFields?.[field.name] || field.defaultValue || (field.multiSelect ? [] : '')) : (currentEditItem?.extraFields?.[field.name] || field.defaultValue || (field.multiSelect ? [] : '')))}
                          onChange={(e) => {
                            setFormErrors(prev => ({...prev, [field.name]: false}))
                            if (field.name === 'priority') {
                              setFormData(prev => ({
                                ...prev, 
                                priority: e.target.value,
                                extraFields: {
                                  ...prev.extraFields,
                                  priority: e.target.value
                                }
                              }))
                              autoSave('priority', e.target.value)
                            } else if (field.name === 'energy') {
                              setFormData(prev => ({
                                ...prev, 
                                energy: e.target.value,
                                extraFields: {
                                  ...prev.extraFields,
                                  energy: e.target.value
                                }
                              }))
                              autoSave('energy', e.target.value)
                            } else {
                              setFormData(prev => ({
                                ...prev, 
                                extraFields: {
                                  ...prev.extraFields,
                                  [field.name]: e.target.value
                                }
                              }))
                              autoSave(field.name, e.target.value)
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

                  {/* Save button for new items */}
                  {panelMode === 'add' && (
                    <>
                      {/* Relationships Section for Add Mode */}
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Relationships</h4>
                        <div className="space-y-3">
                          {Object.entries(bucketConfig).map(([bucket, config]) => {
                            const bucketItems = availableItems.filter(item => 
                              item.bucket === bucket && 
                              (panelMode === 'edit' ? item.id !== currentEditItem?.id : item.bucket !== panelBucket)
                            )
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
                                      <input
                                        type="checkbox"
                                        id={`rel-${item.id}`}
                                        checked={selectedRelationships.includes(item.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedRelationships([...selectedRelationships, item.id])
                                          } else {
                                            setSelectedRelationships(selectedRelationships.filter(id => id !== item.id))
                                          }
                                        }}
                                        className="rounded"
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
                      
                      <div className="flex justify-end pt-4 border-t">
                      <Button 
                        onClick={async () => {
                          console.log('Create button clicked')
                          console.log('Current formData:', JSON.stringify(formData, null, 2))
                          console.log('extraFields being sent:', JSON.stringify(formData.extraFields || {}, null, 2))
                          
                          if (!formData.title?.trim()) {
                            console.log('No title provided')
                            return
                          }
                          
                          const newItem = await createItem(
                            panelBucket,
                            formData.title,
                            formData.description || '',
                            formData.status || 'Planning',
                            formData.extraFields || {},
                            formData.tags || []
                          )
                          
                          console.log('createItem returned:', newItem)
                          
                          // Add relationships if any selected
                          if (newItem && selectedRelationships.length > 0) {
                            for (const relatedId of selectedRelationships) {
                              try {
                                await fetch('/api/relationships', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    parentId: newItem.id, 
                                    childId: relatedId, 
                                    relationship: 'related' 
                                  })
                                })
                              } catch (error) {
                                console.error('Error adding relationship:', error)
                              }
                            }
                          }
                          
                          if (newItem) {
                            setShowPanel(false)
                            setFormData({status: "Next Up", tags: []})
                            setTagsInput('')
                            setSelectedRelationships([])
                          }
                        }}
                        disabled={!formData.title?.trim()}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Create {bucketConfig[panelBucket as keyof typeof bucketConfig]?.name.slice(0, -1)}
                      </Button>
                    </div>
                    </>
                  )}

                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      </div>
      </div>
      </SidebarInset>
      </div>

      {/* Notes Panel */}
      <Sheet open={showNotesPanel} onOpenChange={setShowNotesPanel}>
        <SheetContent className="w-[500px] max-w-[90vw]">
          <SheetHeader>
            <SheetTitle>Notes</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col h-[calc(100vh-120px)] space-y-4">
            {/* Add new note */}
            <div className="space-y-2">
              <MDEditor
                value={newNote}
                onChange={(val) => setNewNote(val || '')}
                preview="edit"
                hideToolbar={false}
                data-color-mode="light"
              />
              <Button 
                onClick={() => {
                  if (newNote.trim() && selectedItemForNotes) {
                    createNote(selectedItemForNotes, newNote.trim())
                    setNewNote('')
                  }
                }}
                className="w-full"
              >
                Add Note
              </Button>
            </div>
            
            {/* Notes list */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No notes yet</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleDateString('en-AU')} at {new Date(note.createdAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setEditingNote({ id: note.id, content: note.content })}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => deleteNote(note.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {editingNote?.id === note.id ? (
                      <div className="space-y-2">
                        <MDEditor
                          value={editingNote.content}
                          onChange={(val) => setEditingNote({ ...editingNote, content: val || '' })}
                          preview="edit"
                          hideToolbar={false}
                          data-color-mode="light"
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => {
                              updateNote(editingNote.id, editingNote.content)
                              setEditingNote(null)
                            }}
                          >
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingNote(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{note.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* AI Summary Panel */}
      <Sheet open={showSummaryPanel} onOpenChange={setShowSummaryPanel}>
        <SheetContent className="w-[600px] max-w-[90vw] flex flex-col">
          <SheetHeader>
            <SheetTitle>AI System Summary</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex-1 overflow-y-auto">
            {systemSummary ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{systemSummary}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-500">No summary generated yet.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

    </SidebarProvider>
  )
}

export default App
