import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentConfig } from '../config/environment.config';
import { Comment, CreateCommentRequest, VoteRequest } from '../models/common.model';
import { ApiResponse, ApiListResponse } from '../models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class CommentService {
    private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();

    constructor(private http: HttpClient) { }

    /**
     * Add a comment to a post
     */
    addCommentToPost(postId: string, commentData: CreateCommentRequest): Observable<ApiResponse<Comment>> {
        const endpoint = `${this.API_BASE_URL}/api/comments/posts/${postId}`;
        return this.http.post<ApiResponse<Comment>>(endpoint, commentData);
    }

    /**
     * Get comments for a post with pagination
     */
    getCommentsForPost(postId: string, page: number = 0, size: number = 10): Observable<ApiListResponse<Comment>> {
        const endpoint = `${this.API_BASE_URL}/api/comments/posts/${postId}`;
        const params = {
            page: page.toString(),
            size: size.toString()
        };
        return this.http.get<ApiListResponse<Comment>>(endpoint, { params });
    }

    /**
     * Update a comment
     */
    updateComment(commentId: string, content: string): Observable<ApiResponse<Comment>> {
        const endpoint = `${this.API_BASE_URL}/api/comments/${commentId}`;
        return this.http.put<ApiResponse<Comment>>(endpoint, { content });
    }

    /**
     * Delete a comment
     */
    deleteComment(commentId: string): Observable<ApiResponse<void>> {
        const endpoint = `${this.API_BASE_URL}/api/comments/${commentId}`;
        return this.http.delete<ApiResponse<void>>(endpoint);
    }

    /**
     * Vote on a comment
     */
    voteOnComment(commentId: string, voteData: VoteRequest): Observable<ApiResponse<Comment>> {
        const endpoint = `${this.API_BASE_URL}/api/comments/${commentId}/vote`;
        return this.http.post<ApiResponse<Comment>>(endpoint, voteData);
    }
}