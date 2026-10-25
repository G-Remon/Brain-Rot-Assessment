import { questions, totalScore, type AnswerMap } from './data'
import { supabase } from './supabase'

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

function isSafeSavedRow(row: unknown, owner: string): row is SavedAssessment {
  if (!row || typeof row !== 'object') return false
  const r = row as Partial<SavedAssessment>
  return typeof r.id === 'string' && typeof r.user_id === 'string' &&
    r.user_id === owner && typeof r.created_at === 'string' &&
    typeof r.total_score === 'number' && validatedAssessment(r.answers) !== null
}

/** Reads and verifies identity; RLS still enforces owner-only access on the server. */
async function verifiedOwner(expectedUserId: string) {
  if (!supabase) throw new Error('auth-unavailable')
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user || data.user.id !== expectedUserId) throw new Error('login-required')
  return data.user.id
}

export async function listSavedAssessments(owner: string): Promise<SavedAssessment[]> {
  await verifiedOwner(owner)
  const { data, error } = await supabase!.from('assessments')
    .select('id,user_id,answers,total_score,created_at')
    .eq('user_id',owner)
    .order('created_at',{ ascending:false })
    .limit(40)
  if (error) throw error
  return (data ?? []).filter((row):row is SavedAssessment => isSafeSavedRow(row,owner))
}

export async function saveAssessment(owner: string, value: unknown): Promise<SavedAssessment> {
  const answers=validatedAssessment(value)
  if (!answers) throw new Error('assessment-incomplete')
  await verifiedOwner(owner)
  const { error } = await supabase!.from('assessments')
    .insert({user_id:owner, answers, total_score:totalScore(answers)})
  if(error)throw error
  // A separate read lets the newest-only Free RLS policy see the committed row.
  const {data,error:readError}=await supabase!.from('assessments').select('id,user_id,answers,total_score,created_at').eq('user_id',owner).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(1).single()
  if(readError)throw readError
  if(!isSafeSavedRow(data,owner))throw new Error('invalid-server-response')
  return data
}

export async function deleteSavedAssessment(owner: string, id: string): Promise<void> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('invalid-assessment-id')
  }
  await verifiedOwner(owner)
  const { error } = await supabase!.from('assessments')
    .delete()
    .eq('id',id)
    .eq('user_id',owner)
  if (error) throw error
}

