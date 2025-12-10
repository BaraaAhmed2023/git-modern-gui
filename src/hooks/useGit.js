import { useState, useEffect, useCallback } from 'react'

export const useGit = () => {
  const [repoPath, setRepoPath] = useState(null)
  const [status, setStatus] = useState({
    staged: [],
    unstaged: [],
    untracked: [],
    branch: '',
    remote: '',
    has_changes: false
  })
  const [history, setHistory] = useState({ commits: [], graph: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Initialize repository detection
  useEffect(() => {
    const findAndSetRepo = async () => {
      const result = await findGitRepo()
      if (result.success && result.path) {
        setRepoPath(result.path)
        loadStatus(result.path)
        loadHistory(result.path)
      }
    }

    findAndSetRepo()
  }, [])

  // Load repository status
  const loadStatus = useCallback(async (path) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await window.electronAPI.getRepoStatus(path || repoPath)
      if (result.success && result.status) {
        setStatus({
          staged: Array.isArray(result.status.staged) ? result.status.staged : [],
          unstaged: Array.isArray(result.status.unstaged) ? result.status.unstaged : [],
          untracked: Array.isArray(result.status.untracked) ? result.status.untracked : [],
          branch: result.status.branch || '',
          remote: result.status.remote || '',
          has_changes: result.status.has_changes || false
        })
      } else {
        setError(result.error || 'Failed to load status')
      }
    } catch (err) {
      setError(err.message)
      console.error('Error loading status:', err)
    } finally {
      setIsLoading(false)
    }
  }, [repoPath])

  // Load commit history
  const loadHistory = useCallback(async (path) => {
    try {
      const result = await window.electronAPI.getCommitHistory(path || repoPath)
      if (result.success) {
        setHistory({
          commits: Array.isArray(result.commits) ? result.commits : [],
          graph: result.graph || '',
          total: result.total || 0
        })
      }
    } catch (err) {
      console.error('Failed to load history:', err)
    }
  }, [repoPath])

  // Initialize a new repository
  const initRepository = useCallback(async (path) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await window.electronAPI.initRepository(path || repoPath)
      if (result.success) {
        setRepoPath(path || repoPath)
        await loadStatus(path || repoPath)
        return result
      } else {
        setError(result.error)
        return result
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }, [repoPath, loadStatus])

  // Find Git repository
  const findGitRepo = useCallback(async (startPath) => {
    try {
      const result = await window.electronAPI.findGitRepo(startPath)
      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // Select directory
  const selectDirectory = useCallback(async () => {
    try {
      const result = await window.electronAPI.selectDirectory()
      if (result.success && result.path) {
        setRepoPath(result.path)
        await loadStatus(result.path)
        await loadHistory(result.path)
      }
      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [loadStatus, loadHistory])

  // Stage a file
  const stageFile = useCallback(async (filePath) => {
    try {
      const result = await window.electronAPI.stageFile({
        repoPath,
        filePath
      })

      if (result.success) {
        await loadStatus(repoPath)
      }

      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [repoPath, loadStatus])

  // Stage all files
  const stageAll = useCallback(async () => {
    try {
      const result = await window.electronAPI.stageAll(repoPath)

      if (result.success) {
        await loadStatus(repoPath)
      }

      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [repoPath, loadStatus])

  // Unstage a file
  const unstageFile = useCallback(async (filePath) => {
    try {
      const result = await window.electronAPI.unstageFile({
        repoPath,
        filePath
      })

      if (result.success) {
        await loadStatus(repoPath)
      }

      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [repoPath, loadStatus])

  // Unstage all files
  const unstageAll = useCallback(async () => {
    try {
      const result = await window.electronAPI.unstageAll(repoPath)

      if (result.success) {
        await loadStatus(repoPath)
      }

      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [repoPath, loadStatus])

  // Add untracked file
  const addUntrackedFile = useCallback(async (filePath) => {
    try {
      const result = await window.electronAPI.addUntrackedFile({
        repoPath,
        filePath
      })

      if (result.success) {
        await loadStatus(repoPath)
      }

      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [repoPath, loadStatus])

  // Add all untracked files
  const addAllUntracked = useCallback(async () => {
    try {
      const result = await window.electronAPI.addAllUntracked(repoPath)

      if (result.success) {
        await loadStatus(repoPath)
      }

      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [repoPath, loadStatus])

  // Commit changes
  const commitChanges = useCallback(async ({ repoPath: path, message, files = [] }) => {
    try {
      const result = await window.electronAPI.commitChanges({
        repoPath: path || repoPath,
        message,
        files
      })

      if (result.success) {
        // Refresh status after commit
        await loadStatus(path || repoPath)
        await loadHistory(path || repoPath)
      }

      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [repoPath, loadStatus, loadHistory])

  // Generate AI commit message
  const generateAICommit = useCallback(async ({ repoPath: path, changes }) => {
    try {
      const result = await window.electronAPI.generateAICommit({
        repoPath: path || repoPath,
        changes
      })
      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [repoPath])

  // Push changes
  const pushChanges = useCallback(async (data) => {
    try {
      const result = await window.electronAPI.pushChanges({
        repoPath: data.repoPath || repoPath,
        ...data
      })

      if (result.success) {
        await loadStatus(data.repoPath || repoPath)
      }

      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [repoPath, loadStatus])

  // Pull changes
  const pullChanges = useCallback(async (data) => {
    try {
      const result = await window.electronAPI.pullChanges({
        repoPath: data.repoPath || repoPath,
        ...data
      })

      if (result.success) {
        await loadStatus(data.repoPath || repoPath)
        await loadHistory(data.repoPath || repoPath)
      }

      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [repoPath, loadStatus, loadHistory])

  // Get file diff
  const getFileDiff = useCallback(async ({ repoPath: path, filePath }) => {
    try {
      const result = await window.electronAPI.getFileDiff({
        repoPath: path || repoPath,
        filePath
      })
      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [repoPath])

  // Start file watcher
  const startFileWatcher = useCallback(async (path) => {
    try {
      const result = await window.electronAPI.startFileWatcher(path || repoPath)
      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [repoPath])

  // Stop file watcher
  const stopFileWatcher = useCallback(() => {
    console.log('Stopping file watcher')
  }, [])

  // Refresh all data
  const refreshAll = useCallback(async () => {
    if (repoPath) {
      await Promise.all([
        loadStatus(repoPath),
        loadHistory(repoPath)
      ])
    }
  }, [repoPath, loadStatus, loadHistory])

  return {
    // State
    repoPath,
    setRepoPath,
    status,
    history,
    isLoading,
    error,

    // Actions
    initRepository,
    findGitRepo,
    selectDirectory,
    stageFile,
    stageAll,
    unstageFile,
    unstageAll,
    addUntrackedFile,
    addAllUntracked,
    commitChanges,
    generateAICommit,
    pushChanges,
    pullChanges,
    getFileDiff,
    startFileWatcher,
    stopFileWatcher,
    refreshAll,

    // Utilities
    loadStatus,
    loadHistory
  }
}