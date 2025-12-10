import React from 'react'
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  FileText,
  History,
  BarChart3,
  Folder,
  Terminal,
  Settings,
  HelpCircle
} from 'lucide-react'

const Sidebar = ({ isOpen, activeTab, onTabChange, onClose }) => {
  const menuItems = [
    { id: 'changes', label: 'Changes', icon: GitBranch },
    { id: 'history', label: 'History', icon: History },
    { id: 'graph', label: 'Graph', icon: BarChart3 },
    { id: 'push-pull', label: 'Push/Pull', icon: GitPullRequest },
    { id: 'files', label: 'Files', icon: Folder },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
  ]

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ]

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-card border-r border-border
          transform transition-transform duration-200 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Git GUI</h2>
              <p className="text-sm text-muted-foreground">Modern Version Control</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-colors duration-150
                  ${activeTab === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>

        <div className="p-4 border-t border-border">
          <div className="px-3 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg">
            <p className="text-sm text-muted-foreground">AI Commit</p>
            <p className="text-xs text-muted-foreground mt-1">
              Powered by OpenRouter AI
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar