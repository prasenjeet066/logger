"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TrendingHashtags() {
  const [trendingTags, setTrendingTags] = useState<{ tag: string; posts: number }[]>([])

  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch("/api/hashtags/trending")
        const data = await res.json()
        setTrendingTags(data)
      } catch (error) {
        console.error("Failed to load trending hashtags", error)
      }
    }
    fetchTags()
  }, [])

  return (
    <Card className="bengali-font">
      <CardHeader>
        <CardTitle className="text-lg">কী ঘটছে</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {trendingTags.map((item, index) => (
          <div key={item.tag} className="cursor-pointer hover:bg-gray-50 p-2 rounded">
            <div className="text-sm text-gray-500">ট্রেন্ডিং #{index + 1}</div>
            <div className="font-semibold">#{item.tag}</div>
            <div className="text-sm text-gray-500">{item.posts.toLocaleString()} পোস্ট</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}