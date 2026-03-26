import React, { useState } from 'react';
import { Character } from '../../api/series';
import CharacterCard from './CharacterCard';
import CharacterEditorModal from './CharacterEditorModal';

interface Props {
  seriesId: string;
  characters: Character[];
  onCharacterSaved: (character: Character) => void;
}

const CharacterStrip: React.FC<Props> = ({ seriesId, characters, onCharacterSaved }) => {
  const [editingCharacter, setEditingCharacter] = useState<Character | null | undefined>(undefined);

  // undefined = closed, null = new character
  const isOpen = editingCharacter !== undefined;

  return (
    <>
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {characters.map((c) => (
          <CharacterCard key={c.id} character={c} onClick={() => setEditingCharacter(c)} />
        ))}

        {/* Add character button */}
        <button
          onClick={() => setEditingCharacter(null)}
          className="flex-shrink-0 w-24 h-24 rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center gap-1 text-slate-500 hover:border-white/40 hover:text-slate-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="text-[10px] uppercase tracking-wider">Add</span>
        </button>
      </div>

      <CharacterEditorModal
        isOpen={isOpen}
        onClose={() => setEditingCharacter(undefined)}
        seriesId={seriesId}
        character={editingCharacter}
        onSaved={(char) => {
          onCharacterSaved(char);
          setEditingCharacter(undefined);
        }}
      />
    </>
  );
};

export default CharacterStrip;
