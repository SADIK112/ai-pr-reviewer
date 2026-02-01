import OpenAI from "openai"
import { getOpenAIClient } from "../ai/client";
import { InferenceClient } from '@huggingface/inference';

let openaiClient: OpenAI | null = getOpenAIClient();
// Initialize with your Hugging Face Access Token
const hf = new InferenceClient(process.env.HF_API_KEY);
/**
 * Generate embeddings for multiple texts (batch)
 * @param text 
 * @returns 
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
        const embedding = await hf.featureExtraction({
            model: 'sentence-transformers/all-MiniLM-L6-v2', // Standard lightweight model
            inputs: text,
        }) as number[];

        return embedding;
    } catch (error: any) {
        console.error('[Embeddings] Error generating embedding:', error);
        throw new Error(`Failed to generate embedding: ${error.message}`);
    }
}

/**
 * Generate embeddings for multiple texts (batch)
 * @param texts 
 * @returns 
 */
export const generateEmbeddings = async (texts: string[]): Promise<number[][]> => {
    try {
        if (texts.length === 0) return [];

        // Recommended batch size for HF serverless API is lower than OpenAI
        const batchSize: number = 32;
        const allEmbeddings: number[][] = [];

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);

            // Hugging Face featureExtraction returns number[] for single string 
            // or number[][] for an array of strings
            console.log("[Huggingface] Convert text to embeddings", batch.length)
            const response = await hf.featureExtraction({
                model: 'sentence-transformers/all-MiniLM-L6-v2', // Standard lightweight model
                inputs: batch,
            }) as number[][];

            allEmbeddings.push(...response);
        }

        return allEmbeddings;
    } catch (error: any) {
        console.error('[Embeddings] Error generating HF batch embeddings:', error);
        throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
}


export const prepareTextForEmbedding = (options: {
    codeSnippet: string;
    filePath: string;
    suggestionTitle?: string;
    suggestionDescription?: string;
    language?: string;
}): string => {
    const {
        codeSnippet,
        filePath,
        suggestionTitle,
        suggestionDescription,
        language,
    } = options;
    // Create a rich text representation
    let text = `File Path: ${filePath}\n`;

    if (language) {
        text += `Language: ${language}\n`;
    };

    if (suggestionTitle) {
        text += `Issue: ${suggestionTitle}\n`;
    };

    if (suggestionDescription) {
        text += `Description: ${suggestionDescription}\n`;
    };
    text += `\nCode:\n${codeSnippet}\n`;
    // Truncate if too long (openai 8191 token limit)
    const maxLength = 6000;
    if (text.length > maxLength) {
        text = text.substring(0, maxLength) + '...';
    };

    return text;
}