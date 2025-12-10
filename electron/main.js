const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs').promises
const fsSync = require('fs')
const os = require('os')

let mainWindow
let pythonProcesses = new Map()

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, '../public/icon.png'),
    show: false
  })

  // Load React app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Create menu
  createMenu()
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Repository',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send('open-repository')
        },
        {
          label: 'Initialize Repository',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => mainWindow.webContents.send('init-repository')
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Git',
      submenu: [
        {
          label: 'Commit',
          accelerator: 'CmdOrCtrl+K',
          click: () => mainWindow.webContents.send('commit-changes')
        },
        {
          label: 'Push',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow.webContents.send('push-changes')
        },
        {
          label: 'Pull',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => mainWindow.webContents.send('pull-changes')
        },
        { type: 'separator' },
        {
          label: 'Generate AI Commit',
          accelerator: 'CmdOrCtrl+Shift+K',
          click: () => mainWindow.webContents.send('generate-ai-commit')
        }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://github.com')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

async function runPythonScript(scriptName, args = [], cwd = null) {
  return new Promise((resolve, reject) => {
    const pythonPath = process.platform === 'win32' ? 'python' : 'python3'
    const scriptPath = path.join(__dirname, 'python', scriptName)

    const pythonProcess = spawn(pythonPath, [scriptPath, ...args], {
      cwd: cwd || process.cwd(),
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout)
          resolve(result)
        } catch (e) {
          resolve({ output: stdout, success: true })
        }
      } else {
        reject({ error: stderr || `Process exited with code ${code}`, success: false })
      }
    })

    pythonProcess.on('error', (error) => {
      reject({ error: error.message, success: false })
    })
  })
}

// IPC Handlers
ipcMain.handle('get-repo-status', async (event, repoPath) => {
  try {
    const status = await runPythonScript('git_operations.py', ['status', repoPath])
    return status
  } catch (error) {
    return { error: error.message, success: false }
  }
})

ipcMain.handle('init-repository', async (event, repoPath) => {
  try {
    const result = await runPythonScript('git_operations.py', ['init', repoPath])
    return result
  } catch (error) {
    return { error: error.message, success: false }
  }
})

ipcMain.handle('commit-changes', async (event, { repoPath, message, files = [] }) => {
  try {
    const result = await runPythonScript('git_operations.py', [
      'commit',
      repoPath,
      message,
      ...files
    ])
    return result
  } catch (error) {
    return { error: error.message, success: false }
  }
})

ipcMain.handle('generate-ai-commit', async (event, { repoPath, changes }) => {
  try {
    const result = await runPythonScript('ai_commit.py', [
      repoPath,
      JSON.stringify(changes)
    ])
    return result
  } catch (error) {
    return { error: error.message, success: false }
  }
})

ipcMain.handle('get-commit-history', async (event, repoPath, limit = 50) => {
  try {
    const history = await runPythonScript('git_operations.py', ['log', repoPath, limit])
    return history
  } catch (error) {
    return { error: error.message, success: false }
  }
})

ipcMain.handle('get-file-diff', async (event, { repoPath, filePath }) => {
  try {
    const diff = await runPythonScript('git_operations.py', [
      'diff',
      repoPath,
      filePath
    ])
    return diff
  } catch (error) {
    return { error: error.message, success: false }
  }
})

ipcMain.handle('push-changes', async (event, { repoPath, remote = 'origin', branch = 'main' }) => {
  try {
    const result = await runPythonScript('git_operations.py', [
      'push',
      repoPath,
      remote,
      branch
    ])
    return result
  } catch (error) {
    return { error: error.message, success: false }
  }
})

ipcMain.handle('pull-changes', async (event, { repoPath, remote = 'origin', branch = 'main' }) => {
  try {
    const result = await runPythonScript('git_operations.py', [
      'pull',
      repoPath,
      remote,
      branch
    ])
    return result
  } catch (error) {
    return { error: error.message, success: false }
  }
})

ipcMain.handle('start-file-watcher', async (event, repoPath) => {
  try {
    // Kill existing watcher for this repo if it exists
    if (pythonProcesses.has(repoPath)) {
      pythonProcesses.get(repoPath).kill()
      pythonProcesses.delete(repoPath)
    }

    const pythonPath = process.platform === 'win32' ? 'python' : 'python3'
    const scriptPath = path.join(__dirname, 'python', 'file_watcher.py')

    const pythonProcess = spawn(pythonPath, [scriptPath, repoPath], {
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
      stdio: ['pipe', 'pipe', 'pipe']
    })

    pythonProcesses.set(repoPath, pythonProcess)

    pythonProcess.stdout.on('data', (data) => {
      const changes = data.toString().trim().split('\n')
      changes.forEach(change => {
        if (change) {
          mainWindow.webContents.send('file-change-detected', change)
        }
      })
    })

    pythonProcess.stderr.on('data', (data) => {
      console.error(`File watcher error for ${repoPath}:`, data.toString())
    })

    pythonProcess.on('close', (code) => {
      pythonProcesses.delete(repoPath)
      console.log(`File watcher for ${repoPath} closed with code ${code}`)
    })

    pythonProcess.on('error', (error) => {
      console.error(`File watcher error for ${repoPath}:`, error)
      pythonProcesses.delete(repoPath)
    })

    return { success: true }
  } catch (error) {
    return { error: error.message, success: false }
  }
})

ipcMain.handle('find-git-repo', async (event, startPath) => {
  try {
    let currentPath = startPath || process.cwd()

    while (currentPath) {
      const gitPath = path.join(currentPath, '.git')
      try {
        await fs.access(gitPath)
        return { path: currentPath, success: true }
      } catch (error) {
        // .git not found, go up one directory
        const parentPath = path.dirname(currentPath)
        if (parentPath === currentPath) {
          break // Reached root
        }
        currentPath = parentPath
      }
    }

    return { path: null, success: false, error: 'No Git repository found' }
  } catch (error) {
    return { error: error.message, success: false }
  }
})

ipcMain.handle('select-directory', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Repository Directory'
    })

    if (!result.canceled && result.filePaths.length > 0) {
      return { path: result.filePaths[0], success: true }
    }

    return { path: null, success: false, error: 'No directory selected' }
  } catch (error) {
    return { error: error.message, success: false }
  }
})

ipcMain.handle('get-file-tree', async (event, repoPath) => {
  try {
    const result = await runPythonScript('git_operations.py', ['file-tree', repoPath])
    return result
  } catch (error) {
    return { error: error.message, success: false }
  }
})

ipcMain.handle('git-command', async (event, { repoPath, command, args = [] }) => {
  try {
    const result = await runPythonScript('git_operations.py', [command, repoPath, ...args])
    return result
  } catch (error) {
    return { error: error.message, success: false }
  }
})

// Add these with other IPC handlers in electron/main.js

// Stage file
ipcMain.handle('stage-file', async (event, { repoPath, filePath }) => {
  try {
    const result = await runPythonScript('git_operations.py', [
      'stage',
      repoPath,
      filePath
    ])
    return result
  } catch (error) {
    return { error: error.message, success: false }
  }
})

// Stage all files
ipcMain.handle('stage-all', async (event, repoPath) => {
  try {
    const result = await runPythonScript('git_operations.py', [
      'stage-all',
      repoPath
    ])
    return result
  } catch (error) {
    return { error: error.message, success: false }
  }
})

// Unstage file
ipcMain.handle('unstage-file', async (event, { repoPath, filePath }) => {
  try {
    const result = await runPythonScript('git_operations.py', [
      'unstage',
      repoPath,
      filePath
    ])
    return result
  } catch (error) {
    return { error: error.message, success: false }
  }
})

// Unstage all files
ipcMain.handle('unstage-all', async (event, repoPath) => {
  try {
    const result = await runPythonScript('git_operations.py', [
      'unstage-all',
      repoPath
    ])
    return result
  } catch (error) {
    return { error: error.message, success: false }
  }
})

// Add untracked file
ipcMain.handle('add-untracked-file', async (event, { repoPath, filePath }) => {
  try {
    const result = await runPythonScript('git_operations.py', [
      'add-untracked',
      repoPath,
      filePath
    ])
    return result
  } catch (error) {
    return { error: error.message, success: false }
  }
})

// Add all untracked files
ipcMain.handle('add-all-untracked', async (event, repoPath) => {
  try {
    const result = await runPythonScript('git_operations.py', [
      'add-all-untracked',
      repoPath
    ])
    return result
  } catch (error) {
    return { error: error.message, success: false }
  }
})

// Stop all Python processes on quit
app.on('before-quit', () => {
  pythonProcesses.forEach((process, repoPath) => {
    try {
      process.kill()
    } catch (error) {
      console.error(`Error killing process for ${repoPath}:`, error)
    }
  })
  pythonProcesses.clear()
})

// App lifecycle
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle file open events (for macOS)
app.on('open-file', (event, path) => {
  event.preventDefault()
  if (mainWindow) {
    mainWindow.webContents.send('open-repository-path', path)
  }
})

