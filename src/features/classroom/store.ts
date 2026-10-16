// src/features/classroom/store.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as api from './api.ts'
import type { AttemptReview, ClassroomPreview, StudentAssignment, StudentClassroom } from './types.ts'

export const useClassroomStore = defineStore('classroom', () => {
    // ── State ─────────────────────────────────────────────────────────────
    const classrooms = ref<StudentClassroom[]>([])
    const assignments = ref<StudentAssignment[]>([])
    const current = ref<StudentAssignment | null>(null)
    const review = ref<AttemptReview | null>(null)
    const preview = ref<ClassroomPreview | null>(null)

    const isLoading = ref(false)
    const isLoaded = ref(false)
    const isSubmitting = ref(false)
    const errorMessage = ref('')

    // ── Getters ───────────────────────────────────────────────────────────
    // К выполнению: можно начать/продолжить и ещё не сдано
    const pending = computed(() => assignments.value.filter(a =>
        a.can_start && (a.student_status === 'not_started' || a.student_status === 'in_progress' || a.student_status === 'missed')
    ))
    // Ещё не открылись по времени
    const upcoming = computed(() => assignments.value.filter(a =>
        !a.can_start && a.student_status === 'not_started' && !!a.starts_at && new Date(a.starts_at) > new Date()
    ))
    const done = computed(() => assignments.value.filter(a =>
        !pending.value.includes(a) && !upcoming.value.includes(a)
    ))
    const hasClassrooms = computed(() => classrooms.value.length > 0)

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        isLoading.value = true
        try {
            const [c, a] = await Promise.all([api.myClassrooms(), api.myAssignments()])
            classrooms.value = c.data
            assignments.value = a.data
            isLoaded.value = true
        } finally {
            isLoading.value = false
        }
    }

    async function fetchPreview(code: string) {
        preview.value = null
        const { data } = await api.previewClassroom(code)
        preview.value = data
        return data
    }

    async function join(code: string) {
        isSubmitting.value = true
        try {
            const { data } = await api.joinClassroom(code)
            preview.value = null
            await fetchAll()
            return data
        } finally {
            isSubmitting.value = false
        }
    }

    async function leave(classroomId: number) {
        await api.leaveClassroom(classroomId)
        await fetchAll()
    }

    async function fetchAssignment(id: number) {
        const { data } = await api.getAssignment(id)
        current.value = data
        const idx = assignments.value.findIndex(a => a.id === id)
        if (idx !== -1) assignments.value[idx] = data
        return data
    }

    async function fetchReview(id: number) {
        review.value = null
        const { data } = await api.assignmentResult(id)
        review.value = data
        return data
    }

    function resetCurrent() {
        current.value = null
        review.value = null
    }

    return {
        classrooms, assignments, current, review, preview,
        isLoading, isLoaded, isSubmitting, errorMessage,
        pending, upcoming, done, hasClassrooms,
        fetchAll, fetchPreview, join, leave, fetchAssignment, fetchReview, resetCurrent,
    }
})
