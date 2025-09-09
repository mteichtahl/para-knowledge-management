// ERD-style graph visualization approach
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
    <div className="h-screen w-full bg-gray-50 p-8 overflow-auto relative">
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

      {/* SVG for connecting lines */}
      <svg className="absolute inset-0 pointer-events-none z-10" style={{ width: '100%', height: '100%' }}>
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0,0 0,6 8,3" fill="#6b7280" />
          </marker>
        </defs>
        {allRelationships.map((rel, idx) => {
          const sourcePos = itemPositions[rel.source]
          const targetPos = itemPositions[rel.target]
          const sourceItem = filteredItems.find(item => item.id === rel.source)
          const targetItem = filteredItems.find(item => item.id === rel.target)
          if (sourcePos && targetPos && sourceItem && targetItem) {
            return (
              <line
                key={idx}
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke="#6b7280"
                strokeWidth="2"
                strokeOpacity="0.6"
                markerEnd="url(#arrowhead)"
              />
            )
          }
          return null
        })}
      </svg>

      {/* ERD-style nodes */}
      <div className="relative z-20">
        {filteredItems.map((item, idx) => (
          <div
            key={item.id}
            ref={(el) => {
              if (el) {
                const rect = el.getBoundingClientRect()
                const containerRect = document.querySelector('.h-screen.w-full.bg-gray-50.p-8')?.getBoundingClientRect()
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
            onClick={() => setSelectedGraphItem(item.id)}
            className="absolute bg-white border-2 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 min-w-48 max-w-64"
            style={{
              left: `${50 + (idx % 4) * 280}px`,
              top: `${100 + Math.floor(idx / 4) * 120}px`,
              borderColor: bucketColors[item.bucket]
            }}
          >
            {/* Header */}
            <div 
              className="px-4 py-2 text-white font-semibold text-sm rounded-t-md"
              style={{ backgroundColor: bucketColors[item.bucket] }}
            >
              {item.bucket}
            </div>
            
            {/* Content */}
            <div className="p-4">
              <div className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                {item.title}
              </div>
              <div className="text-xs text-gray-600 mb-2">
                Status: {item.status}
              </div>
              {item.description && (
                <div className="text-xs text-gray-500 line-clamp-3">
                  {item.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
