import React, { useState, useEffect } from 'react';
import API, { Proxy } from '../api/api';

interface ProxyManagerProps {
  onRefresh: number;
}

const ProxyManager: React.FC<ProxyManagerProps> = ({ onRefresh }) => {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [newProxy, setNewProxy] = useState('');
  const [proxyType, setProxyType] = useState<'http' | 'https'>('http');
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchProxies = async () => {
    try {
      const data = await API.getProxies();
      setProxies(data);
    } catch (error) {
      console.error('Failed to fetch proxies:', error);
    }
  };

  useEffect(() => {
    fetchProxies();
  }, [onRefresh]);

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

  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">🌐 Proxies</h3>
          <span className="text-slate-400 text-sm">({proxies.length})</span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm"
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <form onSubmit={handleAddProxy} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newProxy}
              onChange={(e) => setNewProxy(e.target.value)}
              placeholder="host:port:user:pass"
              className="flex-1 px-3 py-2 bg-slate-700 text-white rounded text-sm"
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

          {proxies.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No proxies configured</p>
          ) : (
            <div className="space-y-2">
              {proxies.map((proxy) => (
                <div key={proxy.id} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(proxy)}`} />
                  
                  <div className="flex-1">
                    <span className="text-white font-mono text-sm">
                      {proxy.host}:{proxy.port}
                    </span>
                    <span className="text-slate-400 text-xs ml-2">
                      ({proxy.type.toUpperCase()})
                      {proxy.username && ` • ${proxy.username}`}
                    </span>
                    {proxy.failure_count > 0 && (
                      <span className="text-red-400 text-xs ml-2">
                        ❌ {proxy.failure_count} failures
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
        </div>
      )}
    </div>
  );
};

export default ProxyManager;