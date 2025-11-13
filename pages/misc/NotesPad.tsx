import React, { useState, useEffect, useRef } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { ToolPageLayout } from '../../components/ToolPageLayout';

interface Note {
    id: number;
    title: string;
    content: string;
    lastModified: number;
}

const RichTextToolbar: React.FC = () => {
    const format = (command: string, value: string | null = null) => {
        document.execCommand(command, false, value);
    };

    return (
        <div className="flex items-center gap-2 p-2 bg-brand-surface rounded-t-md border-b border-brand-border">
            <button onClick={() => format('bold')} className="font-bold w-8 h-8 hover:bg-brand-border rounded">B</button>
            <button onClick={() => format('italic')} className="italic w-8 h-8 hover:bg-brand-border rounded">I</button>
            <button onClick={() => format('underline')} className="underline w-8 h-8 hover:bg-brand-border rounded">U</button>
            <button onClick={() => format('insertUnorderedList')} className="w-8 h-8 hover:bg-brand-border rounded">UL</button>
            <button onClick={() => format('insertOrderedList')} className="w-8 h-8 hover:bg-brand-border rounded">OL</button>
        </div>
    );
};

const NotesPad: React.FC = () => {
    const [notes, setNotes] = useLocalStorage<Note[]>('dicetools-multinotes', []);
    const [activeNoteId, setActiveNoteId] = useLocalStorage<number | null>('dicetools-activenote', null);
    
    const editorRef = useRef<HTMLDivElement>(null);

    const activeNote = notes.find(n => n.id === activeNoteId);

    useEffect(() => {
        if (!activeNote && notes.length > 0) {
            setActiveNoteId(notes[0].id);
        } else if (notes.length === 0) {
            setActiveNoteId(null);
        }
    }, [notes, activeNote, setActiveNoteId]);
    
    useEffect(() => {
        if (activeNote && editorRef.current) {
            editorRef.current.innerHTML = activeNote.content;
        } else if (!activeNote && editorRef.current) {
            editorRef.current.innerHTML = '';
        }
    }, [activeNote]);

    const createNote = () => {
        const newNote: Note = {
            id: Date.now(),
            title: 'New Note',
            content: '',
            lastModified: Date.now()
        };
        setNotes([newNote, ...notes]);
        setActiveNoteId(newNote.id);
    };

    const deleteNote = (id: number) => {
        setNotes(notes.filter(n => n.id !== id));
        if (activeNoteId === id) {
            setActiveNoteId(notes.length > 1 ? notes.find(n => n.id !== id)!.id : null);
        }
    };

    const updateNote = (id: number, updates: Partial<Note>) => {
        setNotes(notes.map(n => n.id === id ? { ...n, ...updates, lastModified: Date.now() } : n).sort((a, b) => b.lastModified - a.lastModified));
    };
    
    const handleContentChange = () => {
        if (activeNote && editorRef.current) {
            const newContent = editorRef.current.innerHTML;
            if (newContent !== activeNote.content) {
                updateNote(activeNote.id, { content: newContent });
            }
        }
    };
    
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(activeNote) {
            updateNote(activeNote.id, { title: e.target.value });
        }
    };

    return (
        <ToolPageLayout
            title="Notes Pad"
            description="A simple notepad that saves your text to your browser's local storage automatically."
        >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[70vh]">
                <div className="md:col-span-1 bg-brand-bg p-2 rounded-lg flex flex-col">
                    <button onClick={createNote} className="w-full bg-brand-primary text-white py-2 rounded-md mb-2">New Note</button>
                    <div className="flex-grow overflow-y-auto">
                        {notes.map(note => (
                            <div key={note.id} onClick={() => setActiveNoteId(note.id)} className={`p-2 rounded cursor-pointer ${activeNoteId === note.id ? 'bg-brand-primary/20' : 'hover:bg-brand-surface'}`}>
                                <p className="font-semibold truncate">{note.title}</p>
                                <p className="text-xs text-brand-text-secondary">{new Date(note.lastModified).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="md:col-span-3 bg-brand-bg rounded-lg">
                    {activeNote ? (
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between items-center p-2 border-b border-brand-border">
                                <input type="text" value={activeNote.title} onChange={handleTitleChange} className="font-bold text-lg bg-transparent w-full focus:outline-none"/>
                                <button onClick={() => deleteNote(activeNote.id)} className="text-red-500 font-bold px-2">Delete</button>
                            </div>
                             <RichTextToolbar />
                            <div
                                ref={editorRef}
                                contentEditable
                                onBlur={handleContentChange}
                                className="w-full h-full p-4 focus:outline-none overflow-y-auto"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-brand-text-secondary">
                            <p>No notes here. Create one to get started!</p>
                        </div>
                    )}
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default NotesPad;
