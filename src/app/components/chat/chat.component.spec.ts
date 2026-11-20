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
    const chatServiceSpy = jasmine.createSpyObj('ChatService', [
      'getConversations', 'getMessages', 'sendMessage', 'markMessagesAsRead',
      'uploadFile', 'downloadAttachment', 'deleteAttachment'
    ]);
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

  // P2-02: display names come from resolved summaries, never raw ObjectIds.
  it('prefers resolved displayName over username for participants', () => {
    expect(component.getParticipantDisplayName({
      id: '507f1f77bcf86cd799439011',
      username: 'alice',
      displayName: 'Alice A.'
    })).toBe('Alice A.');
  });

  it('never renders a raw ObjectId or "Unknown User" when display data is missing', () => {
    const label = component.getParticipantDisplayName({
      id: '507f1f77bcf86cd799439011',
      username: '507f1f77bcf86cd799439011',
      displayName: ''
    });
    expect(label).toBe('Former user');
    expect(label).not.toContain('507f1f77bcf86cd799439011');
  });

  it('uses the resolved sender summary before the legacy senderUsername', () => {
    const currentUser: any = { id: 'user1', userName: 'currentuser' };
    const message: ChatMessage = {
      id: 'msg1',
      conversationId: 'conv1',
      senderId: 'user2',
      senderUsername: 'bob',
      sender: { id: 'user2', username: 'bob', displayName: 'Bob B.' },
      content: 'Hello',
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEdited: false,
      readBy: ['user2'],
      status: 'DELIVERED'
    };
    component.currentUser = currentUser;
    component.selectedConversation = null;

    expect(component.getSenderDisplayName(message)).toBe('Bob B.');
  });

  // ---- P2-03: authenticated chat attachments ----

  function attachment(overrides: any = {}): any {
    return {
      id: 'att1',
      conversationId: 'conv1',
      fileName: 'notes.txt',
      contentType: 'text/plain',
      size: 5,
      downloadUrl: '/api/chat/attachments/att1/download',
      ...overrides
    };
  }

  function selectConversation(): void {
    component.selectedConversation = {
      id: 'conv1',
      participantIds: ['user1', 'user2'],
      title: 'Direct Message',
      type: 'DIRECT',
      participants: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      unreadCount: 0,
      isActive: true
    } as any;
  }

  it('uploads a file then sends a FILE message referencing the attachment ID', () => {
    selectConversation();
    mockChatService.uploadFile.and.returnValue(of(attachment()));
    mockChatService.sendMessage.and.returnValue(of({ id: 'msg1' } as any));

    (component as any).uploadFile(new File(['hello'], 'notes.txt', { type: 'text/plain' }));

    expect(mockChatService.uploadFile).toHaveBeenCalled();
    const formData = mockChatService.uploadFile.calls.mostRecent().args[0] as FormData;
    expect(formData.get('conversationId')).toBe('conv1');
    expect((formData.get('file') as File).name).toBe('notes.txt');
    expect(mockChatService.sendMessage).toHaveBeenCalledWith(jasmine.objectContaining({
      conversationId: 'conv1',
      messageType: 'FILE',
      attachmentId: 'att1'
    }));
    expect(component.sendingMessage).toBeFalse();
  });

  it('sends an IMAGE message for an uploaded image', () => {
    selectConversation();
    mockChatService.uploadFile.and.returnValue(of(attachment({ fileName: 'photo.png', contentType: 'image/png' })));
    mockChatService.sendMessage.and.returnValue(of({ id: 'msg2' } as any));

    (component as any).uploadFile(new File(['img'], 'photo.png', { type: 'image/png' }));

    expect(mockChatService.sendMessage).toHaveBeenCalledWith(jasmine.objectContaining({
      messageType: 'IMAGE',
      attachmentId: 'att1'
    }));
  });

  it('rejects oversized and unsupported files before upload', () => {
    selectConversation();
    const bigFile = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.txt', { type: 'text/plain' });
    (component as any).uploadFile(bigFile);
    expect(mockChatService.uploadFile).not.toHaveBeenCalled();

    const badFile = new File(['x'], 'payload.exe', { type: 'application/octet-stream' });
    (component as any).uploadFile(badFile);
    expect(mockChatService.uploadFile).not.toHaveBeenCalled();
  });

  it('detects image attachments and formats file sizes', () => {
    expect(component.isImageAttachment({ attachment: attachment({ contentType: 'image/png' }) } as any)).toBeTrue();
    expect(component.isImageAttachment({ attachment: attachment() } as any)).toBeFalse();
    expect(component.isImageAttachment({} as any)).toBeFalse();
    expect(component.formatFileSize(512)).toBe('512 B');
    expect(component.formatFileSize(2048)).toBe('2.0 KB');
  });

  it('lazily fetches an attachment once and caches its object URL', () => {
    mockChatService.downloadAttachment.and.returnValue(of(new Blob(['data'], { type: 'text/plain' })));
    spyOn(URL, 'createObjectURL').and.returnValue('blob:mock');
    const message = { attachment: attachment() } as any;

    expect(component.getAttachmentUrl(message)).toBeNull();
    expect(mockChatService.downloadAttachment).toHaveBeenCalledTimes(1);
    expect(component.getAttachmentUrl(message)).toBe('blob:mock');
    expect(mockChatService.downloadAttachment).toHaveBeenCalledTimes(1);
  });

  it('downloads an attachment as a blob and revokes the temporary URL', () => {
    mockChatService.downloadAttachment.and.returnValue(of(new Blob(['data'])));
    spyOn(URL, 'createObjectURL').and.returnValue('blob:download');
    const revokeSpy = spyOn(URL, 'revokeObjectURL');
    const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click');
    const message = { attachment: attachment() } as any;

    component.downloadAttachment(message);

    expect(mockChatService.downloadAttachment).toHaveBeenCalledWith('att1');
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith('blob:download');
  });
});


