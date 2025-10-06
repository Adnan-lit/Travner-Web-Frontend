export interface Media {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploaderId: string;
    postId: string;
    uploadedAt: string;
    // Legacy fields for backward compatibility
    url?: string;
    type?: MediaType;
    createdAt?: string;
}

export enum MediaType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO'
}
