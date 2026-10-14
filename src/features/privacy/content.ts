import type { AppLocale } from '@/shared/i18n'

// Текст политики живёт отдельно от i18n-локалей: он длинный и юридический,
// а в локалях остаются только короткие UI-строки.

export interface PolicySection {
    id: string
    icon: string
    title: string
    paragraphs?: string[]
    items?: string[]
    // Текст после списка
    note?: string
}

export interface PolicyContent {
    title: string
    updatedLabel: string
    updatedAt: string
    intro: string
    tocTitle: string
    sections: PolicySection[]
}

export const CONTACT_EMAIL = 'funder@dovtalab.app'

// ── RU ──
const ru: PolicyContent = {
    title: 'Политика конфиденциальности',
    updatedLabel: 'Редакция от',
    updatedAt: '14 октября 2026 г.',
    intro: 'Dovtalab — образовательная платформа для подготовки к экзаменам: тесты, ежедневные задания, дуэли и рейтинг. Мы бережно относимся к вашим данным и собираем только то, что действительно нужно для работы приложения. Здесь простым языком описано, что именно мы собираем, зачем и как вы можете этим управлять.',
    tocTitle: 'Содержание',
    sections: [
        {
            id: 'general',
            icon: '📄',
            title: 'Общие положения',
            paragraphs: [
                'Настоящая политика применяется к веб-версии dovtalab.app, мини-приложению в Telegram и мобильному приложению Dovtalab для Android (далее — «Сервис»).',
                'Используя Сервис и выполняя вход, вы подтверждаете, что ознакомились с политикой и согласны с обработкой данных на описанных условиях. Если вы не согласны — пожалуйста, не используйте Сервис.',
            ],
        },
        {
            id: 'collect',
            icon: '🗂',
            title: 'Какие данные мы собираем',
            paragraphs: ['Мы не просим пароли и не храним их. Вход выполняется через Telegram, поэтому мы получаем только то, что Telegram передаёт с вашего согласия:'],
            items: [
                'Данные аккаунта Telegram: идентификатор, имя, фамилия, имя пользователя (username) и фото профиля. Номер телефона — только если вы сами разрешили его передачу в окне Telegram.',
                'Учебная активность: пройденные тесты, ответы, правильные и неправильные результаты, баллы, XP, серии, участие в дуэлях и ежедневных заданиях, полученные бейджи.',
                'Настройки: язык интерфейса, таймер, количество вопросов и время на вопрос.',
                'Подписка: выбранный тариф, статус и срок действия. Платёжные реквизиты (номера карт и т. п.) мы не получаем и не храним.',
                'Технические данные: IP-адрес, тип устройства и браузера, версия приложения, время запросов и журналы ошибок — для безопасности и стабильной работы.',
            ],
        },
        {
            id: 'purpose',
            icon: '🎯',
            title: 'Зачем мы используем данные',
            items: [
                'Авторизация и защита вашего аккаунта.',
                'Сохранение прогресса, статистики и персональных настроек.',
                'Работа соревновательных функций: рейтинг, дуэли, ежедневные челленджи.',
                'Предоставление Pro-подписки и связанных с ней возможностей.',
                'Улучшение качества вопросов и приложения на основе обезличенной статистики.',
                'Отправка служебных уведомлений через бота Telegram (если вы разрешили боту писать вам).',
            ],
        },
        {
            id: 'public',
            icon: '👥',
            title: 'Что видят другие пользователи',
            paragraphs: ['В рейтинге, дуэлях и при обмене результатами другим пользователям видны ваше имя, фото профиля, баллы, уровень и бейджи. Ваш номер телефона, настройки и подробные ответы не показываются никому.'],
        },
        {
            id: 'device',
            icon: '📱',
            title: 'Данные на вашем устройстве',
            paragraphs: ['Чтобы вам не приходилось входить каждый раз, Сервис хранит на устройстве токен доступа и выбранный язык (локальное хранилище), а также защищённый cookie для обновления сессии. Мы не используем рекламные и сторонние трекинговые cookie.'],
        },
        {
            id: 'share',
            icon: '🤝',
            title: 'Передача третьим лицам',
            paragraphs: ['Мы не продаём и не передаём ваши данные в рекламных целях. Данные могут обрабатываться только:'],
            items: [
                'Telegram — для входа и работы мини-приложения и бота;',
                'хостинг-провайдерами, на серверах которых работает Сервис;',
                'Google Play — при установке приложения на Android (по правилам Google);',
                'государственными органами — только в случаях, прямо предусмотренных законом.',
            ],
        },
        {
            id: 'retention',
            icon: '⏳',
            title: 'Срок хранения',
            paragraphs: ['Данные хранятся, пока у вас есть аккаунт. После запроса на удаление мы удаляем аккаунт и связанные данные в течение 30 дней. Технические журналы хранятся не дольше 90 дней. Обезличенная статистика может храниться дольше, так как она не позволяет вас идентифицировать.'],
        },
        {
            id: 'security',
            icon: '🔒',
            title: 'Безопасность',
            paragraphs: ['Все данные передаются по защищённому протоколу HTTPS. Доступ к серверам ограничен, токены имеют ограниченный срок действия. Ни один способ передачи данных не защищён на 100%, но мы делаем всё разумно возможное, чтобы защитить вашу информацию.'],
        },
        {
            id: 'rights',
            icon: '⚖️',
            title: 'Ваши права',
            items: [
                'узнать, какие данные о вас хранятся, и получить их копию;',
                'исправить неточные данные;',
                'удалить аккаунт и все связанные данные;',
                'отозвать согласие на обработку и запретить боту присылать сообщения.',
            ],
            note: `Чтобы воспользоваться правами, напишите нам на почту ${CONTACT_EMAIL}. Мы ответим в течение 30 дней.`,
        },
        {
            id: 'children',
            icon: '🧒',
            title: 'Дети',
            paragraphs: ['Сервис рассчитан на школьников, абитуриентов и студентов. Если пользователю меньше 14 лет, он должен использовать Сервис с согласия родителей или законных представителей. Если вы считаете, что ребёнок передал нам данные без такого согласия, свяжитесь с нами — мы удалим их.'],
        },
        {
            id: 'changes',
            icon: '🔄',
            title: 'Изменения политики',
            paragraphs: ['Мы можем обновлять эту политику. Актуальная версия всегда доступна на странице dovtalab.app/privacy, а дата редакции указана вверху. О существенных изменениях мы сообщим в приложении или через бота.'],
        },
        {
            id: 'contacts',
            icon: '✉️',
            title: 'Контакты',
            paragraphs: [`По любым вопросам о данных и конфиденциальности пишите на почту ${CONTACT_EMAIL}.`],
        },
    ],
}

// ── EN ──
const en: PolicyContent = {
    title: 'Privacy Policy',
    updatedLabel: 'Last updated',
    updatedAt: 'October 14, 2026',
    intro: 'Dovtalab is an exam-preparation platform with quizzes, daily challenges, duels and leaderboards. We care about your data and collect only what the app actually needs. This page explains in plain language what we collect, why, and how you stay in control.',
    tocTitle: 'Contents',
    sections: [
        {
            id: 'general',
            icon: '📄',
            title: 'General',
            paragraphs: [
                'This policy applies to the web version at dovtalab.app, the Telegram Mini App and the Dovtalab Android app (the "Service").',
                'By using the Service and signing in, you confirm that you have read this policy and agree to the processing of your data as described. If you do not agree, please do not use the Service.',
            ],
        },
        {
            id: 'collect',
            icon: '🗂',
            title: 'Data we collect',
            paragraphs: ['We never ask for or store passwords. You sign in with Telegram, so we only receive what Telegram shares with your consent:'],
            items: [
                'Telegram account data: ID, first name, last name, username and profile photo. Phone number — only if you explicitly allow it in the Telegram dialog.',
                'Learning activity: completed quizzes, answers, correct and wrong results, points, XP, streaks, duels, daily challenges and earned badges.',
                'Settings: interface language, timer, number of questions and time per question.',
                'Subscription: selected plan, status and expiry date. We do not receive or store payment details such as card numbers.',
                'Technical data: IP address, device and browser type, app version, request times and error logs — for security and stability.',
            ],
        },
        {
            id: 'purpose',
            icon: '🎯',
            title: 'How we use data',
            items: [
                'Signing you in and protecting your account.',
                'Saving your progress, statistics and personal settings.',
                'Running competitive features: leaderboard, duels, daily challenges.',
                'Providing the Pro subscription and its features.',
                'Improving questions and the app using anonymised statistics.',
                'Sending service notifications via the Telegram bot (if you allowed the bot to message you).',
            ],
        },
        {
            id: 'public',
            icon: '👥',
            title: 'What other users can see',
            paragraphs: ['In the leaderboard, duels and shared results, other users can see your name, profile photo, points, level and badges. Your phone number, settings and detailed answers are never shown to anyone.'],
        },
        {
            id: 'device',
            icon: '📱',
            title: 'Data on your device',
            paragraphs: ['So you don\'t have to sign in every time, the Service stores an access token and your chosen language in local storage, plus a secure cookie used to refresh your session. We do not use advertising or third-party tracking cookies.'],
        },
        {
            id: 'share',
            icon: '🤝',
            title: 'Sharing with third parties',
            paragraphs: ['We do not sell your data or share it for advertising. Data may only be processed by:'],
            items: [
                'Telegram — for sign-in and for the Mini App and bot to work;',
                'hosting providers whose servers run the Service;',
                'Google Play — when you install the Android app (under Google\'s terms);',
                'public authorities — only where strictly required by law.',
            ],
        },
        {
            id: 'retention',
            icon: '⏳',
            title: 'Retention',
            paragraphs: ['We keep your data for as long as you have an account. After a deletion request, we delete the account and related data within 30 days. Technical logs are kept for no more than 90 days. Anonymised statistics may be kept longer because they cannot identify you.'],
        },
        {
            id: 'security',
            icon: '🔒',
            title: 'Security',
            paragraphs: ['All data is transmitted over HTTPS. Server access is restricted and tokens expire. No method of transmission is 100% secure, but we take all reasonable measures to protect your information.'],
        },
        {
            id: 'rights',
            icon: '⚖️',
            title: 'Your rights',
            items: [
                'find out what data we hold about you and get a copy;',
                'correct inaccurate data;',
                'delete your account and all related data;',
                'withdraw consent and stop the bot from messaging you.',
            ],
            note: `To exercise these rights, email us at ${CONTACT_EMAIL}. We will reply within 30 days.`,
        },
        {
            id: 'children',
            icon: '🧒',
            title: 'Children',
            paragraphs: ['The Service is designed for school students, university applicants and students. Users under 14 should use the Service with the consent of a parent or legal guardian. If you believe a child has shared data with us without such consent, contact us and we will delete it.'],
        },
        {
            id: 'changes',
            icon: '🔄',
            title: 'Changes to this policy',
            paragraphs: ['We may update this policy. The current version is always available at dovtalab.app/privacy, with the revision date shown at the top. We will notify you of significant changes in the app or via the bot.'],
        },
        {
            id: 'contacts',
            icon: '✉️',
            title: 'Contact',
            paragraphs: [`For any questions about your data and privacy, email us at ${CONTACT_EMAIL}.`],
        },
    ],
}

// ── TG ──
const tg: PolicyContent = {
    title: 'Сиёсати махфият',
    updatedLabel: 'Таҳрир аз',
    updatedAt: '14 октябри 2026',
    intro: 'Dovtalab — платформаи таълимӣ барои омодагӣ ба имтиҳонҳо: тестҳо, супоришҳои ҳаррӯза, дуэлҳо ва рейтинг. Мо ба маълумоти шумо бодиққат муносибат мекунем ва танҳо он чизеро ҷамъ меорем, ки барои кори барнома воқеан лозим аст. Дар ин саҳифа бо забони содда гуфта шудааст, ки мо чӣ ҷамъ меорем, барои чӣ ва чӣ тавр шумо онро идора карда метавонед.',
    tocTitle: 'Мундариҷа',
    sections: [
        {
            id: 'general',
            icon: '📄',
            title: 'Муқаррароти умумӣ',
            paragraphs: [
                'Ин сиёсат ба версияи веб dovtalab.app, мини-барнома дар Telegram ва барномаи мобилии Dovtalab барои Android (минбаъд — «Хизматрасонӣ») татбиқ мешавад.',
                'Бо истифодаи Хизматрасонӣ ва ворид шудан, шумо тасдиқ мекунед, ки бо сиёсат шинос шудаед ва ба коркарди маълумот дар ҳамин шартҳо розӣ ҳастед. Агар розӣ набошед, лутфан Хизматрасониро истифода набаред.',
            ],
        },
        {
            id: 'collect',
            icon: '🗂',
            title: 'Мо кадом маълумотро ҷамъ меорем',
            paragraphs: ['Мо паролро намепурсем ва нигоҳ намедорем. Воридшавӣ тавассути Telegram сурат мегирад, бинобар ин мо танҳо он чизеро мегирем, ки Telegram бо розигии шумо медиҳад:'],
            items: [
                'Маълумоти аккаунти Telegram: идентификатор, ном, насаб, номи корбар (username) ва акси профил. Рақами телефон — танҳо агар худатон дар равзанаи Telegram иҷозат дода бошед.',
                'Фаъолияти таълимӣ: тестҳои супоридашуда, ҷавобҳо, натиҷаҳои дуруст ва нодуруст, холҳо, XP, силсилаҳо, иштирок дар дуэлҳо ва супоришҳои ҳаррӯза, нишонҳои бадастоварда.',
                'Танзимот: забони интерфейс, таймер, шумораи саволҳо ва вақт барои ҳар савол.',
                'Обуна: тарифи интихобшуда, ҳолат ва мӯҳлати амал. Маълумоти пардохт (рақами корт ва ғ.) мо намегирем ва нигоҳ намедорем.',
                'Маълумоти техникӣ: суроғаи IP, навъи дастгоҳ ва браузер, версияи барнома, вақти дархостҳо ва гузоришҳои хатоҳо — барои амният ва кори устувор.',
            ],
        },
        {
            id: 'purpose',
            icon: '🎯',
            title: 'Мо маълумотро барои чӣ истифода мебарем',
            items: [
                'Воридшавӣ ва ҳифзи аккаунти шумо.',
                'Нигоҳ доштани пешрафт, омор ва танзимоти шахсӣ.',
                'Кори функсияҳои мусобиқавӣ: рейтинг, дуэлҳо, супоришҳои ҳаррӯза.',
                'Пешниҳоди обунаи Pro ва имкониятҳои он.',
                'Беҳтар кардани саволҳо ва барнома дар асоси омори беном.',
                'Фиристодани огоҳиномаҳои хидматӣ тавассути боти Telegram (агар ба бот иҷозат дода бошед).',
            ],
        },
        {
            id: 'public',
            icon: '👥',
            title: 'Корбарони дигар чӣ мебинанд',
            paragraphs: ['Дар рейтинг, дуэлҳо ва ҳангоми мубодилаи натиҷаҳо ба корбарони дигар номи шумо, акси профил, холҳо, сатҳ ва нишонҳо намоёнанд. Рақами телефон, танзимот ва ҷавобҳои муфассали шумо ба ҳеҷ кас нишон дода намешаванд.'],
        },
        {
            id: 'device',
            icon: '📱',
            title: 'Маълумот дар дастгоҳи шумо',
            paragraphs: ['Барои он ки ҳар дафъа ворид нашавед, Хизматрасонӣ дар дастгоҳ токени дастрасӣ ва забони интихобшударо (анбори маҳаллӣ), инчунин cookie-и ҳифзшударо барои навсозии сессия нигоҳ медорад. Мо cookie-ҳои рекламавӣ ва пайгирии шахсони сеюмро истифода намебарем.'],
        },
        {
            id: 'share',
            icon: '🤝',
            title: 'Додан ба шахсони сеюм',
            paragraphs: ['Мо маълумоти шуморо намефурӯшем ва бо мақсадҳои рекламавӣ намедиҳем. Маълумот метавонад танҳо аз ҷониби инҳо коркард шавад:'],
            items: [
                'Telegram — барои воридшавӣ ва кори мини-барнома ва бот;',
                'провайдерҳои хостинг, ки Хизматрасонӣ дар серверҳои онҳо кор мекунад;',
                'Google Play — ҳангоми насби барнома дар Android (мувофиқи қоидаҳои Google);',
                'мақомоти давлатӣ — танҳо дар ҳолатҳое, ки қонун мустақиман пешбинӣ кардааст.',
            ],
        },
        {
            id: 'retention',
            icon: '⏳',
            title: 'Мӯҳлати нигоҳдорӣ',
            paragraphs: ['Маълумот то он даме нигоҳ дошта мешавад, ки шумо аккаунт доред. Пас аз дархости нест кардан мо аккаунт ва маълумоти марбутро дар давоми 30 рӯз нест мекунем. Гузоришҳои техникӣ на зиёда аз 90 рӯз нигоҳ дошта мешаванд. Омори беном метавонад дарозтар нигоҳ дошта шавад, зеро он шуморо муайян карда наметавонад.'],
        },
        {
            id: 'security',
            icon: '🔒',
            title: 'Амният',
            paragraphs: ['Ҳамаи маълумот тавассути протоколи ҳифзшудаи HTTPS интиқол дода мешавад. Дастрасӣ ба серверҳо маҳдуд аст ва токенҳо мӯҳлати маҳдуд доранд. Ягон усули интиқол 100% ҳифзшуда нест, аммо мо ҳама чораҳои оқилонаро барои ҳифзи маълумоти шумо меандешем.'],
        },
        {
            id: 'rights',
            icon: '⚖️',
            title: 'Ҳуқуқҳои шумо',
            items: [
                'донистани он ки кадом маълумот дар бораи шумо нигоҳ дошта мешавад ва гирифтани нусхаи он;',
                'ислоҳ кардани маълумоти нодуруст;',
                'нест кардани аккаунт ва ҳамаи маълумоти марбут;',
                'бозхондани розигӣ ва манъ кардани паёмҳои бот.',
            ],
            note: `Барои истифодаи ин ҳуқуқҳо ба почтаи ${CONTACT_EMAIL} нависед. Мо дар давоми 30 рӯз ҷавоб медиҳем.`,
        },
        {
            id: 'children',
            icon: '🧒',
            title: 'Кӯдакон',
            paragraphs: ['Хизматрасонӣ барои хонандагон, довталабон ва донишҷӯён пешбинӣ шудааст. Агар синну соли корбар аз 14 кам бошад, ӯ бояд Хизматрасониро бо розигии волидон ё намояндагони қонунӣ истифода барад. Агар фикр кунед, ки кӯдак бе чунин розигӣ ба мо маълумот додааст, бо мо тамос гиред — мо онро нест мекунем.'],
        },
        {
            id: 'changes',
            icon: '🔄',
            title: 'Тағйироти сиёсат',
            paragraphs: ['Мо метавонем ин сиёсатро навсозӣ кунем. Версияи амалкунанда ҳамеша дар саҳифаи dovtalab.app/privacy дастрас аст ва санаи таҳрир дар боло нишон дода шудааст. Дар бораи тағйироти муҳим мо дар барнома ё тавассути бот хабар медиҳем.'],
        },
        {
            id: 'contacts',
            icon: '✉️',
            title: 'Тамос',
            paragraphs: [`Бо ҳар саволе дар бораи маълумот ва махфият ба почтаи ${CONTACT_EMAIL} муроҷиат кунед.`],
        },
    ],
}

export const POLICY: Record<AppLocale, PolicyContent> = { ru, en, tg }
