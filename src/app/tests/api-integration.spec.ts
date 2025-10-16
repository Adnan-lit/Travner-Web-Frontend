import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { PostService } from '../services/post.service';
import { MarketplaceService } from '../services/marketplace.service';
import { CommentService } from '../services/comment.service';
import { ChatService } from '../services/chat.service';
import { MediaService } from '../services/media.service';
import { AdminService } from '../services/admin.service';
import { WebSocketService } from '../features/chat/services/websocket.service';

describe('API Integration Tests', () => {
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let userService: UserService;
  let postService: PostService;
  let marketplaceService: MarketplaceService;
  let commentService: CommentService;
  let chatService: ChatService;
  let mediaService: MediaService;
  let adminService: AdminService;
  let webSocketService: WebSocketService;

  const mockApiBaseUrl = 'http://localhost:8080/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        UserService,
        PostService,
        MarketplaceService,
        CommentService,
        ChatService,
        MediaService,
        AdminService,
        WebSocketService
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    userService = TestBed.inject(UserService);
    postService = TestBed.inject(PostService);
    marketplaceService = TestBed.inject(MarketplaceService);
    commentService = TestBed.inject(CommentService);
    chatService = TestBed.inject(ChatService);
    mediaService = TestBed.inject(MediaService);
    adminService = TestBed.inject(AdminService);
    webSocketService = TestBed.inject(WebSocketService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('AuthService', () => {
    it('should signup user successfully', () => {
      const signupData = {
        userName: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123'
      };

      const mockResponse = {
        success: true,
        message: 'User created successfully',
        data: {
          id: '123',
          userName: 'testuser',
          email: 'test@example.com'
        }
      };

      authService.signup(signupData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.userName).toBe('testuser');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/public/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(signupData);
      req.flush(mockResponse);
    });

    it('should perform health check', () => {
      const mockResponse = {
        success: true,
        data: {
          status: 'UP',
          timestamp: '2023-01-01T00:00:00Z'
        }
      };

      authService.healthCheck().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.status).toBe('UP');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/public/health`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should test authentication with valid credentials', () => {
      const credentials = { username: 'testuser', password: 'password123' };
      const mockResponse = {
        success: true,
        data: {
          id: '123',
          userName: 'testuser',
          email: 'test@example.com'
        }
      };

      authService.testAuthentication(credentials.username, credentials.password).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.userName).toBe('testuser');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/user/profile`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Basic ${btoa(`${credentials.username}:${credentials.password}`)}`);
      req.flush(mockResponse);
    });

    it('should check username availability', () => {
      const username = 'testuser';
      const mockResponse = {
        success: true,
        data: { available: false }
      };

      authService.checkUsername(username).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.available).toBe(false);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/public/check-username/${username}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should request password reset', () => {
      const username = 'testuser';
      const mockResponse = {
        success: true,
        data: { message: 'Password reset email sent' }
      };

      authService.requestPasswordReset(username).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.message).toBe('Password reset email sent');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/public/forgot-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username });
      req.flush(mockResponse);
    });

    it('should reset password with token', () => {
      const token = 'reset-token-123';
      const newPassword = 'newpassword123';
      const mockResponse = {
        success: true,
        data: { message: 'Password reset successfully' }
      };

      authService.resetPasswordWithToken(token, newPassword).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.message).toBe('Password reset successfully');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/public/reset-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token, newPassword });
      req.flush(mockResponse);
    });

    it('should delete user account', () => {
      const mockResponse = null; // 204 No Content

      authService.deleteUser().subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/user/account`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse, { status: 204, statusText: 'No Content' });
    });
  });

  describe('UserService', () => {
    it('should get user profile', () => {
      const mockResponse = {
        success: true,
        data: {
          id: '123',
          userName: 'testuser',
          email: 'test@example.com'
        }
      };

      userService.getUserProfile().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.userName).toBe('testuser');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/user/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should update user profile', () => {
      const profileData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const mockResponse = {
        success: true,
        data: {
          id: '123',
          userName: 'testuser',
          firstName: 'Updated',
          lastName: 'Name'
        }
      };

      userService.updateUserProfile(profileData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.firstName).toBe('Updated');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/user/profile`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(profileData);
      req.flush(mockResponse);
    });

    it('should get public user by username', () => {
      const username = 'testuser';
      const mockResponse = {
        success: true,
        data: {
          id: '123',
          userName: 'testuser',
          bio: 'Test user bio'
        }
      };

      userService.getPublicUserByUsername(username).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.userName).toBe('testuser');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/public/user/${username}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('PostService', () => {
    it('should get posts with pagination', () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: '1',
            title: 'Test Post',
            content: 'Test content',
            authorUsername: 'testuser'
          }
        ],
        pagination: {
          page: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1
        }
      };

      postService.getPosts().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.length).toBe(1);
        expect(response.data?.[0].title).toBe('Test Post');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/posts`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should create a new post', () => {
      const postData = {
        title: 'New Post',
        content: 'New post content',
        published: true
      };

      const mockResponse = {
        success: true,
        data: {
          id: '123',
          title: 'New Post',
          content: 'New post content',
          published: true
        }
      };

      postService.createPost(postData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.title).toBe('New Post');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/posts`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(postData);
      req.flush(mockResponse);
    });

    it('should get post by ID', () => {
      const postId = '123';
      const mockResponse = {
        success: true,
        data: {
          id: '123',
          title: 'Test Post',
          content: 'Test content'
        }
      };

      postService.getPostById(postId).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.id).toBe('123');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/posts/${postId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should search posts', () => {
      const query = 'test';
      const mockResponse = {
        success: true,
        data: [
          {
            id: '1',
            title: 'Test Post',
            content: 'Test content'
          }
        ],
        pagination: {
          page: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1
        }
      };

      postService.searchPosts(query).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/posts/search?query=${query}&page=0&size=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should add comment to post', () => {
      const postId = '123';
      const commentData = {
        content: 'Great post!'
      };

      const mockResponse = {
        success: true,
        data: {
          id: '456',
          postId: '123',
          content: 'Great post!',
          authorUsername: 'testuser'
        }
      };

      postService.createComment(postId, commentData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.content).toBe('Great post!');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/posts/${postId}/comments`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(commentData);
      req.flush(mockResponse);
    });

    it('should get comments for post', () => {
      const postId = '123';
      const mockResponse = {
        success: true,
        data: [
          {
            id: '456',
            postId: '123',
            content: 'Great post!',
            authorUsername: 'testuser'
          }
        ],
        pagination: {
          page: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1
        }
      };

      postService.getComments(postId).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/posts/${postId}/comments?page=0&size=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('MarketplaceService', () => {
    it('should get products', () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: '1',
            name: 'Test Product',
            price: 29.99,
            category: 'Electronics'
          }
        ],
        pagination: {
          page: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1
        }
      };

      marketplaceService.getProducts().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/market/products`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should create product', () => {
      const productData = {
        name: 'New Product',
        description: 'Product description',
        price: 19.99,
        category: 'Books',
        stockQuantity: 10,
        location: 'Dhaka',
        tags: ['books', 'education'],
        images: []
      };

      const mockResponse = {
        success: true,
        data: {
          id: '123',
          name: 'New Product',
          price: 19.99,
          category: 'Books'
        }
      };

      marketplaceService.createProduct(productData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.name).toBe('New Product');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/market/products`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(productData);
      req.flush(mockResponse);
    });

    it('should get cart', () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'cart123',
          userId: 'user123',
          items: [],
          totalAmount: 0,
          totalItems: 0
        }
      };

      marketplaceService.getCart().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.id).toBe('cart123');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/cart`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should add item to cart', () => {
      const cartItem = {
        productId: '123',
        quantity: 2
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'cart123',
          userId: 'user123',
          items: [
            {
              productId: '123',
              quantity: 2,
              unitPrice: 19.99,
              subtotal: 39.98
            }
          ],
          totalAmount: 39.98,
          totalItems: 1
        }
      };

      marketplaceService.addToCart(cartItem).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.totalAmount).toBe(39.98);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/cart/items`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(cartItem);
      req.flush(mockResponse);
    });

    it('should checkout cart', () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'order123',
          userId: 'user123',
          items: [],
          amountTotal: 0,
          status: 'PLACED'
        }
      };

      marketplaceService.checkout().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.id).toBe('order123');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/cart/checkout`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('CommentService', () => {
    it('should add comment to post', () => {
      const postId = '123';
      const commentData = {
        content: 'Great post!'
      };

      const mockResponse = {
        success: true,
        data: {
          id: '456',
          postId: '123',
          content: 'Great post!',
          authorUsername: 'testuser'
        }
      };

      commentService.addCommentToPost(postId, commentData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.content).toBe('Great post!');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/comments/posts/${postId}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(commentData);
      req.flush(mockResponse);
    });

    it('should get comments for post', () => {
      const postId = '123';
      const mockResponse = {
        success: true,
        data: [
          {
            id: '456',
            postId: '123',
            content: 'Great post!',
            authorUsername: 'testuser'
          }
        ],
        pagination: {
          page: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1
        }
      };

      commentService.getCommentsForPost(postId).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/comments/posts/${postId}?page=0&size=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should update comment', () => {
      const commentId = '456';
      const content = 'Updated comment content';

      const mockResponse = {
        success: true,
        data: {
          id: '456',
          content: 'Updated comment content',
          authorUsername: 'testuser'
        }
      };

      commentService.updateComment(commentId, content).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.content).toBe('Updated comment content');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/comments/${commentId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ content });
      req.flush(mockResponse);
    });

    it('should delete comment', () => {
      const commentId = '456';

      commentService.deleteComment(commentId).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/comments/${commentId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should vote on comment', () => {
      const commentId = '456';
      const voteData = { isUpvote: true };

      const mockResponse = {
        success: true,
        data: {
          id: '456',
          content: 'Great post!',
          upvotes: 1,
          downvotes: 0
        }
      };

      commentService.voteOnComment(commentId, voteData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.upvotes).toBe(1);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/comments/${commentId}/vote`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(voteData);
      req.flush(mockResponse);
    });
  });

  describe('ChatService', () => {
    it('should get conversations', () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'conv1',
            type: 'DIRECT',
            participants: [
              { userId: 'user1', username: 'user1' },
              { userId: 'user2', username: 'user2' }
            ],
            lastMessage: 'Hello!',
            unreadCount: 0
          }
        ],
        pagination: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1
        }
      };

      chatService.getConversations().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/conversations?page=0&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should start new conversation', () => {
      const conversationData = {
        type: 'DIRECT' as const,
        memberIds: ['user1', 'user2']
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'conv1',
          type: 'DIRECT',
          participants: [
            { userId: 'user1', username: 'user1' },
            { userId: 'user2', username: 'user2' }
          ]
        }
      };

      chatService.startNewConversation(conversationData.type, conversationData.memberIds).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.id).toBe('conv1');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/conversations`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(conversationData);
      req.flush(mockResponse);
    });

    it('should get conversation messages', () => {
      const conversationId = 'conv1';
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'msg1',
            conversationId: 'conv1',
            senderId: 'user1',
            senderUsername: 'user1',
            content: 'Hello!',
            kind: 'TEXT',
            createdAt: new Date().toISOString()
          }
        ],
        pagination: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1
        }
      };

      chatService.getConversationMessages(conversationId).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/conversations/${conversationId}/messages?page=0&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should send message', () => {
      const conversationId = 'conv1';
      const messageData = {
        content: 'Hello!',
        kind: 'TEXT'
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'msg1',
          conversationId: 'conv1',
          senderId: 'user1',
          senderUsername: 'user1',
          content: 'Hello!',
          kind: 'TEXT',
          createdAt: new Date().toISOString()
        }
      };

      chatService.sendMessage(conversationId, messageData.content, messageData.kind).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.body).toBe('Hello!');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/conversations/${conversationId}/messages`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(messageData);
      req.flush(mockResponse);
    });

    it('should mark messages as read', () => {
      const conversationId = 'conv1';
      const mockResponse = {
        success: true,
        data: null
      };

      chatService.markMessagesAsRead(conversationId).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/conversations/${conversationId}/read`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('MediaService', () => {
    it('should upload media files', () => {
      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'media1',
            url: '/api/media/media1',
            type: 'image',
            createdAt: new Date().toISOString()
          }
        ]
      };

      mediaService.uploadMedia(files, 'image').subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/media/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.get('files')).toBe(files[0]);
      expect(req.request.body.get('type')).toBe('image');
      req.flush(mockResponse);
    });

    it('should get media by ID', () => {
      const mediaId = 'media1';
      const mockResponse = {
        success: true,
        data: {
          id: 'media1',
          url: '/api/media/media1',
          type: 'image',
          createdAt: new Date().toISOString()
        }
      };

      mediaService.getMediaById(mediaId).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.id).toBe('media1');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/media/${mediaId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get media by type', () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'media1',
            url: '/api/media/media1',
            type: 'image',
            createdAt: new Date().toISOString()
          }
        ],
        pagination: {
          page: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1
        }
      };

      mediaService.getMediaByType('image').subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/media/type/image?page=0&size=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should delete media', () => {
      const mediaId = 'media1';

      mediaService.deleteMedia(mediaId).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/media/${mediaId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('AdminService', () => {
    it('should get all users', () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'user1',
            userName: 'user1',
            firstName: 'User',
            lastName: 'One',
            email: 'user1@example.com',
            roles: ['USER'],
            active: true,
            createdAt: new Date().toISOString()
          }
        ],
        pagination: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1
        }
      };

      adminService.getAllUsers().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/admin/users?page=0&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get user by username', () => {
      const username = 'user1';
      const mockResponse = {
        success: true,
        data: {
          id: 'user1',
          userName: 'user1',
          firstName: 'User',
          lastName: 'One',
          email: 'user1@example.com',
          roles: ['USER'],
          active: true,
          createdAt: new Date().toISOString()
        }
      };

      adminService.getUserByUsername(username).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.userName).toBe('user1');
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/admin/users/${username}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should update user roles', () => {
      const username = 'user1';
      const roles = ['ADMIN', 'USER'];
      const mockResponse = {
        success: true,
        data: null
      };

      adminService.updateUserRoles(username, roles).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/admin/users/${username}/roles`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ roles });
      req.flush(mockResponse);
    });

    it('should activate user', () => {
      const username = 'user1';

      adminService.activateUser(username).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/admin/users/${username}/activate`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('should deactivate user', () => {
      const username = 'user1';

      adminService.deactivateUser(username).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/admin/users/${username}/deactivate`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('should get system statistics', () => {
      const mockResponse = {
        success: true,
        data: {
          totalUsers: 100,
          totalPosts: 500,
          totalActiveUsers: 75,
          totalAdmins: 5
        }
      };

      adminService.getSystemStats().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.totalUsers).toBe(100);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/admin/stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get all posts', () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'post1',
            title: 'Test Post',
            content: 'Test content',
            status: 'PUBLISHED'
          }
        ],
        pagination: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1
        }
      };

      adminService.getAllPosts().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/admin/posts?page=0&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should delete post', () => {
      const postId = 'post1';

      adminService.deletePost(postId).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/admin/posts/${postId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('WebSocketService', () => {
    it('should initialize WebSocket connection', () => {
      // WebSocket service doesn't make HTTP requests, so we test the initialization
      expect(webSocketService).toBeTruthy();
    });

    it('should handle connection status', (done) => {
      webSocketService.getConnectionStatus().subscribe(status => {
        expect(typeof status).toBe('boolean');
        done();
      });
    });

    it('should send message', () => {
      // This would normally test WebSocket communication
      // For unit testing, we verify the method exists and can be called
      expect(() => {
        webSocketService.sendMessage('test', { data: 'test' });
      }).not.toThrow();
    });

    it('should join conversation', () => {
      expect(() => {
        webSocketService.joinConversation('conv1');
      }).not.toThrow();
    });

    it('should send chat message', () => {
      expect(() => {
        webSocketService.sendChatMessage('conv1', 'Hello!');
      }).not.toThrow();
    });

    it('should close connection', () => {
      expect(() => {
        webSocketService.closeConnection();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 unauthorized error', () => {
      const errorMessage = 'Unauthorized: Please sign in to continue.';

      authService.healthCheck().subscribe({
        error: (error) => {
          expect(error.message).toContain(errorMessage);
        }
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/public/health`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 404 not found error', () => {
      const errorMessage = 'Not Found: The requested resource could not be found.';

      userService.getUserProfile().subscribe({
        error: (error) => {
          expect(error.message).toContain(errorMessage);
        }
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/user/profile`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 500 server error', () => {
      const errorMessage = 'Internal Server Error: Please try again later.';

      postService.getPosts().subscribe({
        error: (error) => {
          expect(error.message).toContain(errorMessage);
        }
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/posts`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error', () => {
      const errorMessage = 'Network Error: Please check your connection and try again.';

      marketplaceService.getProducts().subscribe({
        error: (error) => {
          expect(error.message).toContain(errorMessage);
        }
      });

      const req = httpMock.expectOne(`${mockApiBaseUrl}/market/products`);
      req.flush('Network Error', { status: 0, statusText: 'Unknown Error' });
    });
  });

  describe('Pagination', () => {
    it('should handle pagination parameters correctly', () => {
      const page = 1;
      const size = 5;
      const sortBy = 'createdAt';
      const direction = 'asc';

      postService.getPosts(page, size, sortBy, direction).subscribe();

      const req = httpMock.expectOne(`${mockApiBaseUrl}/posts?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`);
      expect(req.request.method).toBe('GET');
    });

    it('should use default pagination values when not provided', () => {
      postService.getPosts().subscribe();

      const req = httpMock.expectOne(`${mockApiBaseUrl}/posts?page=0&size=10&sortBy=createdAt&direction=desc`);
      expect(req.request.method).toBe('GET');
    });
  });

  describe('Search and Filtering', () => {
    it('should handle search parameters correctly', () => {
      const query = 'angular';
      const location = 'Dhaka';
      const tags = ['technology', 'web'];

      postService.searchPosts(query).subscribe();
      marketplaceService.getProductsByLocation(location).subscribe();
      marketplaceService.getProductsByTags(tags).subscribe();

      const searchReq = httpMock.expectOne(`${mockApiBaseUrl}/posts/search?query=${query}&page=0&size=10`);
      const locationReq = httpMock.expectOne(`${mockApiBaseUrl}/market/products/location/${location}?page=0&size=10`);
      const tagsReq = httpMock.expectOne(`${mockApiBaseUrl}/market/products/tags?tags=${tags.join(',')}&page=0&size=10`);

      expect(searchReq.request.method).toBe('GET');
      expect(locationReq.request.method).toBe('GET');
      expect(tagsReq.request.method).toBe('GET');
    });
  });

  describe('File Upload', () => {
    it('should handle file upload with FormData', () => {
      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];

      mediaService.uploadMedia(files, 'image').subscribe();

      const req = httpMock.expectOne(`${mockApiBaseUrl}/media/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      expect(req.request.body.get('files')).toBe(files[0]);
      expect(req.request.body.get('type')).toBe('image');
    });

    it('should handle multiple file upload', () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
      ];

      mediaService.uploadMedia(files, 'image').subscribe();

      const req = httpMock.expectOne(`${mockApiBaseUrl}/media/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.getAll('files').length).toBe(2);
    });
  });
});