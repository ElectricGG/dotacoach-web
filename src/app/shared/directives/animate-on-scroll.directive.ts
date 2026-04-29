import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';

export type ScrollAnimation =
  | 'fade-up'
  | 'fade-in'
  | 'scale'
  | 'slide-left'
  | 'slide-right';

@Directive({
  selector: '[appAnimateOnScroll]',
  standalone: true,
  host: {
    '[class.animate-target]': 'true',
    '[class.anim-fade]': 'animation === "fade-in"',
    '[class.anim-scale]': 'animation === "scale"',
    '[class.anim-slide-left]': 'animation === "slide-left"',
    '[class.anim-slide-right]': 'animation === "slide-right"',
  },
})
export class AnimateOnScrollDirective implements OnInit, OnDestroy {
  /** Tipo de animación. Por default fade-up. Cualquier string fuera de ScrollAnimation cae al default. */
  @Input('appAnimateOnScroll') animation: ScrollAnimation | '' = '';

  /** Delay en ms para staggear elementos del mismo grupo. */
  @Input() animationDelay = 0;

  /** Si false, la animación se repite cuando el elemento sale y vuelve a entrar. */
  @Input() animationOnce = true;

  /** Threshold del IntersectionObserver (0 a 1). */
  @Input() threshold = 0.15;

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const node = this.el.nativeElement;

    if (this.animationDelay > 0) {
      node.style.transitionDelay = `${this.animationDelay}ms`;
    }

    if (typeof IntersectionObserver === 'undefined') {
      // Fallback para navegadores muy viejos: mostrar sin animar.
      node.classList.add('is-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            if (this.animationOnce) {
              this.observer?.unobserve(entry.target);
            }
          } else if (!this.animationOnce) {
            entry.target.classList.remove('is-visible');
          }
        }
      },
      {
        threshold: this.threshold,
        rootMargin: '0px 0px -64px 0px',
      },
    );

    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
