import React from 'react'
import { Search } from 'lucide-react'
import { Input } from './ui/input'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from './ui/sidebar'
import { ThemeToggle } from './theme-toggle'

interface MainSidebarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedBucket: string
  setSelectedBucket: (bucket: string) => void
  bucketConfig: any
  filteredItems: any[]
}

export function MainSidebar({
  searchQuery,
  setSearchQuery,
  selectedBucket,
  setSelectedBucket,
  bucketConfig,
  filteredItems
}: MainSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader>
        <h2 className="text-lg font-semibold text-gray-900 px-4 py-2">PAARA System</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Search</SidebarGroupLabel>
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
          <SidebarGroupLabel>PARA Buckets</SidebarGroupLabel>
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
                      <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
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
  )
}
