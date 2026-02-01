import { Suggestion } from "@/types";
import { getOrCreateIndex } from "./pinecone";
import { generateEmbedding, generateEmbeddings, prepareTextForEmbedding } from "./embeddings";
import { getLanguageFromFilename } from "../github/pr-fetcher";

export interface VectorMetadata {
    userId: string;
    prNumber: number;
    prId: string;
    filePath: string;
    functionName?: string;
    suggestionId: string;
    suggestionType: string;
    suggestionTitle: string;
    suggestionSeverity: string;
    suggestionDescription: string;
    codeSnippet: string;
    suggestedCode?: string;
    wasAccepted?: boolean;
    language?: string;
    timestamp: string;
}

/**
 * Store a suggestion embedding in Pinecone
 * @param userId 
 * @param prNumber 
 * @param prId 
 * @param suggestion 
 * @param wasAccepted 
 * @param language 
 */
export const storeSuggestionEmbedding = async (
    userId: string,
    prNumber: number,
    prId: string,
    suggestion: Suggestion,
    wasAccepted: boolean,
    language?: string
): Promise<void> => {
    try {
        console.log(`[Vector Store] Storing embedding for suggestion: ${suggestion.id}`);

        const index = await getOrCreateIndex();
        // Prepare text for embedding
        const textToEmbed = prepareTextForEmbedding({
            codeSnippet: suggestion.codeSnippet || "",
            filePath: suggestion.filePath,
            suggestionTitle: suggestion.title,
            suggestionDescription: suggestion.description,
            language,
        });
        // Generate embedding
        const embedding = await generateEmbedding(textToEmbed);
        // Prepare metadata
        const metadata: VectorMetadata = {
            userId,
            prNumber,
            prId,
            filePath: suggestion.filePath,
            suggestionId: suggestion.id || `temp_${Date.now()}`,
            suggestionType: suggestion.type,
            suggestionTitle: suggestion.title,
            suggestionSeverity: suggestion.severity,
            suggestionDescription: suggestion.description || "",
            codeSnippet: suggestion.codeSnippet || "",
            suggestedCode: suggestion.suggestedCode,
            wasAccepted,
            language,
            timestamp: new Date().toISOString(),
        };

        // Store in Pinecone
        const vectorId = `${userId}_${prId}_${suggestion.id || Date.now()}`;
        await index.upsert([
            {
                id: vectorId,
                values: embedding,
                metadata: metadata as any,
            }
        ]);
        console.log(`[Vector Store] Successfully stored embedding with ID: ${vectorId}`);
    } catch (error: any) {
        console.error('[Vector Store] Error storing embedding:', error);
        throw error;
    }
}

/**
 * Store multiple suggestion embeddings in batch
 * @param userId
 * @param prNumber 
 * @param prId 
 * @param suggestions 
 * @returns 
 */
export const storeSuggestionEmbeddingsBatch = async (
    userId: string,
    prNumber: number,
    prId: string,
    suggestions: Suggestion[],
): Promise<void> => {
    try {
        if (suggestions.length === 0) return;

        console.log(`[Vector Store] Storing ${suggestions.length} embeddings in batch`);
        const index = await getOrCreateIndex();
        // Prepare all texts
        const texts = suggestions.map((suggestion) =>
            prepareTextForEmbedding({
                codeSnippet: suggestion.codeSnippet ?? '',
                filePath: suggestion.filePath,
                suggestionTitle: suggestion.title,
                suggestionDescription: suggestion.description,
                language: getLanguageFromFilename(suggestion.filePath),
            })
        );
        console.log({ texts })
        // generate all embedding
        const embeddings = await generateEmbeddings(texts);
        // Create vectors with metadata
        const vectors = suggestions.map((suggestion, i) => {
            const metadata: VectorMetadata = {
                userId,
                prNumber,
                prId,
                filePath: suggestion.filePath,
                suggestionId: suggestion.id || `temp_${Date.now()}_${i}`,
                suggestionType: suggestion.type,
                suggestionSeverity: suggestion.severity,
                suggestionTitle: suggestion.title,
                suggestionDescription: suggestion.description,
                codeSnippet: suggestion.codeSnippet || '',
                suggestedCode: suggestion.suggestedCode,
                language: getLanguageFromFilename(suggestion.filePath),
                timestamp: new Date().toISOString(),
            };

            return {
                id: `${userId}_${prId}_${suggestion.id || Date.now()}_${i}`,
                values: embeddings[i],
                metadata: metadata as any,
            };
        });
        console.log({ vectors })
        // Upsert in batches of 100 (Pinecone limit)
        const BATCH_SIZE = 100;
        for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
            const batch = vectors.slice(i, i + BATCH_SIZE);
            await index.upsert(batch);
        }
        console.log(`[Vector Store] Successfully stored ${vectors.length} embeddings in batch`);
    } catch (error: any) {
        console.error('[Vector Store] Error storing batch embeddings:', error);
        throw error;
    }
}

/**
 * Delete embeddings for a PR
 * @param userId 
 * @param prId 
 */
export const deletePREmbeddings = async (
    userId: string,
    prId: string,
): Promise<void> => {
    try {
        const index = await getOrCreateIndex();
        const prefix = `${userId}_${prId}`;
        await index.deleteOne(prefix);
        console.log(`[Vector Store] Deleted embeddings for PR ID: ${prId}`);
    } catch (error: any) {
        console.error('[Vector Store] Error deleting embeddings:', error);
        throw error;
    }
}