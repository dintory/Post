export const DEFAULT_AVATAR = `data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23FF4500'/%3E%3Cellipse cx='50' cy='42' rx='22' ry='20' fill='%23fff'/%3E%3Ccircle cx='40' cy='40' r='5' fill='%23FF4500'/%3E%3Ccircle cx='60' cy='40' r='5' fill='%23FF4500'/%3E%3Ccircle cx='40' cy='40' r='2.5' fill='%23333'/%3E%3Ccircle cx='60' cy='40' r='2.5' fill='%23333'/%3E%3Cellipse cx='50' cy='52' rx='8' ry='4' fill='%23FF4500'/%3E%3Cellipse cx='35' cy='38' rx='6' ry='4' fill='%23fff' opacity='0.5'/%3E%3Cellipse cx='65' cy='38' rx='6' ry='4' fill='%23fff' opacity='0.5'/%3E%3Ccircle cx='30' cy='50' r='8' fill='%23FF4500'/%3E%3Ccircle cx='70' cy='50' r='8' fill='%23FF4500'/%3E%3C/svg%3E`

export type RedditTheme = 'dark' | 'light'
export type UpvoteState = 'up' | 'down' | 'none'

export interface RedditCardConfig {
  username: string
  subreddit: string
  postTitle: string
  postBody: string
  upvotes: number
  comments: number
  timeAgo: string
  theme: RedditTheme
  showVerified: boolean
  showAwards: boolean
  avatarSrc: string
  upvoteState: UpvoteState
}

export const REDDIT_CARD_DEFAULTS: RedditCardConfig = {
  username: 'throwaway_8472',
  subreddit: 'AskReddit',
  postTitle: 'AITA for telling my roommate their "emotional support peacock" is not welcome in our apartment?',
  postBody: 'So I (24F) have been living with my roommate (26M) for about 8 months now. Last week he showed up with a peacock...',
  upvotes: 42100,
  comments: 8342,
  timeAgo: '6 hours ago',
  theme: 'dark',
  showVerified: false,
  showAwards: true,
  avatarSrc: '',
  upvoteState: 'none',
}
