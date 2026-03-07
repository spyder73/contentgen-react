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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
      <div className="bg-zinc-950 border border-white/20 p-5 w-full max-w-lg max-h-[80vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
          <h2 className="text-base font-semibold uppercase tracking-[0.2em] text-white">Proxy Manager</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm border border-white/20 px-2 py-1"
          >
            Close
          </button>
        </div>

        {/* Add Proxy Form */}
        <form onSubmit={handleAddProxy} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newProxy}
            onChange={(e) => setNewProxy(e.target.value)}
            placeholder="host:port:user:pass"
            className="flex-1 input"
          />
          <select
            value={proxyType}
            onChange={(e) => setProxyType(e.target.value as 'http' | 'https')}
            className="select"
          >
            <option value="http">HTTP</option>
            <option value="https">HTTPS</option>
          </select>
          <button
            type="submit"
            className="btn btn-primary text-xs"
          >
            Add
          </button>
        </form>

        {/* Proxy List */}
        {proxies.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No proxies configured.</p>
        ) : (
          <div className="space-y-2">
            {proxies.map((proxy) => (
              <div key={proxy.id} className="flex items-center gap-3 p-3 border border-white/15 bg-black/40">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(proxy)}`} />
                
                <div className="flex-1 min-w-0">
                  <span className="text-white font-mono text-sm">
                    {proxy.host}:{proxy.port}
                  </span>
                  <span className="text-slate-400 text-xs ml-2">
                    ({proxy.type.toUpperCase()}){proxy.username ? ` • ${proxy.username}` : ''}
                  </span>
                  {proxy.failure_count > 0 && (
                    <span className="text-zinc-300 text-xs ml-2">
                      Failures: {proxy.failure_count}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(proxy.id)}
                  className="btn btn-sm btn-ghost"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer info */}
        <p className="text-slate-500 text-xs mt-4 text-center">
          Proxies rotate automatically for Pollinations requests.
        </p>
      </div>
    </div>
  );
};

export default ProxyModal;
