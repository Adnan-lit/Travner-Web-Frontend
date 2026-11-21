import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { apiEnvelopeInterceptor } from '../core/http/api-envelope.interceptor';
import { MediaService } from './media.service';
import { PostService } from './post.service';

describe('PostService', () => {
  let service: PostService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiEnvelopeInterceptor])),
        provideHttpClientTesting(),
        { provide: MediaService, useValue: { getMediaUrl: (id: string) => `/media/${id}` } },
      ],
    });
    service = TestBed.inject(PostService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends pagination and sort parameters for the post list', () => {
    service.getPosts(2, 5, 'createdAt', 'asc').subscribe();

    const request = httpMock.expectOne((r) => r.url === '/api/posts');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('5');
    expect(request.request.params.get('sortBy')).toBe('createdAt');
    expect(request.request.params.get('direction')).toBe('asc');
    request.flush({ success: true, data: [] });
  });

  it('returns an empty list without leaking a raw error when loading posts fails', () => {
    let response: unknown;
    service.getPosts().subscribe((value) => (response = value));

    httpMock
      .expectOne((r) => r.url === '/api/posts')
      .flush('SECRET-SERVER-DETAIL', { status: 500, statusText: 'Error' });

    expect((response as { data: unknown }).data).toEqual([]);
    expect(JSON.stringify(response)).not.toContain('SECRET-SERVER-DETAIL');
  });

  it('creates posts with POST and votes through the dedicated endpoint', () => {
    service.createPost({ title: 'Title', content: 'hello', published: true }).subscribe();
    const create = httpMock.expectOne('/api/posts');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ title: 'Title', content: 'hello', published: true });
    create.flush({ success: true, data: {} });

    service.voteOnPost('p1', { isUpvote: true }).subscribe();
    const vote = httpMock.expectOne('/api/posts/p1/vote');
    expect(vote.request.method).toBe('POST');
    vote.flush({ success: true, data: {} });
  });

  it('encodes free-form search input as query parameters, never in the URL path', () => {
    service.searchPosts('e.g. Dhaka & friends').subscribe();

    const request = httpMock.expectOne((r) => r.url === '/api/posts/search');
    expect(request.request.params.get('query')).toBe('e.g. Dhaka & friends');
    request.flush({ success: true, data: [] });
  });
});
