import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

export interface MarkdownItemHint {
  /** Display name del item (lo que el LLM puede haber citado en el texto). */
  displayName: string;
  /** URL absoluta de la imagen del item. */
  imgUrl: string;
}

/**
 * Renderiza markdown del coach a HTML sanitizado. Acepta opcionalmente una lista
 * de items para enriquecer el output: cada vez que aparece el nombre de un item
 * en el texto, se reemplaza por un chip inline con imagen.
 */
@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined, items?: MarkdownItemHint[] | null): SafeHtml {
    if (!value) return '';

    let html = marked.parse(value, { async: false }) as string;
    if (items && items.length > 0) {
      html = enrichItemsInHtml(html, items);
    }

    const cleanHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'strong', 'b', 'em', 'i', 'del', 's',
        'ul', 'ol', 'li',
        'blockquote', 'code', 'pre',
        'a', 'span', 'img',
      ],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class', 'src', 'alt'],
    });

    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }
}

/**
 * Escanea los text nodes del HTML rendereado y reemplaza apariciones de
 * nombres de items por chips inline con imagen + nombre.
 * Hace match con word boundaries, case-insensitive, priorizando los nombres más
 * largos (para que "Battle Fury" no quede capturado por "Battle").
 */
function enrichItemsInHtml(html: string, items: MarkdownItemHint[]): string {
  if (items.length === 0) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');

  const sorted = [...items].sort((a, b) => b.displayName.length - a.displayName.length);
  const byNameLower = new Map(sorted.map((i) => [i.displayName.toLowerCase(), i] as const));
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `\\b(${sorted.map((i) => escape(i.displayName)).join('|')})\\b`,
    'gi',
  );

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const toReplace: { node: Text; fragment: DocumentFragment }[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    const text = textNode.nodeValue ?? '';
    if (!text) continue;
    pattern.lastIndex = 0;
    if (!pattern.test(text)) continue;

    pattern.lastIndex = 0;
    const frag = doc.createDocumentFragment();
    let lastIdx = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIdx) {
        frag.appendChild(doc.createTextNode(text.slice(lastIdx, match.index)));
      }
      const item = byNameLower.get(match[1].toLowerCase());
      if (item) {
        const span = doc.createElement('span');
        span.className = 'inline-item';
        const img = doc.createElement('img');
        img.src = item.imgUrl;
        img.alt = '';
        span.appendChild(img);
        span.appendChild(doc.createTextNode(item.displayName));
        frag.appendChild(span);
      } else {
        frag.appendChild(doc.createTextNode(match[0]));
      }
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < text.length) {
      frag.appendChild(doc.createTextNode(text.slice(lastIdx)));
    }
    toReplace.push({ node: textNode, fragment: frag });
  }

  for (const { node: textNode, fragment } of toReplace) {
    textNode.parentNode?.replaceChild(fragment, textNode);
  }

  return doc.body.innerHTML;
}
