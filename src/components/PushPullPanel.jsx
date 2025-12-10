import React, { useState } from 'react'
import {
  GitPullRequest,
  UploadCloud,
  DownloadCloud,
  RefreshCw,
  CheckCircle,
  XCircle,
  ExternalLink,
  GitBranch,
  Globe
} from 'lucide-react'

const PushPullPanel = ({ repoPath, onPush, onPull, remote, branch }) => {
  const [isPushing, setIsPushing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [pushResult, setPushResult] = useState(null)
  const [pullResult, setPullResult] = useState(null)
  const [customRemote, setCustomRemote] = useState(remote || 'origin')
  const [customBranch, setCustomBranch] = useState(branch || 'main')

  const handlePush = async () => {
    setIsPushing(true)
    setPushResult(null)

    try {
      const result = await onPush({
        repoPath,
        remote: customRemote,
        branch: customBranch
      })

      setPushResult(result)
    } catch (error) {
      setPushResult({ success: false, error: error.message })
    } finally {
      setIsPushing(false)
    }
  }

  const handlePull = async () => {
    setIsPulling(true)
    setPullResult(null)

    try {
      const result = await onPull({
        repoPath,
        remote: customRemote,
        branch: customBranch
      })

      setPullResult(result)
    } catch (error) {
      setPullResult({ success: false, error: error.message })
    } finally {
      setIsPulling(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Remote Configuration */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
          <Globe className="w-6 h-6 text-blue-500" />
          Remote Configuration
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Remote</label>
            <input
              type="text"
              value={customRemote}
              onChange={(e) => setCustomRemote(e.target.value)}
              className="w-full p-3 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., origin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Branch</label>
            <input
              type="text"
              value={customBranch}
              onChange={(e) => setCustomBranch(e.target.value)}
              className="w-full p-3 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., main"
            />
          </div>
        </div>

        {remote && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Current remote: <span className="font-mono">{remote}</span>
            </p>
          </div>
        )}
      </div>

      {/* Push Section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <UploadCloud className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-semibold">Push to Remote</h3>
          </div>

          <button
            onClick={handlePush}
            disabled={isPushing}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg transition-all
              ${isPushing
                ? 'bg-muted cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
              }
            `}
          >
            {isPushing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            <span>{isPushing ? 'Pushing...' : 'Push Changes'}</span>
          </button>
        </div>

        {pushResult && (
          <div className={`
            p-4 rounded-lg border
            ${pushResult.success
              ? 'bg-green-500/10 border-green-500'
              : 'bg-red-500/10 border-red-500'
            }
          `}>
            <div className="flex items-center gap-3">
              {pushResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">
                  {pushResult.success ? 'Push Successful' : 'Push Failed'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {pushResult.success ? 'Changes pushed to remote successfully' : pushResult.error}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="font-medium mb-1">Branch</p>
            <p className="text-muted-foreground">{branch || 'main'}</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="font-medium mb-1">Remote</p>
            <p className="text-muted-foreground">{remote || 'origin'}</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="font-medium mb-1">Status</p>
            <p className="text-muted-foreground">Ready to push</p>
          </div>
        </div>
      </div>

      {/* Pull Section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <DownloadCloud className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold">Pull from Remote</h3>
          </div>

          <button
            onClick={handlePull}
            disabled={isPulling}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg transition-all
              ${isPulling
                ? 'bg-muted cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {isPulling ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <DownloadCloud className="w-4 h-4" />
            )}
            <span>{isPulling ? 'Pulling...' : 'Pull Changes'}</span>
          </button>
        </div>

        {pullResult && (
          <div className={`
            p-4 rounded-lg border
            ${pullResult.success
              ? 'bg-blue-500/10 border-blue-500'
              : 'bg-red-500/10 border-red-500'
            }
          `}>
            <div className="flex items-center gap-3">
              {pullResult.success ? (
                <CheckCircle className="w-5 h-5 text-blue-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">
                  {pullResult.success ? 'Pull Successful' : 'Pull Failed'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {pullResult.success ? 'Changes pulled from remote successfully' : pullResult.error}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h4 className="font-medium mb-3">Recent Updates</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <GitBranch className="w-4 h-4" />
                <span>feature/new-ui</span>
              </div>
              <span className="text-sm text-muted-foreground">2 commits ahead</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <GitBranch className="w-4 h-4" />
                <span>bugfix/login</span>
              </div>
              <span className="text-sm text-muted-foreground">1 commit behind</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <button className="p-4 bg-card border border-border rounded-xl hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <GitPullRequest className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Create PR</p>
              <p className="text-sm text-muted-foreground">Open pull request</p>
            </div>
          </div>
        </button>

        <button className="p-4 bg-card border border-border rounded-xl hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <ExternalLink className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">View on GitHub</p>
              <p className="text-sm text-muted-foreground">Open in browser</p>
            </div>
          </div>
        </button>

        <button className="p-4 bg-card border border-border rounded-xl hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Sync</p>
              <p className="text-sm text-muted-foreground">Push & pull</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

export default PushPullPanel