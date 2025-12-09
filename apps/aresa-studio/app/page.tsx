// ARESA Studio - Dashboard Page

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Database, Play, History, Settings, Terminal, Activity, Zap } from 'lucide-react';
import { api, Connection, HistoryEntry } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { ConnectionCard } from '@/components/ConnectionCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { setSelectedConnection } from '@/lib/connection-state';

export default function Dashboard() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [conns, hist] = await Promise.all([
        api.listConnections(),
        api.getHistory(5),
      ]);
      setConnections(conns);
      setHistory(hist);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <div className="text-white text-xl mt-4">Loading ARESA Studio...</div>
          <div className="text-slate-400 text-sm mt-2">Connecting to databases...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text-cyan-blue">
          ARESA Studio
        </h1>
        <p className="text-slate-400 mt-2">Universal Database Management</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Connections"
          value={connections.length}
          icon={Database}
          color="cyan"
        />
        <StatCard
          title="Queries Today"
          value={history.length}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Success Rate"
          value={`${history.length > 0
            ? Math.round((history.filter(h => h.success).length / history.length) * 100)
            : 0}%`}
          icon={Zap}
          color="blue"
        />
        <StatCard
          title="Avg Response"
          value={`${history.length > 0
            ? Math.round(history.reduce((sum, h) => sum + (h.durationMs || 0), 0) / history.length)
            : 0}ms`}
          icon={Activity}
          color="purple"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Connections */}
        <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Database className="text-cyan-400" size={24} />
              Connections
            </h2>
            <Link
              href="/connections"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Manage →
            </Link>
          </div>

          <div className="space-y-3">
            {connections.length === 0 ? (
              <div className="text-center py-8">
                <Database className="mx-auto text-slate-600 mb-3" size={48} />
                <p className="text-slate-400 text-sm">No connections configured</p>
                <Link href="/connections" className="text-cyan-400 text-sm hover:underline mt-2 inline-block">
                  Add your first connection →
                </Link>
              </div>
            ) : (
              connections.map((conn) => (
                <ConnectionCard
                  key={conn.name}
                  connection={conn}
                  onClick={() => {
                    setSelectedConnection(conn.name);
                    router.push('/query');
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Recent Queries */}
        <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <History className="text-blue-400" size={24} />
              Recent Queries
            </h2>
            <Link
              href="/history"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="text-slate-400 text-sm">No query history</p>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 bg-slate-700/50 rounded border border-slate-600"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {entry.success ? (
                        <span className="text-green-400 text-xs">✓</span>
                      ) : (
                        <span className="text-red-400 text-xs">✗</span>
                      )}
                      <span className="text-sm text-slate-400">{entry.source}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm font-mono text-slate-300 truncate">
                    {entry.query}
                  </p>
                  {entry.durationMs && (
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>{entry.durationMs}ms</span>
                      {entry.rowsReturned && <span>{entry.rowsReturned} rows</span>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Link
          href="/query"
          className="gradient-bg-cyan-blue p-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
        >
          <Play className="mb-3" size={28} />
          <h3 className="font-semibold">New Query</h3>
          <p className="text-sm opacity-90 mt-1">Execute SQL</p>
        </Link>

        <Link
          href="/schema"
          className="gradient-bg-purple-pink p-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
        >
          <Database className="mb-3" size={28} />
          <h3 className="font-semibold">Schema</h3>
          <p className="text-sm opacity-90 mt-1">Explore tables</p>
        </Link>

        <Link
          href="/history"
          className="gradient-bg-orange-red p-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
        >
          <History className="mb-3" size={28} />
          <h3 className="font-semibold">History</h3>
          <p className="text-sm opacity-90 mt-1">View queries</p>
        </Link>

        <Link
          href="/terminal"
          className="gradient-bg-green-teal p-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
        >
          <Terminal className="mb-3" size={28} />
          <h3 className="font-semibold">Terminal</h3>
          <p className="text-sm opacity-90 mt-1">CLI access</p>
        </Link>
      </div>
    </div>
  );
}
