import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Post, PostCreate, PostUpdate, PostsResponse } from '../models/post.model';
import { Comment, CommentCreate, CommentUpdate, CommentsResponse } from '../models/comment.model';
import { Media, MediaType } from '../models/media.model';
import { EnvironmentConfig } from '../config/environment.config';
import { CentralizedAuthService } from './centralized-auth.service';
import { BackendStatusService } from './backend-status.service';
import { ApiResponseHandler } from '../utils/api-response-handler';
import { PaginationHandler } from '../utils/pagination-handler';
import { ErrorHandler, ApiError } from '../utils/error-handler';

@Injectable({
    providedIn: 'root'
})
export class PostService {
    // API base URL (EnvironmentConfig now returns '/api' in dev for proxy, full absolute in prod)
    private readonly API_BASE_URL = this.normalizeBaseUrl(EnvironmentConfig.getApiBaseUrl());

    constructor(private http: HttpClient, private auth: CentralizedAuthService, private backendStatus: BackendStatusService) { }

    private normalizeBaseUrl(url: string): string {
        if (!url) return '';
        if (url === '/api') return url; // keep proxy root
        return url.replace(/\/+$/, '');
    }

    private buildUrl(path: string): string {
        if (!path.startsWith('/')) path = '/' + path;
        const full = `${this.API_BASE_URL}${path}`;
        return full.replace(/([^:])\/\//g, '$1/');
    }

    // Rely on interceptor for Authorization. Angular sets JSON headers automatically for JSON bodies.

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
            if (!url) return '';
            // Already absolute
            if (url.startsWith('http://') || url.startsWith('https://')) return url;

            // If we're in proxy mode (/api) and backend already returned a proxied path beginning with /api/, don't prefix again
            if (this.API_BASE_URL === '/api' && url.startsWith('/api/')) return url.replace(/\/api\/api\//g, '/api/');

            let built: string;
            if (url.startsWith('/')) {
                built = `${this.API_BASE_URL}${url}`;
            } else {
                built = `${this.API_BASE_URL}/${url}`;
            }
            // Collapse accidental double /api/ segments or duplicate slashes
            built = built.replace(/\/api\/api\//g, '/api/').replace(/([^:])\/\/+/, '$1/');
            if (localStorage.getItem('travner_debug') === 'true' && built.includes('/api/api/')) {
                console.warn('[PostService] Detected unresolved double /api/ in media URL', { original: url, built });
            }
            return built;
        });
    }

    /**
     * Process a single post to fix media URLs and other transformations
     * Updated to handle the new API response format with nested author object
     */
    private processPost(post: any): Post {
        // Handle the new API response format with nested author object
        let author: { id: string; userName: string; firstName: string; lastName: string };

        if (post.author && typeof post.author === 'object') {
            // Use the nested author object from the API response
            author = {
                id: post.author.id || '',
                userName: post.author.userName || post.author.username || '',
                firstName: post.author.firstName || '',
                lastName: post.author.lastName || ''
            };
        } else {
            // Fallback for old format or missing author object
            console.warn('[PostService] Post missing author object, using fallback:', {
                postId: post.id,
                author: post.author
            });

            // Try to derive author info from flat fields (backward compatibility)
            author = {
                id: post.authorId || post.author_id || post.userId || post.user_id || '',
                userName: post.userName || post.username || post.authorName || '',
                firstName: post.firstName || '',
                lastName: post.lastName || ''
            };
        }

        const processed: Post = {
            ...post,
            author: author,
            mediaUrls: this.processMediaUrls(post.mediaUrls)
        };

        // Debug instrumentation (enabled via localStorage flag)
        try {
            if (localStorage.getItem('travner_debug') === 'true') {
                console.debug('[PostService] Processed post:', {
                    postId: processed.id,
                    author: processed.author,
                    mediaUrls: processed.mediaUrls
                });
            }
        } catch { }

        return processed;
    }

    // POSTS API ENDPOINTS

    // Unified parsing logic for any posts list style according to backend docs
    private parsePostsList(response: any, page: number, size: number): PostsResponse {
        // Use our standardized API response handler to normalize base shape
        const parsedResponse = ApiResponseHandler.parsePaginatedResponse<Post>(response, page, size);

        // Extract content and pagination robustly across variants
        let content: Post[] = [];
        let totalElements = 0;
        let totalPages = 0;
        let pageSize = size;
        let pageNumber = page;

        // Prefer normalized pagination if available
        if (parsedResponse.pagination) {
            totalElements = parsedResponse.pagination.totalElements ?? totalElements;
            totalPages = parsedResponse.pagination.totalPages ?? totalPages;
            pageSize = parsedResponse.pagination.size ?? pageSize;
            pageNumber = parsedResponse.pagination.page ?? pageNumber;
        }

        // Determine the data block that may contain posts
        const dataBlock: any =
            parsedResponse?.data ?? // { success, data }
            response?.data ??        // raw { data }
            response;                // raw list or Spring-style

        if (Array.isArray(dataBlock)) {
            // Direct array of posts
            content = dataBlock.map((p: any) => this.processPost(p));
        } else if (dataBlock && Array.isArray(dataBlock.content)) {
            // Spring-style or wrapped content array
            content = dataBlock.content.map((p: any) => this.processPost(p));
            // Try to infer pagination when not provided by handler
            if (!parsedResponse.pagination) {
                totalElements = dataBlock.totalElements ?? dataBlock.total_elements ?? content.length;
                pageSize = dataBlock.size ?? size;
                pageNumber = dataBlock.number ?? dataBlock.page ?? page;
                totalPages = dataBlock.totalPages ?? dataBlock.total_pages ?? Math.max(1, Math.ceil(totalElements / (pageSize || 1)));
            }
        } else if (dataBlock && Array.isArray((dataBlock as any).items)) {
            // Generic items list fallback
            const items = (dataBlock as any).items;
            content = items.map((p: any) => this.processPost(p));
            if (!parsedResponse.pagination) {
                totalElements = (dataBlock as any).total ?? items.length;
                totalPages = Math.max(1, Math.ceil(totalElements / (size || 1)));
            }
        } else if (dataBlock && typeof dataBlock === 'object') {
            // Possibly a single post object
            if ('id' in dataBlock || 'title' in dataBlock || 'author' in dataBlock) {
                content = [this.processPost(dataBlock)];
                if (!parsedResponse.pagination) {
                    totalElements = 1;
                    totalPages = 1;
                    pageSize = 1;
                    pageNumber = 0;
                }
            }
        }

        // Final fallback
        if (content.length === 0) {
            totalElements = 0;
            totalPages = 0;
        } else if (!totalElements) {
            totalElements = content.length;
            totalPages = Math.max(1, Math.ceil(totalElements / (pageSize || size || 1)));
        }

        return {
            content,
            totalElements,
            totalPages,
            size: pageSize,
            number: pageNumber
        } as PostsResponse;
    }

    // Get all posts with pagination (PUBLIC)
    getPosts(page: number = 0, size: number = 10): Observable<PostsResponse> {
        const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
        const url = this.buildUrl('/posts');
        if (localStorage.getItem('travner_debug') === 'true' && page === 0 && size === 10) {
            console.log('[PostService] Fetching posts:', { url, page, size, base: this.API_BASE_URL });
        }
        return this.http.get<any>(url, { params, withCredentials: false }).pipe(
            map(response => {
                // Backend returns proper JSON, no need for text parsing
                console.log('[PostService] Received JSON response:', response);

                // Use existing parsePostsList method to handle response format
                const result = this.parsePostsList(response, page, size);
                this.backendStatus.reportSuccess('posts:list:proxy');
                return result;
            }),
            catchError(err => {
                // Use our standardized error handler
                if (err instanceof HttpErrorResponse) {
                    const parsedError: ApiError = ErrorHandler.parseHttpError(err);
                    console.error('[PostService] getPosts transport error (non-HTML fallback)', {
                        url,
                        page,
                        size,
                        status: parsedError.status,
                        message: parsedError.message
                    });
                    return throwError(parsedError);
                }

                console.error('[PostService] getPosts transport error (non-HTML fallback)', { url, page, size, status: err.status, message: err.message });
                return throwError(() => err);
            })
        ) as Observable<PostsResponse>;
    }

    // Removed direct HTML fallback to simplify: rely on proxy and backend endpoints only

    // Get a specific post by ID
    getPostById(id: string): Observable<Post> {
        const url = this.buildUrl(`/posts/${id}`);
        return this.http.get<any>(url, {
            withCredentials: false
        }).pipe(
            map((response: any) => {
                // Handle enhanced response format
                if (response && response.success && response.data) {
                    // data may be post itself or wrapped again
                    const data = response.data;
                    if (data && data.content && Array.isArray(data.content) && data.content.length === 1) {
                        return this.processPost(data.content[0]);
                    }
                    return this.processPost(data);
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
        const url = this.buildUrl(`/posts/user/${username}`);
        return this.http.get<any>(url, {
            params,
            withCredentials: false
        }).pipe(
            map(resp => this.parsePostsList(resp, page, size))
        );
    }

    // Search posts
    searchPosts(query: string, page: number = 0, size: number = 10): Observable<PostsResponse> {
        const params = new HttpParams()
            .set('query', query)
            .set('page', page.toString())
            .set('size', size.toString());
        const url = this.buildUrl('/posts/search');
        return this.http.get<any>(url, {
            params,
            withCredentials: false
        }).pipe(
            map(resp => this.parsePostsList(resp, page, size))
        );
    }

    // Get posts by location
    getPostsByLocation(location: string, page: number = 0, size: number = 10): Observable<PostsResponse> {
        const params = new HttpParams()
            .set('location', location)
            .set('page', page.toString())
            .set('size', size.toString());
        const url = this.buildUrl('/posts/location');
        return this.http.get<any>(url, {
            params,
            withCredentials: false
        }).pipe(
            map(resp => this.parsePostsList(resp, page, size))
        );
    }

    // Get posts by tags
    getPostsByTags(tags: string[], page: number = 0, size: number = 10): Observable<PostsResponse> {
        const params = new HttpParams()
            .set('tags', tags.join(','))
            .set('page', page.toString())
            .set('size', size.toString());
        const url = this.buildUrl('/posts/tags');
        return this.http.get<any>(url, {
            params,
            withCredentials: false
        }).pipe(
            map(resp => this.parsePostsList(resp, page, size))
        );
    }

    // Create a new post
    createPost(post: PostCreate): Observable<Post> {
        const url = this.buildUrl('/posts');

        // Add debugging
        console.log('[PostService] Creating post:', {
            url,
            postData: post,
            note: 'Relying on interceptor for Authorization'
        });

        return this.http.post<any>(url, post, { withCredentials: false }).pipe(
            map((response: any) => {
                console.log('[PostService] Create post response:', response);

                // Handle enhanced response format
                if (response && response.success && response.data) {
                    // New API format: { success: boolean, data: Post }
                    return this.processPost(response.data);
                } else if (response && response.id) {
                    // Direct post object response
                    return this.processPost(response);
                } else {
                    console.error('[PostService] Invalid create response format:', response);
                    throw new Error('Invalid response format from create post');
                }
            }),
            catchError((error: HttpErrorResponse) => {
                console.error('[PostService] Create post error:', error);
                console.error('[PostService] Error details:', {
                    status: error.status,
                    statusText: error.statusText,
                    message: error.message,
                    error: error.error
                });

                let errorMessage = 'Failed to create post. ';
                if (error.status === 401) {
                    errorMessage += 'Please sign in to create a post.';
                } else if (error.status === 400) {
                    errorMessage += 'Please check your input and try again.';
                    // Try to extract more specific error from response
                    if (error.error && error.error.message) {
                        errorMessage += ` (${error.error.message})`;
                    }
                } else if (error.status === 403) {
                    errorMessage += 'You do not have permission to create posts.';
                } else if (error.status === 0) {
                    errorMessage += 'Network error. Please check your connection.';
                } else {
                    errorMessage += 'Please try again later.';
                    if (error.error && error.error.message) {
                        errorMessage += ` (${error.error.message})`;
                    }
                }
                return throwError(() => new Error(errorMessage));
            })
        );
    }

    // Update a post
    updatePost(id: string, post: PostUpdate): Observable<Post> {
        // Optional client-side ownership hint (server must enforce)
        const currentUser = this.auth.getCurrentUser();
        if (!currentUser) {
            throw new Error('Not authenticated');
        }
        const url = this.buildUrl(`/posts/${id}`);
        return this.http.put<any>(url, post, { withCredentials: false }).pipe(
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
        const currentUser = this.auth.getCurrentUser();
        if (!currentUser) {
            throw new Error('Not authenticated');
        }
        const url = this.buildUrl(`/posts/${id}`);
        return this.http.delete<void>(url, { withCredentials: false });
    }

    // Upvote a post
    upvotePost(id: string): Observable<Post> {
        const url = this.buildUrl(`/posts/${id}/upvote`);
        return this.http.post<Post>(url, {}, { withCredentials: false });
    }

    // Downvote a post
    downvotePost(id: string): Observable<Post> {
        const url = this.buildUrl(`/posts/${id}/downvote`);
        return this.http.post<Post>(url, {}, { withCredentials: false });
    }

    // COMMENTS API ENDPOINTS

    // Get comments for a post with pagination
    getComments(postId: string, page: number = 0, size: number = 10): Observable<CommentsResponse> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        const url = this.buildUrl(`/posts/${postId}/comments`);
        return this.http.get<CommentsResponse>(url, { params, withCredentials: false });
    }

    // Get a specific comment
    getComment(postId: string, commentId: string): Observable<Comment> {
        const url = this.buildUrl(`/posts/${postId}/comments/${commentId}`);
        return this.http.get<Comment>(url, { withCredentials: false });
    }

    // Create a comment
    createComment(postId: string, comment: CommentCreate): Observable<Comment> {
        const url = this.buildUrl(`/posts/${postId}/comments`);
        return this.http.post<Comment>(url, comment, { withCredentials: false });
    }

    // Update a comment
    updateComment(postId: string, commentId: string, comment: CommentUpdate): Observable<Comment> {
        const url = this.buildUrl(`/posts/${postId}/comments/${commentId}`);
        return this.http.put<Comment>(url, comment, { withCredentials: false });
    }

    // Delete a comment
    deleteComment(postId: string, commentId: string): Observable<void> {
        const url = this.buildUrl(`/posts/${postId}/comments/${commentId}`);
        return this.http.delete<void>(url, { withCredentials: false });
    }

    // Upvote a comment
    upvoteComment(postId: string, commentId: string): Observable<Comment> {
        const url = this.buildUrl(`/posts/${postId}/comments/${commentId}/upvote`);
        return this.http.post<Comment>(url, {}, { withCredentials: false });
    }

    // Downvote a comment
    downvoteComment(postId: string, commentId: string): Observable<Comment> {
        const url = this.buildUrl(`/posts/${postId}/comments/${commentId}/downvote`);
        return this.http.post<Comment>(url, {}, { withCredentials: false });
    }

    // MEDIA API ENDPOINTS

    /**
     * Process media object from API response to ensure consistent format
     */
    private processMedia(media: any): Media {
        return {
            id: media.id || '',
            fileName: media.fileName || '',
            fileUrl: media.fileUrl || media.url || '',
            fileType: media.fileType || media.type || '',
            fileSize: Number(media.fileSize) || 0,
            uploaderId: media.uploaderId || '',
            postId: media.postId || '',
            uploadedAt: media.uploadedAt || media.createdAt || '',
            // Legacy backward compatibility
            url: media.fileUrl || media.url || '',
            type: this.mapFileTypeToMediaType(media.fileType || media.type || ''),
            createdAt: media.uploadedAt || media.createdAt || ''
        };
    }

    /**
     * Map file type string to MediaType enum
     */
    private mapFileTypeToMediaType(fileType: string): MediaType {
        if (fileType.startsWith('image/')) {
            return MediaType.IMAGE;
        } else if (fileType.startsWith('video/')) {
            return MediaType.VIDEO;
        }
        // Default to IMAGE for unknown types
        return MediaType.IMAGE;
    }

    // Get media for a post
    getMedia(postId: string): Observable<Media[]> {
        const url = this.buildUrl(`/posts/${postId}/media`);
        return this.http.get<any>(url, { withCredentials: false }).pipe(
            map((response: any) => {
                if (response && response.success && response.data) {
                    // Enhanced API response format
                    const mediaData = Array.isArray(response.data) ? response.data : [response.data];
                    return mediaData.map((media: any) => this.processMedia(media));
                } else if (Array.isArray(response)) {
                    // Direct array response
                    return response.map((media: any) => this.processMedia(media));
                } else {
                    console.warn('[PostService] Unexpected media list response format', response);
                    return [];
                }
            })
        );
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

        // Use the same URL builder as other post endpoints to ensure consistent proxying
        const primaryUploadUrl = this.buildUrl(`/posts/${postId}/media/upload`);
        const fallbackUploadUrl = this.buildUrl(`/posts/${postId}/media`); // some backends accept POST here
        console.log('🌐 Upload URL (primary):', primaryUploadUrl);
        console.log('🌐 Upload URL (fallback):', fallbackUploadUrl);
        console.log('📋 FormData entries:');
        formData.forEach((value, key) => {
            if (value instanceof File) {
                console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
            } else {
                console.log(`  ${key}: ${value}`);
            }
        });

        const doUpload = (url: string) => this.http.post<any>(url, formData, { withCredentials: false });

        return doUpload(primaryUploadUrl).pipe(
            map((response: any) => {
                console.log('✅ Media upload response:', response);
                // Handle enhanced response format
                if (response && response.success && response.data) {
                    // Enhanced format - data could be single object or array
                    const mediaData = Array.isArray(response.data) ? response.data : [response.data];
                    const result = mediaData.map((media: any) => this.processMedia(media));
                    console.log('📤 Processed upload result:', result);
                    return result;
                } else if (Array.isArray(response)) {
                    // Direct array response
                    const result = response.map((media: any) => this.processMedia(media));
                    console.log('📤 Direct array response processed:', result);
                    return result;
                } else if (response) {
                    // Single object response
                    const result = [this.processMedia(response)];
                    console.log('📤 Single object response processed:', result);
                    return result;
                } else {
                    console.warn('⚠️ Empty or invalid response from media upload');
                    return [];
                }
            }),
            catchError((error: HttpErrorResponse) => {
                console.error('❌ Media upload error (primary):', {
                    status: error.status,
                    statusText: error.statusText,
                    url: error.url,
                    message: error.message,
                    error: error.error
                });

                const isConnReset = error.status === 0 || /ECONNRESET|Connection reset/i.test(error.message || '');
                const mayTryFallback = isConnReset || error.status === 404 || error.status === 405;

                if (mayTryFallback) {
                    console.warn('↩️ Retrying media upload using fallback endpoint:', fallbackUploadUrl);
                    return doUpload(fallbackUploadUrl).pipe(
                        map((response: any) => {
                            console.log('✅ Media upload response (fallback):', response);
                            if (response && response.success && response.data) {
                                const mediaData = Array.isArray(response.data) ? response.data : [response.data];
                                const result = mediaData.map((media: any) => this.processMedia(media));
                                console.log('📤 Processed upload result (fallback):', result);
                                return result;
                            } else if (Array.isArray(response)) {
                                const result = response.map((media: any) => this.processMedia(media));
                                console.log('📤 Direct array response processed (fallback):', result);
                                return result;
                            } else if (response) {
                                const result = [this.processMedia(response)];
                                console.log('📤 Single object response processed (fallback):', result);
                                return result;
                            } else {
                                console.warn('⚠️ Empty or invalid response from media upload (fallback)');
                                return [];
                            }
                        }),
                        catchError((fallbackErr: HttpErrorResponse) => {
                            console.error('❌ Media upload error (fallback):', {
                                status: fallbackErr.status,
                                statusText: fallbackErr.statusText,
                                url: fallbackErr.url,
                                message: fallbackErr.message,
                                error: fallbackErr.error
                            });
                            let msg = 'Failed to upload media. ';
                            if (fallbackErr.status === 401) msg += 'Please sign in to upload media.';
                            else if (fallbackErr.status === 400) msg += 'Invalid file format or size.';
                            else if (fallbackErr.status === 0) msg += 'Network error. Please check your connection.';
                            else msg += 'Please try again later.';
                            return throwError(() => new Error(msg));
                        })
                    );
                }

                let errorMessage = 'Failed to upload media. ';
                if (error.status === 401) errorMessage += 'Please sign in to upload media.';
                else if (error.status === 400) errorMessage += 'Invalid file format or size.';
                else if (error.status === 0) errorMessage += 'Network error. Please check your connection.';
                else errorMessage += 'Please try again later.';
                return throwError(() => new Error(errorMessage));
            })
        );
    }

    // Delete media
    deleteMedia(postId: string, mediaId: string): Observable<void> {
        const url = this.buildUrl(`/posts/${postId}/media/${mediaId}`);
        return this.http.delete<void>(url, { withCredentials: false });
    }

    /**
     * Fetch media file with authentication headers and return as blob URL
     * This solves the issue where background-image requests don't include auth headers
     */
    getMediaBlob(mediaUrl: string): Observable<string> {
        const debug = localStorage.getItem('travner_debug') === 'true';
        return new Observable<string>(subscriber => {
            const attemptProxy = () => {
                console.log('[PostService] Attempting media blob request:', { mediaUrl });
                this.http.get(mediaUrl, { responseType: 'blob', observe: 'response' as const }).subscribe({
                    next: async resp => {
                        const blob = resp.body as Blob;
                        const type = blob?.type || resp.headers.get('Content-Type') || '';
                        const size = blob?.size || 0;
                        const status = resp.status;

                        console.log('[PostService] Media blob response details:', {
                            mediaUrl,
                            status,
                            type,
                            size,
                            contentType: resp.headers.get('Content-Type'),
                            responseHeaders: Array.from(resp.headers.keys()).map(key => ({ [key]: resp.headers.get(key) }))
                        });

                        let looksHtml = false;
                        if (type.includes('text/html') || type.includes('text/plain')) {
                            looksHtml = true;
                        } else if (size < 200_000) { // sniff small responses
                            try {
                                const text = await blob.text();
                                const low = text.trim().toLowerCase();
                                console.log('[PostService] Small blob content preview:', { mediaUrl, size, preview: low.substring(0, 200) });
                                if (low.startsWith('<!doctype html') || low.startsWith('<html')) {
                                    looksHtml = true;
                                } else if (debug && low.startsWith('{')) {
                                    console.warn('[PostService] Media endpoint returned JSON instead of binary', { mediaUrl, preview: low.substring(0, 80) });
                                }
                            } catch { /* ignore */ }
                        }

                        if (looksHtml) {
                            if (debug) console.warn('[PostService] Media proxy returned HTML fallback, attempting direct candidates...', { mediaUrl, type, size });
                            attemptDirect();
                            return;
                        }

                        // Validate blob before creating object URL
                        if (!blob || !(blob instanceof Blob) || blob.size === 0) {
                            console.warn('[PostService] Invalid blob received, attempting direct candidates', { mediaUrl, blob, type, size });
                            attemptDirect();
                            return;
                        }

                        try {
                            const url = URL.createObjectURL(blob);
                            subscriber.next(url);
                            subscriber.complete();
                        } catch (error) {
                            console.error('[PostService] Failed to create object URL for blob, attempting direct candidates', { mediaUrl, error, blob });
                            attemptDirect();
                        }
                    },
                    error: err => {
                        console.error('[PostService] Media proxy request failed, attempting direct candidates', { mediaUrl, status: err.status });
                        attemptDirect();
                    }
                });
            };

            const attemptDirect = () => {
                const override = localStorage.getItem('travner_backend_override');
                const directBase = (override || 'http://localhost:8080').replace(/\/$/, '');
                const storedPrefix = localStorage.getItem('travner_media_prefix');
                const path = mediaUrl.startsWith('/api/') ? mediaUrl.substring(4) : mediaUrl.startsWith('/') ? mediaUrl : '/' + mediaUrl;
                const candidates: string[] = [];
                if (storedPrefix) candidates.push(storedPrefix + path);
                candidates.push(
                    `${directBase}${path}`,
                    `${directBase}/api${path}` // in case backend actually expects /api prefix
                );
                const unique = Array.from(new Set(candidates));
                if (debug) console.log('[PostService] Media direct fetch candidates', unique);
                const auth = this.getStoredAuthData();
                const authHeader = auth ? 'Basic ' + btoa(`${auth.username}:${auth.password}`) : null;

                const tryIndex = (i: number) => {
                    if (i >= unique.length) {
                        if (debug) console.error('[PostService] All media direct candidates failed', { mediaUrl });
                        subscriber.next('');
                        subscriber.complete();
                        return;
                    }
                    const url = unique[i];
                    fetch(url, { headers: authHeader ? { 'Authorization': authHeader } : undefined })
                        .then(r => r.blob().then(b => ({ r, b })))
                        .then(({ r, b }) => {
                            const type = b.type || r.headers.get('Content-Type') || '';
                            if (type.includes('text/html')) {
                                if (debug) console.warn('[PostService] Media candidate returned HTML, trying next', { url });
                                return tryIndex(i + 1);
                            }
                            const objectUrl = URL.createObjectURL(b);
                            // Persist discovered working base prefix for faster future loads
                            const base = url.replace(path, '');
                            localStorage.setItem('travner_media_prefix', base);
                            subscriber.next(objectUrl);
                            subscriber.complete();
                        })
                        .catch(err => {
                            if (debug) console.error('[PostService] Media candidate network error', { url, err });
                            tryIndex(i + 1);
                        });
                };
                tryIndex(0);
            };

            attemptProxy();
        });
    }
}
