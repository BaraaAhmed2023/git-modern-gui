// Utility functions for Git operations

export const parseGitStatus = (statusOutput) => {
  if (!statusOutput) return { staged: [], unstaged: [], untracked: [] }

  const lines = statusOutput.split('\n')
  const staged = []
  const unstaged = []
  const untracked = []

  let mode = 'none' // 'staged', 'unstaged', 'untracked'

  lines.forEach(line => {
    if (line.startsWith('Changes to be committed:')) {
      mode = 'staged'
    } else if (line.startsWith('Changes not staged for commit:')) {
      mode = 'unstaged'
    } else if (line.startsWith('Untracked files:')) {
      mode = 'untracked'
    } else if (line.trim() === '' || line.includes('(use "git')) {
      mode = 'none'
    } else if (mode !== 'none') {
      const match = line.match(/^\s*([AMD?R])\s+(.*)/)
      if (match) {
        const [, status, file] = match
        const item = { status, file: file.trim() }

        switch (mode) {
          case 'staged':
            staged.push(item)
            break
          case 'unstaged':
            unstaged.push(item)
            break
          case 'untracked':
            untracked.push({ status: '??', file: line.trim() })
            break
        }
      }
    }
  })

  return { staged, unstaged, untracked }
}

export const parseGitLog = (logOutput) => {
  if (!logOutput) return []

  const commits = []
  const lines = logOutput.split('\n')
  let currentCommit = null

  lines.forEach(line => {
    if (line.startsWith('commit ')) {
      if (currentCommit) {
        commits.push(currentCommit)
      }
      currentCommit = {
        hash: line.substring(7).trim(),
        short_hash: line.substring(7, 14).trim(),
        author: '',
        email: '',
        date: '',
        subject: '',
        body: ''
      }
    } else if (line.startsWith('Author:')) {
      const authorMatch = line.match(/Author:\s+(.+?)\s+<(.+?)>/)
      if (authorMatch) {
        currentCommit.author = authorMatch[1]
        currentCommit.email = authorMatch[2]
      }
    } else if (line.startsWith('Date:')) {
      currentCommit.date = line.substring(5).trim()
    } else if (line.trim() && !line.startsWith('    ')) {
      if (!currentCommit.subject) {
        currentCommit.subject = line.trim()
      }
    } else if (line.startsWith('    ') && currentCommit.subject) {
      if (!currentCommit.body) {
        currentCommit.body = line.substring(4).trim()
      } else {
        currentCommit.body += '\n' + line.substring(4).trim()
      }
    }
  })

  if (currentCommit) {
    commits.push(currentCommit)
  }

  return commits
}

export const parseGitDiff = (diffOutput) => {
  if (!diffOutput) return []

  const chunks = []
  const lines = diffOutput.split('\n')
  let currentChunk = null

  lines.forEach(line => {
    if (line.startsWith('@@')) {
      if (currentChunk) {
        chunks.push(currentChunk)
      }

      const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/)
      if (match) {
        const [, oldStart, oldCount, newStart, newCount] = match
        currentChunk = {
          header: line,
          oldStart: parseInt(oldStart),
          oldCount: oldCount ? parseInt(oldCount) : 1,
          newStart: parseInt(newStart),
          newCount: newCount ? parseInt(newCount) : 1,
          lines: []
        }
      }
    } else if (currentChunk) {
      const type = line.startsWith('+') ? 'added' :
                  line.startsWith('-') ? 'removed' :
                  line.startsWith(' ') ? 'context' : 'info'

      currentChunk.lines.push({
        type,
        content: line,
        original: line.substring(1)
      })
    }
  })

  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks
}

export const getStatusColor = (status) => {
  switch (status) {
    case 'A': return { bg: 'bg-git-added/10', text: 'text-git-added', border: 'border-git-added' }
    case 'M': return { bg: 'bg-git-modified/10', text: 'text-git-modified', border: 'border-git-modified' }
    case 'D': return { bg: 'bg-git-deleted/10', text: 'text-git-deleted', border: 'border-git-deleted' }
    case 'R': return { bg: 'bg-git-renamed/10', text: 'text-git-renamed', border: 'border-git-renamed' }
    case '??': return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500' }
    default: return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' }
  }
}

export const getStatusIcon = (status) => {
  switch (status) {
    case 'A': return '➕'
    case 'M': return '✏️'
    case 'D': return '🗑️'
    case 'R': return '📝'
    case '??': return '📄'
    default: return '📄'
  }
}

export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ')
}