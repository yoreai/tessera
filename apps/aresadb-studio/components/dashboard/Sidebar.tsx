'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Terminal,
  Sparkles,
  FileText,
  Beaker,
  BarChart3,
  Settings,
  Database,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/sidebar'
import { useTheme } from '@/lib/theme'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Query', href: '/query', icon: Terminal },
  { name: 'Vectors', href: '/vectors', icon: Sparkles },
  { name: 'RAG', href: '/rag', icon: FileText },
  { name: 'Playground', href: '/playground', icon: Beaker },
  { name: 'Benchmarks', href: '/benchmarks', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const { theme, toggleTheme } = useTheme()

  return (
    <aside 
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col relative sidebar-transition",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "absolute -right-3 top-20 z-20",
          "w-6 h-6 rounded-full",
          "bg-card border border-border",
          "flex items-center justify-center",
          "text-muted-foreground hover:text-primary hover:border-primary",
          "transition-all duration-200",
          "shadow-lg"
        )}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-xl gradient-primary"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ filter: 'blur(8px)', zIndex: -1 }}
            />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent whitespace-nowrap">
                  AresaDB
                </h1>
                <p className="text-xs text-muted-foreground">Studio</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative',
                isActive
                  ? 'gradient-primary text-white glow-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                isCollapsed && 'justify-center'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* Database Status */}
      <div className={cn("p-3 border-t border-border", isCollapsed && "px-2")}>
        <div className={cn(
          "bg-secondary/30 rounded-xl p-3 space-y-2",
          isCollapsed && "p-2"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-xs text-muted-foreground">Connected</span>
              )}
            </div>
            <Database className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          {!isCollapsed && (
            <div className="space-y-1">
              <p className="text-sm font-medium">demo_database</p>
              <p className="text-xs text-muted-foreground font-mono">
                25,847 nodes • 12,493 edges
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Theme Toggle & Settings */}
      <div className={cn("p-3 border-t border-border space-y-1", isCollapsed && "px-2")}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium",
            "text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all",
            isCollapsed && "justify-center"
          )}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 flex-shrink-0" />
          ) : (
            <Moon className="w-5 h-5 flex-shrink-0" />
          )}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          title={isCollapsed ? 'Settings' : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium",
            "text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all",
            isCollapsed && "justify-center"
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </aside>
  )
}
