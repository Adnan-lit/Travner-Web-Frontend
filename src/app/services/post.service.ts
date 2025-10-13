import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';
import { Post, CreatePostRequest, UpdatePostRequest, VoteRequest } from '../models/common.model';
import { ApiResponse, ApiListResponse } from '../models/api-response.model';
import { Comment, CommentListResponse } from '../models/post.model';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();

  constructor(private http: HttpClient) { }

  /**
   * Get all published posts with pagination and sorting
   */
  getPosts(page: number = 0, size: number = 10, sortBy: string = 'createdAt', direction: 'asc' | 'desc' = 'desc'): Observable<ApiListResponse<Post>> {
    const endpoint = `${this.API_BASE_URL}/api/posts`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);

    return this.http.get<ApiListResponse<Post>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error('Error fetching posts:', error);
        throw error;
      })
    );
  }

  /**
   * Get a single post by ID
   */
  getPostById(id: string): Observable<ApiResponse<Post>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${id}`;
    return this.http.get<ApiResponse<Post>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error fetching post ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Create a new post
   */
  createPost(postData: CreatePostRequest): Observable<ApiResponse<Post>> {
    const endpoint = `${this.API_BASE_URL}/api/posts`;
    return this.http.post<ApiResponse<Post>>(endpoint, postData).pipe(
      catchError(error => {
        console.error('Error creating post:', error);
        throw error;
      })
    );
  }

  /**
   * Update an existing post
   */
  updatePost(id: string, postData: UpdatePostRequest): Observable<ApiResponse<Post>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${id}`;
    return this.http.put<ApiResponse<Post>>(endpoint, postData).pipe(
      catchError(error => {
        console.error(`Error updating post ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Delete a post
   */
  deletePost(id: string): Observable<ApiResponse<void>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${id}`;
    return this.http.delete<ApiResponse<void>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error deleting post ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Vote on a post (upvote or downvote)
   */
  voteOnPost(id: string, voteData: VoteRequest): Observable<ApiResponse<Post>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${id}/vote`;
    return this.http.post<ApiResponse<Post>>(endpoint, voteData).pipe(
      catchError(error => {
        console.error(`Error voting on post ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Upvote a post (alternative endpoint)
   */
  upvotePost(id: string): Observable<ApiResponse<Post>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${id}/upvote`;
    return this.http.post<ApiResponse<Post>>(endpoint, {}).pipe(
      catchError(error => {
        console.error(`Error upvoting post ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Downvote a post (alternative endpoint)
   */
  downvotePost(id: string): Observable<ApiResponse<Post>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${id}/downvote`;
    return this.http.post<ApiResponse<Post>>(endpoint, {}).pipe(
      catchError(error => {
        console.error(`Error downvoting post ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Search posts by query
   */
  searchPosts(query: string, page: number = 0, size: number = 10): Observable<ApiListResponse<Post>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/search`;
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiListResponse<Post>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error(`Error searching posts with query '${query}':`, error);
        throw error;
      })
    );
  }

  /**
   * Get posts by location
   */
  getPostsByLocation(location: string, page: number = 0, size: number = 10): Observable<ApiListResponse<Post>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/location/${location}`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiListResponse<Post>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching posts by location '${location}':`, error);
        throw error;
      })
    );
  }

  /**
   * Get posts by tags
   */
  getPostsByTags(tags: string[], page: number = 0, size: number = 10): Observable<ApiListResponse<Post>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/tags`;
    const params = new HttpParams()
      .set('tags', tags.join(','))
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiListResponse<Post>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching posts by tags '${tags.join(',')}':`, error);
        throw error;
      })
    );
  }

  /**
   * Get user's posts
   */
  getUserPosts(username: string, page: number = 0, size: number = 10): Observable<ApiListResponse<Post>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/user/${username}`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiListResponse<Post>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching posts for user '${username}':`, error);
        throw error;
      })
    );
  }

  /**
   * Upvote a comment
   */
  upvoteComment(postId: string, commentId: string): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${postId}/comments/${commentId}/upvote`;
    return this.http.post<ApiResponse<any>>(endpoint, {}).pipe(
      catchError(error => {
        console.error(`Error upvoting comment ${commentId} on post ${postId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Downvote a comment
   */
  downvoteComment(postId: string, commentId: string): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${postId}/comments/${commentId}/downvote`;
    return this.http.post<ApiResponse<any>>(endpoint, {}).pipe(
      catchError(error => {
        console.error(`Error downvoting comment ${commentId} on post ${postId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Upload media for a post
   */
  uploadMedia(postId: string, files: File[]): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${postId}/media`;
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files', file);
    });

    return this.http.post<ApiResponse<any>>(endpoint, formData).pipe(
      catchError(error => {
        console.error(`Error uploading media for post ${postId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Delete media from a post
   */
  deleteMedia(postId: string, mediaId: string): Observable<ApiResponse<void>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${postId}/media/${mediaId}`;
    return this.http.delete<ApiResponse<void>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error deleting media ${mediaId} from post ${postId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get media blob for display
   */
  getMediaBlob(mediaUrl: string): Observable<Blob> {
    return this.http.get(mediaUrl, { responseType: 'blob' }).pipe(
      catchError(error => {
        console.error(`Error fetching media blob from ${mediaUrl}:`, error);
        throw error;
      })
    );
  }

  /**
   * Create a comment on a post
   */
  createComment(postId: string, commentData: any): Observable<ApiResponse<Comment>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${postId}/comments`;
    return this.http.post<ApiResponse<Comment>>(endpoint, commentData).pipe(
      catchError(error => {
        console.error(`Error creating comment on post ${postId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Delete a comment
   */
  deleteComment(postId: string, commentId: string): Observable<ApiResponse<void>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${postId}/comments/${commentId}`;
    return this.http.delete<ApiResponse<void>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error deleting comment ${commentId} on post ${postId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get comments for a post
   */
  getComments(postId: string, page: number = 0, size: number = 10): Observable<CommentListResponse> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${postId}/comments`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<CommentListResponse>(endpoint, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching comments for post ${postId}:`, error);
        throw error;
      })
    );
  }
}