import React, { useState, useEffect, useRef } from 'react';
import Modal from '../modals/Modal';
import AttachmentLibraryModal from '../ideas/AttachmentLibraryModal';
import { Character, createCharacter, updateCharacter } from '../../api/series';
import MediaAPI from '../../api/media';
import { constructMediaUrl } from '../../api/helpers';

const VOICE_OPTIONS = [
  'alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer',
];

type ImageTab = 'upload' | 'library' | 'ai';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  seriesId: string;
  character?: Character | null;
  onSaved: (character: Character) => void;
}

const CharacterEditorModal: React.FC<Props> = ({ isOpen, onClose, seriesId, character, onSaved }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [voice, setVoice] = useState('');
  // refImageUrl = display URL (constructMediaUrl applied, for <img> preview)
  // refRawUrl   = raw URL as returned from media API (stored in DB)
  const [refMediaId, setRefMediaId] = useState<string | undefined>(undefined);
  const [refImageUrl, setRefImageUrl] = useState<string>('');
  const [refRawUrl, setRefRawUrl] = useState<string>('');
  const [imageTab, setImageTab] = useState<ImageTab>('upload');
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && character) {
      setName(character.name);
      setDescription(character.description ?? '');
      setVoice(character.voice ?? '');
      setRefMediaId(character.reference_image_media_id ?? undefined);
      const raw = String(character.metadata?.reference_image_url ?? '');
      setRefRawUrl(raw);
      setRefImageUrl(raw ? constructMediaUrl(raw) : '');
    } else if (isOpen) {
      setName('');
      setDescription('');
      setVoice('');
      setRefMediaId(undefined);
      setRefRawUrl('');
      setRefImageUrl('');
    }
    setUploadError('');
    setError('');
  }, [isOpen, character]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError('');
    try {
      const item = await MediaAPI.uploadMediaLibraryFile(file, { type: 'image', source: 'character_reference' });
      setRefMediaId(item.media_id);
      const url = item.url ?? item.preview_url ?? '';
      setRefRawUrl(url);
      setRefImageUrl(url ? constructMediaUrl(url) : '');
    } catch {
      setUploadError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let saved: Character;
      if (character) {
        saved = await updateCharacter(character, {
          name: name.trim(),
          description: description.trim(),
          voice,
          reference_image_media_id: refMediaId ?? null,
          reference_image_url: refRawUrl,
        });
      } else {
        saved = await createCharacter({
          series_id: seriesId,
          name: name.trim(),
          description: description.trim(),
          voice,
          reference_image_media_id: refMediaId,
          reference_image_url: refRawUrl,
        });
      }
      onSaved(saved);
      onClose();
    } catch {
      setError('Failed to save character');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={character ? 'Edit Character' : 'New Character'}
        size="md"
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Name</label>
            <input
              className="input w-full"
              placeholder="Character name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Description</label>
            <textarea
              className="input w-full resize-none"
              rows={3}
              placeholder="Physical appearance, personality, backstory…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Voice */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Voice</label>
            <select
              className="input w-full"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
            >
              <option value="">No voice</option>
              {VOICE_OPTIONS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Reference Image */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Reference Image</label>

            {/* Tab switcher */}
            <div className="flex gap-1 mb-2">
              {(['upload', 'library', 'ai'] as ImageTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setImageTab(tab)}
                  disabled={tab === 'ai'}
                  className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                    imageTab === tab
                      ? 'bg-white/10 text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  } ${tab === 'ai' ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {tab === 'ai' ? 'AI (soon)' : tab}
                </button>
              ))}
            </div>

            {imageTab === 'upload' && (
              <div
                className="border border-dashed border-white/20 rounded p-4 flex flex-col items-center gap-2 hover:border-white/40 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                {uploading ? (
                  <span className="text-slate-400 text-sm">Uploading…</span>
                ) : refImageUrl ? (
                  <img src={refImageUrl} alt="Reference" className="w-20 h-20 object-cover rounded" />
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span className="text-slate-500 text-xs">Click to upload image</span>
                  </>
                )}
                {uploadError && <p className="text-red-400 text-xs">{uploadError}</p>}
              </div>
            )}

            {imageTab === 'library' && (
              <div className="flex flex-col gap-2">
                {refImageUrl && (
                  <img src={refImageUrl} alt="Reference" className="w-20 h-20 object-cover rounded border border-white/20" />
                )}
                <button
                  className="btn btn-ghost btn-sm self-start"
                  onClick={() => setShowLibrary(true)}
                >
                  Browse Media Library
                </button>
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Character'}
            </button>
          </div>
        </div>
      </Modal>

      <AttachmentLibraryModal
        isOpen={showLibrary}
        mode="select"
        onClose={() => setShowLibrary(false)}
        onConfirmSelection={(items) => {
          const item = items[0];
          if (item) {
            setRefMediaId(item.media_id);
            const url = item.url ?? item.preview_url ?? '';
            setRefRawUrl(url);
            setRefImageUrl(url ? constructMediaUrl(url) : '');
          }
          setShowLibrary(false);
        }}
      />
    </>
  );
};

export default CharacterEditorModal;
