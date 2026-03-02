import type { QuizIn, ContextIn, QuestionIn } from "@/features/quizPage/types.ts"

// ─── Контексты ────────────────────────────────────────────────────────────────

export const mockContexts: Record<number, ContextIn[]> = {
    1: [
        {
            id: 101,
            title: "Алгебра",
            text: "Раздел математики, изучающий операции над числами и выражениями. Основные темы: уравнения, неравенства, функции и их свойства.",
            rule: "При решении квадратных уравнений используй формулу дискриминанта: D = b² − 4ac",
            order: 1,
            detail: { questions: 5 },
        },
        {
            id: 102,
            title: "Геометрия",
            text: "Изучает фигуры, их свойства и отношения в пространстве. Включает планиметрию (2D) и стереометрию (3D).",
            rule: "Сумма углов треугольника всегда равна 180°. Теорема Пифагора: a² + b² = c²",
            order: 2,
            detail: { questions: 4 },
        },
        {
            id: 103,
            title: "Теория вероятностей",
            text: "Раздел математики о случайных событиях и их вероятностях. Применяется в статистике, экономике, физике.",
            rule: "Вероятность события A: P(A) = m/n, где m — число благоприятных исходов, n — общее число исходов.",
            order: 3,
            detail: { questions: 3 },
        },
    ],

    2: [
        {
            id: 201,
            title: "Саманиды",
            text: "Первая таджикская государственность (819–999). Столица — Бухара. Расцвет науки, литературы и культуры. При Саманидах творил Рудаки — основоположник персидско-таджикской поэзии.",
            rule: "Саманиды правили с 819 по 999 год. Основатель — Саман-худат.",
            order: 1,
            detail: { questions: 4 },
        },
        {
            id: 202,
            title: "Советский период",
            text: "Таджикская ССР была образована 5 декабря 1929 года. В этот период проводились масштабные индустриализация и коллективизация, развивалось образование.",
            rule: "Таджикская ССР образована 5 декабря 1929 года. Первый секретарь ЦК — Шириншо Шотемур.",
            order: 2,
            detail: { questions: 5 },
        },
    ],
}

// ─── Вопросы ──────────────────────────────────────────────────────────────────

export const mockQuestions: Record<number, QuestionIn[]> = {
    // Математика — разные типы
    1: [
        {
            id: 1001,
            order: 1,
            type: "single_choice",
            text: "Чему равен дискриминант уравнения x² − 5x + 6 = 0?",
            context_id: 101,
            image_url: undefined,
            payload: {
                single_choice: {
                    shuffle: false,
                    correct: 2,
                    options: [
                        { id: 1, text: "1" },
                        { id: 2, text: "1" },
                        { id: 3, text: "1" },
                        { id: 4, text: "−1" },
                    ],
                },
            },
        },
        {
            id: 1002,
            order: 2,
            type: "multiple_choice",
            text: "Какие из следующих чисел являются корнями уравнения x² − 5x + 6 = 0?",
            context_id: 101,
            image_url: undefined,
            payload: {
                multiple_choice: {
                    shuffle: false,
                    correct: [2, 3],
                    min_choices: 1,
                    max_choices: 2,
                    partial_scoring: true,
                    options: [
                        { id: 1, text: "1" },
                        { id: 2, text: "2" },
                        { id: 3, text: "3" },
                        { id: 4, text: "6" },
                    ],
                },
            },
        },
        {
            id: 1003,
            order: 3,
            type: "matching",
            text: "Сопоставьте формулу с её названием",
            context_id: 102,
            image_url: undefined,
            payload: {
                matching: {
                    shuffle_left: false,
                    shuffle_right: false,
                    pairs: { "1": 4, "2": 3, "3": 2, "4": 1 },
                    left: [
                        { id: 1, text: "a² + b² = c²" },
                        { id: 2, text: "S = πr²" },
                        { id: 3, text: "V = lwh" },
                        { id: 4, text: "P = 2(l+w)" },
                    ],
                    right: [
                        { id: 1, text: "Периметр прямоугольника" },
                        { id: 2, text: "Объём прямоугольника" },
                        { id: 3, text: "Площадь круга" },
                        { id: 4, text: "Теорема Пифагора" },
                    ],
                },
            },
        },
        {
            id: 1004,
            order: 4,
            type: "input",
            text: "Найдите значение выражения: 15² − 10²",
            context_id: 102,
            image_url: undefined,
            payload: {
                input: {
                    answers: [{ value: "125", aliases: [] }],
                    case_sensitive: false,
                    trim: true,
                    normalize_space: true,
                    numeric: true,
                    tolerance: 0,
                },
            },
        },
        {
            id: 1005,
            order: 5,
            type: "single_choice",
            text: "Монету бросают дважды. Какова вероятность, что оба раза выпадет орёл?",
            context_id: 103,
            image_url: undefined,
            payload: {
                single_choice: {
                    shuffle: false,
                    correct: 2,
                    options: [
                        { id: 1, text: "1/4 (25%)" },
                        { id: 2, text: "1/4 (25%)" },
                        { id: 3, text: "1/2 (50%)" },
                        { id: 4, text: "3/4 (75%)" },
                    ],
                },
            },
        },
    ],

    // История Таджикистана
    2: [
        {
            id: 2001,
            order: 1,
            type: "single_choice",
            text: "В каком году была основана Таджикская ССР?",
            context_id: 202,
            image_url: undefined,
            payload: {
                single_choice: {
                    shuffle: false,
                    correct: 3,
                    options: [
                        { id: 1, text: "1917" },
                        { id: 2, text: "1924" },
                        { id: 3, text: "1929" },
                        { id: 4, text: "1991" },
                    ],
                },
            },
        },
        {
            id: 2002,
            order: 2,
            type: "multiple_choice",
            text: "Какие из этих личностей жили в эпоху Саманидов?",
            context_id: 201,
            image_url: undefined,
            payload: {
                multiple_choice: {
                    shuffle: false,
                    correct: [1, 2],
                    min_choices: 1,
                    max_choices: 3,
                    partial_scoring: true,
                    options: [
                        { id: 1, text: "Рудаки" },
                        { id: 2, text: "Авиценна (Ибн Сина)" },
                        { id: 3, text: "Темур (Тамерлан)" },
                        { id: 4, text: "Исмоил Сомони" },
                    ],
                },
            },
        },
        {
            id: 2003,
            order: 3,
            type: "matching",
            text: "Сопоставьте исторический период с датой",
            context_id: 201,
            image_url: undefined,
            payload: {
                matching: {
                    shuffle_left: false,
                    shuffle_right: false,
                    pairs: { "1": 3, "2": 4, "3": 1, "4": 2 },
                    left: [
                        { id: 1, text: "Государство Саманидов" },
                        { id: 2, text: "Таджикская ССР" },
                        { id: 3, text: "Независимость Таджикистана" },
                        { id: 4, text: "Распад СССР" },
                    ],
                    right: [
                        { id: 1, text: "9 сентября 1991" },
                        { id: 2, text: "25 декабря 1991" },
                        { id: 3, text: "819–999 гг." },
                        { id: 4, text: "5 декабря 1929" },
                    ],
                },
            },
        },
        {
            id: 2004,
            order: 4,
            type: "input",
            text: "Как называется национальная валюта Таджикистана?",
            context_id: 202,
            image_url: undefined,
            payload: {
                input: {
                    answers: [{ value: "сомони", aliases: ["somoni", "TJS"] }],
                    case_sensitive: false,
                    trim: true,
                    normalize_space: true,
                    numeric: false,
                    tolerance: 0,
                },
            },
        },
    ],

    // Биология (matching-heavy)
    3: [
        {
            id: 3001,
            order: 1,
            type: "matching",
            text: "Сопоставьте органеллу клетки с её функцией",
            context_id: null,
            image_url: undefined,
            payload: {
                matching: {
                    shuffle_left: false,
                    shuffle_right: false,
                    pairs: { "1": 2, "2": 4, "3": 1, "4": 3 },
                    left: [
                        { id: 1, text: "Митохондрия" },
                        { id: 2, text: "Рибосома" },
                        { id: 3, text: "Ядро" },
                        { id: 4, text: "Вакуоль" },
                    ],
                    right: [
                        { id: 1, text: "Хранение ДНК" },
                        { id: 2, text: "Синтез АТФ" },
                        { id: 3, text: "Хранение воды и питательных веществ" },
                        { id: 4, text: "Синтез белков" },
                    ],
                },
            },
        },
        {
            id: 3002,
            order: 2,
            type: "multiple_choice",
            text: "Какие из перечисленных структур характерны ТОЛЬКО для растительной клетки?",
            context_id: null,
            image_url: undefined,
            payload: {
                multiple_choice: {
                    shuffle: false,
                    correct: [1, 3, 4],
                    min_choices: 1,
                    max_choices: 3,
                    partial_scoring: true,
                    options: [
                        { id: 1, text: "Клеточная стенка из целлюлозы" },
                        { id: 2, text: "Митохондрии" },
                        { id: 3, text: "Хлоропласты" },
                        { id: 4, text: "Центральная вакуоль" },
                    ],
                },
            },
        },
        {
            id: 3003,
            order: 3,
            type: "input",
            text: "Как называется процесс преобразования световой энергии в химическую энергию в растениях?",
            context_id: null,
            image_url: undefined,
            payload: {
                input: {
                    answers: [{ value: "фотосинтез", aliases: ["photosynthesis"] }],
                    case_sensitive: false,
                    trim: true,
                    normalize_space: true,
                    numeric: false,
                    tolerance: 0,
                },
            },
        },
    ],

    // Русский язык (input-heavy)
    4: [
        {
            id: 4001,
            order: 1,
            type: "single_choice",
            text: "В каком слове пишется буква «И» в корне?",
            context_id: null,
            image_url: undefined,
            payload: {
                single_choice: {
                    shuffle: false,
                    correct: 3,
                    options: [
                        { id: 1, text: "заж_гать" },
                        { id: 2, text: "бл_стать" },
                        { id: 3, text: "уб_рать" },
                        { id: 4, text: "выч_тать" },
                    ],
                },
            },
        },
        {
            id: 4002,
            order: 2,
            type: "input",
            text: "Вставьте пропущенную букву: «Со_нце светит ярко». Напишите слово целиком.",
            context_id: null,
            image_url: undefined,
            payload: {
                input: {
                    answers: [{ value: "Солнце", aliases: ["солнце"] }],
                    case_sensitive: false,
                    trim: true,
                    normalize_space: true,
                    numeric: false,
                    tolerance: 0,
                },
            },
        },
        {
            id: 4003,
            order: 3,
            type: "matching",
            text: "Сопоставьте слово с его частью речи",
            context_id: null,
            image_url: undefined,
            payload: {
                matching: {
                    shuffle_left: false,
                    shuffle_right: false,
                    pairs: { "1": 2, "2": 4, "3": 1, "4": 3 },
                    left: [
                        { id: 1, text: "бежать" },
                        { id: 2, text: "красивый" },
                        { id: 3, text: "солнце" },
                        { id: 4, text: "быстро" },
                    ],
                    right: [
                        { id: 1, text: "Существительное" },
                        { id: 2, text: "Глагол" },
                        { id: 3, text: "Наречие" },
                        { id: 4, text: "Прилагательное" },
                    ],
                },
            },
        },
    ],
}

// ─── Квизы ────────────────────────────────────────────────────────────────────

export const mockQuizzes: QuizIn[] = [
    {
        id: 1,
        hash_code: "math-2026",
        title: "Математика 2026",
        description: "Подготовка к НМТ: алгебра, геометрия и теория вероятностей",
        time_limit: 1800,
        created_at: new Date().toISOString(),
        contexts: mockContexts[1],
        details: { type: "single_choice", total: 5, completed: 2 },
    },
    {
        id: 2,
        hash_code: "history-tj",
        title: "История Таджикистана",
        description: "Основные события, даты и исторические личности",
        time_limit: 1200,
        created_at: new Date().toISOString(),
        contexts: mockContexts[2],
        details: { type: "multiple_choice", total: 4, completed: 0 },
    },
    {
        id: 3,
        hash_code: "biology-cells",
        title: "Биология",
        description: "Строение клетки, органы и системы организма",
        time_limit: 900,
        created_at: new Date().toISOString(),
        details: { type: "matching", total: 3, completed: 3 },
    },
    {
        id: 4,
        hash_code: "russian-lang",
        title: "Русский язык",
        description: "Орфография, части речи и пунктуация",
        time_limit: 2400,
        created_at: new Date().toISOString(),
        details: { type: "input", total: 3, completed: 1 },
    },
]