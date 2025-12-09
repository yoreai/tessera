'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Database,
  Play,
  History,
  Settings,
  Terminal,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  HelpCircle
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  isActive: boolean;
}

function NavItem({ href, icon, label, isCollapsed, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-3 rounded-lg transition-all group relative
        ${isActive
          ? 'bg-slate-800 text-white'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }
        ${isCollapsed ? 'justify-center' : ''}
      `}
      title={isCollapsed ? label : undefined}
    >
      <span className={`
        transition-colors flex-shrink-0
        ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'}
      `}>
        {icon}
      </span>
      <span
        className={`
          font-medium whitespace-nowrap overflow-hidden transition-all duration-300
          ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
        `}
      >
        {label}
      </span>
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-r" />
      )}
    </Link>
  );
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { href: '/query', icon: <Play size={20} />, label: 'Query Editor' },
    { href: '/schema', icon: <Database size={20} />, label: 'Schema' },
    { href: '/history', icon: <History size={20} />, label: 'History' },
    { href: '/connections', icon: <Settings size={20} />, label: 'Connections' },
    { href: '/terminal', icon: <Terminal size={20} />, label: 'Terminal' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div
      className={`
        bg-slate-900 border-r border-slate-800 flex flex-col relative
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-[72px]' : 'w-64'}
      `}
    >
      {/* Logo */}
      <Link
        href="/"
        className={`
          p-4 border-b border-slate-800 flex items-center gap-3 hover:bg-slate-800/50 transition-colors
          ${isCollapsed ? 'justify-center' : ''}
        `}
      >
        {/* App Icon */}
        <div className="w-10 h-10 flex-shrink-0 relative">
          <Image
            src="/favicon.svg"
            alt="ARESA Studio"
            width={40}
            height={40}
            className="drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"
          />
        </div>

        {/* App Name */}
        <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          <h1 className="text-lg font-bold gradient-text-cyan-blue whitespace-nowrap">
            ARESA Studio
          </h1>
          <p className="text-xs text-slate-500">v0.2.0</p>
        </div>
      </Link>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`
          absolute -right-3 top-20 z-10
          w-6 h-6 rounded-full
          bg-slate-800 border border-slate-700
          flex items-center justify-center
          text-slate-400 hover:text-cyan-400 hover:border-cyan-400
          transition-all duration-200
          shadow-lg
        `}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isCollapsed={isCollapsed}
            isActive={isActive(item.href)}
          />
        ))}

        <div className="pt-4 mt-4 border-t border-slate-800 space-y-1">
          <NavItem
            href="/help"
            icon={<HelpCircle size={20} />}
            label="Help & Docs"
            isCollapsed={isCollapsed}
            isActive={isActive('/help')}
          />
          <NavItem
            href="/settings"
            icon={<Settings size={20} />}
            label="Settings"
            isCollapsed={isCollapsed}
            isActive={isActive('/settings')}
          />
        </div>
      </nav>

      {/* Footer */}
      <div className={`
        p-4 border-t border-slate-800 transition-all duration-300
        ${isCollapsed ? 'opacity-0' : 'opacity-100'}
      `}>
        <p className="text-xs text-slate-500 whitespace-nowrap overflow-hidden">
          Powered by ARESA CLI
        </p>
      </div>
    </div>
  );
}
