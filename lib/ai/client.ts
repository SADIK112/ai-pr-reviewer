import { OpenAI } from "openai";

const LLM_API_URL = process.env.LLM_API_URL;
const LLM_API_KEY = process.env.LLM_API_KEY;
const MODEL = process.env.LLM_MODEL_NAME || 'openai/gpt-oss-120b:groq';
const MAX_TOKENS = process.env.LLM_MAX_TOKEN || 4096;
const TEMPERATURE = process.env.LLM_TEMPERATURE || 0.4;

/**
 * Initialize OpenAI client
 */
export const getOpenAIClient = (): OpenAI => {
    if (!LLM_API_URL) {
        throw new Error('HF_API_URL is not defined in environment variables');
    }
    if (!LLM_API_KEY) {
        throw new Error('HF_API_KEY is not defined in environment variables');
    }

    return new OpenAI({
        baseURL: process.env.HF_API_URL,
        apiKey: process.env.ANTHROPIC_API_KEY,
    });
}

/**
 * Review code using OpenAI api
 * @param request
 * @return promise<LLMReviewResponse>
 */
export const reviewWithOpenAi = async (
    systemPrompt: string,
    userPrompt: string
): Promise<string> => {
    const client = getOpenAIClient();
    const startTime = Date.now();

    try {
        // Call OpenAI API
        const message = await client.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: userPrompt,
                }
            ],
            max_completion_tokens: Number(MAX_TOKENS),
            temperature: Number(TEMPERATURE),
        });
        // Extract response
        const content = message.choices[0].message.content;
        console.log({ content })
        console.log(`[OpenAI] Response received in ${Date.now() - startTime} ms`);
        if (!content) {
            throw new Error('No content received from the AI model');
        }

        return content;
    } catch (error: any) {
        console.error('[OpenAI] Review failed:', error);
        // Handle rate limits
        if (error.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }
        // Handle other errors
        throw new Error(`OpenAI API error: ${error.message}`);
    }
}

export const getllmConfig = (): {
    apiKey: string;
    model: string;
    tokens: number;
    temperature: number;
} => {
    if (!LLM_API_KEY) {
        throw new Error('OPENAI_API_KEY is not defined in environment variables');
    }

    return {
        apiKey: LLM_API_KEY,
        model: MODEL,
        tokens: Number(MAX_TOKENS),
        temperature: Number(TEMPERATURE),
    }
}