import { ApiResponse } from './api-response.model';

export interface Media {
    id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
    createdAt: string;
}

export type MediaResponse = ApiResponse<Media>;
export type MediaListResponse = ApiResponse<Media[]>;