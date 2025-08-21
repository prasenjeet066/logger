// utils/text-highlighter.ts
//import {Link} from 'lucide-react'
export interface HighlightConfig {
  hashtags?: {
    color?: string
    fontWeight?: string
    className?: string
  }
  mentions?: {
    color?: string
    fontWeight?: string
    className?: string
  }
  urls?: {
    color?: string
    textDecoration?: string
    className?: string
    target?: string
    rel?: string
  }
}

const DEFAULT_CONFIG: HighlightConfig = {
  hashtags: {
    color: '#1DA1F2',
    fontWeight: 'bold',
    className: 'hashtag'
  },
  mentions: {
    color: '#1DA1F2',
    fontWeight: 'bold',
    className: 'mention'
  },
  urls: {
    color: '#1DA1F2',
    textDecoration: 'underline',
    className: 'url-link',
    target: '_blank',
    rel: 'noopener noreferrer'
  }
}

/**
 * Highlights hashtags, mentions, and URLs in text content
 * @param text - The text content to highlight
 * @param config - Configuration for highlighting styles
 * @returns HTML string with highlighted content
 */
export function highlightText(text: string, config: HighlightConfig = {}): string {
  const mergedConfig = {
    hashtags: { ...DEFAULT_CONFIG.hashtags, ...config.hashtags },
    mentions: { ...DEFAULT_CONFIG.mentions, ...config.mentions },
    urls: { ...DEFAULT_CONFIG.urls, ...config.urls }
  }
  
  // Escape HTML to prevent XSS
  const div = document.createElement('div')
  div.textContent = text
  let escapedText = div.innerHTML
  
  // Highlight URLs first (to avoid conflicts with # and @ in URLs)
  escapedText = highlightUrls(escapedText, mergedConfig.urls!)
  
  // Highlight hashtags (supports Bengali/English alphanumeric and underscores)
  escapedText = highlightHashtags(escapedText, mergedConfig.hashtags!)
  
  // Highlight mentions
  escapedText = highlightMentions(escapedText, mergedConfig.mentions!)
  
  return escapedText
}

/**
 * Highlights URLs in text
 */
function highlightUrls(text: string, config: NonNullable<HighlightConfig['urls']>): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  
  return text.replace(urlRegex, (match) => {
    const styles = buildInlineStyles({
      color: config.color,
      'text-decoration': config.textDecoration
    })
    
    const attributes = [
      `href="${match}"`,
      config.target && `target="${config.target}"`,
      config.rel && `rel="${config.rel}"`,
      config.className && `class="${config.className}"`,
      styles && `style="${styles}"`
    ].filter(Boolean).join(' ')
    
    return `<a ${attributes}>${match}</a>`
  })
}

/**
 * Highlights hashtags in text (supports Bengali and English)
 */
function highlightHashtags(text: string, config: NonNullable<HighlightConfig['hashtags']>): string {
  // Regex for hashtags: # followed by Bengali characters, English alphanumeric, or underscores
  const hashtagRegex = /#([a-zA-Z0-9_\u0980-\u09FF]+)/g
  
  return text.replace(hashtagRegex, (match, hashtag) => {
    const styles = buildInlineStyles({
      color: config.color,
      'font-weight': config.fontWeight
    })
    
    const attributes = [
      `href="/explore?tag=${encodeURIComponent(hashtag.toLowerCase())}"`,
      `data-hashtag="${hashtag.toLowerCase()}"`,
      `role="link"`,
      `aria-label="Hashtag ${hashtag}"`,
      `class="${config.className || ''}"`,
      styles && `style="${styles}"`
    ].filter(Boolean).join(' ')
    
    return `<a ${attributes}>${match}</a>`
  })
}

/**
 * Highlights mentions in text
 */
function highlightMentions(text: string, config: NonNullable<HighlightConfig['mentions']>): string {
  // Regex for mentions: @ followed by alphanumeric characters and underscores
  const mentionRegex = /@([a-zA-Z0-9_]+)/g
  
  return text.replace(mentionRegex, (match, username) => {
    const styles = buildInlineStyles({
      color: config.color,
      'font-weight': config.fontWeight
    })
    
    const attributes = [
      `href="/profile/${encodeURIComponent(username.toLowerCase())}"`,
      `data-mention="${username.toLowerCase()}"`,
      `role="link"`,
      `aria-label="Mention ${username}"`,
      `class="${config.className || ''}"`,
      styles && `style="${styles}"`
    ].filter(Boolean).join(' ')
    
    return `<a ${attributes}>${match}</a>`
  })
}

/**
 * Builds inline CSS styles from an object
 */
function buildInlineStyles(styles: Record<string, string | undefined>): string {
  return Object.entries(styles)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ')
}

/**
 * Extracts hashtags from text
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#([a-zA-Z0-9_\u0980-\u09FF]+)/g
  const matches = text.match(hashtagRegex)
  return matches ? matches.map(tag => tag.toLowerCase()) : []
}

/**
 * Extracts mentions from text
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g
  const matches = text.match(mentionRegex)
  return matches ? matches.map(mention => mention.substring(1).toLowerCase()) : []
}

/**
 * Extracts URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const matches = text.match(urlRegex)
  return matches ? matches : []
}

/**
 * React hook for text highlighting
 */
export function useTextHighlighter(config?: HighlightConfig) {
  const highlight = (text: string) => highlightText(text, config)
  
  const extract = (text: string) => ({
    hashtags: extractHashtags(text),
    mentions: extractMentions(text),
    urls: extractUrls(text)
  })
  
  return { highlight, extract }
}

/**
 * Validates if text contains valid hashtags, mentions, or URLs
 */
export function validateTextContent(text: string): {
  hasValidHashtags: boolean
  hasValidMentions: boolean
  hasValidUrls: boolean
  invalidPatterns: string[]
} {
  const hashtags = extractHashtags(text)
  const mentions = extractMentions(text)
  const urls = extractUrls(text)
  const invalidPatterns: string[] = []
  
  // Check for invalid hashtags (too short)
  const invalidHashtags = hashtags.filter(tag => tag.length < 2)
  if (invalidHashtags.length > 0) {
    invalidPatterns.push(...invalidHashtags)
  }
  
  // Check for invalid mentions (too short)
  const invalidMentions = mentions.filter(mention => mention.length < 2)
  if (invalidMentions.length > 0) {
    invalidPatterns.push(...invalidMentions.map(m => `@${m}`))
  }
  
  return {
    hasValidHashtags: hashtags.length > 0 && invalidHashtags.length === 0,
    hasValidMentions: mentions.length > 0 && invalidMentions.length === 0,
    hasValidUrls: urls.length > 0,
    invalidPatterns
  }
}