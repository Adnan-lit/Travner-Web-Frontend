export interface Media {
    id: string;
    postId: string;
    url: string;
    type: MediaType;
    createdAt: string;
}

export enum MediaType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO'
}
