export interface RepositoryWithStats {
    id: number;
    name: string;
    owner: string;
    fullName: string;
    description: string | null;
    isActive: boolean;
    webhookId: string | null;
    webhookSecret: string;
    prCount: number;
    createdAt: Date;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}