"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, X, Clock, TrendingUp, Hash, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchSectionProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onSearch: (query: string) => void
  searchHistory: string[]
  onClearHistory: () => void
  suggestions: string[]
  showSuggestions: boolean
  onSuggestionClick: (suggestion: string) => void
  isLoading: boolean
}

export function SearchSection({
  searchQuery,
  onSearchChange,
  onSearch,
  searchHistory,
  onClearHistory,
  suggestions,
  showSuggestions,
  onSuggestionClick,
  isLoading,
}: SearchSectionProps) {
  const [isFocused, setIsFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const trendingSearches = ["#technology", "#design", "#programming", "#ai", "#webdev"]

  return (
    <div className="relative" ref={searchRef}>
      {/* Main Search Bar */}
      <div className="relative">
        <div
          className={cn(
            "relative flex items-center transition-all duration-200",
            isFocused ? "ring-2 ring-blue-500 ring-offset-2" : "",
            "bg-white rounded-xl border shadow-sm hover:shadow-md",
          )}
        >
          <Search className="absolute left-4 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search for people, posts, hashtags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyPress={(e) => e.key === "Enter" && onSearch(searchQuery)}
            className="pl-12 pr-20 py-6 text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("")}
              className="absolute right-16 h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={() => onSearch(searchQuery)}
            disabled={isLoading || !searchQuery.trim()}
            className="absolute right-2 h-10 px-6 bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : "Search"}
          </Button>
        </div>

        {/* Search Suggestions Dropdown */}
        {isFocused && (showSuggestions || searchHistory.length > 0) && (
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto shadow-lg border-0 ring-1 ring-gray-200">
            <CardContent className="p-0">
              {/* Recent Searches */}
              {searchHistory.length > 0 && (
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recent Searches
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearHistory}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {searchHistory.slice(0, 5).map((item, index) => (
                      <button
                        key={index}
                        onClick={() => onSuggestionClick(item)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Clock className="h-3 w-3 text-gray-400" />
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Suggestions */}
              {suggestions.length > 0 && (
                <div className="p-4 border-b">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Suggestions
                  </h4>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => onSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <User className="h-3 w-3 text-gray-400" />@{suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              <div className="p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </h4>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((trend, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors"
                      onClick={() => onSuggestionClick(trend)}
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      {trend.replace("#", "")}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
