'use client'

import { useState } from 'react'

const EMOJI_CATEGORIES = {
  tech: ['💻', '📱', '🖥️', '⌨️', '🖱️', '💾', '📀', '🔌', '🔋', '📡', '🛰️', '🤖', '🧠', '⚙️', '🔧', '🔩'],
  media: ['🎬', '🎥', '📺', '📻', '🎙️', '🎧', '🎤', '📸', '📹', '🎞️', '📽️', '🎵', '🎶', '🎼', '🎹', '🎸'],
  creative: ['🎨', '✏️', '🖌️', '🖍️', '📝', '✍️', '🎭', '🎪', '🎟️', '🏆', '🥇', '🎯', '🎲', '♟️', '🧩', '🪄'],
  home: ['🏠', '🏡', '🏢', '🏗️', '🛋️', '🛏️', '🚿', '🛁', '🪴', '🌱', '🌿', '🪵', '🔥', '💡', '🔦', '🕯️'],
  food: ['🍳', '🍕', '🍔', '🌮', '🍜', '🍣', '🍰', '☕', '🍷', '🍺', '🧁', '🍩', '🥗', '🥘', '🧇', '🥐'],
  sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥊', '🏋️', '🚴', '🏃', '🧗', '🏄', '🎿', '⛷️'],
  travel: ['✈️', '🚀', '🚂', '🚗', '🚢', '🛸', '🗺️', '🧭', '🏔️', '🏖️', '🌴', '🗼', '🗽', '🌍', '🌎', '🌏'],
  nature: ['🌳', '🌲', '🌵', '🌸', '🌺', '🌻', '🌹', '🍀', '🍁', '🍂', '🌈', '☀️', '🌙', '⭐', '🌟', '💫'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐮', '🐷', '🐸', '🦋', '🐝'],
  symbols: ['❤️', '💜', '💙', '💚', '💛', '🧡', '⚡', '💥', '✨', '🔥', '💯', '✅', '❌', '⭕', '❓', '❗'],
}

const CATEGORY_LABELS: Record<string, string> = {
  tech: 'Tech',
  media: 'Media', 
  creative: 'Creatif',
  home: 'Maison',
  food: 'Food',
  sports: 'Sport',
  travel: 'Voyage',
  nature: 'Nature',
  animals: 'Animaux',
  symbols: 'Symboles',
}

interface TagIconPickerProps {
  value?: string
  onChange: (icon: string) => void
}

export function TagIconPicker({ value, onChange }: TagIconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('tech')

  const categories = Object.keys(EMOJI_CATEGORIES) as (keyof typeof EMOJI_CATEGORIES)[]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
      >
        {value || '➕'}
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-12 left-0 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl w-72">
            <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 p-1 gap-1 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${
                    activeCategory === cat 
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
            
            <div className="p-2">
              {value && (
                <button
                  type="button"
                  onClick={() => { onChange(''); setIsOpen(false) }}
                  className="w-full mb-2 px-2 py-1 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center justify-center gap-1"
                >
                  <span>✕</span> Supprimer
                </button>
              )}
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => { onChange(emoji); setIsOpen(false) }}
                    className={`w-7 h-7 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-lg transition-colors ${
                      value === emoji ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
