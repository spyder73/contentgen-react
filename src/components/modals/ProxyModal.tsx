import React, { useState, useEffect } from 'react';
import API, { Proxy } from '../../api/api';

interface ProxyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProxyModal: React.FC<ProxyModalProps> = ({ isOpen, onClose }) => {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [newProxy, setNewProxy] = useState('');
  const [proxyType, setProxyType] = useState<'http' | 'https'>('http');

  const fetchProxies = async () => {
    try {
      const data = await API.getProxies();
      setProxies(data.proxies);
    } catch (error) {
      console.error('Failed to fetch proxies:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProxies();
    }
  }, [isOpen]);

  const handleAddProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProxy.trim()) return;

    try {
      await API.addProxy(newProxy, proxyType);
      setNewProxy('');
      fetchProxies();
    } catch (error: any) {
      alert(`Failed to add proxy: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await API.deleteProxy(id);
      fetchProxies();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    }
  };

  const getStatusColor = (proxy: Proxy) => {
    if (proxy.failure_count >= 5) return 'bg-red-600';
    if (proxy.failure_count > 0) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">🌐 Proxy Manager</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Add Proxy Form */}
        <form onSubmit={handleAddProxy} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newProxy}
            onChange={(e) => setNewProxy(e.target.value)}
            placeholder="host:port:user:pass"
            className="flex-1 px-3 py-2 bg-slate-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={proxyType}
            onChange={(e) => setProxyType(e.target.value as 'http' | 'https')}
            className="px-3 py-2 bg-slate-700 text-white rounded text-sm"
          >
            <option value="http">HTTP</option>
            <option value="https">HTTPS</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
          >
            Add
          </button>
        </form>

        {/* Proxy List */}
        {proxies.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No proxies configured</p>
        ) : (
          <div className="space-y-2">
            {proxies.map((proxy) => (
              <div key={proxy.id} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(proxy)}`} />
                
                <div className="flex-1 min-w-0">
                  <span className="text-white font-mono text-sm">
                    {proxy.host}:{proxy.port}
                  </span>
                  <span className="text-slate-400 text-xs ml-2">
                    ({proxy.type.toUpperCase()})
                    {proxy.username && ` • ${proxy.username}`}
                  </span>
                  {proxy.failure_count > 0 && (
                    <span className="text-red-400 text-xs ml-2">
                      ❌ {proxy.failure_count}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(proxy.id)}
                  className="p-1.5 hover:bg-slate-600 rounded text-sm text-red-400"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer info */}
        <p className="text-slate-500 text-xs mt-4 text-center">
          Proxies rotate automatically for Pollinations AI requests
        </p>
      </div>
    </div>
  );
};

export default ProxyModal;