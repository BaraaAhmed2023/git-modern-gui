import React, { useState, useEffect } from 'react'
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  FolderOpen,
  Search,
  PlusCircle,
  RefreshCw,
  Menu,
  X,
  Settings,
  AlertCircle
} from 'lucide-react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import RepositoryPanel from './components/RepositoryPanel'
import StatusPanel from './components/StatusPanel'
import CommitPanel from './components/CommitPanel'
import GitGraph from './components/GitGraph'
import FileDiff from './components/FileDiff'
import PushPullPanel from './components/PushPullPanel'
import AICommitModal from './components/AICommitModal'
import FileTree from './components/FileTree'
import Terminal from './components/Terminal'
import { useGit } from './hooks/useGit'

function App() {
  const [activeTab, setActiveTab] = useState('changes')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  const {
    repoPath,
    status,
    history,
    isLoading,
    error,
    initRepository,
    findGitRepo,
    selectDirectory,
    stageFile,
    stageAll,
    unstageAll,
    addAllUntracked,
    commitChanges,
    generateAICommit,
    pushChanges,
    pullChanges,
    startFileWatcher,
    stopFileWatcher,
    loadStatus
  } = useGit()

  useEffect(() => {
    if (repoPath) {
      startFileWatcher(repoPath)
    }
    return () => stopFileWatcher()
  }, [repoPath])

  const handleCommit = async (message, files) => {
    await commitChanges({ repoPath, message, files })
  }

  const handleGenerateAICommit = async () => {
    setIsAIModalOpen(true)
  }

  const handleAIGenerate = async (changes) => {
    const result = await generateAICommit({ repoPath, changes })
    if (result.success) {
      return result.message
    }
    return null
  }

  const handleStageFile = async (filePath) => {
    const result = await stageFile(filePath)
    if (result.success) {
      console.log('File staged:', filePath)
    } else {
      console.error('Failed to stage file:', result.error)
    }
  }

  const handleStageAll = async () => {
    const result = await stageAll()
    if (result.success) {
      console.log('All files staged')
    } else {
      console.error('Failed to stage all files:', result.error)
    }
  }

  const handleUnstageAll = async () => {
    const result = await unstageAll()
    if (result.success) {
      console.log('All files unstaged')
    } else {
      console.error('Failed to unstage all files:', result.error)
    }
  }

  const handleAddAll = async () => {
    const result = await addAllUntracked()
    if (result.success) {
      console.log('All untracked files added')
    } else {
      console.error('Failed to add all untracked files:', result.error)
    }
  }

  const handleRefresh = async () => {
    if (repoPath) {
      await loadStatus(repoPath)
    }
  }

  if (!repoPath) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center">
                  <GitBranch className="w-12 h-12" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <PlusCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Modern Git GUI
            </h1>
            <p className="text-gray-400 mb-8">
              A beautiful, feature-rich Git client with AI-powered commit messages
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => selectDirectory()}
                className="p-6 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors group"
              >
                <FolderOpen className="w-8 h-8 mb-3 mx-auto text-blue-400 group-hover:text-blue-300" />
                <h3 className="font-semibold mb-2">Open Repository</h3>
                <p className="text-sm text-gray-400">Open an existing Git repository</p>
              </button>

              <button
                onClick={() => initRepository()}
                className="p-6 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors group"
              >
                <GitBranch className="w-8 h-8 mb-3 mx-auto text-green-400 group-hover:text-green-300" />
                <h3 className="font-semibold mb-2">Initialize Repository</h3>
                <p className="text-sm text-gray-400">Create a new Git repository</p>
              </button>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search for Git Repositories
              </h3>
              <p className="text-gray-400 mb-4">Let us find Git repositories on your system</p>
              <button
                onClick={() => findGitRepo()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:opacity-90 transition-opacity"
              >
                Scan for Repositories
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading repository...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => selectDirectory()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Select Different Repository
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <Header
        repoPath={repoPath}
        branch={status?.branch}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onGenerateAICommit={handleGenerateAICommit}
        onRefresh={handleRefresh}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'changes' && (
              <div className="space-y-6">
                <StatusPanel
                  status={status}
                  onFileSelect={setSelectedFile}
                  onStageFile={handleStageFile}
                  onStageAll={handleStageAll}
                  onUnstageAll={handleUnstageAll}
                  onAddAll={handleAddAll}
                />
                <CommitPanel
                  onCommit={handleCommit}
                  status={status}
                  onGenerateAI={handleGenerateAICommit}
                />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <GitGraph history={history} />
              </div>
            )}

            {activeTab === 'graph' && (
              <div className="h-full">
                <GitGraph history={history} interactive={true} />
              </div>
            )}

            {activeTab === 'push-pull' && (
              <PushPullPanel
                repoPath={repoPath}
                onPush={pushChanges}
                onPull={pullChanges}
                remote={status?.remote}
                branch={status?.branch}
              />
            )}

            {activeTab === 'files' && (
              <FileTree
                repoPath={repoPath}
                onFileSelect={setSelectedFile}
              />
            )}
          </div>

          {selectedFile && (
            <div className="w-1/2 border-l border-border">
              <FileDiff
                filePath={selectedFile}
                repoPath={repoPath}
                onClose={() => setSelectedFile(null)}
              />
            </div>
          )}
        </main>
      </div>

      <Terminal repoPath={repoPath} />

      <AICommitModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onGenerate={handleAIGenerate}
        changes={[...(status?.unstaged || []), ...(status?.staged || [])]}
      />
    </div>
  )
}

export default App