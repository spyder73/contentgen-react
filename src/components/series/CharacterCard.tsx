import React from 'react';
import { Character, characterImageUrl } from '../../api/series';

interface Props {
  character: Character;
  onClick: () => void;
}

const CharacterCard: React.FC<Props> = ({ character, onClick }) => (
  <button
    onClick={onClick}
    className="flex-shrink-0 w-24 flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/5 transition-colors text-center"
  >
    <div className="w-16 h-16 rounded-full overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center">
      {characterImageUrl(character) ? (
        <img
          src={characterImageUrl(character)}
          alt={character.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )}
    </div>
    <span className="text-white text-[11px] font-medium truncate w-full">{character.name}</span>
    {character.voice ? (
      <span className="text-[9px] uppercase tracking-wider text-indigo-400 bg-indigo-900/30 px-1.5 py-0.5 rounded">
        {character.voice}
      </span>
    ) : null}
  </button>
);

export default CharacterCard;
