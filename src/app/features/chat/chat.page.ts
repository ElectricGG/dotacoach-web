import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { SessionStore } from '../../data/sessions/session.store';
import { CountdownPillComponent } from '../../shared/components/countdown-pill/countdown-pill.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { MarkdownPipe } from '../../shared/pipes/markdown.pipe';
import { extractSuggestedQuestions } from '../../shared/utils/extract-suggested-questions';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MarkdownPipe,
    CountdownPillComponent,
    SkeletonComponent,
  ],
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  // Sin encapsulación: necesitamos que los estilos lleguen a los chips de items
  // inyectados por innerHTML (el atributo de scope de Angular no se aplica a
  // contenido dinámico).
  encapsulation: ViewEncapsulation.None,
})
export class ChatPage implements OnInit, AfterViewChecked {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sessions = inject(SessionStore);

  @ViewChild('messagesEnd') messagesEnd?: ElementRef<HTMLDivElement>;

  readonly session = this.sessions.current;
  readonly isLoading = this.sessions.isLoading;
  readonly loadingPhase = this.sessions.loadingPhase;
  readonly error = this.sessions.error;
  readonly canSendMessage = this.sessions.canSendMessage;

  readonly messageControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(500)],
  });

  /** Hints de items para que el markdown pipe los reemplace con chips inline.
   *  Solo aplica si la sesión es DraftConsultation (trae relevantItems). */
  readonly itemHints = computed(() => {
    const items = this.session()?.relevantItems ?? [];
    return items.map((i) => ({
      displayName: i.displayName,
      imgUrl: `https://cdn.cloudflare.steamstatic.com${i.imgPath}`,
    }));
  });

  readonly visibleMessages = computed(() => {
    const messages = this.session()?.messages ?? [];
    const sorted = messages
      .filter((m) => m.role !== 'System')
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // El primer mensaje User siempre es el prompt inicial generado por el backend
    // (contexto de la partida que se le manda a Gemini). No es algo que el usuario
    // escribió, así que lo ocultamos y arrancamos desde el primer Assistant.
    const firstAssistantIdx = sorted.findIndex((m) => m.role === 'Assistant');
    if (firstAssistantIdx > 0) {
      return sorted.slice(firstAssistantIdx);
    }
    return sorted;
  });

  readonly suggestedQuestions = computed(() => {
    const messages = this.visibleMessages();
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'Assistant');
    return lastAssistant ? extractSuggestedQuestions(lastAssistant.content) : [];
  });

  readonly isSending = signal(false);
  private autoScrollPending = signal(true);
  private lastMessageCount = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigateByUrl('/app/home');
      return;
    }
    if (this.session()?.sessionId !== id) {
      this.sessions.loadSession(id);
    }
  }

  ngAfterViewChecked(): void {
    const count = this.visibleMessages().length;
    if (count !== this.lastMessageCount && this.autoScrollPending()) {
      this.lastMessageCount = count;
      this.scrollToBottom();
    }
  }

  async send(text?: string): Promise<void> {
    const value = (text ?? this.messageControl.value).trim();
    const session = this.session();
    if (!session || !value || this.isSending() || !this.canSendMessage()) return;

    this.isSending.set(true);
    this.messageControl.reset('');
    this.autoScrollPending.set(true);

    try {
      await this.sessions.sendMessage(session.sessionId, value);
    } catch {
      // El error queda en this.error y se muestra en el banner
    } finally {
      this.isSending.set(false);
    }
  }

  useSuggestion(question: string): void {
    this.send(question);
  }

  async markOutcome(outcome: 'Won' | 'Lost'): Promise<void> {
    const s = this.session();
    if (!s || s.type !== 'DraftConsultation') return;
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
      this.send();
    }
  }

  heroPortraitUrl(name: string): string {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${slug}.png`;
  }

  private scrollToBottom(): void {
    queueMicrotask(() => {
      this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }
}
