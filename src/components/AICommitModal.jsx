import React, { useState } from 'react'
import {
  X,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Brain,
  MessageSquare
} from 'lucide-react'

const AICommitModal = ({ isOpen, onClose, onGenerate, changes = [] }) => {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [tone, setTone] = useState('professional')

  if (!isOpen) return null

  const handleGenerate = async () => {
    setIsGenerating(true)

    try {
      // Ensure changes is an array
      const changesArray = Array.isArray(changes) ? changes : []
      const message = await onGenerate(changesArray)
      if (message) {
        setGeneratedMessage(message)
      }
    } catch (error) {
      console.error('Failed to generate commit:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleAccept = () => {
    // You can implement what happens when the message is accepted
    onClose()
  }

  const tones = [
    { id: 'professional', label: 'Professional', emoji: '👔' },
    { id: 'concise', label: 'Concise', emoji: '⚡' },
    { id: 'detailed', label: 'Detailed', emoji: '📝' },
    { id: 'fun', label: 'Fun', emoji: '🎉' },
    { id: 'technical', label: 'Technical', emoji: '💻' },
  ]

  const commitTypes = [
    { label: '✨ Feature', value: 'feat' },
    { label: '🐛 Fix', value: 'fix' },
    { label: '📚 Docs', value: 'docs' },
    { label: '🎨 Style', value: 'style' },
    { label: '♻️ Refactor', value: 'refactor' },
    { label: '🚀 Perf', value: 'perf' },
    { label: '✅ Test', value: 'test' },
    { label: '🔧 Chore', value: 'chore' },
  ]

  // Ensure changes is an array
  const changesArray = Array.isArray(changes) ? changes : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-purple-600/10 to-blue-600/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">AI Commit Generator</h2>
                <p className="text-muted-foreground">
                  Powered by OpenRouter AI
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Changes Summary */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Changes to commit
            </h3>
            <div className="bg-muted/30 rounded-lg p-4">
              {changesArray.length > 0 ? (
                <div className="space-y-2">
                  {changesArray.slice(0, 5).map((change, index) => {
                    // Handle both object and string formats
                    const fileObj = typeof change === 'string'
                      ? { status: 'M', file: change }
                      : change

                    return (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <div className={`
                          w-2 h-2 rounded-full
                          ${fileObj.status === 'A' ? 'bg-green-500' : ''}
                          ${fileObj.status === 'M' ? 'bg-yellow-500' : ''}
                          ${fileObj.status === 'D' ? 'bg-red-500' : ''}
                        `} />
                        <span className="font-mono flex-1">{fileObj.file}</span>
                        <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                          {fileObj.status}
                        </span>
                      </div>
                    )
                  })}
                  {changesArray.length > 5 && (
                    <p className="text-sm text-muted-foreground pt-2">
                      + {changesArray.length - 5} more changes
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No changes detected</p>
              )}
            </div>
          </div>

          {/* Customization Options */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Tone</label>
              <div className="flex flex-wrap gap-2">
                {tones.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                      ${tone === t.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent'
                      }
                    `}
                  >
                    <span>{t.emoji}</span>
                    <span className="text-sm">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Commit Type</label>
              <select className="w-full p-3 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                {commitTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Prompt */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Additional Instructions (optional)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., 'Focus on the performance improvements', 'Keep it very short', etc."
              className="w-full h-24 p-3 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || changesArray.length === 0}
            className={`
              w-full py-4 rounded-lg font-semibold transition-all
              ${isGenerating || changesArray.length === 0
                ? 'bg-muted cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90'
              }
            `}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Generating commit message...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="w-5 h-5" />
                <span>Generate Commit Message</span>
              </div>
            )}
          </button>

          {/* Generated Message */}
          {generatedMessage && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Generated Message</h3>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-muted rounded-lg hover:bg-accent transition-colors"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <p className="whitespace-pre-wrap">{generatedMessage}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAccept}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Use This Message
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-1 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>Regenerate</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Using GPT-4 for best results</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Tokens used: 128</span>
              <span>Cost: $0.002</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AICommitModal