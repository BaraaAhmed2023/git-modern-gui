import { useState, useEffect, useCallback } from 'react'

export const useFileWatcher = () => {
  const [fileChanges, setFileChanges] = useState([])
  const [isWatching, setIsWatching] = useState(false)

  const startWatching = useCallback(async (repoPath) => {
    try {
      const result = await window.electronAPI.startFileWatcher(repoPath)
      if (result.success) {
        setIsWatching(true)

        // Listen for file change events
        const handleFileChange = (event, change) => {
          try {
            const changeData = typeof change === 'string' ? JSON.parse(change) : change
            setFileChanges(prev => {
              const newChange = {
                path: changeData.path || 'unknown',
                timestamp: changeData.timestamp || new Date().toISOString(),
                type: changeData.event || 'modified',
                git_status: changeData.git_status || '??'
              }
              return [newChange, ...prev.slice(0, 9)] // Keep last 10 changes
            })
          } catch (e) {
            console.error('Error parsing file change:', e)
          }
        }

        window.electronAPI.onFileChange(handleFileChange)

        // Return cleanup function
        return () => {
          window.electronAPI.removeFileChangeListener(handleFileChange)
        }
      }
      return result
    } catch (error) {
      console.error('Failed to start file watcher:', error)
      return { success: false, error: error.message }
    }
  }, [])

  const stopWatching = useCallback(() => {
    setIsWatching(false)
    setFileChanges([])
  }, [])

  const clearChanges = useCallback(() => {
    setFileChanges([])
  }, [])

  return {
    fileChanges,
    isWatching,
    startWatching,
    stopWatching,
    clearChanges
  }
}