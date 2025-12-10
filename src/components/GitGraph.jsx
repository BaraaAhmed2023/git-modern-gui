import React, { useRef, useEffect, useState } from 'react'
import {
  GitBranch,
  GitCommit,
  Users,
  Calendar,
  MessageSquare,
  Code,
  ChevronRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const GitGraph = ({ history, interactive = false }) => {
  const canvasRef = useRef(null)
  const [selectedCommit, setSelectedCommit] = useState(null)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    if (!history?.commits || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Draw graph
    drawGraph(ctx, rect.width, rect.height)
  }, [history, zoom])

  const drawGraph = (ctx, width, height) => {
    const commits = history?.commits || []
    const nodeRadius = 6 * zoom
    const nodeSpacing = 80 * zoom
    const branchWidth = 40 * zoom

    ctx.lineWidth = 2
    ctx.lineCap = 'round'

    // Draw branches and connections
    commits.forEach((commit, index) => {
      const x = width - 100
      const y = 100 + (index * nodeSpacing)

      // Draw branch lines
      ctx.strokeStyle = 'hsl(var(--muted-foreground) / 0.3)'
      ctx.beginPath()
      ctx.moveTo(50, y)
      ctx.lineTo(x - 20, y)
      ctx.stroke()

      // Draw node
      ctx.fillStyle = selectedCommit?.hash === commit.hash
        ? 'hsl(var(--primary))'
        : 'hsl(var(--accent))'

      ctx.beginPath()
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2)
      ctx.fill()

      // Draw hover effect
      if (selectedCommit?.hash === commit.hash) {
        ctx.strokeStyle = 'hsl(var(--primary))'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(x, y, nodeRadius + 3, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Draw connection to next commit
      if (index < commits.length - 1) {
        const nextY = 100 + ((index + 1) * nodeSpacing)
        ctx.strokeStyle = 'hsl(var(--muted-foreground) / 0.2)'
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(x, y + nodeRadius)
        ctx.lineTo(x, nextY - nodeRadius)
        ctx.stroke()
        ctx.setLineDash([])
      }
    })
  }

  if (!history?.commits?.length) {
    return (
      <div className="h-full flex items-center justify-center bg-card rounded-xl border border-border">
        <div className="text-center">
          <GitCommit className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Commits Yet</h3>
          <p className="text-muted-foreground">
            Make your first commit to see the graph
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex gap-6">
      {/* Commit List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          {history.commits.map((commit, index) => (
            <div
              key={commit.hash}
              onClick={() => setSelectedCommit(commit)}
              className={`
                bg-card rounded-xl border p-6 cursor-pointer transition-all
                ${selectedCommit?.hash === commit.hash
                  ? 'border-primary shadow-lg'
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              <div className="flex items-start gap-4">
                {/* Graph Line */}
                <div className="flex flex-col items-center pt-2">
                  <div className={`
                    w-3 h-3 rounded-full
                    ${index === 0 ? 'bg-green-500' : 'bg-primary'}
                  `} />
                  {index < history.commits.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-1" />
                  )}
                </div>

                {/* Commit Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{commit.author}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(commit.date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {commit.short_hash}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium mb-2">{commit.subject}</h3>

                  {commit.body && (
                    <p className="text-muted-foreground mb-4">{commit.body}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(commit.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>3 comments</span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graph Visualization */}
      <div className="w-1/3">
        <div className="sticky top-6 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold">Commit Graph</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="px-3 py-1 bg-muted rounded"
              >
                +
              </button>
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="px-3 py-1 bg-muted rounded"
              >
                -
              </button>
            </div>
          </div>

          <div className="relative h-96">
            <canvas
              ref={canvasRef}
              className="w-full h-full rounded-lg border border-border"
            />

            {/* Overlay info */}
            {selectedCommit && (
              <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm">{selectedCommit.short_hash}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(selectedCommit.date), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm font-medium">{selectedCommit.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedCommit.author}</p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Commit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>HEAD</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 bg-border ml-1" />
              <span>Parent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 bg-border ml-1" style={{ borderStyle: 'dashed' }} />
              <span>Child</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GitGraph