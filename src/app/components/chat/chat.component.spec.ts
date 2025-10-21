import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatComponent } from './chat.component';
import { ChatService } from '../../services/chat.service';
import { WebSocketService } from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ChatMessage } from '../../models/chat.model';
import { User } from '../../models/common.model';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let mockChatService: jasmine.SpyObj<ChatService>;
  let mockWebSocketService: jasmine.SpyObj<WebSocketService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const chatServiceSpy = jasmine.createSpyObj('ChatService', ['getConversations', 'getMessages', 'sendMessage']);
    const webSocketServiceSpy = jasmine.createSpyObj('WebSocketService', ['connect', 'disconnect', 'subscribeToConversation']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getCurrentUser']);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['searchUsers']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        { provide: ChatService, useValue: chatServiceSpy },
        { provide: WebSocketService, useValue: webSocketServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    mockChatService = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;
    mockWebSocketService = TestBed.inject(WebSocketService) as jasmine.SpyObj<WebSocketService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockUserService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display correct sender name for other user messages', () => {
    // Setup
    const currentUser: any = {
      id: 'user1',
      userName: 'currentuser',
      username: 'currentuser',
      firstName: 'Current',
      lastName: 'User',
      isOnline: true
    };

    const otherUser: any = {
      id: 'user2',
      userName: 'otheruser',
      username: 'otheruser',
      firstName: 'Other',
      lastName: 'User',
      isOnline: true
    };

    const message: ChatMessage = {
      id: 'msg1',
      conversationId: 'conv1',
      senderId: 'user2',
      senderUsername: 'otheruser',
      content: 'Hello from other user',
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEdited: false,
      readBy: ['user2'],
      status: 'DELIVERED'
    };

    component.currentUser = currentUser;
    component.selectedConversation = {
      id: 'conv1',
      participantIds: ['user1', 'user2'],
      title: 'Direct Message',
      type: 'DIRECT',
      participants: [currentUser, otherUser],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      unreadCount: 0,
      isActive: true
    };

    // Test
    const senderName = component.getSenderDisplayName(message);

    // Assert
    expect(senderName).toBe('otheruser');
  });

  it('should not show sender name for own messages', () => {
    // Setup
    const currentUser: User = {
      id: 'user1',
      userName: 'currentuser',
      firstName: 'Current',
      lastName: 'User',
      isOnline: true
    };

    const message: ChatMessage = {
      id: 'msg1',
      conversationId: 'conv1',
      senderId: 'user1',
      senderUsername: 'currentuser',
      content: 'My own message',
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEdited: false,
      readBy: ['user1'],
      status: 'DELIVERED'
    };

    component.currentUser = currentUser;

    // Test
    const senderName = component.getSenderDisplayName(message);

    // Assert
    expect(senderName).toBe('');
  });

  it('should identify own messages correctly', () => {
    // Setup
    const currentUser: User = {
      id: 'user1',
      userName: 'currentuser',
      firstName: 'Current',
      lastName: 'User',
      isOnline: true
    };

    const ownMessage: ChatMessage = {
      id: 'msg1',
      conversationId: 'conv1',
      senderId: 'user1',
      senderUsername: 'currentuser',
      content: 'My message',
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEdited: false,
      readBy: ['user1'],
      status: 'DELIVERED'
    };

    const otherMessage: ChatMessage = {
      id: 'msg2',
      conversationId: 'conv1',
      senderId: 'user2',
      senderUsername: 'otheruser',
      content: 'Other message',
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEdited: false,
      readBy: ['user2'],
      status: 'DELIVERED'
    };

    component.currentUser = currentUser;

    // Test
    const isOwnMessage1 = component.isOwnMessage(ownMessage);
    const isOwnMessage2 = component.isOwnMessage(otherMessage);

    // Assert
    expect(isOwnMessage1).toBe(true);
    expect(isOwnMessage2).toBe(false);
  });
});


