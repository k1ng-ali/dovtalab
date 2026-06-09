// src/shared/lib/seo.ts
export const getQuizSchema = (title: string, description: string) => ({
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": title,
    "description": description,
    "educationalLevel": "University",
    "inLanguage": "ru"
});