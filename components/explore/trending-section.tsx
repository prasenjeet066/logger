"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Hash, ArrowUpRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface Hashtag {
  name: string
  postsCount: number
}

interface TrendingSectionProps {
  hashtags: Hashtag[]
  onHashtagClick: (hashtag: string) => void
}

export function TrendingSection({ hashtags, onHashtagClick }: TrendingSectionProps) {
  const getTrendingBadge = (index: number) => {
    if (index === 0) return { label: "🔥 Hot", color: "bg-red-100 text-red-700" }
    if (index === 1) return { label: "⚡ Rising", color: "bg-orange-100 text-orange-700" }
    if (index === 2) return { label: "✨ Popular", color: "bg-yellow-100 text-yellow-700" }
    return { label: "📈 Trending", color: "bg-blue-100 text-blue-700" }
  }

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Trending Now</h2>
            <p className="text-gray-600">Discover what's popular today</p>
          </div>
        </div>
        <Button variant="outline" className="hidden sm:flex bg-transparent">
          View All
          <ArrowUpRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Trending Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hashtags.slice(0, 6).map((hashtag, index) => {
          const badge = getTrendingBadge(index)
          return (
            <Card
              key={index}
              className={cn(
                "group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                "border-0 bg-gradient-to-br from-white to-gray-50",
                index === 0 && "ring-2 ring-red-200 bg-gradient-to-br from-red-50 to-white",
                index === 1 && "ring-2 ring-orange-200 bg-gradient-to-br from-orange-50 to-white",
                index === 2 && "ring-2 ring-yellow-200 bg-gradient-to-br from-yellow-50 to-white",
              )}
              onClick={() => onHashtagClick(`#${hashtag.name}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-3 rounded-xl transition-colors",
                        index === 0 && "bg-red-100 group-hover:bg-red-200",
                        index === 1 && "bg-orange-100 group-hover:bg-orange-200",
                        index === 2 && "bg-yellow-100 group-hover:bg-yellow-200",
                        index > 2 && "bg-blue-100 group-hover:bg-blue-200",
                      )}
                    >
                      <Hash
                        className={cn(
                          "h-5 w-5",
                          index === 0 && "text-red-600",
                          index === 1 && "text-orange-600",
                          index === 2 && "text-yellow-600",
                          index > 2 && "text-blue-600",
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">#{index + 1}</span>
                      {index < 3 && <Sparkles className="h-4 w-4 text-yellow-500" />}
                    </div>
                  </div>
                  <Badge className={cn("text-xs font-medium", badge.color)}>{badge.label}</Badge>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    #{hashtag.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600">
                      <span className="font-semibold text-gray-900">{hashtag.postsCount.toLocaleString()}</span> posts
                    </p>
                    <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
