/**
 * Extrae las "preguntas sugeridas" del último mensaje del coach.
 *
 * El system prompt instruye al coach a cerrar con 3 preguntas en una sección
 * "Preguntas sugeridas" (o "Preguntas para profundizar"). Hacemos un parsing
 * tolerante por regex.
 */
export function extractSuggestedQuestions(content: string): string[] {
  if (!content) return [];

  // Buscar la sección "preguntas..." y agarrar lo que viene después.
  const sectionMatch = content.match(
    /(?:###\s*)?\d?\.?\s*Preguntas\s+(?:sugeridas|para\s+profundizar|para\s+seguir)[\s\S]*$/i,
  );
  if (!sectionMatch) return [];

  const section = sectionMatch[0];

  // Extraer items numerados o con bullets.
  const items: string[] = [];
  const lineRegex = /^\s*(?:\d+[\.\)]|[-*•])\s*(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(section)) !== null) {
    const cleaned = match[1].trim()
      .replace(/^\*+|\*+$/g, '')   // quitar **bold** wrapping
      .replace(/^_+|_+$/g, '')     // quitar _italic_ wrapping
      .trim();
    if (cleaned.length >= 5) {
      items.push(cleaned);
    }
  }

  return items.slice(0, 3);
}
