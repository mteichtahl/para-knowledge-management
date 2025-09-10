import React, { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import { Button } from '../components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { Checkbox } from '../components/ui/checkbox'

interface Item {
  id: string
  bucket: string
  title: string
  description?: string
  status?: string
  extraFields?: Record<string, any>
}

interface GraphViewProps {
  items: Item[]
  itemRelationships: Record<string, any[]>
  bucketConfig: any
}

const D3NetworkGraph: React.FC<GraphViewProps> = ({ items, itemRelationships, bucketConfig }) => {
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
    
    d3.select(graphRef.current).selectAll("*").remove()
    
    let filteredItems = items.filter(item => visibleBuckets.has(item.bucket))
    
    if (debouncedSearchQuery.trim()) {
      const matchingItems = filteredItems.filter(item => 
        item.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
      
      const connectedItemIds = new Set(matchingItems.map(item => item.id))
      
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
      
      filteredItems = filteredItems.filter(item => connectedItemIds.has(item.id))
    }
    
    const filteredItemIds = new Set(filteredItems.map(item => item.id))
    
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
        if (filteredItemIds.has(rel.parentId) && filteredItemIds.has(rel.childId)) {
          links.push({
            source: rel.parentId,
            target: rel.childId,
            relationship: rel.relationship
          })
        }
      })
    })
    
    const width = 1200
    const height = 800
    const svg = d3.select(graphRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "#f8f9fa")
    
    const g = svg.append("g")
    
    svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
      }))
    
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
    
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
    
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
    
    node.append("circle")
      .attr("r", 8)
      .attr("fill", (d: any) => d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
    
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
    
    svg.on("dblclick", () => {
      node.select("circle").style("opacity", 1)
      node.select("text").style("opacity", 1)
      link.style("opacity", 0.6)
    })
    
    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
        const dx = d.target.x - d.source.x
        const dy = d.target.y - d.source.y
        const dr = Math.sqrt(dx * dx + dy * dy) * 2
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`
      })
      
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`)
    })
    
  }, [items, itemRelationships, bucketConfig, visibleBuckets, debouncedSearchQuery])

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-2 border rounded-lg shadow-sm text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
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

export const GraphView: React.FC<GraphViewProps> = (props) => {
  return (
    <div className="h-screen w-full bg-white p-8 overflow-auto">
      <D3NetworkGraph {...props} />
    </div>
  )
}
