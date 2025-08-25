import { Injectable, ElementRef, Renderer2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CursorService {
  private cursor!: HTMLElement;
  private cursorDot!: HTMLElement;
  private isInitialized = false;
  private mouseMoveListener?: () => void;
  private hoverListeners: (() => void)[] = [];

  constructor() { }

  initializeCursor(renderer: Renderer2, elementRef: ElementRef): void {
    if (this.isInitialized) {
      this.cleanup(renderer);
    }

    this.cursor = renderer.createElement('div');
    this.cursorDot = renderer.createElement('div');

    renderer.addClass(this.cursor, 'custom-cursor');
    renderer.addClass(this.cursorDot, 'custom-cursor-dot');

    renderer.appendChild(document.body, this.cursor);
    renderer.appendChild(document.body, this.cursorDot);

    // Mouse move listener
    this.mouseMoveListener = renderer.listen('document', 'mousemove', (e) => {
      renderer.setStyle(this.cursor, 'left', e.clientX + 'px');
      renderer.setStyle(this.cursor, 'top', e.clientY + 'px');
      renderer.setStyle(this.cursorDot, 'left', e.clientX + 'px');
      renderer.setStyle(this.cursorDot, 'top', e.clientY + 'px');
    });

    // Add hover effects for interactive elements
    this.addHoverEffects(renderer, elementRef);
    this.isInitialized = true;
  }

  private addHoverEffects(renderer: Renderer2, elementRef: ElementRef): void {
    const interactiveElements = elementRef.nativeElement.querySelectorAll(
      'button, input, a, .btn, .action-btn, .nav-link, .card, .feature-card, .action-card, .destination-card'
    );

    interactiveElements.forEach((element: HTMLElement) => {
      const mouseEnterListener = renderer.listen(element, 'mouseenter', () => {
        renderer.addClass(this.cursor, 'hover');
      });

      const mouseLeaveListener = renderer.listen(element, 'mouseleave', () => {
        renderer.removeClass(this.cursor, 'hover');
      });

      this.hoverListeners.push(mouseEnterListener, mouseLeaveListener);
    });
  }

  cleanup(renderer: Renderer2): void {
    if (!this.isInitialized) return;

    // Remove cursor elements
    if (this.cursor) {
      renderer.removeChild(document.body, this.cursor);
    }
    if (this.cursorDot) {
      renderer.removeChild(document.body, this.cursorDot);
    }

    // Remove event listeners
    if (this.mouseMoveListener) {
      this.mouseMoveListener();
    }

    this.hoverListeners.forEach(removeListener => removeListener());
    this.hoverListeners = [];

    this.isInitialized = false;
  }

  addHoverElement(renderer: Renderer2, element: HTMLElement): void {
    if (!this.isInitialized) return;

    const mouseEnterListener = renderer.listen(element, 'mouseenter', () => {
      renderer.addClass(this.cursor, 'hover');
    });

    const mouseLeaveListener = renderer.listen(element, 'mouseleave', () => {
      renderer.removeClass(this.cursor, 'hover');
    });

    this.hoverListeners.push(mouseEnterListener, mouseLeaveListener);
  }
}
