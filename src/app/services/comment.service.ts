import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';
import { ApiResponse, ApiListResponse } from '../models/api-response.model';
import { Comment, CreateCommentRequest } from '../models/common.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();

  constructor(private http: HttpClient) { }

  /**
   * Get comments for a post with pagination
   */
  getComments(postId: string, page: number = 0, size: number = 10): Observable<ApiListResponse<Comment>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${postId}/comments`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiListResponse<Comment>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching comments for post ${postId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Create a new comment on a post
   */
  createComment(postId: string, commentData: CreateCommentRequest): Observable<ApiResponse<Comment>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${postId}/comments`;
    return this.http.post<ApiResponse<Comment>>(endpoint, commentData).pipe(
      catchError(error => {
        console.error(`Error creating comment on post ${postId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Update an existing comment
   */
  updateComment(postId: string, commentId: string, content: string): Observable<ApiResponse<Comment>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${postId}/comments/${commentId}`;
    return this.http.put<ApiResponse<Comment>>(endpoint, { content }).pipe(
      catchError(error => {
        console.error(`Error updating comment ${commentId} on post ${postId}:`, error);
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
   * Upvote a comment
   */
  upvoteComment(postId: string, commentId: string): Observable<ApiResponse<Comment>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${postId}/comments/${commentId}/upvote`;
    return this.http.post<ApiResponse<Comment>>(endpoint, {}).pipe(
      catchError(error => {
        console.error(`Error upvoting comment ${commentId} on post ${postId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Downvote a comment
   */
  downvoteComment(postId: string, commentId: string): Observable<ApiResponse<Comment>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${postId}/comments/${commentId}/downvote`;
    return this.http.post<ApiResponse<Comment>>(endpoint, {}).pipe(
      catchError(error => {
        console.error(`Error downvoting comment ${commentId} on post ${postId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Vote on a comment (upvote or downvote)
   */
  voteComment(postId: string, commentId: string, isUpvote: boolean): Observable<ApiResponse<Comment>> {
    return isUpvote ? 
      this.upvoteComment(postId, commentId) : 
      this.downvoteComment(postId, commentId);
  }

  /**
   * Get comment by ID
   */
  getCommentById(postId: string, commentId: string): Observable<ApiResponse<Comment>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${postId}/comments/${commentId}`;
    return this.http.get<ApiResponse<Comment>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error fetching comment ${commentId} on post ${postId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get replies to a comment
   */
  getCommentReplies(postId: string, parentCommentId: string, page: number = 0, size: number = 10): Observable<ApiListResponse<Comment>> {
    const endpoint = `${this.API_BASE_URL}/api/posts/${postId}/comments/${parentCommentId}/replies`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiListResponse<Comment>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching replies for comment ${parentCommentId} on post ${postId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Create a reply to a comment
   */
  createReply(postId: string, parentCommentId: string, content: string): Observable<ApiResponse<Comment>> {
    return this.createComment(postId, {
      content,
      parentCommentId
    });
  }

  /**
   * Check if user can edit a comment
   */
  canEditComment(comment: Comment, currentUserId: string): boolean {
    return comment.authorId === currentUserId;
  }

  /**
   * Check if user can delete a comment
   */
  canDeleteComment(comment: Comment, currentUserId: string, isAdmin: boolean = false): boolean {
    return comment.authorId === currentUserId || isAdmin;
  }

  /**
   * Vote on a comment (alias for voteComment)
   */
  voteOnComment(commentId: string, voteData: { isUpvote: boolean }): Observable<ApiResponse<Comment>> {
    // This method needs postId, but we'll need to get it from the comment or pass it
    throw new Error('voteOnComment requires postId. Use voteComment instead.');
  }

  /**
   * Add comment to post (alias for createComment)
   */
  addCommentToPost(postId: string, commentData: CreateCommentRequest): Observable<ApiResponse<Comment>> {
    return this.createComment(postId, commentData);
  }
}