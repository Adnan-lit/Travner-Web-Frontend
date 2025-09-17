import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { Post, PostsResponse } from '../../models/post.model';
import { PostItemComponent } from './post-item/post-item.component';
// import { PostFormComponent } from './post-form/post-form.component';
import { CursorService } from '../../services/cursor.service';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PostItemComponent],
  template: `
    <div class="post-list-container">
      <!-- Search and Filter Section -->
      <div class="search-filter-section">
        <div class="search-container">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Search posts..." 
            (keyup.enter)="searchPosts()"
            class="search-input"
          >
          <button (click)="searchPosts()" class="search-btn">Search</button>
        </div>
        
        <div class="filter-container">
          <select [(ngModel)]="filterType" (change)="applyFilter()" class="filter-select">
            <option value="all">All Posts</option>
            <option value="location">Filter by Location</option>
            <option value="tag">Filter by Tag</option>
          </select>
          
          <input 
            *ngIf="filterType === 'location'"
            type="text" 
            [(ngModel)]="filterLocation" 
            placeholder="Enter location" 
            (keyup.enter)="applyFilter()"
            class="filter-input"
          >
          
          <input 
            *ngIf="filterType === 'tag'"
            type="text" 
            [(ngModel)]="filterTag" 
            placeholder="Enter tag" 
            (keyup.enter)="applyFilter()"
            class="filter-input"
          >
          
          <button (click)="applyFilter()" class="filter-btn">Apply Filter</button>
          <button (click)="resetFilters()" class="reset-btn">Reset</button>
        </div>
      </div>
      
      <!-- Create New Post Button -->
      <div class="create-post-section">
        <button (click)="toggleCreatePost()" class="create-post-btn">
          {{ showCreatePost ? 'Cancel' : 'Share Your Journey' }}
        </button>
      </div>
      
      <!-- Create Post Form -->
      <!-- <app-post-form *ngIf="showCreatePost" (postSubmitted)="onPostCreated($event)"></app-post-form> -->
      
      <!-- Posts List -->
      <div class="posts-container">
        <ng-container *ngIf="posts && posts.length > 0; else noPosts">
          <app-post-item 
            *ngFor="let post of posts" 
            [post]="post"
            (upvoted)="onUpvote($event)"
            (downvoted)="onDownvote($event)"
            (deleted)="onDelete($event)"
          ></app-post-item>
          
          <!-- Pagination Controls -->
          <div class="pagination-controls">
            <button 
              [disabled]="currentPage === 0" 
              (click)="loadPage(currentPage - 1)" 
              class="pagination-btn"
            >
              Previous
            </button>
            <span class="page-info">Page {{ currentPage + 1 }} of {{ totalPages }}</span>
            <button 
              [disabled]="currentPage >= totalPages - 1" 
              (click)="loadPage(currentPage + 1)" 
              class="pagination-btn"
            >
              Next
            </button>
          </div>
        </ng-container>
        
        <!-- No Posts Template -->
        <ng-template #noPosts>
          <div class="no-posts">
            <p>No travel posts available. Be the first to share your journey!</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .post-list-container {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .search-filter-section {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .search-container {
      display: flex;
      gap: 10px;
    }
    
    .search-input {
      flex: 1;
      padding: 10px 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }
    
    .search-btn {
      padding: 10px 15px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.3s;
    }
    
    .search-btn:hover {
      background-color: #45a049;
    }
    
    .filter-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    
    .filter-select, .filter-input {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .filter-btn, .reset-btn {
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s;
    }
    
    .filter-btn {
      background-color: #2196F3;
      color: white;
    }
    
    .filter-btn:hover {
      background-color: #0b7dda;
    }
    
    .reset-btn {
      background-color: #f44336;
      color: white;
    }
    
    .reset-btn:hover {
      background-color: #d32f2f;
    }
    
    .create-post-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }
    
    .create-post-btn {
      padding: 12px 20px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      transition: background-color 0.3s;
    }
    
    .create-post-btn:hover {
      background-color: #45a049;
    }
    
    .posts-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      margin-top: 30px;
      padding: 10px 0;
    }
    
    .pagination-btn {
      padding: 8px 15px;
      background-color: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .pagination-btn:hover:not(:disabled) {
      background-color: #0b7dda;
    }
    
    .pagination-btn:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    
    .page-info {
      font-size: 14px;
      color: #555;
    }
    
    .no-posts {
      text-align: center;
      padding: 40px;
      color: #666;
      background-color: #f8f9fa;
      border-radius: 8px;
      border: 1px dashed #ddd;
    }
  `]
})
export class PostListComponent implements OnInit, OnDestroy, AfterViewInit {
  posts: Post[] = [];
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  searchQuery = '';
  filterType = 'all';
  filterLocation = '';
  filterTag = '';

  showCreatePost = false;

  constructor(
    private postService: PostService,
    private el: ElementRef,
    private renderer: Renderer2,
    private cursorService: CursorService
  ) { }

  ngOnInit(): void {
    this.loadPosts();
    this.cursorService.initializeCursor(this.renderer, this.el);
  }

  ngAfterViewInit(): void {
    // Add any additional initialization that needs to happen after the view is initialized
  }

  ngOnDestroy(): void {
    this.cursorService.cleanup(this.renderer);
  }

  loadPosts(): void {
    this.postService.getPosts(this.currentPage, this.pageSize).subscribe({
      next: (response: PostsResponse) => {
        console.log('Posts loaded successfully:', response);
        if (response && response.content) {
          this.posts = response.content;
          this.totalPages = response.totalPages;
          this.totalElements = response.totalElements;
        } else {
          console.warn('Received unexpected response format:', response);
          this.posts = [];
          this.totalPages = 0;
          this.totalElements = 0;
        }
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.posts = [];
        this.totalPages = 0;
        this.totalElements = 0;
      }
    });
  }

  searchPosts(): void {
    if (!this.searchQuery.trim()) {
      this.loadPosts();
      return;
    }

    this.currentPage = 0;
    this.postService.searchPosts(this.searchQuery, this.currentPage, this.pageSize).subscribe({
      next: (response: PostsResponse) => {
        this.posts = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
      },
      error: (error) => {
        console.error('Error searching posts:', error);
      }
    });
  }

  applyFilter(): void {
    this.currentPage = 0;

    switch (this.filterType) {
      case 'location':
        if (this.filterLocation.trim()) {
          this.postService.getPostsByLocation(this.filterLocation, this.currentPage, this.pageSize).subscribe({
            next: (response: PostsResponse) => {
              this.posts = response.content;
              this.totalPages = response.totalPages;
              this.totalElements = response.totalElements;
            },
            error: (error) => {
              console.error('Error filtering posts by location:', error);
            }
          });
        }
        break;

      case 'tag':
        if (this.filterTag.trim()) {
          const tags = this.filterTag.split(',').map(tag => tag.trim());
          this.postService.getPostsByTags(tags, this.currentPage, this.pageSize).subscribe({
            next: (response: PostsResponse) => {
              this.posts = response.content;
              this.totalPages = response.totalPages;
              this.totalElements = response.totalElements;
            },
            error: (error) => {
              console.error('Error filtering posts by tag:', error);
            }
          });
        }
        break;

      default:
        this.loadPosts();
        break;
    }
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.filterType = 'all';
    this.filterLocation = '';
    this.filterTag = '';
    this.currentPage = 0;
    this.loadPosts();
  }

  loadPage(page: number): void {
    if (page < 0 || page >= this.totalPages) {
      return;
    }

    this.currentPage = page;

    // Apply the current filter/search when changing pages
    if (this.searchQuery) {
      this.searchPosts();
    } else if (this.filterType === 'location' && this.filterLocation) {
      this.applyFilter();
    } else if (this.filterType === 'tag' && this.filterTag) {
      this.applyFilter();
    } else {
      this.loadPosts();
    }
  }

  toggleCreatePost(): void {
    this.showCreatePost = !this.showCreatePost;
  }

  onPostCreated(newPost: Post): void {
    this.showCreatePost = false;
    this.loadPosts(); // Refresh the post list
  }

  onUpvote(postId: string): void {
    this.postService.upvotePost(postId).subscribe({
      next: (updatedPost) => {
        this.updatePostInList(updatedPost);
      },
      error: (error) => {
        console.error('Error upvoting post:', error);
      }
    });
  }

  onDownvote(postId: string): void {
    this.postService.downvotePost(postId).subscribe({
      next: (updatedPost) => {
        this.updatePostInList(updatedPost);
      },
      error: (error) => {
        console.error('Error downvoting post:', error);
      }
    });
  }

  onDelete(postId: string): void {
    this.postService.deletePost(postId).subscribe({
      next: () => {
        this.posts = this.posts.filter(post => post.id !== postId);
      },
      error: (error) => {
        console.error('Error deleting post:', error);
      }
    });
  }

  private updatePostInList(updatedPost: Post): void {
    const index = this.posts.findIndex(post => post.id === updatedPost.id);
    if (index !== -1) {
      this.posts[index] = updatedPost;
    }
  }
}
