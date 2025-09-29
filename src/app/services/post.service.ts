import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Post, PostCreate, PostUpdate, PostsResponse } from '../models/post.model';
import { Comment, CommentCreate, CommentUpdate, CommentsResponse } from '../models/comment.model';
import { Media, MediaType } from '../models/media.model';
import { EnvironmentConfig } from '../config/environment.config';
import { AuthService } from './auth.service';
import { BackendStatusService } from './backend-status.service';

@Injectable({
    providedIn: 'root'
})
export class PostService {
    // API base URL (EnvironmentConfig now returns '/api' in dev for proxy, full absolute in prod)
    private readonly API_BASE_URL = this.normalizeBaseUrl(EnvironmentConfig.getApiBaseUrl());

    constructor(private http: HttpClient, private auth: AuthService, private backendStatus: BackendStatusService) { }

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

    /**
     * Get authentication headers for API requests
     * This uses the same authentication approach as AuthService
     */
    private getAuthHeaders(): HttpHeaders {
        // Get stored auth data from localStorage (same as AuthService)
        const authData = this.getStoredAuthData();

        if (!authData) {
            return new HttpHeaders();
        }

        // Use Basic Authentication (same as AuthService)
        const credentials = btoa(`${authData.username}:${authData.password}`);
        const headers = new HttpHeaders({
            'Authorization': `Basic ${credentials}`
        });

        return headers;
    }

    /**
     * For public endpoints: include Authorization header only if credentials exist.
     */
    private getOptionalAuthHeaders(): HttpHeaders {
        const authData = this.getStoredAuthData();
        if (!authData) return new HttpHeaders();
        const credentials = btoa(`${authData.username}:${authData.password}`);
        return new HttpHeaders({ 'Authorization': `Basic ${credentials}` });
    }

    /**
     * Get headers for JSON requests (POST/PUT) that need Content-Type
     */
    private getJsonHeaders(): HttpHeaders {
        const authData = this.getStoredAuthData();

        if (!authData) {
            return new HttpHeaders({
                'Content-Type': 'application/json'
            });
        }

        const credentials = btoa(`${authData.username}:${authData.password}`);
        return new HttpHeaders({
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
        });
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
    }    /**
     * Process a single post to fix media URLs and other transformations
     */
    private processPost(post: any): Post {
        // Attempt to derive a stable author identifier across multiple possible backend field shapes
        // Backend docs show userName frequently; posts may expose either a nested author object or flat fields.
        const derivedAuthorId =
            post.authorId ||
            post.author_id ||
            post.author?.id ||
            post.author?.userId ||
            post.author?.userID ||
            post.author?.uuid ||
            post.author?.user_id ||
            post.userId ||
            post.user_id ||
            post.user?.id ||
            post.user?.userId ||
            post.user?.uuid ||
            // fall back to username as identifier if no numeric/id style field present
            post.author?.userName ||
            post.author?.username ||
            post.userName ||
            post.username;

        const derivedAuthorName =
            post.author?.userName ||
            post.author?.username ||
            post.authorName ||
            post.userName ||
            post.username ||
            'Unknown';

        const processed: Post = {
            ...post,
            authorId: derivedAuthorId != null ? String(derivedAuthorId) : undefined,
            authorName: derivedAuthorName,
            mediaUrls: this.processMediaUrls(post.mediaUrls)
        };
        // Debug instrumentation (enabled via localStorage flag)
        try {
            if (localStorage.getItem('travner_debug') === 'true') {
                if (!processed.authorId) {
                    // Log once per post id to avoid spam
                    console.warn('[PostService] Missing authorId after processing post:', {
                        id: processed.id,
                        rawAuthor: post.author || post.user,
                        topLevelKeys: Object.keys(post || {}),
                        derivedAuthorId: processed.authorId,
                        fallbackFieldsTried: ['authorId', 'author_id', 'author.id', 'author.userId', 'author.userID', 'author.uuid', 'author.user_id', 'userId', 'user_id', 'user.id', 'user.userId', 'user.uuid', 'author.userName', 'author.username', 'userName', 'username']
                    });
                } else {
                    console.debug('[PostService] Processed post ownership mapping:', {
                        postId: processed.id,
                        authorId: processed.authorId,
                        authorName: processed.authorName
                    });
                }
            }
        } catch { }
        return processed;
    }

    // POSTS API ENDPOINTS

    // Unified parsing logic for any posts list style according to backend docs
    private parsePostsList(response: any, page: number, size: number): PostsResponse {
        // Wrapper with data possibly containing content or being the array directly
        if (response && response.success) {
            const data = response.data;
            const paginationFromRoot = response.pagination || response.page || response.pageInfo || {};
            // Case: data is a wrapper again containing content
            if (data && Array.isArray(data.content)) {
                const pagination = data.pagination || paginationFromRoot;
                return {
                    content: data.content.map((p: any) => this.processPost(p)),
                    totalElements: pagination?.totalElements || pagination?.total_items || data.totalElements || data.total_items || data.content.length,
                    totalPages: pagination?.totalPages || pagination?.total_pages || data.totalPages || 1,
                    size: pagination?.size || size,
                    number: pagination?.page || pagination?.pageNumber || page
                } as PostsResponse;
            }
            // Case: data itself is an array
            if (Array.isArray(data)) {
                return {
                    content: data.map((p: any) => this.processPost(p)),
                    totalElements: data.length,
                    totalPages: 1,
                    size,
                    number: page
                } as PostsResponse;
            }
            // Case: data is a page object (Spring style) with content
            if (data && Array.isArray(data.content)) {
                return {
                    content: data.content.map((p: any) => this.processPost(p)),
                    totalElements: data.totalElements || data.total_elements || data.content.length,
                    totalPages: data.totalPages || data.total_pages || 1,
                    size: data.size || size,
                    number: data.number || data.page || page
                } as PostsResponse;
            }
        }
        // Direct Spring page w/out wrapper
        if (response && Array.isArray(response.content)) {
            return {
                ...response,
                content: response.content.map((p: any) => this.processPost(p))
            } as PostsResponse;
        }
        // Simple array
        if (Array.isArray(response)) {
            return {
                content: response.map((p: any) => this.processPost(p)),
                totalElements: response.length,
                totalPages: 1,
                size,
                number: page
            } as PostsResponse;
        }
        console.warn('[PostService] Unexpected posts list format', response);
        return { content: [], totalElements: 0, totalPages: 0, size, number: page } as PostsResponse;
    }

    // Get all posts with pagination (PUBLIC)
    getPosts(page: number = 0, size: number = 10): Observable<PostsResponse> {
        const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
        const headers = this.getOptionalAuthHeaders();
        const url = this.buildUrl('/posts');
        if (localStorage.getItem('travner_debug') === 'true' && page === 0 && size === 10) {
            console.log('[PostService] Fetching posts:', { url, page, size, base: this.API_BASE_URL });
        }
        return this.http.get(url, { headers, params, withCredentials: false, responseType: 'text' }).pipe(
            map(raw => {
                const trimmed = raw.trim().toLowerCase();
                const isHtml = trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html');
                if (isHtml) {
                    console.warn('[PostService] HTML fallback detected for posts list via proxy. Attempting direct backend retry...', { firstUrl: url });
                    this.backendStatus.reportHtmlFallback('posts:list:proxy');
                    // Attempt one synchronous-like fallback by throwing an identifiable object we catch below
                    throw { __htmlFallback: true, raw };
                }
                let parsed: any;
                try { parsed = JSON.parse(raw); } catch (e) {
                    const jsonMatch = raw.match(/\{[\s\S]*\}$/);
                    if (jsonMatch) { try { parsed = JSON.parse(jsonMatch[0]); } catch { /* ignore */ } }
                    if (!parsed) {
                        console.error('[PostService] Failed to parse posts JSON after proxy response', { url, snippet: raw.substring(0, 200) });
                        return { content: [], totalElements: 0, totalPages: 0, size, number: page } as PostsResponse;
                    }
                }
                const parsedList = this.parsePostsList(parsed, page, size);
                this.backendStatus.reportSuccess('posts:list:proxy');
                return parsedList;
            }),
            catchError(err => {
                if (err && err.__htmlFallback) {
                    return this.attemptDirectPostsFetch(page, size);
                }
                console.error('[PostService] getPosts transport error (non-HTML fallback)', { url, page, size, status: err.status, message: err.message });
                throw err;
            })
        ) as Observable<PostsResponse>;
    }

    /** Build Basic auth headers for direct fetch fallback */
    private buildDirectHeaders(): Headers {
        const headers = new Headers();
        const auth = this.getStoredAuthData();
        if (auth) headers.set('Authorization', 'Basic ' + btoa(`${auth.username}:${auth.password}`));
        return headers;
    }

    /** Attempt multiple direct backend candidate endpoints for posts when proxy served HTML */
    private attemptDirectPostsFetch(page: number, size: number): Observable<PostsResponse> {
        const override = localStorage.getItem('travner_backend_override');
        const directBase = (override || 'http://localhost:8080').replace(/\/$/, '');
        const discovered = localStorage.getItem('travner_posts_endpoint');
        const debug = localStorage.getItem('travner_debug') === 'true';
        const candidates: string[] = [];
        if (discovered) candidates.push(discovered); // prefer previously good one
        candidates.push(
            `${directBase}/posts`,
            `${directBase}/api/posts`,
            `${directBase}/api/v1/posts`
        );
        // de-dupe
        const unique = [...new Set(candidates)];
        if (debug) console.log('[PostService] Direct fetch candidate endpoints:', unique);
        const headers = this.buildDirectHeaders();
        return new Observable<PostsResponse>(subscriber => {
            const tryNext = (index: number) => {
                if (index >= unique.length) {
                    console.error('[PostService] All direct post endpoint candidates failed (HTML or parse).');
                    this.backendStatus.reportHtmlFallback('posts:list:direct-all-failed');
                    subscriber.next({ content: [], totalElements: 0, totalPages: 0, size, number: page });
                    subscriber.complete();
                    return;
                }
                const endpoint = unique[index];
                if (debug) console.log('[PostService] Trying direct posts endpoint candidate', { endpoint });
                fetch(`${endpoint}?page=${page}&size=${size}`, { headers: headers as any })
                    .then(r => r.text().then(t => ({ status: r.status, text: t })))
                    .then(({ status, text }) => {
                        const low = text.trim().toLowerCase();
                        const isHtml = low.startsWith('<!doctype html') || low.startsWith('<html');
                        if (isHtml) {
                            if (debug) console.warn('[PostService] Candidate returned HTML fallback, trying next', { endpoint, status });
                            return tryNext(index + 1);
                        }
                        try {
                            const parsed = JSON.parse(text);
                            const result = this.parsePostsList(parsed, page, size);
                            // Persist working endpoint (even if empty list) to avoid re-trying all candidates next time
                            localStorage.setItem('travner_posts_endpoint', endpoint);
                            this.backendStatus.reportSuccess('posts:list:direct');
                            subscriber.next(result);
                        } catch (e2) {
                            console.error('[PostService] JSON parse failed for candidate, trying next', { endpoint, snippet: text.substring(0, 120) });
                            return tryNext(index + 1);
                        }
                        subscriber.complete();
                    })
                    .catch(err => {
                        console.error('[PostService] Network error for candidate, trying next', { endpoint, error: err });
                        tryNext(index + 1);
                    });
            };
            tryNext(0);
        });
    }

    // Get a specific post by ID
    getPostById(id: string): Observable<Post> {
        const headers = this.getOptionalAuthHeaders(); // public endpoint
        const url = this.buildUrl(`/posts/${id}`);
        return this.http.get<any>(url, {
            headers,
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
        const headers = this.getOptionalAuthHeaders(); // public
        const url = this.buildUrl(`/posts/user/${username}`);
        return this.http.get<any>(url, {
            headers,
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
        const headers = this.getOptionalAuthHeaders(); // public
        const url = this.buildUrl('/posts/search');
        return this.http.get<any>(url, {
            headers,
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
        const headers = this.getOptionalAuthHeaders(); // public
        const url = this.buildUrl('/posts/location');
        return this.http.get<any>(url, {
            headers,
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
        const headers = this.getOptionalAuthHeaders(); // public
        const url = this.buildUrl('/posts/tags');
        return this.http.get<any>(url, {
            headers,
            params,
            withCredentials: false
        }).pipe(
            map(resp => this.parsePostsList(resp, page, size))
        );
    }

    // Create a new post
    createPost(post: PostCreate): Observable<Post> {
        const headers = this.getJsonHeaders();
        const url = this.buildUrl('/posts');
        return this.http.post<any>(url, post, {
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
        // Optional client-side ownership hint (server must enforce)
        const currentUser = this.auth.getCurrentUser();
        if (!currentUser) {
            throw new Error('Not authenticated');
        }
        const headers = this.getJsonHeaders();
        const url = this.buildUrl(`/posts/${id}`);
        return this.http.put<any>(url, post, {
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
        const currentUser = this.auth.getCurrentUser();
        if (!currentUser) {
            throw new Error('Not authenticated');
        }
        const headers = this.getAuthHeaders();
        const url = this.buildUrl(`/posts/${id}`);
        return this.http.delete<void>(url, {
            headers,
            withCredentials: false
        });
    }

    // Upvote a post
    upvotePost(id: string): Observable<Post> {
        const headers = this.getAuthHeaders();
        const url = this.buildUrl(`/posts/${id}/upvote`);
        return this.http.post<Post>(url, {}, {
            headers,
            withCredentials: false
        });
    }

    // Downvote a post
    downvotePost(id: string): Observable<Post> {
        const headers = this.getAuthHeaders();
        const url = this.buildUrl(`/posts/${id}/downvote`);
        return this.http.post<Post>(url, {}, {
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
        const url = this.buildUrl(`/posts/${postId}/comments`);
        return this.http.get<CommentsResponse>(url, {
            headers,
            params,
            withCredentials: false
        });
    }

    // Get a specific comment
    getComment(postId: string, commentId: string): Observable<Comment> {
        const headers = this.getAuthHeaders();
        const url = this.buildUrl(`/posts/${postId}/comments/${commentId}`);
        return this.http.get<Comment>(url, {
            headers,
            withCredentials: false
        });
    }

    // Create a comment
    createComment(postId: string, comment: CommentCreate): Observable<Comment> {
        const headers = this.getJsonHeaders();
        const url = this.buildUrl(`/posts/${postId}/comments`);
        return this.http.post<Comment>(url, comment, {
            headers,
            withCredentials: false
        });
    }

    // Update a comment
    updateComment(postId: string, commentId: string, comment: CommentUpdate): Observable<Comment> {
        const headers = this.getJsonHeaders();
        const url = this.buildUrl(`/posts/${postId}/comments/${commentId}`);
        return this.http.put<Comment>(url, comment, {
            headers,
            withCredentials: false
        });
    }

    // Delete a comment
    deleteComment(postId: string, commentId: string): Observable<void> {
        const headers = this.getAuthHeaders();
        const url = this.buildUrl(`/posts/${postId}/comments/${commentId}`);
        return this.http.delete<void>(url, {
            headers,
            withCredentials: false
        });
    }

    // Upvote a comment
    upvoteComment(postId: string, commentId: string): Observable<Comment> {
        const headers = this.getAuthHeaders();
        const url = this.buildUrl(`/posts/${postId}/comments/${commentId}/upvote`);
        return this.http.post<Comment>(url, {}, {
            headers,
            withCredentials: false
        });
    }

    // Downvote a comment
    downvoteComment(postId: string, commentId: string): Observable<Comment> {
        const headers = this.getAuthHeaders();
        const url = this.buildUrl(`/posts/${postId}/comments/${commentId}/downvote`);
        return this.http.post<Comment>(url, {}, {
            headers,
            withCredentials: false
        });
    }

    // MEDIA API ENDPOINTS

    // Get media for a post
    getMedia(postId: string): Observable<Media[]> {
        const headers = this.getAuthHeaders();
        const url = this.buildUrl(`/posts/${postId}/media`);
        return this.http.get<Media[]>(url, {
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

        const uploadUrl = this.buildUrl(`/posts/${postId}/media/upload`);
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
        const url = this.buildUrl(`/posts/${postId}/media/${mediaId}`);
        return this.http.delete<void>(url, { headers, withCredentials: false });
    }

    /**
     * Fetch media file with authentication headers and return as blob URL
     * This solves the issue where background-image requests don't include auth headers
     */
    getMediaBlob(mediaUrl: string): Observable<string> {
        const debug = localStorage.getItem('travner_debug') === 'true';
        const headers = this.getAuthHeaders();
        return new Observable<string>(subscriber => {
            const attemptProxy = () => {
                this.http.get(mediaUrl, { headers, responseType: 'blob', observe: 'response' as const }).subscribe({
                    next: async resp => {
                        const blob = resp.body as Blob;
                        const type = blob?.type || resp.headers.get('Content-Type') || '';
                        const size = blob?.size || 0;
                        let looksHtml = false;
                        if (type.includes('text/html') || type.includes('text/plain')) {
                            looksHtml = true;
                        } else if (size < 200_000) { // sniff small responses
                            try {
                                const text = await blob.text();
                                const low = text.trim().toLowerCase();
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
                        const url = URL.createObjectURL(blob);
                        subscriber.next(url);
                        subscriber.complete();
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
                const unique = [...new Set(candidates)];
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
