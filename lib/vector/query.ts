import { generateEmbedding, prepareTextForEmbedding } from "./embeddings";
import { getOrCreateIndex } from "./pinecone";
import { VectorMetadata } from "./store";

export interface SimilarSuggestion {
    score: number;
    metadata: VectorMetadata
}

/**
 * Find similar past suggestions based on code snippet
 * @param userId 
 * @param codeSnippet 
 * @param filePath 
 * @param options 
 * @returns 
 */
export const findSimilarSuggestions = async (
    userId: string,
    codeSnippet: string,
    filePath: string,
    options?: {
        topK?: number;
        minScore?: number,
        filterAccepted?: boolean,
        language?: string
    }
): Promise<SimilarSuggestion[]> => {
    try {
        const { topK = 5, minScore = 0.7, filterAccepted, language } = options || {};

        console.log(`[Vector Query] Searching for similar suggestions for user: ${userId}`);

        const index = await getOrCreateIndex();
        // Prepare text for embedding
        const queryText = prepareTextForEmbedding({
            codeSnippet,
            filePath,
            language,
        });
        // Generate embedding for query
        const queryEmbedding = await generateEmbedding(queryText);
        // Build filter
        const filter: any = {
            userId: { "$eq": userId }
        }
        if (filterAccepted !== undefined) {
            filter.wasAccepted = { "$eq": filterAccepted };
        }
        // Perform query
        const queryResponse = await index.query({
            vector: queryEmbedding,
            topK,
            includeMetadata: true,
            filter,
        });
        // Filter by minimum score and format results
        const results: SimilarSuggestion[] = queryResponse.matches
            .filter(match => match.score && match.score >= minScore)
            .map(match => ({
                score: match.score || 0,
                metadata: match.metadata as any,
            }));
        console.log(`[Vector Query] Found ${results.length} similar suggestions`);

        return results;
    } catch (error: any) {
        console.error('[Vector Query] Error finding similar suggestions:', error);
        throw error;
    }
}

/**
 * Find similar suggestions across all users (for pattern learning)
 * @param codeSnippet 
 * @param filePath 
 * @param options 
 * @returns 
 */
export const findSimilarSuggestionsGlobal = async (
    codeSnippet: string,
    filePath: string,
    options?: {
        topK?: number;
        minScore?: number,
        language?: string
    }
): Promise<SimilarSuggestion[]> => {
    try {
        const { topK = 10, minScore = 0.75, language } = options || {};

        console.log('[Vector Query] Searching for similar suggestions globally');

        const index = await getOrCreateIndex();

        // Prepare query text
        const queryText = prepareTextForEmbedding({
            codeSnippet,
            filePath,
            language,
        });

        // Generate embedding for query
        const queryEmbedding = await generateEmbedding(queryText);

        // Query without user filter
        const queryResponse = await index.query({
            vector: queryEmbedding,
            topK,
            includeMetadata: true,
            filter: {
                wasAccepted: { $eq: true } // Only accepted suggestions
            }
        });

        // Filter and format results
        const results: SimilarSuggestion[] = queryResponse.matches
            .filter(match => match.score && match.score >= minScore)
            .map(match => ({
                score: match.score || 0,
                metadata: match.metadata as any,
            }));

        console.log(`[Vector Query] Found ${results.length} similar suggestions globally`);

        return results;
    } catch (error: any) {
        console.error('[Vector Query] Error finding similar suggestions globally:', error);
        throw error;
    }
}

/**
 * Get statistics about stored vectors for a user
 * @param userId 
 * @returns 
 */
export const getUserVectorStats = async (userId: string): Promise<{
    totalVectors: number;
    acceptedVectors: number;
    rejectedVectors: number;
}> => {
    try {
        const index = await getOrCreateIndex();
        const totalQuery = await index.query({
            vector: new Array(1536).fill(0),
            topK: 10000,
            includeMetadata: true,
            filter: { userId: { $eq: userId } }
        });
        
        const total = totalQuery.matches.length;
        const accepted = totalQuery.matches.filter(m => m.metadata?.wasAccepted).length;
        const rejected = total - accepted;

        return {
            totalVectors: total,
            acceptedVectors: accepted,
            rejectedVectors: rejected,
        }
    } catch (error: any) {
        console.error('[Vector Query] Error getting user stats:', error);
        return {
            totalVectors: 0,
            acceptedVectors: 0,
            rejectedVectors: 0,
        };
    }
}