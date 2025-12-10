import React, { useState, useEffect } from 'react'
import {
  Folder,
  GitBranch,
  Users,
  Calendar,
  Globe,
  RefreshCw,
  Settings,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { formatDistanceToNow } from '../utils/formatDate'

const RepositoryPanel = ({ repoPath }) => {
  const [repoInfo, setRepoInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (repoPath) {
      loadRepoInfo()
    }
  }, [repoPath])

  const loadRepoInfo = async () => {
    setLoading(true)
    setError(null)
    try {
      // Get git status for basic info
      const status = await window.electronAPI.getRepoStatus(repoPath)
      if (status.success) {
        // Get commit history for latest commit
        const history = await window.electronAPI.getCommitHistory(repoPath)

        const info = {
          path: repoPath,
          branch: status.status?.branch || 'main',
          remote: status.status?.remote ? extractRemoteInfo(status.status.remote) : null,
          lastCommit: history.success && history.commits.length > 0 ? history.commits[0] : null,
          hasChanges: status.status?.has_changes || false,
          staged: status.status?.staged?.length || 0,
          unstaged: status.status?.unstaged?.length || 0,
          untracked: status.status?.untracked?.length || 0
        }

        setRepoInfo(info)
      } else {
        setError('Failed to load repository information')
      }
    } catch (err) {
      setError('Error loading repository information')
      console.error('Error loading repo info:', err)
    } finally {
      setLoading(false)
    }
  }

  const extractRemoteInfo = (remoteOutput) => {
    const lines = remoteOutput.split('\n')
    if (lines.length > 0) {
      const parts = lines[0].split('\t')
      return {
        name: parts[0],
        url: parts[1]?.split(' ')[0]
      }
    }
    return null
  }

  const getRepoName = () => {
    return repoPath.split('/').pop() || 'Repository'
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="font-semibold mb-2">Error Loading Repository</h3>
        <p className="text-muted-foreground text-center mb-4">{error}</p>
        <button
          onClick={loadRepoInfo}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Repository Header */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Folder className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">{getRepoName()}</h1>
              <p className="text-muted-foreground font-mono text-sm truncate max-w-md">
                {repoPath}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  <span className="font-medium">{repoInfo.branch}</span>
                </div>
                {repoInfo.remote && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span className="font-medium">{repoInfo.remote.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadRepoInfo}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="text-2xl font-bold text-git-added">{repoInfo.staged}</div>
            <p className="text-sm text-muted-foreground">Staged</p>
          </div>
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="text-2xl font-bold text-git-modified">{repoInfo.unstaged}</div>
            <p className="text-sm text-muted-foreground">Unstaged</p>
          </div>
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-500">{repoInfo.untracked}</div>
            <p className="text-sm text-muted-foreground">Untracked</p>
          </div>
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="text-2xl font-bold">
              {repoInfo.hasChanges ? 'Dirty' : 'Clean'}
            </div>
            <p className="text-sm text-muted-foreground">Status</p>
          </div>
        </div>
      </div>

      {/* Latest Commit */}
      {repoInfo.lastCommit && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-3">
            <Clock className="w-5 h-5" />
            Latest Commit
          </h3>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold">{repoInfo.lastCommit.author}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(repoInfo.lastCommit.date), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-mono">{repoInfo.lastCommit.short_hash}</span>
              </div>
            </div>

            <h4 className="font-medium mb-2">{repoInfo.lastCommit.subject}</h4>
            {repoInfo.lastCommit.body && (
              <p className="text-muted-foreground text-sm">{repoInfo.lastCommit.body}</p>
            )}
          </div>
        </div>
      )}

      {/* Remote Information */}
      {repoInfo.remote && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-3">
            <Globe className="w-5 h-5" />
            Remote Repository
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{repoInfo.remote.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">URL</span>
              <span className="font-mono text-sm truncate max-w-xs">
                {repoInfo.remote.url}
              </span>
            </div>

            {repoInfo.remote.url && (
              <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
                <ExternalLink className="w-4 h-4" />
                <span>Open in Browser</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="p-4 bg-card border border-border rounded-xl hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Create Branch</p>
              <p className="text-sm text-muted-foreground">Start new feature</p>
            </div>
          </div>
        </button>

        <button className="p-4 bg-card border border-border rounded-xl hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">View History</p>
              <p className="text-sm text-muted-foreground">Browse commits</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

export default RepositoryPanel