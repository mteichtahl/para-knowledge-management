import React from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet'
import ReactMarkdown from 'react-markdown'
import MDEditor from '@uiw/react-md-editor'

interface NotesPanelProps {
  showNotesPanel: boolean
  setShowNotesPanel: (show: boolean) => void
  notes: any[]
  newNote: string
  setNewNote: (note: string) => void
  editingNote: {id: string, content: string} | null
  setEditingNote: (note: {id: string, content: string} | null) => void
  selectedItemForNotes: string | null
  createNote: (itemId: string, content: string) => Promise<void>
  updateNote: (noteId: string, content: string) => Promise<void>
  deleteNote: (noteId: string) => Promise<void>
}

export function NotesPanel({
  showNotesPanel,
  setShowNotesPanel,
  notes,
  newNote,
  setNewNote,
  editingNote,
  setEditingNote,
  selectedItemForNotes,
  createNote,
  updateNote,
  deleteNote
}: NotesPanelProps) {
  return (
    <Sheet open={showNotesPanel} onOpenChange={setShowNotesPanel}>
      <SheetContent className="w-[500px] max-w-[90vw]">
        <SheetHeader>
          <SheetTitle>Notes</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col h-[calc(100vh-120px)] space-y-4">
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
  )
}
