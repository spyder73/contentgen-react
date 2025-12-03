import React, { useState } from 'react';
import API from './api/api';
import IdeasList from './components/IdeasList';
import VideoPromptsList from './components/VideoPromptsList';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // WebSocket connection for real-time updates - refreshes BOTH lists
  const { isConnected } = useWebSocket('ws://localhost:81/webhook', () => {
    console.log('WebSocket message received - refreshing both lists');
    setRefreshTrigger(prev => prev + 1);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    try {
      setLoading(true);
      await API.createNewPrompt(prompt);
      setPrompt('');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to create prompt:', error);
      alert('Failed to create prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMultipleIdeas = async () => {
    const promptText = window.prompt('Generate Multiple Ideas', 'Generate 10 video ideas');
    if (!promptText) return;

    try {
      setLoading(true);
      await API.createMultiplePrompts(promptText);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to create multiple prompts:', error);
      alert('Failed to create multiple prompts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">🎬 Content Generator</h1>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">WebSocket:</span>
                <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-xs text-slate-400">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>

              <button
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-2"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Prompt Input */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">✨ Create an Idea</h2>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your video idea..."
              className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Creating...' : '➕ Add'}
            </button>
            <button
              type="button"
              onClick={handleAddMultipleIdeas}
              disabled={loading}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              title="Add Multiple Video Ideas"
            >
              {loading ? '⏳' : '📚 Add Multiple'}
            </button>
          </form>
        </div>

        {/* Two Column Layout - Ideas and Prompts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Prompts (Left) - matches Flutter's first tab */}
          <div>
            <VideoPromptsList onRefresh={refreshTrigger} />
          </div>

          {/* Ideas (Right) - matches Flutter's second tab */}
          <div>
            <IdeasList onRefresh={refreshTrigger} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
