import { RefObject } from 'react'
import { MessageSquare, Share2, Award } from 'lucide-react'
import { DEFAULT_AVATAR, type RedditCardConfig } from './defaults'

function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 3 }}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12.5589 0.7267C12.9733 0.8474 13.3429 1.1642 14.082 1.7978L14.8782 2.4802C15.2109 2.7653 15.3772 2.9079 15.5649 3.0095C15.7314 3.0996 15.9098 3.1656 16.0948 3.2055C16.3034 3.2505 16.5225 3.2505 16.9607 3.2505H17.5495C18.6696 3.2505 19.2297 3.2505 19.6575 3.4685C20.0338 3.6603 20.3398 3.9662 20.5315 4.3426C20.7495 4.7704 20.7495 5.3304 20.7495 6.4505V7.0393C20.7495 7.4775 20.7495 7.6966 20.7945 7.9052C20.8345 8.0903 20.9005 8.2687 20.9906 8.4351C21.0921 8.6228 21.2347 8.7892 21.5199 9.1219L22.2023 9.918C22.8359 10.6572 23.1526 11.0267 23.2734 11.4412C23.3798 11.8065 23.3798 12.1946 23.2734 12.5599C23.1526 12.9743 22.8359 13.3439 22.2023 14.0831L21.5199 14.8792C21.2347 15.2119 21.0921 15.3783 20.9906 15.5659C20.9005 15.7324 20.8345 15.9108 20.7945 16.0958C20.7495 16.3044 20.7495 16.5235 20.7495 16.9617V17.5505C20.7495 18.6706 20.7495 19.2307 20.5315 19.6585C20.3398 20.0348 20.0338 20.3408 19.6575 20.5325C19.2297 20.7505 18.6696 20.7505 17.5495 20.7505H16.9607C16.5225 20.7505 16.3034 20.7505 16.0948 20.7956C15.9098 20.8355 15.7314 20.9015 15.5649 20.9916C15.3772 21.0931 15.2109 21.2357 14.8782 21.5209L14.082 22.2033C13.3429 22.8369 12.9733 23.1537 12.5589 23.2744C12.1936 23.3808 11.8055 23.3808 11.4402 23.2744C11.0257 23.1536 10.6561 22.8369 9.917 22.2033L9.12085 21.5209C8.78814 21.2357 8.62179 21.0931 8.43412 20.9916C8.26765 20.9015 8.08923 20.8355 7.90421 20.7956C7.69562 20.7505 7.47652 20.7505 7.03832 20.7505H6.4153C5.29519 20.7505 4.73514 20.7505 4.30732 20.5325C3.931 20.3408 3.62503 20.0348 3.43329 19.6585C3.2153 19.2307 3.2153 18.6706 3.2153 17.5505V16.949C3.2153 16.5146 3.2153 16.2973 3.17099 16.0903C3.13169 15.9067 3.06672 15.7296 2.97801 15.5641C2.878 15.3775 2.73756 15.2118 2.45668 14.8803L1.76945 14.0693C1.14668 13.3343 0.835291 12.9669 0.716483 12.5555C0.611756 12.1929 0.611756 11.8081 0.716483 11.4455C0.835291 11.0342 1.14668 10.6667 1.76945 9.9318L2.45668 9.1208C2.73756 8.7893 2.878 8.6236 2.97801 8.437C3.06672 8.2715 3.13169 8.0944 3.17099 7.9108C3.2153 7.7038 3.2153 7.4865 3.2153 7.052V6.4505C3.2153 5.3304 3.2153 4.7704 3.43329 4.3426C3.62503 3.9662 3.931 3.6603 4.30732 3.4685C4.73514 3.2505 5.2952 3.2505 6.4153 3.2505H7.03832C7.47652 3.2505 7.69562 3.2505 7.90421 3.2055C8.08923 3.1656 8.26765 3.0996 8.43412 3.0095C8.62179 2.9079 8.78814 2.7653 9.12084 2.4802L9.91699 1.7978C10.6561 1.1642 11.0257 0.8474 11.4402 0.7267C11.8055 0.6203 12.1936 0.6203 12.5589 0.7267ZM16.5306 9.5303C16.8235 9.2374 16.8235 8.7626 16.5306 8.4697C16.2377 8.1768 15.7628 8.1768 15.4699 8.4697L11.0002 12.9393L9.53058 11.4697C9.23768 11.1768 8.76281 11.1768 8.46992 11.4697C8.17702 11.7626 8.17702 12.2374 8.46992 12.5303L10.4699 14.5303C10.6106 14.671 10.8013 14.75 11.0002 14.75C11.1992 14.75 11.3899 14.671 11.5306 14.5303L16.5306 9.5303Z" fill="#4A99E9"/>
    </svg>
  )
}

interface RedditCardProps {
  config: RedditCardConfig
  cardRef?: RefObject<HTMLDivElement>
}

export function RedditCard({ config, cardRef }: RedditCardProps) {
  const {
    username, postTitle, postBody, upvotes, comments, theme,
    showVerified, showAwards, avatarSrc, subreddit, timeAgo, upvoteState
  } = config

  const isDark = theme === 'dark'
  const bg = isDark ? '#1a1a1b' : '#ffffff'
  const border = isDark ? '#343536' : '#ccc'
  const textMain = isDark ? '#d7dadc' : '#1c1c1c'
  const textSub = isDark ? '#818384' : '#878a8c'
  const bgInner = isDark ? '#272729' : '#f6f7f8'
  const orange = '#ff4500'

  const displayUpvotes = upvoteState === 'up' ? upvotes + 1 : upvoteState === 'down' ? upvotes - 1 : upvotes
  const upvoteColor = upvoteState === 'up' ? orange : upvoteState === 'down' ? '#7193ff' : textSub

  return (
    <div
      ref={cardRef}
      style={{
        width: 540,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 4,
        fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex' }}>
        <div style={{
          width: 40, background: bgInner,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '8px 4px', gap: 2, flexShrink: 0
        }}>
          <div style={{ color: upvoteColor }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={upvoteState === 'up' ? upvoteColor : 'none'} stroke={upvoteColor} strokeWidth="2">
              <path d="M12 4l8 8H4z"/>
            </svg>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: upvoteColor, lineHeight: 1 }}>
            {displayUpvotes >= 1000 ? `${(displayUpvotes / 1000).toFixed(1)}k` : displayUpvotes}
          </span>
          <div style={{ color: textSub }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={upvoteState === 'down' ? '#7193ff' : 'none'} stroke={upvoteState === 'down' ? '#7193ff' : textSub} strokeWidth="2">
              <path d="M12 20l-8-8h16z"/>
            </svg>
          </div>
        </div>

        <div style={{ flex: 1, padding: '8px 8px 8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              border: `1px solid ${border}`
            }}>
              <img src={avatarSrc || DEFAULT_AVATAR} alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: textMain }}>r/{subreddit || 'AskReddit'}</span>
              <span style={{ fontSize: 12, color: textSub }}>•</span>
              <span style={{ fontSize: 12, color: textSub }}>Posted by</span>
              <span style={{ fontSize: 12, color: textSub }}>u/{username || 'anonymous'}</span>
              {showVerified && <VerifiedBadge size={12} />}
              <span style={{ fontSize: 12, color: textSub }}>{timeAgo || '4 hours ago'}</span>
            </div>
          </div>

          <h3 style={{
            margin: '0 0 6px', fontSize: 18, fontWeight: 700,
            color: textMain, lineHeight: 1.35, wordBreak: 'break-word'
          }}>
            {postTitle || 'Your post title goes here'}
          </h3>

          {postBody && (
            <p style={{
              margin: '0 0 8px', fontSize: 14, color: textMain,
              lineHeight: 1.6, wordBreak: 'break-word',
              display: '-webkit-box', WebkitLineClamp: 6,
              WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {postBody}
            </p>
          )}

          {showAwards && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              {['🏆','⭐','🎖️','💎','🌟'].map((a, i) => (
                <span key={i} style={{ fontSize: 14 }}>{a}</span>
              ))}
              <span style={{ fontSize: 12, color: textSub, fontWeight: 600 }}>342</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 6px', borderRadius: 2, border: 'none',
              background: 'none', cursor: 'default', color: textSub, fontSize: 12, fontWeight: 700
            }}>
              <MessageSquare size={16} />
              {comments >= 1000 ? `${(comments / 1000).toFixed(1)}k` : comments} Comments
            </button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 6px', borderRadius: 2, border: 'none',
              background: 'none', cursor: 'default', color: textSub, fontSize: 12, fontWeight: 700
            }}>
              <Share2 size={16} />
              Share
            </button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 6px', borderRadius: 2, border: 'none',
              background: 'none', cursor: 'default', color: textSub, fontSize: 12, fontWeight: 700
            }}>
              <Award size={16} />
              Award
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
