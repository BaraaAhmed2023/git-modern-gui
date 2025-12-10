import React from 'react'
import {
  Menu,
  GitBranch,
  RefreshCw,
  Sparkles,
  Settings,
  Bell,
  Search,
  User
} from 'lucide-react'

const Header = ({
  repoPath,
  branch,
  onMenuClick,
  onGenerateAICommit,
  onRefresh
}) => {
  return (
    <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-accent rounded-md transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{repoPath?.split('/').pop() || 'Repository'}</span>
          {branch && (
            <div className="flex items-center gap-2 ml-4">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-muted-foreground">{branch}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search commits, files..."
            className="pl-9 pr-4 py-1.5 bg-muted rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          onClick={onGenerateAICommit}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">AI Commit</span>
        </button>

        <button
          onClick={onRefresh}
          className="p-2 hover:bg-accent rounded-md transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        <button className="p-2 hover:bg-accent rounded-md transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <button className="p-2 hover:bg-accent rounded-md transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </header>
  )
}

export default Header