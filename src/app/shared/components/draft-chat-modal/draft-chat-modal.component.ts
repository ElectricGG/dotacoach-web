import { Component, ElementRef, HostListener, ViewChild, ViewEncapsulation, computed, effect, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { DraftChatModalService } from '../../../core/services/draft-chat-modal.service';
import { SessionStore } from '../../../data/sessions/session.store';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-draft-chat-modal',
  standalone: true,
  imports: [ReactiveFormsModule, MarkdownPipe],
  templateUrl: './draft-chat-modal.component.html',
  styleUrls: ['./draft-chat-modal.component.scss'],
  // Sin encapsulación: las imágenes y elementos inyectados por [innerHTML]
  // necesitan que los estilos lleguen sin rewrite del scope.
  encapsulation: ViewEncapsulation.None,
})
export class DraftChatModalComponent {
  private readonly modal = inject(DraftChatModalService);
  private readonly sessions = inject(SessionStore);

  @ViewChild('messagesEnd') messagesEnd?: ElementRef<HTMLDivElement>;

  readonly activeSessionId = this.modal.activeSessionId;
  readonly session = this.sessions.current;
  readonly isSending = computed(() => this.sessions.loadingPhase() === 'sending');
  readonly error = this.sessions.error;

  readonly visibleMessages = computed(() => {
    // Para draft consultation el primer user message ya es conversacional
    // ("Voy a jugar X vs Y..."), no es el dump de contexto técnico — ese va
    // en el system prompt. Filtramos solo System y mostramos el resto.
    return (this.session()?.messages ?? []).filter((m) => m.role !== 'System');
  });

  /** Hints de items para que el markdown pipe los reemplace con chips inline. */
  readonly itemHints = computed(() => {
    const items = this.session()?.relevantItems ?? [];
    return items.map((i) => ({
      displayName: i.displayName,
      imgUrl: `https://cdn.cloudflare.steamstatic.com${i.imgPath}`,
    }));
  });

  readonly canSendMessage = computed(() => {
    const s = this.session();
    return !!s && s.status === 'Active' && s.remainingMessages > 0;
  });

  readonly messageControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(1), Validators.maxLength(1000)],
  });

  constructor() {
    // Auto-scroll al fondo cuando llega un mensaje nuevo.
    effect(() => {
      this.visibleMessages();
      this.isSending();
      queueMicrotask(() => this.scrollToBottom());
    });

    // Disable input mientras Gemini responde
    effect(() => {
      if (this.isSending()) {
        this.messageControl.disable({ emitEvent: false });
      } else {
        this.messageControl.enable({ emitEvent: false });
      }
    });
  }

  close(): void {
    this.modal.close();
    this.sessions.clearError();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.activeSessionId() !== null) this.close();
  }

  async sendMessage(): Promise<void> {
    const value = this.messageControl.value.trim();
    const sessionId = this.activeSessionId();
    if (!value || !sessionId || this.isSending() || !this.canSendMessage()) return;

    this.messageControl.reset('');
    try {
      await this.sessions.sendMessage(sessionId, value);
    } catch {
      // error queda en this.error
    }
  }

  async markOutcome(outcome: 'Won' | 'Lost'): Promise<void> {
    const s = this.session();
    if (!s || s.type !== 'DraftConsultation') return;
    // Toggle: si ya está marcado lo mismo, lo limpia.
    const next = s.outcome === outcome ? 'Unknown' : outcome;
    try {
      await this.sessions.setOutcome(s.sessionId, next);
    } catch {
      // error queda en this.error
    }
  }

  onTextareaKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
}
