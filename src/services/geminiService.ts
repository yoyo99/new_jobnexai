import type { Job, Profile } from "../types";

export async function* generateCoverLetterStream(
    profile: Profile,
    job: Job,
    lang: string,
    t: (key: string) => string,
): AsyncGenerator<string> {
    // TODO: Use profile, lang, and t when implementing real Gemini API streaming
    // For now, we simulate the streaming response
    // Simulate streaming chunks for cover letter generation

    // In production, this would call Google Gemini API with streaming
    // For now, we'll simulate streaming text
    const chunks = [
        `Dear Hiring Manager,\n\n`,
        `I am writing to express my strong interest in the ${job.title} position at ${job.company}. `,
        `With my background and experience, I am confident I would be a valuable addition to your team.\n\n`,
        `${
            job.description
                ? "Your job posting indicates you are looking for " +
                    job.description.substring(0, 100) + "...\n\n"
                : ""
        }`,
        `I look forward to discussing how my skills and experience align with your needs.\n\n`,
        `Best regards`,
    ];

    for (const chunk of chunks) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        yield chunk;
    }
}
