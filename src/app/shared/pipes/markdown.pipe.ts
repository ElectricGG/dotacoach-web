import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Renderiza markdown del coach a HTML sanitizado.
 * Usa marked en modo síncrono y DOMPurify para evitar XSS.
 */
@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';

    const rawHtml = marked.parse(value, { async: false }) as string;
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'strong', 'b', 'em', 'i', 'del', 's',
        'ul', 'ol', 'li',
        'blockquote', 'code', 'pre',
        'a', 'span',
      ],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    });

    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }
}
