import { http } from "@/shared/api/http.ts"
import type { KnowledgeMapResponse } from "./types.ts"

export const getKnowledgeMap = (quizId: number) =>
    http.get<KnowledgeMapResponse>(`/quizzes/${quizId}/knowledge-map`)
