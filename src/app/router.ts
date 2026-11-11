import {createRouter, createWebHistory} from "vue-router"
import {useAuthStore} from "@/features/auth/store.ts"
const MainPage = () => import("@/pages/MainPage/MainPage.vue");
const QuizPage = () => import("@/pages/Quizes/QuizPage.vue")
const ProfilePage = () =>  import("@/pages/ProfilePage/ProfilePage.vue")
const LeaderPage = () => import("@/pages/LeaderPage/LeaderPage.vue");
const LeaguePage = () => import("@/pages/LeaguePage/LeaguePage.vue");
const DailyChallengePage = () => import("@/pages/DailyChallenge/DailyChallengePage.vue");
const DuelsPage = () => import("@/pages/DuelsPage/DuelsPage.vue");
const PrivacyPage = () => import("@/pages/PrivacyPage/PrivacyPage.vue");
const ClassesPage = () => import("@/pages/ClassesPage/ClassesPage.vue");
const AssignmentPage = () => import("@/pages/AssignmentPage/AssignmentPage.vue");
const ConnectPage = () => import("@/pages/ConnectPage/ConnectPage.vue");
const ConnectionsPage = () => import("@/pages/ConnectionsPage/ConnectionsPage.vue");

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', component: MainPage},
        {path: '/quiz', component: QuizPage},
        // Deep-link по хеш-коду: dovtalab.app/quiz/QZS+R6GO1KGYE5KB
        {path: '/quiz/:hashCode', component: QuizPage},
        {path: '/profile', component: ProfilePage },
        {path: '/leaders', component: LeaderPage},
        // Недельная лига: группа до 30 игроков своего уровня
        {path: '/league', component: LeaguePage, meta: {members: true}},
        {path: '/daily', component: DailyChallengePage, meta: {members: true}},
        {path: '/duels', component: DuelsPage, meta: {members: true}},
        {path: '/duels/:duelId', component: DuelsPage, meta: {members: true}},
        // Классы и задания учителя; /join/:code — ссылка-приглашение в класс
        {path: '/classes', component: ClassesPage, meta: {members: true}},
        {path: '/join/:code', component: ClassesPage, meta: {members: true}},
        {path: '/assignment/:assignmentId', component: AssignmentPage, meta: {members: true}},
        // Подключение ИИ-приложений (MCP): экран согласия OAuth и список выданных доступов
        {path: '/connect', component: ConnectPage, meta: {members: true}},
        {path: '/connections', component: ConnectionsPage, meta: {members: true}},
        // Публичная страница — доступна без авторизации (meta.public)
        {path: '/privacy', component: PrivacyPage, meta: {public: true}},
    ]
})

// Гость (вход без аккаунта) не попадает в разделы только для вошедших (meta.members):
// вместо перехода открывается окно входа, после входа — переход по ссылке
router.beforeEach((to, from) => {
    if (!to.meta.members) return true
    const auth = useAuthStore()
    if (!auth.isGuest) return true
    auth.promptLogin(to.fullPath)
    // Прямая ссылка при старте приложения — показываем главную под окном входа
    return from.matched.length ? false : '/'
})

export default router