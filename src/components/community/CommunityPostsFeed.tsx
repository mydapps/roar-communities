import React from 'react';
import { Post } from '@/components/feed/Post';
import { Loader2, MessageCircle } from 'lucide-react';
import { CommunityPost } from '@/hooks/useCommunityPosts'; // Assuming type is exported

interface CommunityPostsFeedProps {
  posts: Partial<CommunityPost>[];
  loading: boolean;
  hasMore: boolean;
  loadingElementRef: React.LegacyRef<HTMLDivElement> | undefined;
  handleRoar: (postCode: string) => Promise<void>;
  isLoggedIn: boolean;
  isAdmin: boolean;
  onPostUpdated: (postCode: string, newPinnedStatus: boolean) => void;
}

const CommunityPostsFeed: React.FC<CommunityPostsFeedProps> = ({ 
  posts,
  loading,
  hasMore,
  loadingElementRef,
  handleRoar,
  isLoggedIn,
  isAdmin,
  onPostUpdated
}) => {
  return (
    <div className="space-y-6">
      {loading && posts.length === 0 ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : posts.length > 0 ? (
        <>
          {posts.map((post, index) => (
            <Post 
              key={`post-${post.code || index}-${index}`}
              username={post.handle || ''}
              community={post.community || ''}
              ticker={post.ticker}
              timeAgo={post.timeAgo || ''}
              content={post.is_mirror === 1 ? (post.mirror_quote || '') : (post.body || '')}
              roarCount={post.upvotes || 0}
              commentCount={post.reply_count || 0}
              shareCount={post.engagement || 0}
              images={post.multiple_images ? post.images || [] : (post.image ? [post.image_url || ''] : [])}
              video={undefined} // Assuming video is not used here yet
              postCode={post.code || ''}
              avatar={post.avatar || ''}
              roared={post.roar === 1}
              onRoar={() => post.code ? handleRoar(post.code) : Promise.resolve()}
              isMirror={post.is_mirror === 1}
              mirrorData={post.is_mirror === 1 ? {
                quote: post.mirror_quote || '',
                originalAuthor: post.original_author || '',
                originalCommunity: post.original_community || '',
                originalBody: post.original_body || '',
                originalTimeAgo: post.original_created_on || '',
                originalAvatar: post.original_author_avatar || '',
                originalImages: post.original_images || [],
                originalTitle: post.original_title || '',
                originalPostCode: post.original_post_code || ''
              } : undefined}
              ipfs={post.code || ''}
              isLoggedIn={isLoggedIn}
              hasUserTipped={post.has_tipped === 1}
              hideComments={false} // Keep comments visible on community feed
              isAdmin={isAdmin}
              isPinned={!!post.pinned}
              onPostUpdated={onPostUpdated}
              is_poll={post.is_poll}
              poll_data={post.poll_data}
              is_dao_proposal={post.is_dao_proposal || false}
              dao_proposal_data={post.dao_proposal_data || null}
            />
          ))}
          
          <div 
            ref={loadingElementRef}
            className="flex justify-center py-8 my-4"
            id="infinite-scroll-marker"
          >
            {loading && (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            )}
            
            {!loading && !hasMore && posts.length > 0 && (
              <p className="text-sm text-muted-foreground">You've reached the end</p>
            )}
          </div>
        </>
      ) : (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <MessageCircle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-muted-foreground">No posts in this community yet. Be the first to post!</p>
        </div>
      )}
    </div>
  );
};

export default CommunityPostsFeed; 