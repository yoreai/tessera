'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success' | 'info';
  content: string;
}

// Demo responses for various commands
const DEMO_RESPONSES: Record<string, string[]> = {
  'help': [
    '\x1b[1;36mARESA CLI - Universal Database Query Interface\x1b[0m',
    '',
    '\x1b[1mUsage:\x1b[0m aresa <command> [options]',
    '',
    '\x1b[1mCommands:\x1b[0m',
    '  \x1b[33mquery\x1b[0m <source> "<sql>"   Execute SQL query on a data source',
    '  \x1b[33mlist\x1b[0m                      List configured data sources',
    '  \x1b[33mschema\x1b[0m <source>           Show schema for a data source',
    '  \x1b[33mping\x1b[0m <source>             Test connection to a data source',
    '  \x1b[33mserve\x1b[0m                     Start the web UI server',
    '  \x1b[33mhelp\x1b[0m                      Show this help message',
    '',
    '\x1b[1mSupported Databases:\x1b[0m',
    '  PostgreSQL, MySQL, SQLite, ClickHouse, BigQuery, DuckDB, Snowflake, Databricks',
    '',
    '\x1b[1mExamples:\x1b[0m',
    '  aresa query postgres "SELECT * FROM users LIMIT 5"',
    '  aresa schema bigquery',
    '  aresa list',
  ],
  'list': [
    '\x1b[1;36mConfigured Data Sources\x1b[0m',
    '',
    '  \x1b[32m●\x1b[0m \x1b[1mpostgres\x1b[0m      PostgreSQL    localhost:5432/aresa_db',
    '  \x1b[32m●\x1b[0m \x1b[1mmysql\x1b[0m         MySQL         localhost:3306/demo',
    '  \x1b[32m●\x1b[0m \x1b[1msqlite\x1b[0m        SQLite        ./data/local.db',
    '  \x1b[32m●\x1b[0m \x1b[1mclickhouse\x1b[0m    ClickHouse    localhost:8123/default',
    '  \x1b[33m●\x1b[0m \x1b[1mbigquery\x1b[0m      BigQuery      project-id.dataset',
    '  \x1b[32m●\x1b[0m \x1b[1mduckdb\x1b[0m        DuckDB        ./data/analytics.duckdb',
    '  \x1b[33m●\x1b[0m \x1b[1msnowflake\x1b[0m     Snowflake     account.snowflakecomputing.com',
    '  \x1b[33m●\x1b[0m \x1b[1mdatabricks\x1b[0m    Databricks    workspace.cloud.databricks.com',
    '',
    '\x1b[90m● = connected, ● = cloud (requires auth)\x1b[0m',
  ],
  'query postgres': [
    '\x1b[90mExecuting query on postgres...\x1b[0m',
    '',
    '┌────────┬─────────────────┬─────────────────────┬────────┐',
    '│ \x1b[1mid\x1b[0m     │ \x1b[1mname\x1b[0m            │ \x1b[1memail\x1b[0m               │ \x1b[1mstatus\x1b[0m │',
    '├────────┼─────────────────┼─────────────────────┼────────┤',
    '│ 1      │ Alice Johnson   │ alice@example.com   │ active │',
    '│ 2      │ Bob Smith       │ bob@example.com     │ active │',
    '│ 3      │ Carol Williams  │ carol@example.com   │ pending│',
    '│ 4      │ David Brown     │ david@example.com   │ active │',
    '│ 5      │ Eve Davis       │ eve@example.com     │ inactive│',
    '└────────┴─────────────────┴─────────────────────┴────────┘',
    '',
    '\x1b[32m✓\x1b[0m 5 rows returned in \x1b[33m12ms\x1b[0m',
  ],
  'query mysql': [
    '\x1b[90mExecuting query on mysql...\x1b[0m',
    '',
    '┌────────┬──────────────┬───────────┬─────────────┐',
    '│ \x1b[1morder_id\x1b[0m │ \x1b[1mcustomer\x1b[0m    │ \x1b[1mtotal\x1b[0m     │ \x1b[1mdate\x1b[0m        │',
    '├────────┼──────────────┼───────────┼─────────────┤',
    '│ 10001  │ Acme Corp    │ $1,250.00 │ 2024-12-01  │',
    '│ 10002  │ TechStart    │ $3,450.00 │ 2024-12-02  │',
    '│ 10003  │ DataFlow Inc │ $890.50   │ 2024-12-03  │',
    '└────────┴──────────────┴───────────┴─────────────┘',
    '',
    '\x1b[32m✓\x1b[0m 3 rows returned in \x1b[33m8ms\x1b[0m',
  ],
  'query duckdb': [
    '\x1b[90mExecuting query on duckdb...\x1b[0m',
    '',
    '┌─────────────┬───────────┬────────────┬─────────┐',
    '│ \x1b[1mmetric\x1b[0m      │ \x1b[1mvalue\x1b[0m     │ \x1b[1mchange\x1b[0m     │ \x1b[1mtrend\x1b[0m   │',
    '├─────────────┼───────────┼────────────┼─────────┤',
    '│ revenue     │ $2.4M     │ +12.5%     │ ↑       │',
    '│ users       │ 145,230   │ +8.2%      │ ↑       │',
    '│ retention   │ 87.3%     │ +2.1%      │ ↑       │',
    '│ churn       │ 4.2%      │ -0.8%      │ ↓       │',
    '└─────────────┴───────────┴────────────┴─────────┘',
    '',
    '\x1b[32m✓\x1b[0m 4 rows returned in \x1b[33m3ms\x1b[0m (DuckDB is fast! 🦆)',
  ],
  'query clickhouse': [
    '\x1b[90mExecuting query on clickhouse...\x1b[0m',
    '',
    '┌────────────────┬─────────────┬───────────────┐',
    '│ \x1b[1mevent_type\x1b[0m     │ \x1b[1mcount\x1b[0m       │ \x1b[1mavg_duration\x1b[0m  │',
    '├────────────────┼─────────────┼───────────────┤',
    '│ page_view      │ 1,234,567   │ 2.3s          │',
    '│ click          │ 456,789     │ 0.1s          │',
    '│ purchase       │ 12,345      │ 45.2s         │',
    '│ signup         │ 8,901       │ 120.5s        │',
    '└────────────────┴─────────────┴───────────────┘',
    '',
    '\x1b[32m✓\x1b[0m 4 rows returned in \x1b[33m45ms\x1b[0m (scanned 10M rows)',
  ],
  'query bigquery': [
    '\x1b[90mExecuting query on bigquery...\x1b[0m',
    '',
    '┌─────────────────┬────────────┬─────────────────┐',
    '│ \x1b[1mregion\x1b[0m          │ \x1b[1mrevenue\x1b[0m    │ \x1b[1myoy_growth\x1b[0m      │',
    '├─────────────────┼────────────┼─────────────────┤',
    '│ North America   │ $45.2M     │ +15.3%          │',
    '│ Europe          │ $32.1M     │ +12.8%          │',
    '│ Asia Pacific    │ $28.7M     │ +22.1%          │',
    '│ Latin America   │ $8.9M      │ +18.5%          │',
    '└─────────────────┴────────────┴─────────────────┘',
    '',
    '\x1b[32m✓\x1b[0m 4 rows returned in \x1b[33m1.2s\x1b[0m (processed 2.3 GB)',
  ],
  'schema postgres': [
    '\x1b[1;36mSchema: postgres\x1b[0m',
    '',
    '\x1b[1mTables:\x1b[0m',
    '  • users (5 columns)',
    '  • orders (8 columns)',
    '  • products (6 columns)',
    '  • sessions (4 columns)',
    '',
    '\x1b[1mTable: users\x1b[0m',
    '┌──────────────┬─────────────┬──────────┐',
    '│ \x1b[1mcolumn\x1b[0m       │ \x1b[1mtype\x1b[0m        │ \x1b[1mnullable\x1b[0m │',
    '├──────────────┼─────────────┼──────────┤',
    '│ id           │ SERIAL      │ NO       │',
    '│ name         │ VARCHAR     │ NO       │',
    '│ email        │ VARCHAR     │ NO       │',
    '│ created_at   │ TIMESTAMP   │ NO       │',
    '│ status       │ VARCHAR     │ YES      │',
    '└──────────────┴─────────────┴──────────┘',
  ],
  'ping postgres': [
    '\x1b[90mTesting connection to postgres...\x1b[0m',
    '\x1b[32m✓\x1b[0m Connected to PostgreSQL 15.4',
    '\x1b[32m✓\x1b[0m Latency: 2ms',
    '\x1b[32m✓\x1b[0m Database: aresa_db',
  ],
  'ping mysql': [
    '\x1b[90mTesting connection to mysql...\x1b[0m',
    '\x1b[32m✓\x1b[0m Connected to MySQL 8.0.35',
    '\x1b[32m✓\x1b[0m Latency: 3ms',
    '\x1b[32m✓\x1b[0m Database: demo',
  ],
  'serve': [
    '\x1b[1;36m🚀 Starting ARESA Studio...\x1b[0m',
    '',
    '\x1b[32m✓\x1b[0m Loading configuration from ~/.aresa/config.toml',
    '\x1b[32m✓\x1b[0m Initializing connection pool',
    '\x1b[32m✓\x1b[0m Starting web server',
    '',
    '\x1b[1mARESA Studio is running!\x1b[0m',
    '',
    '  \x1b[36m→\x1b[0m Local:   http://localhost:3001',
    '  \x1b[36m→\x1b[0m Network: http://192.168.1.100:3001',
    '',
    '\x1b[90mPress Ctrl+C to stop\x1b[0m',
  ],
  'version': [
    '\x1b[1;36mARESA CLI\x1b[0m v0.1.0',
    '',
    'Built with Rust 🦀',
    'Supported databases: 8',
    'Config: ~/.aresa/config.toml',
  ],
  'clear': [],
};

// Commands that show typing animation
const TYPING_COMMANDS = ['query', 'schema', 'ping', 'serve'];

export default function DemoTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  useEffect(() => {
    const welcomeLines: TerminalLine[] = [
      { type: 'info', content: '\x1b[1;36m╔═══════════════════════════════════════════════════════════╗\x1b[0m' },
      { type: 'info', content: '\x1b[1;36m║\x1b[0m        \x1b[1;36mARESA Studio - Demo Terminal\x1b[0m                    \x1b[1;36m║\x1b[0m' },
      { type: 'info', content: '\x1b[1;36m║\x1b[0m        \x1b[90mUniversal Database Query Interface\x1b[0m               \x1b[1;36m║\x1b[0m' },
      { type: 'info', content: '\x1b[1;36m╚═══════════════════════════════════════════════════════════╝\x1b[0m' },
      { type: 'info', content: '' },
      { type: 'success', content: '\x1b[32m✓\x1b[0m Demo mode active - try these commands:' },
      { type: 'info', content: '' },
      { type: 'info', content: '  \x1b[33maresa help\x1b[0m                              Show all commands' },
      { type: 'info', content: '  \x1b[33maresa list\x1b[0m                              List data sources' },
      { type: 'info', content: '  \x1b[33maresa query postgres "SELECT * FROM users"\x1b[0m' },
      { type: 'info', content: '  \x1b[33maresa query duckdb "SELECT * FROM metrics"\x1b[0m' },
      { type: 'info', content: '  \x1b[33maresa schema postgres\x1b[0m                   Show schema' },
      { type: 'info', content: '  \x1b[33maresa ping mysql\x1b[0m                        Test connection' },
      { type: 'info', content: '' },
    ];
    setLines(welcomeLines);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input on click
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  // Process command
  const processCommand = useCallback(async (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    
    // Add command to history
    if (trimmedCmd) {
      setCommandHistory(prev => [...prev, cmd]);
      setHistoryIndex(-1);
    }

    // Add input line
    setLines(prev => [...prev, { type: 'input', content: `\x1b[32m❯\x1b[0m ${cmd}` }]);

    if (!trimmedCmd) return;

    // Handle clear
    if (trimmedCmd === 'clear' || trimmedCmd === 'cls') {
      setLines([]);
      return;
    }

    // Remove "aresa" prefix if present
    const normalizedCmd = trimmedCmd.replace(/^aresa\s+/, '');

    // Find matching response
    let response: string[] | undefined;
    
    // Check for exact match first
    if (DEMO_RESPONSES[normalizedCmd]) {
      response = DEMO_RESPONSES[normalizedCmd];
    } else {
      // Check for partial matches (e.g., "query postgres" matches "query postgres ...")
      for (const key of Object.keys(DEMO_RESPONSES)) {
        if (normalizedCmd.startsWith(key)) {
          response = DEMO_RESPONSES[key];
          break;
        }
      }
    }

    // Unknown command
    if (!response) {
      setLines(prev => [...prev, 
        { type: 'error', content: `\x1b[31m✗\x1b[0m Unknown command: ${cmd}` },
        { type: 'info', content: '\x1b[90mType "aresa help" for available commands\x1b[0m' },
        { type: 'info', content: '' },
      ]);
      return;
    }

    // Show typing animation for certain commands
    const shouldAnimate = TYPING_COMMANDS.some(c => normalizedCmd.startsWith(c));
    
    if (shouldAnimate) {
      setIsProcessing(true);
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    }

    // Add response lines
    setLines(prev => [
      ...prev, 
      ...response!.map(content => ({ type: 'output' as const, content })),
      { type: 'info', content: '' },
    ]);

    setIsProcessing(false);
  }, []);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isProcessing) {
      processCommand(currentInput);
      setCurrentInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  // Parse ANSI codes to styled spans
  const parseAnsi = (text: string) => {
    const parts: React.ReactElement[] = [];
    let currentIndex = 0;
    const regex = /\x1b\[([0-9;]+)m/g;
    let match;
    let currentStyle: React.CSSProperties = {};

    const styleMap: Record<string, React.CSSProperties> = {
      '0': {},
      '1': { fontWeight: 'bold' },
      '31': { color: '#ef4444' },
      '32': { color: '#10b981' },
      '33': { color: '#f59e0b' },
      '34': { color: '#3b82f6' },
      '35': { color: '#a855f7' },
      '36': { color: '#06b6d4' },
      '90': { color: '#64748b' },
      '1;36': { fontWeight: 'bold', color: '#06b6d4' },
      '1;31': { fontWeight: 'bold', color: '#ef4444' },
      '1;32': { fontWeight: 'bold', color: '#10b981' },
    };

    while ((match = regex.exec(text)) !== null) {
      // Add text before the escape code
      if (match.index > currentIndex) {
        parts.push(
          <span key={currentIndex} style={currentStyle}>
            {text.slice(currentIndex, match.index)}
          </span>
        );
      }
      // Update style
      const code = match[1];
      currentStyle = styleMap[code] || {};
      currentIndex = regex.lastIndex;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(
        <span key={currentIndex} style={currentStyle}>
          {text.slice(currentIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-slate-900 font-mono text-sm overflow-auto cursor-text p-4"
      onClick={handleContainerClick}
      style={{ minHeight: '500px' }}
    >
      {/* Terminal output */}
      {lines.map((line, i) => (
        <div key={i} className="leading-6 whitespace-pre-wrap">
          {parseAnsi(line.content)}
        </div>
      ))}

      {/* Input line */}
      <div className="flex items-center leading-6">
        <span className="text-green-500 mr-2">❯</span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          className="flex-1 bg-transparent outline-none text-slate-200 caret-cyan-400"
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
        {isProcessing && (
          <span className="text-cyan-400 animate-pulse ml-2">●</span>
        )}
      </div>
    </div>
  );
}

