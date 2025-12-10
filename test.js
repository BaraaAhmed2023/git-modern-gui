// test.js
const { spawn } = require('child_process')
const path = require('path')

function testPythonScript() {
  const pythonPath = process.platform === 'win32' ? 'python' : 'python3'
  const scriptPath = path.join(__dirname, 'electron/python/git_operations.py')

  const pythonProcess = spawn(pythonPath, [scriptPath, 'status', __dirname], {
    cwd: __dirname,
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
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
    console.log('Exit code:', code)
    console.log('STDOUT:', stdout)
    console.log('STDERR:', stderr)

    try {
      const result = JSON.parse(stdout)
      console.log('Parsed result:', result)
    } catch (e) {
      console.log('Failed to parse JSON:', e.message)
    }
  })
}

testPythonScript()