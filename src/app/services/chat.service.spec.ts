import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ChatMessage } from '../models/chat.model';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads conversations from the paged endpoint', () => {
    service.getConversations(1, 7).subscribe();

    const request = httpMock.expectOne((r) => r.url === '/api/chat/conversations');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('7');
    request.flush({ success: true, data: { content: [] } });
  });

  it('posts messages and marks conversations read', () => {
    service.sendMessage({ conversationId: 'c1', content: 'Hello', messageType: 'TEXT' }).subscribe();
    const send = httpMock.expectOne('/api/chat/messages');
    expect(send.request.method).toBe('POST');
    send.flush({ success: true, data: { id: 'm1' } });

    service.markMessagesAsRead('c1').subscribe();
    const read = httpMock.expectOne('/api/chat/conversations/c1/mark-read');
    expect(read.request.method).toBe('POST');
    read.flush({ success: true, data: null });
  });

  it('deduplicates cached live messages and sorts them by time', () => {
    const first = {
      id: 'm1',
      conversationId: 'c1',
      content: 'first',
      createdAt: '2026-01-01T00:00:00Z',
    } as ChatMessage;
    const second = {
      id: 'm2',
      conversationId: 'c1',
      content: 'second',
      createdAt: '2026-01-01T00:00:02Z',
    } as ChatMessage;

    service.addMessageToCache(second);
    service.addMessageToCache(first);
    service.addMessageToCache({ ...first, content: 'duplicate' });

    expect(service.getMessagesFromCache('c1').map((m) => m.id)).toEqual(['m1', 'm2']);
  });
});
