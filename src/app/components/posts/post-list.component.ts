import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { Post, User } from '../../models/common.model';
import { ApiListResponse } from '../../models/api-response.model';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { MediaViewerComponent } from './media-viewer/media-viewer.component';
import { ActivityFeedComponent } from './activity-feed/activity-feed.component';
import { TrendingPostsComponent } from './trending-posts/trending-posts.component';
import { MediaService } from '../../services/media.service';

interface PostWithExtras extends Post {
  showMenu?: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
  recentComments?: any[];
}

@Component({
  selector: 'app-post-list',
  imports: [CommonModule, RouterModule, FormsModule, MediaViewerComponent, ActivityFeedComponent, TrendingPostsComponent],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit, OnDestroy {
  posts: PostWithExtras[] = [];
  filteredPosts: PostWithExtras[] = [];
  isLoading = true;
  errorMessage = '';
  currentUser: User | null = null;
  currentPage = 0;
  pageSize = 12;
  totalPages = 0;
  hasMorePosts = false;
  
  // Search and filters
  searchQuery = '';
  activeFilter = 'all';
  selectedLocation = '';
  selectedCategory = '';
  
  // Search subject for debouncing
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Media viewer state
  showMediaViewer = false;
  mediaViewerItems: any[] = [];
  mediaViewerIndex = 0;

  constructor(
    private postService: PostService,
    private authService: AuthService,
    private mediaService: MediaService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    // Setup search debouncing
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.performSearch(query);
      });

    this.loadPosts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPosts(page: number = 0): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.postService.getPosts(page, this.pageSize).subscribe({
      next: (response: ApiListResponse<Post>) => {
        const newPosts = (response.data || []).map(post => ({
          ...post,
          showMenu: false,
          isLiked: false, // This would be determined by API
          isSaved: false, // This would be determined by API
          recentComments: [] // This would come from API
        }));

        if (page === 0) {
          this.posts = newPosts;
        } else {
          this.posts = [...this.posts, ...newPosts];
        }
        
        this.currentPage = response.pagination?.page || 0;
        this.totalPages = response.pagination?.totalPages || 0;
        this.hasMorePosts = !response.pagination?.last || false;
        
        this.applyFilters();
        this.isLoading = false;

        // Load media for posts that have mediaUrls
        this.loadMediaForPosts();
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to load posts. Please try again later.';
        this.isLoading = false;
        console.error('Error loading posts:', error);
      }
    });
  }

  loadMorePosts(): void {
    if (this.hasMorePosts && !this.isLoading) {
      this.loadPosts(this.currentPage + 1);
    }
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  private performSearch(query: string): void {
    this.applyFilters();
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.applyFilters();
  }

  onLocationFilter(): void {
    this.applyFilters();
  }

  onCategoryFilter(): void {
    this.applyFilters();
  }

  filterByTag(tag: string): void {
    this.searchQuery = tag;
    this.performSearch(tag);
  }

  private applyFilters(): void {
    let filtered = [...this.posts];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        post.location?.toLowerCase().includes(query)
      );
    }

    // Apply location filter
    if (this.selectedLocation) {
      filtered = filtered.filter(post => 
        post.location?.toLowerCase().includes(this.selectedLocation.toLowerCase())
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(post => 
        post.tags?.some(tag => tag.toLowerCase().includes(this.selectedCategory.toLowerCase()))
      );
    }

    // Apply active filter (trending, recent, popular)
    switch (this.activeFilter) {
      case 'trending':
        filtered = filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'recent':
        filtered = filtered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'popular':
        filtered = filtered.sort((a, b) => 
          ((b.likes || 0) + (b.commentCount || 0)) - ((a.likes || 0) + (a.commentCount || 0))
        );
        break;
      default:
        // Keep original order for 'all'
        break;
    }

    this.filteredPosts = filtered;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedLocation = '';
    this.selectedCategory = '';
    this.activeFilter = 'all';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedLocation || this.selectedCategory);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  }

  togglePostMenu(postId: string): void {
    this.posts.forEach(post => {
      if (post.id === postId) {
        post.showMenu = !post.showMenu;
      } else {
        post.showMenu = false;
      }
    });
  }

  canEditPost(post: Post): boolean {
    return this.currentUser?.id === post.authorId || this.authService.isAdmin();
  }

  toggleLike(post: PostWithExtras): void {
    if (!this.currentUser) {
      this.errorMessage = 'Please sign in to like posts.';
      return;
    }

    const isUpvote = !post.isLiked;
    
    this.postService.voteOnPost(post.id, { isUpvote }).subscribe({
      next: () => {
        post.isLiked = isUpvote;
        post.likes = (post.likes || 0) + (isUpvote ? 1 : -1);
      },
      error: (error: any) => {
        console.error('Error liking post:', error);
        this.errorMessage = 'Failed to like post. Please try again.';
      }
    });
  }

  toggleSave(post: PostWithExtras): void {
    if (!this.currentUser) {
      this.errorMessage = 'Please sign in to save posts.';
      return;
    }

    // This would be implemented with a save service
    post.isSaved = !post.isSaved;
  }

  sharePost(post: Post): void {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content,
        url: `${window.location.origin}/community/${post.id}`
      });
    } else {
      // Fallback to copying to clipboard
      const url = `${window.location.origin}/community/${post.id}`;
      navigator.clipboard.writeText(url).then(() => {
        // Show toast notification
        console.log('Link copied to clipboard');
      });
    }
  }

  reportPost(post: Post): void {
    // This would open a report modal
    console.log('Report post:', post.id);
  }

  focusComments(post: Post): void {
    // This would focus the comment section or scroll to it
    console.log('Focus comments for post:', post.id);
  }

  openMediaViewer(media: any): void {
    // Find the post that contains this media
    const post = this.posts.find(p => p.mediaUrls?.includes(media.url));
    if (post && post.mediaUrls) {
      const processedUrls = this.processMediaUrls(post);
      this.mediaViewerItems = processedUrls.map((url: string, index: number) => ({
        url: url,
        type: this.getMediaType(url),
        caption: `Image ${index + 1} from ${post.title}`
      }));
      this.mediaViewerIndex = media.index || 0;
      this.showMediaViewer = true;
    }
  }

  closeMediaViewer(): void {
    this.showMediaViewer = false;
    this.mediaViewerItems = [];
    this.mediaViewerIndex = 0;
  }

  private getMediaType(url: string): string {
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
      return 'video';
    }
    return 'image';
  }

  handleImageError(event: any, mediaUrl: string): void {
    console.error('Failed to load image:', mediaUrl);
    // Set a placeholder image using data URL
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
  }

  /**
   * Process media URLs to ensure they're properly formatted for display
   */
  processMediaUrls(post: PostWithExtras): string[] {
    if (!post.mediaUrls || post.mediaUrls.length === 0) {
      return [];
    }

    console.log('Processing media URLs for post:', post.title, 'URLs:', post.mediaUrls);

    const validUrls = post.mediaUrls
      .filter(url => url && url !== '/api/media/null' && url !== 'null'); // Filter out invalid URLs

    if (post.mediaUrls.length > 0 && validUrls.length === 0) {
      console.warn('Post has invalid media URLs:', post.title, 'Original URLs:', post.mediaUrls);
    }

    return validUrls.map(url => {
        console.log('Processing URL:', url);
        
        // If it's already a full URL, return as is
        if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
          console.log('Full URL detected:', url);
          return url;
        }
        
        // If it's a relative URL starting with /api/media, return as is
        if (url.startsWith('/api/media')) {
          console.log('API URL detected:', url);
          return url;
        }
        
        // If it's just a media ID, construct the full URL
        if (url.match(/^[a-f0-9]{24}$/)) {
          const fullUrl = this.mediaService.getMediaUrl(url);
          console.log('Media ID detected, constructed URL:', fullUrl);
          return fullUrl;
        }
        
        // If it's a filename, construct the file URL
        const fileUrl = this.mediaService.getMediaFileUrl(url);
        console.log('Filename detected, constructed URL:', fileUrl);
        return fileUrl;
      });
  }

  /**
   * Load media data for posts that have mediaUrls
   */
  loadMediaForPosts(): void {
    this.posts.forEach(post => {
      if (post.mediaUrls && post.mediaUrls.length > 0) {
        // Always try to load media for posts that have mediaUrls
        // The backend will return the correct media data even if the post has invalid URLs
        console.log('Loading media for post:', post.title, 'Current mediaUrls:', post.mediaUrls);
        this.loadPostMedia(post);
      }
    });
  }

  /**
   * Load media data for a specific post
   */
  loadPostMedia(post: PostWithExtras): void {
    // Extract post ID from the post object
    const postId = post.id;
    
    this.postService.getPostMedia(postId).subscribe({
      next: (mediaFiles) => {
        console.log('Media loaded for post:', post.title, mediaFiles);
        
        // Update the post's mediaUrls with the actual media URLs
        if (mediaFiles && mediaFiles.length > 0) {
          post.mediaUrls = mediaFiles.map(media => media.downloadUrl);
          console.log('Updated media URLs for post:', post.title, post.mediaUrls);
        }
      },
      error: (error) => {
        console.error('Error loading media for post:', post.title, error);
        // Keep the original mediaUrls if loading fails
      }
    });
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}