export interface YouTubeAccount {
  id: string
  channelName: string
  email: string
  status: 'active' | 'suspended' | 'pending'
  subscriberCount: number
  videoCount: number
  lastSync: string
  avatar?: string
}

export interface Video {
  id: string
  title: string
  status: 'draft' | 'processing' | 'published' | 'failed'
  channelId: string
  channelName: string
  views: number
  likes: number
  comments: number
  publishedAt?: string
  thumbnail?: string
  duration: string
}

export interface AnalyticsData {
  date: string
  views: number
  subscribers: number
  revenue: number
  watchTime: number
}

export interface User {
  id: string
  email: string
  name: string
  plan: 'free' | 'pro' | 'enterprise'
  apiKey?: string
  settings: UserSettings
}

export interface UserSettings {
  defaultVideoSettings: {
    privacy: 'public' | 'private' | 'unlisted'
    category: string
    language: string
    allowComments: boolean
  }
  notifications: {
    email: boolean
    push: boolean
    videoPublished: boolean
    accountIssues: boolean
  }
}
