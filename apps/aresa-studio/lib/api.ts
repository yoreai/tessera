// API client for ARESA Studio
// Uses local Next.js API routes which can either:
// 1. Return demo data (DEMO_MODE=true in lib/demo-data.ts)
// 2. Proxy to aresa-cli backend (when running locally)

const API_BASE = '';

export interface Connection {
  name: string;
  type: string;
  details: string;
  status: 'connected' | 'disconnected' | 'unknown';
  lastChecked?: string;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, string>[];
  rowCount: number;
  executionTimeMs: number;
}

export interface HistoryEntry {
  id: number;
  timestamp: string;
  source: string;
  query: string;
  success: boolean;
  durationMs?: number;
  rowsReturned?: number;
}

export interface SchemaTable {
  name: string;
  schema?: string;  // Dataset/schema name (for BigQuery, Postgres, etc.)
  type: 'table' | 'view' | 'BASE TABLE' | 'VIEW';
  rowCount?: number;
}

export interface SchemaColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  primaryKey?: boolean;
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async listConnections(): Promise<Connection[]> {
    const res = await fetch(`${this.baseUrl}/api/connections`);
    if (!res.ok) throw new Error('Failed to fetch connections');
    return res.json();
  }

  async pingConnection(name: string): Promise<{ success: boolean; latencyMs: number }> {
    const res = await fetch(`${this.baseUrl}/api/connections/${name}/ping`);
    if (!res.ok) throw new Error('Failed to ping connection');
    return res.json();
  }

  async executeQuery(source: string, query: string, limit?: number): Promise<QueryResult> {
    const res = await fetch(`${this.baseUrl}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, query, limit }),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Query failed');
    }
    return res.json();
  }

  async getHistory(limit: number = 50): Promise<HistoryEntry[]> {
    const res = await fetch(`${this.baseUrl}/api/history?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  }

  async searchHistory(pattern: string): Promise<HistoryEntry[]> {
    const res = await fetch(`${this.baseUrl}/api/history/search?q=${encodeURIComponent(pattern)}`);
    if (!res.ok) throw new Error('Failed to search history');
    return res.json();
  }

  async listTables(source: string): Promise<SchemaTable[]> {
    const res = await fetch(`${this.baseUrl}/api/schema/${source}/tables`);
    if (!res.ok) throw new Error('Failed to list tables');
    return res.json();
  }

  async getTableSchema(source: string, table: string): Promise<SchemaColumn[]> {
    // URL-encode the table name since it may contain dots (e.g., "dataset.table")
    const res = await fetch(`${this.baseUrl}/api/schema/${source}/tables/${encodeURIComponent(table)}`);
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Failed to get table schema');
    }
    // Map backend field names to frontend interface
    const data = await res.json();
    return data.map((col: Record<string, string>) => ({
      name: col.column_name || col.name,
      dataType: col.data_type || col.dataType,
      nullable: (col.is_nullable || col.nullable || '').toUpperCase() === 'YES',
      primaryKey: col.primaryKey || false,
    }));
  }

  async addConnection(data: {
    name: string;
    type: string;
    config: Record<string, string>;
  }): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add connection');
  }

  async removeConnection(name: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/connections/${name}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove connection');
  }

  // WebSocket for live updates
  createWebSocket(onMessage: (data: any) => void): WebSocket {
    const ws = new WebSocket(`ws://localhost:3001/api/ws`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    return ws;
  }
}

export const api = new APIClient();

