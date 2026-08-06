export type MasteryLevel = "not_started" | "weak" | "learning" | "strong"

export interface KnowledgeMapItem {
    cluster_id: number
    name: string
    description: string | null
    accuracy: number
    answers_count: number
    total_questions: number
    mastery_level: MasteryLevel
}

export interface KnowledgeMapSummary {
    total_topics: number
    strong: number
    learning: number
    weak: number
    not_started: number
    weakest_topic: KnowledgeMapItem | null
}

export interface SkillLevel {
    theta: number
    level: number              // 1-5
    level_name: string
    percentile: number
    answered_questions: number
}

export interface KnowledgeMapResponse {
    quiz_id: number
    topics: KnowledgeMapItem[]
    summary: KnowledgeMapSummary
    skill_level: SkillLevel | null
}
