import { questions, totalScore, type AnswerMap } from './data.ts'

export type SavedAssessment = {
  id: string
  user_id: string
  answers: AnswerMap
  total_score: number
  created_at: string
}

const recognizedQuestionIds = new Set(questions.map(question => question.id))

/** Only complete and correctly-shaped assessments can be sent to the database. */
export function validatedAssessment(value: unknown): AnswerMap | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const entries = Object.entries(value)
  if (entries.length !== questions.length) return null
  if (!entries.every(([id,answer]) =>
    recognizedQuestionIds.has(id) && typeof answer === 'number' &&
    Number.isInteger(answer) && answer >= 0 && answer <= 4
  )) return null
  return Object.fromEntries(questions.map(question => [question.id,(value as AnswerMap)[question.id]]))
}

export function snapshotKey(value: unknown): string | null {
  const snapshot=validatedAssessment(value)
  return snapshot ? questions.map(q=>String(snapshot[q.id])).join('') : null
}

