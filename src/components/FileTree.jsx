import React, { useState, useEffect } from 'react'
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Search,
  FolderPlus,
  FilePlus,
  MoreVertical,
  GitBranch,
  RefreshCw,
  GitCommit,
  AlertCircle
} from 'lucide-react'

const FileTree = ({ repoPath, onFileSelect }) => {
  const [expandedFolders, setExpandedFolders] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [gitStatus, setGitStatus] = useState({})

  useEffect(() => {
    if (repoPath) {
      loadFileTree()
      loadGitStatus()
    }
  }, [repoPath])

  const loadFileTree = async () => {
    setLoading(true)
    setError(null)
    try {
      const fileList = await window.electronAPI.getRepoStatus(repoPath)
      if (fileList.success) {
        // Build tree structure from file paths
        const tree = buildTree(fileList.status?.unstaged || [])
        setFiles(tree)
      }
    } catch (err) {
      setError('Failed to load file tree')
      console.error('Error loading file tree:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadGitStatus = async () => {
    try {
      const status = await window.electronAPI.getRepoStatus(repoPath)
      if (status.success) {
        // Create a map of file statuses
        const statusMap = {}
        ;[...(status.status?.staged || []), ...(status.status?.unstaged || [])].forEach(item => {
          statusMap[item.file] = item.status
        })
        setGitStatus(statusMap)
      }
    } catch (err) {
      console.error('Error loading git status:', err)
    }
  }

  const buildTree = (fileList) => {
    const root = { name: repoPath.split('/').pop() || 'repository', type: 'folder', children: [] }

    fileList.forEach(item => {
      const parts = item.file.split('/')
      let currentLevel = root.children

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1
        let existingNode = currentLevel.find(node => node.name === part)

        if (!existingNode) {
          const newNode = {
            name: part,
            type: isFile ? 'file' : 'folder',
            path: parts.slice(0, index + 1).join('/'),
            status: item.status,
            children: isFile ? null : []
          }
          currentLevel.push(newNode)
          existingNode = newNode
        }

        if (!isFile) {
          currentLevel = existingNode.children
        }
      })
    })

    return root
  }

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'A': return 'bg-git-added/20 text-git-added border-git-added/30'
      case 'M': return 'bg-git-modified/20 text-git-modified border-git-modified/30'
      case 'D': return 'bg-git-deleted/20 text-git-deleted border-git-deleted/30'
      case 'R': return 'bg-git-renamed/20 text-git-renamed border-git-renamed/30'
      case '??': return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'A': return <FilePlus className="w-3 h-3" />
      case 'M': return <GitCommit className="w-3 h-3" />
      case 'D': return <AlertCircle className="w-3 h-3" />
      case 'R': return <GitBranch className="w-3 h-3" />
      case '??': return <File className="w-3 h-3" />
      default: return <File className="w-3 h-3" />
    }
  }

  const renderTree = (node, depth = 0) => {
    if (!node) return null

    const isExpanded = expandedFolders[node.path || node.name]
    const isFolder = node.type === 'folder'
    const hasChildren = node.children && node.children.length > 0
    const paddingLeft = depth * 20 + (isFolder ? 0 : 20)

    if (searchQuery &&
        !node.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !isFolder && !hasChildren) {
      return null
    }

    return (
      <div key={node.path || node.name}>
        <div
          className={`
            flex items-center gap-2 py-1.5 px-3 cursor-pointer
            hover:bg-accent transition-colors group
            ${isFolder ? 'font-medium' : 'font-normal'}
          `}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(node.path || node.name)
            } else {
              onFileSelect(node.path)
            }
          }}
        >
          {isFolder ? (
            <>
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                )
              ) : (
                <div className="w-3" />
              )}
              <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="truncate flex-1">{node.name}</span>
              {hasChildren && (
                <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded flex-shrink-0">
                  {node.children.length}
                </span>
              )}
            </>
          ) : (
            <>
              <File className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="truncate flex-1">{node.name}</span>
              {node.status && (
                <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${getStatusColor(node.status)}`}>
                  {getStatusIcon(node.status)}
                  <span>{node.status}</span>
                </div>
              )}
            </>
          )}

          <button
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              // Handle file actions
            }}
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>

        {isFolder && isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    )
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
        <h3 className="font-semibold mb-2">Error Loading Files</h3>
        <p className="text-muted-foreground text-center mb-4">{error}</p>
        <button
          onClick={loadFileTree}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Folder className="w-5 h-5" />
            File Explorer
          </h3>
          <button
            onClick={loadFileTree}
            className="p-1.5 hover:bg-accent rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-4 py-2 bg-muted/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b border-border">
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-git-added" />
            <span>Added</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-git-modified" />
            <span>Modified</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-git-deleted" />
            <span>Deleted</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Untracked</span>
          </div>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {files.children && files.children.length > 0 ? (
          renderTree(files)
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <Folder className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Files Found</h3>
            <p className="text-muted-foreground text-center">
              This repository doesn't have any modified files.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{files.children?.length || 0} files</span>
          <button
            onClick={() => {
              setExpandedFolders({})
              loadFileTree()
            }}
            className="text-xs hover:text-foreground transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>
    </div>
  )
}

export default FileTree