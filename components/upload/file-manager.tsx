"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { blobStorage, type BlobFile } from "@/lib/blob/client"
import { Search, Trash2, Download, Eye, RefreshCw, Grid, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface FileManagerProps {
  pathPrefix?: string
  onFileSelect?: (file: BlobFile) => void
  selectable?: boolean
  className?: string
}

type ViewMode = "grid" | "list"
type SortBy = "name" | "size" | "date" | "type"

export function FileManager({ pathPrefix = "", onFileSelect, selectable = false, className }: FileManagerProps) {
  const [files, setFiles] = useState<BlobFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<BlobFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sortBy, setSortBy] = useState<SortBy>("date")
  const [filterType, setFilterType] = useState<string>("all")

  const loadFiles = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await blobStorage.listFiles({
        prefix: pathPrefix,
        limit: 100,
      })
      setFiles(result.blobs)
      setFilteredFiles(result.blobs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files")
    } finally {
      setLoading(false)
    }
  }, [pathPrefix])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  useEffect(() => {
    let filtered = files

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((file) => file.pathname.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((file) => {
        if (filterType === "images") {
          return file.contentType.startsWith("image/")
        }
        if (filterType === "videos") {
          return file.contentType.startsWith("video/")
        }
        return true
      })
    }

    // Sort files
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.pathname.localeCompare(b.pathname)
        case "size":
          return b.size - a.size
        case "date":
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        case "type":
          return a.contentType.localeCompare(b.contentType)
        default:
          return 0
      }
    })

    setFilteredFiles(filtered)
  }, [files, searchTerm, filterType, sortBy])

  const handleFileSelect = useCallback(
    (file: BlobFile) => {
      if (selectable) {
        setSelectedFiles((prev) => {
          const newSet = new Set(prev)
          if (newSet.has(file.url)) {
            newSet.delete(file.url)
          } else {
            newSet.add(file.url)
          }
          return newSet
        })
      }
      onFileSelect?.(file)
    },
    [selectable, onFileSelect],
  )

  const handleDeleteSelected = useCallback(async () => {
    if (selectedFiles.size === 0) return

    try {
      await blobStorage.deleteMultipleFiles(Array.from(selectedFiles))
      setSelectedFiles(new Set())
      await loadFiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete files")
    }
  }, [selectedFiles, loadFiles])

  const handleDownload = useCallback((file: BlobFile) => {
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.pathname.split("/").pop() || "download"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileTypeColor = (contentType: string): string => {
    if (contentType.startsWith("image/")) return "bg-blue-100 text-blue-800"
    if (contentType.startsWith("video/")) return "bg-purple-100 text-purple-800"
    return "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading files...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>File Manager</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={loadFiles}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Files</option>
            <option value="images">Images</option>
            <option value="videos">Videos</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
            <option value="type">Sort by Type</option>
          </select>
        </div>

        {/* Actions */}
        {selectable && selectedFiles.size > 0 && (
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
            <span className="text-sm font-medium">{selectedFiles.size} file(s) selected</span>
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || filterType !== "all" ? "No files match your criteria" : "No files found"}
          </div>
        ) : (
          <div
            className={cn(
              viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2",
            )}
          >
            {filteredFiles.map((file) => (
              <div
                key={file.url}
                className={cn(
                  "border rounded-lg overflow-hidden transition-colors",
                  selectable && selectedFiles.has(file.url) && "ring-2 ring-blue-500",
                  selectable && "cursor-pointer hover:bg-gray-50",
                  viewMode === "list" && "flex items-center p-3",
                )}
                onClick={() => handleFileSelect(file)}
              >
                {viewMode === "grid" ? (
                  <>
                    {/* Grid View */}
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      {file.contentType.startsWith("image/") ? (
                        <img
                          src={file.url || "/placeholder.svg"}
                          alt={file.pathname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400">{file.contentType.startsWith("video/") ? "🎥" : "📄"}</div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate" title={file.pathname}>
                        {file.pathname.split("/").pop()}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={getFileTypeColor(file.contentType)}>{file.contentType.split("/")[0]}</Badge>
                        <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* List View */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded flex items-center justify-center mr-3">
                      {file.contentType.startsWith("image/") ? (
                        <img
                          src={file.url || "/placeholder.svg"}
                          alt={file.pathname}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="text-gray-400">{file.contentType.startsWith("video/") ? "🎥" : "📄"}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={file.pathname}>
                        {file.pathname.split("/").pop()}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getFileTypeColor(file.contentType)}>{file.contentType.split("/")[0]}</Badge>
                        <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(file.url, "_blank")
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(file)
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
