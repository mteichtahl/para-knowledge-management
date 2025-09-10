import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet'
import ReactMarkdown from 'react-markdown'

interface SummaryPanelProps {
  showSummaryPanel: boolean
  setShowSummaryPanel: (show: boolean) => void
  systemSummary: string
}

export function SummaryPanel({
  showSummaryPanel,
  setShowSummaryPanel,
  systemSummary
}: SummaryPanelProps) {
  return (
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
  )
}
