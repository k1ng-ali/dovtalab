import { http } from '@/shared/api/http.ts'
import type {
    AssignmentFinish, AssignmentQuestion, AttemptReview, ClassroomPreview, StudentAssignment, StudentClassroom,
} from './types.ts'

// ── Классы ────────────────────────────────────────────────────────────────────
export const myClassrooms = () => http.get<StudentClassroom[]>('/classrooms/my')

export const previewClassroom = (code: string) =>
    http.get<ClassroomPreview>(`/classrooms/preview/${encodeURIComponent(code)}`)

export const joinClassroom = (code: string) => http.post<StudentClassroom>('/classrooms/join', { code })

export const leaveClassroom = (classroomId: number) => http.post(`/classrooms/${classroomId}/leave`)

// ── Задания ───────────────────────────────────────────────────────────────────
export const myAssignments = (state?: 'pending' | 'done') =>
    http.get<StudentAssignment[]>('/assignments/my', { params: { state } })

export const getAssignment = (id: number) => http.get<StudentAssignment>(`/assignments/${id}`)

export const startAssignment = (id: number) => http.post<AssignmentQuestion>(`/assignments/${id}/start`)

export const finishAssignment = (id: number) => http.post<AssignmentFinish>(`/assignments/${id}/finish`)

export const assignmentResult = (id: number) => http.get<AttemptReview>(`/assignments/${id}/result`)
