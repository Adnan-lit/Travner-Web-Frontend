import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends search text as a query parameter and unwraps paged results', () => {
    let result: unknown[] = [];
    service.searchUsers('Alice', 1, 5).subscribe((users) => (result = users));

    const request = httpMock.expectOne((r) => r.url === '/api/users/search');
    expect(request.request.params.get('q')).toBe('Alice');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('5');
    request.flush({ success: true, data: { content: [{ id: 'u1' }] } });

    expect(result).toEqual([{ id: 'u1' }]);
  });

  it('follows and unfollows through the documented endpoints', () => {
    service.followUser('u1').subscribe();
    const follow = httpMock.expectOne('/api/users/u1/follow');
    expect(follow.request.method).toBe('POST');
    follow.flush({ success: true, data: null });

    service.unfollowUser('u1').subscribe();
    const unfollow = httpMock.expectOne('/api/users/u1/unfollow');
    expect(unfollow.request.method).toBe('DELETE');
    unfollow.flush({ success: true, data: null });
  });

  it('maps follow status and fails closed on error', () => {
    let following: boolean | undefined;
    service.isFollowing('u1').subscribe((value) => (following = value));
    httpMock.expectOne('/api/users/u1/follow-status').flush({ success: true, data: { following: true } });
    expect(following).toBeTrue();

    service.isFollowing('u2').subscribe((value) => (following = value));
    httpMock.expectOne('/api/users/u2/follow-status').flush('SECRET', { status: 500, statusText: 'Error' });
    expect(following).toBeFalse();
  });

  it('fails closed to null without leaking a raw error when a user lookup fails', () => {
    let user: unknown = { id: 'unset' };
    service.getUserById('u1').subscribe((value) => (user = value));

    httpMock.expectOne('/api/users/u1').flush('SECRET', { status: 500, statusText: 'Error' });

    expect(user).toBeNull();
  });
});
