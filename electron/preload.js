const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Repository operations
  getRepoStatus: (repoPath) => ipcRenderer.invoke('get-repo-status', repoPath),
  initRepository: (repoPath) => ipcRenderer.invoke('init-repository', repoPath),
  findGitRepo: (startPath) => ipcRenderer.invoke('find-git-repo', startPath),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getFileTree: (repoPath) => ipcRenderer.invoke('get-file-tree', repoPath),

  // Git operations
  commitChanges: (data) => ipcRenderer.invoke('commit-changes', data),
  generateAICommit: (data) => ipcRenderer.invoke('generate-ai-commit', data),
  getCommitHistory: (repoPath, limit) => ipcRenderer.invoke('get-commit-history', repoPath, limit),
  getFileDiff: (data) => ipcRenderer.invoke('get-file-diff', data),
  pushChanges: (data) => ipcRenderer.invoke('push-changes', data),
  pullChanges: (data) => ipcRenderer.invoke('pull-changes', data),
  gitCommand: (data) => ipcRenderer.invoke('git-command', data),

  // File watching
  startFileWatcher: (repoPath) => ipcRenderer.invoke('start-file-watcher', repoPath),

  // Events
  onFileChange: (callback) => {
    ipcRenderer.on('file-change-detected', callback)
    return () => ipcRenderer.removeListener('file-change-detected', callback)
  },
  onOpenRepository: (callback) => ipcRenderer.on('open-repository', callback),
  onInitRepository: (callback) => ipcRenderer.on('init-repository', callback),
  onCommitChanges: (callback) => ipcRenderer.on('commit-changes', callback),
  onPushChanges: (callback) => ipcRenderer.on('push-changes', callback),
  onPullChanges: (callback) => ipcRenderer.on('pull-changes', callback),
  onGenerateAICommit: (callback) => ipcRenderer.on('generate-ai-commit', callback),
  onOpenRepositoryPath: (callback) => ipcRenderer.on('open-repository-path', callback),
  stageFile: (data) => ipcRenderer.invoke('stage-file', data),
stageAll: (repoPath) => ipcRenderer.invoke('stage-all', repoPath),
unstageFile: (data) => ipcRenderer.invoke('unstage-file', data),
unstageAll: (repoPath) => ipcRenderer.invoke('unstage-all', repoPath),
addUntrackedFile: (data) => ipcRenderer.invoke('add-untracked-file', data),
addAllUntracked: (repoPath) => ipcRenderer.invoke('add-all-untracked', repoPath),

  // Remove listeners
  removeFileChangeListener: (callback) => {
    if (callback) {
      ipcRenderer.removeListener('file-change-detected', callback)
    } else {
      ipcRenderer.removeAllListeners('file-change-detected')
    }
  }
})