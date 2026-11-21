import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();
  });

  it('renders a useful 404 page with a link home', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('404');
    expect(text).toContain('Page not found');

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a.home-link');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/');
  });
});
