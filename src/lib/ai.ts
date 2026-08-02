import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Condenses a task's title + description + comment thread into a short
 * status summary — useful when a task has accumulated 20+ comments and a
 * teammate just needs "what's the current state" without reading all of it.
 *
 * Deliberately NOT streamed: this is called from a server action that
 * caches the result on Task.aiSummary, so a single blocking call keeps the
 * calling code simple. If this were user-facing chat, streaming would be
 * the right call — it isn't, here.
 */
export async function summarizeTask(input: {
  title: string;
  description: string | null;
  comments: { author: string; body: string }[];
}): Promise<string> {
  const threadText = input.comments.length
    ? input.comments.map((c) => `${c.author}: ${c.body}`).join('\n')
    : '(no comments yet)';

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 200,
    system:
      'You summarize project management task threads for busy teammates. ' +
      'Output 2-3 sentences max, plain text, no markdown. Focus on: current ' +
      'status, any blockers, and what decision or action (if any) is pending. ' +
      'If the thread is empty, summarize just the task description.',
    messages: [
      {
        role: 'user',
        content: `Title: ${input.title}\nDescription: ${input.description ?? '(none)'}\n\nComment thread:\n${threadText}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  return textBlock?.type === 'text' ? textBlock.text.trim() : '';
}

/**
 * Suggests a priority level for a new task based on its title/description,
 * used as a default suggestion in the "create task" form — the human
 * always has final say and can override it before saving.
 */
export async function suggestPriority(
  title: string,
  description: string | null
): Promise<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 10,
    system:
      'Classify the urgency of this task. Reply with exactly one word: ' +
      'LOW, MEDIUM, HIGH, or URGENT. No punctuation, no explanation.',
    messages: [
      { role: 'user', content: `Title: ${title}\nDescription: ${description ?? '(none)'}` },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  const raw = textBlock?.type === 'text' ? textBlock.text.trim().toUpperCase() : '';
  const valid = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
  return (valid as readonly string[]).includes(raw) ? (raw as (typeof valid)[number]) : 'MEDIUM';
}
