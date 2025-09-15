import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Post, PostCreate, PostUpdate, PostsResponse } from '../models/post.model';
import { Comment, CommentCreate, CommentUpdate, CommentsResponse } from '../models/comment.model';
import { Media, MediaType } from '../models/media.model';

@Injectable({
    providedIn: 'root'
})
export class PostService {
    // API URL configuration
    private readonly API_BASE_URL = this.getApiBaseUrl();

    constructor(private http: HttpClient) { }

    private getApiBaseUrl(): string {
        // Check if we're in production (deployed) or development (local)
        const hostname = window.location.hostname;

        if (hostname === 'travner.vercel.app' || hostname.includes('vercel.app')) {
            // Production: use your deployed backend URL
            console.log('🌐 Production environment detected - using Railway backend');
            return 'https://travner-web-backend-production.up.railway.app';
        } else if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost')) {
            // Development: use local backend
            console.log('🔧 Development environment detected - using local backend');
            return 'http://localhost:8080';
        } else {
            // Fallback for other domains
            console.log('⚠️ Unknown environment, using Railway backend as fallback');
            return 'https://travner-web-backend-production.up.railway.app';
        }
    }

    /**
     * Get authentication headers for API requests
     * This uses the same authentication approach as AuthService
     */
    private getAuthHeaders(): HttpHeaders {
        // Get stored auth data from localStorage (same as AuthService)
        const authData = this.getStoredAuthData();

        if (!authData) {
            return new HttpHeaders({
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest' // Prevent browser auth popup
            });
        }

        // Use Basic Authentication (same as AuthService)
        const credentials = btoa(`${authData.username}:${authData.password}`);
        const headers = new HttpHeaders({
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest' // Prevent browser auth popup
        });

        return headers;
    }

    /**
     * Get stored authentication data from localStorage
     * This is the same implementation as in AuthService
     */
    private getStoredAuthData(): { username: string, password: string } | null {
        const authJson = localStorage.getItem('travner_auth');
        if (authJson) {
            try {
                return JSON.parse(authJson);
            } catch (e) {
                console.error('Error parsing auth data from localStorage', e);
                return null;
            }
        }
        return null;
    }

    /**
     * Convert relative media URLs to full URLs pointing to the backend
     */
    private processMediaUrls(mediaUrls: string[] | undefined): string[] {
        if (!mediaUrls || !Array.isArray(mediaUrls)) {
            return [];
        }

        return mediaUrls.map(url => {
            if (url.startsWith('http')) {
                // Already a full URL
                return url;
            } else if (url.startsWith('/')) {
                // Relative URL, convert to full backend URL
                return `${this.API_BASE_URL}${url}`;
            } else {
                // Assume it's a relative path without leading slash
                return `${this.API_BASE_URL}/${url}`;
            }
        });
    }    /**
     * Process a single post to fix media URLs and other transformations
     */
    private processPost(post: any): Post {
        return {
            ...post,
            authorName: post.author?.userName || post.authorName || 'Unknown',
            mediaUrls: this.processMediaUrls(post.mediaUrls)
        };
    }

    // POSTS API ENDPOINTS

    // Get all posts with pagination
    getPosts(page: number = 0, size: number = 10): Observable<PostsResponse> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        const headers = this.getAuthHeaders();

        return this.http.get<any>(`${this.API_BASE_URL}/posts`, {
            headers,
            params,
            withCredentials: false
        }).pipe(
            map((response: any) => {
                // Handle enhanced response format
                if (response && response.success && response.data) {
                    // Enhanced format with wrapper
                    const posts = Array.isArray(response.data) ? response.data : [];
                    const pagination = response.pagination || {};

                    return {
                        content: posts.map((post: any) => this.processPost(post)),
                        totalElements: pagination.totalElements || posts.length,
                        totalPages: pagination.totalPages || 1,
                        size: pagination.size || size,
                        number: pagination.page || page
                    } as PostsResponse;
                } else if (response && Array.isArray(response.content)) {
                    // Spring Boot page format
                    return {
                        ...response,
                        content: response.content.map((post: any) => this.processPost(post))
                    } as PostsResponse;
                } else if (response && Array.isArray(response)) {
                    // Simple array format
                    return {
                        content: response.map((post: any) => this.processPost(post)),
                        totalElements: response.length,
                        totalPages: 1,
                        size: size,
                        number: page
                    } as PostsResponse;
                } else {
                    // Fallback for unexpected formats
                    console.warn('Received unexpected response format:', response);
                    return {
                        content: [],
                        totalElements: 0,
                        totalPages: 0,
                        size: size,
                        number: page
                    } as PostsResponse;
                }
            })
        );
    }

    // Get a specific post by ID
    getPostById(id: string): Observable<Post> {
        const headers = this.getAuthHeaders();
        return this.http.get<any>(`${this.API_BASE_URL}/posts/${id}`, {
            headers,
            withCredentials: false
        }).pipe(
            map((response: any) => {
                // Handle enhanced response format
                if (response && response.success && response.data) {
                    return this.processPost(response.data);
                } else {
                    return this.processPost(response);
                }
            })
        );
    }

    // Get posts by a specific user
    getPostsByUser(username: string, page: number = 0, size: number = 10): Observable<PostsResponse> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        const headers = this.getAuthHeaders();

        return this.http.get<any>(`${this.API_BASE_URL}/posts/user/${username}`, {
            headers,
            params,
            withCredentials: false
        }).pipe(
            map((response: any) => {
                // Handle response format differences
                if (response && !response.hasOwnProperty('content')) {
                    return {
                        content: Array.isArray(response) ? response : [],
                        totalElements: Array.isArray(response) ? response.length : 0,
                        totalPages: 1,
                        size: size,
                        number: page
                    } as PostsResponse;
                }
                return response as PostsResponse;
            })
        );
    }

    // Search posts
    searchPosts(query: string, page: number = 0, size: number = 10): Observable<PostsResponse> {
        const params = new HttpParams()
            .set('query', query)
            .set('page', page.toString())
            .set('size', size.toString());

        const headers = this.getAuthHeaders();

        return this.http.get<any>(`${this.API_BASE_URL}/posts/search`, {
            headers,
            params,
            withCredentials: false
        }).pipe(
            map((response: any) => {
                // Handle response format differences
                if (response && !response.hasOwnProperty('content')) {
                    return {
                        content: Array.isArray(response) ? response : [],
                        totalElements: Array.isArray(response) ? response.length : 0,
                        totalPages: 1,
                        size: size,
                        number: page
                    } as PostsResponse;
                }
                return response as PostsResponse;
            })
        );
    }

    // Get posts by location
    getPostsByLocation(location: string, page: number = 0, size: number = 10): Observable<PostsResponse> {
        const params = new HttpParams()
            .set('location', location)
            .set('page', page.toString())
            .set('size', size.toString());

        const headers = this.getAuthHeaders();

        return this.http.get<any>(`${this.API_BASE_URL}/posts/location`, {
            headers,
            params,
            withCredentials: false
        }).pipe(
            map((response: any) => {
                // Handle response format differences
                if (response && !response.hasOwnProperty('content')) {
                    return {
                        content: Array.isArray(response) ? response : [],
                        totalElements: Array.isArray(response) ? response.length : 0,
                        totalPages: 1,
                        size: size,
                        number: page
                    } as PostsResponse;
                }
                return response as PostsResponse;
            })
        );
    }

    // Get posts by tags
    getPostsByTags(tags: string[], page: number = 0, size: number = 10): Observable<PostsResponse> {
        const params = new HttpParams()
            .set('tags', tags.join(','))
            .set('page', page.toString())
            .set('size', size.toString());

        const headers = this.getAuthHeaders();

        return this.http.get<any>(`${this.API_BASE_URL}/posts/tags`, {
            headers,
            params,
            withCredentials: false
        }).pipe(
            map((response: any) => {
                // Handle response format differences
                if (response && !response.hasOwnProperty('content')) {
                    return {
                        content: Array.isArray(response) ? response : [],
                        totalElements: Array.isArray(response) ? response.length : 0,
                        totalPages: 1,
                        size: size,
                        number: page
                    } as PostsResponse;
                }
                return response as PostsResponse;
            })
        );
    }

    // Create a new post
    createPost(post: PostCreate): Observable<Post> {
        const headers = this.getAuthHeaders();
        return this.http.post<any>(`${this.API_BASE_URL}/posts`, post, {
            headers,
            withCredentials: false
        }).pipe(
            map((response: any) => {
                // Handle enhanced response format
                if (response && response.success && response.data) {
                    return this.processPost(response.data);
                } else if (response && response.id) {
                    // Direct post object response
                    return this.processPost(response);
                } else {
                    throw new Error('Invalid response format from create post');
                }
            })
        );
    }

    // Update a post
    updatePost(id: string, post: PostUpdate): Observable<Post> {
        const headers = this.getAuthHeaders();
        return this.http.put<any>(`${this.API_BASE_URL}/posts/${id}`, post, {
            headers,
            withCredentials: false
        }).pipe(
            map((response: any) => {
                // Handle enhanced response format
                if (response && response.success && response.data) {
                    return this.processPost(response.data);
                } else {
                    return this.processPost(response);
                }
            })
        );
    }

    // Delete a post
    deletePost(id: string): Observable<void> {
        const headers = this.getAuthHeaders();
        return this.http.delete<void>(`${this.API_BASE_URL}/posts/${id}`, {
            headers,
            withCredentials: false
        });
    }

    // Upvote a post
    upvotePost(id: string): Observable<Post> {
        const headers = this.getAuthHeaders();
        return this.http.post<Post>(`${this.API_BASE_URL}/posts/${id}/upvote`, {}, {
            headers,
            withCredentials: false
        });
    }

    // Downvote a post
    downvotePost(id: string): Observable<Post> {
        const headers = this.getAuthHeaders();
        return this.http.post<Post>(`${this.API_BASE_URL}/posts/${id}/downvote`, {}, {
            headers,
            withCredentials: false
        });
    }

    // COMMENTS API ENDPOINTS

    // Get comments for a post with pagination
    getComments(postId: string, page: number = 0, size: number = 10): Observable<CommentsResponse> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        const headers = this.getAuthHeaders();
        return this.http.get<CommentsResponse>(`${this.API_BASE_URL}/posts/${postId}/comments`, {
            headers,
            params,
            withCredentials: false
        });
    }

    // Get a specific comment
    getComment(postId: string, commentId: string): Observable<Comment> {
        const headers = this.getAuthHeaders();
        return this.http.get<Comment>(`${this.API_BASE_URL}/posts/${postId}/comments/${commentId}`, {
            headers,
            withCredentials: false
        });
    }

    // Create a comment
    createComment(postId: string, comment: CommentCreate): Observable<Comment> {
        const headers = this.getAuthHeaders();
        return this.http.post<Comment>(`${this.API_BASE_URL}/posts/${postId}/comments`, comment, {
            headers,
            withCredentials: false
        });
    }

    // Update a comment
    updateComment(postId: string, commentId: string, comment: CommentUpdate): Observable<Comment> {
        const headers = this.getAuthHeaders();
        return this.http.put<Comment>(`${this.API_BASE_URL}/posts/${postId}/comments/${commentId}`, comment, {
            headers,
            withCredentials: false
        });
    }

    // Delete a comment
    deleteComment(postId: string, commentId: string): Observable<void> {
        const headers = this.getAuthHeaders();
        return this.http.delete<void>(`${this.API_BASE_URL}/posts/${postId}/comments/${commentId}`, {
            headers,
            withCredentials: false
        });
    }

    // Upvote a comment
    upvoteComment(postId: string, commentId: string): Observable<Comment> {
        const headers = this.getAuthHeaders();
        return this.http.post<Comment>(`${this.API_BASE_URL}/posts/${postId}/comments/${commentId}/upvote`, {}, {
            headers,
            withCredentials: false
        });
    }

    // Downvote a comment
    downvoteComment(postId: string, commentId: string): Observable<Comment> {
        const headers = this.getAuthHeaders();
        return this.http.post<Comment>(`${this.API_BASE_URL}/posts/${postId}/comments/${commentId}/downvote`, {}, {
            headers,
            withCredentials: false
        });
    }

    // MEDIA API ENDPOINTS

    // Get media for a post
    getMedia(postId: string): Observable<Media[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<Media[]>(`${this.API_BASE_URL}/posts/${postId}/media`, {
            headers,
            withCredentials: false
        });
    }

    // Upload media for a post
    uploadMedia(postId: string, files: File[]): Observable<Media[]> {
        const formData = new FormData();

        // According to the API docs, use 'file' as the parameter name
        files.forEach((file, index) => {
            console.log(`📎 Appending file ${index + 1}:`, {
                name: file.name,
                size: file.size,
                type: file.type
            });
            formData.append('file', file);
        });

        // For file uploads, we need to create headers without Content-Type so browser sets it with boundary
        const authData = this.getStoredAuthData();
        console.log('🔐 Auth data available:', !!authData);

        let headers = new HttpHeaders();

        if (authData) {
            const credentials = btoa(`${authData.username}:${authData.password}`);
            headers = headers.set('Authorization', `Basic ${credentials}`);
            console.log('🔑 Authorization header set for user:', authData.username);
        } else {
            console.warn('⚠️ No auth data found for media upload!');
        }

        const uploadUrl = `${this.API_BASE_URL}/posts/${postId}/media/upload`;
        console.log('🌐 Upload URL:', uploadUrl);
        console.log('📋 FormData entries:');
        formData.forEach((value, key) => {
            if (value instanceof File) {
                console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
            } else {
                console.log(`  ${key}: ${value}`);
            }
        });

        return this.http.post<any>(uploadUrl, formData, {
            headers: headers,
            withCredentials: false
        }).pipe(
            map((response: any) => {
                console.log('✅ Media upload response:', response);
                // Handle enhanced response format
                if (response && response.success && response.data) {
                    // Enhanced format - data could be single object or array
                    const result = Array.isArray(response.data) ? response.data : [response.data];
                    console.log('📤 Processed upload result:', result);
                    return result;
                } else if (Array.isArray(response)) {
                    // Direct array response
                    console.log('📤 Direct array response:', response);
                    return response;
                } else if (response) {
                    // Single object response
                    const result = [response];
                    console.log('📤 Single object response wrapped in array:', result);
                    return result;
                } else {
                    console.warn('⚠️ Empty or invalid response from media upload');
                    return [];
                }
            }),
            catchError(error => {
                console.error('❌ Media upload error details:', {
                    status: error.status,
                    statusText: error.statusText,
                    url: error.url,
                    message: error.message,
                    error: error.error
                });
                throw error;
            })
        );
    }

    // Delete media
    deleteMedia(postId: string, mediaId: string): Observable<void> {
        const headers = this.getAuthHeaders();
        return this.http.delete<void>(`${this.API_BASE_URL}/posts/${postId}/media/${mediaId}`, {
            headers,
            withCredentials: false
        });
    }

    /**
     * Fetch media file with authentication headers and return as blob URL
     * This solves the issue where background-image requests don't include auth headers
     */
    getMediaBlob(mediaUrl: string): Observable<string> {
        const headers = this.getAuthHeaders();

        return this.http.get(mediaUrl, {
            headers,
            responseType: 'blob'
        }).pipe(
            map((blob: Blob) => {
                // Create a blob URL that can be used in img src or background-image
                return URL.createObjectURL(blob);
            }),
            catchError(error => {
                console.error('❌ Error fetching media blob:', error);
                // Return empty string for failed loads
                return of('');
            })
        );
    }
}
