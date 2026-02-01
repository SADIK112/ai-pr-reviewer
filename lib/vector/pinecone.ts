import { Pinecone, ServerlessSpecCloudEnum } from "@pinecone-database/pinecone"

let pineconeClient: Pinecone | null = null;

/**
 * Initialize pinecone client
 * @returns Pinecone 
 */
export const getPineconeClient = (): Pinecone => {
    if (pineconeClient) {
        return pineconeClient;
    }

    const apiKey = process.env.PINECONE_API_KEY;

    if (!apiKey) {
        throw new Error("Pinecone API key is not set in environment variables.");
    }

    pineconeClient = new Pinecone({ apiKey });

    return pineconeClient;
};

/**
 * Get or create index
 * @returns 
 */
export const getOrCreateIndex = async () => {
    const client = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME || "pr-review-embeddings";

    try {
        const indexes = await client.listIndexes();
        const indexExists = indexes.indexes?.some(idx => idx.name === indexName);

        if (!indexExists) {
            console.log(`[Pinecone] Creating index: ${indexName}`);

            await client.createIndex({
                name: indexName,
                dimension: 384,
                metric: "cosine",
                spec: {
                    serverless: {
                        cloud: (
                            process.env.PINECONE_SERVER_SERVICE_PROVIDER || 'aws'
                        ) as ServerlessSpecCloudEnum,
                        region: process.env.PINECONE_SERVER_REGION || "us-east-1",
                    }
                }
            });

            console.log('[Pinecone] Waiting for index to be ready...');
            await new Promise(resolve => setTimeout(resolve, 60000));
        };

        return client.Index(indexName);
    } catch (error: any) {
        console.error('[Pinecone] Error getting/creating index:', error);
        throw error;
    }
}

/**
 * Check index status
 * @returns 
 */
export const checkIndexStatus = async () => {
    try {
        const client = getPineconeClient();
        const indexName = process.env.PINECONE_INDEX_NAME || "pr-review-embeddings";

        const description = await client.describeIndex(indexName);
        return description;
    } catch (error: any) {
        console.error('[Pinecone] Error checking index status:', error);
        return null;
    }
}