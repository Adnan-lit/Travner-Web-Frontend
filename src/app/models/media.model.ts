import { ApiResponse, ApiPaginationInfo } from './api-response.model';

export interface Media {
    id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
    fileType?: string;
    fileUrl?: string;
    fileName?: string;
    createdAt: string;
}

export interface UploadMediaRequest {
    files: File[];
    type: 'image' | 'video';
}

export interface MediaSearchParams {
    page?: number;
    size?: number;
    sortBy?: string;
    direction?: 'asc' | 'desc';
    type?: 'image' | 'video';
    userId?: string;
}

export type MediaResponse = ApiResponse<Media>;
export type MediaListResponse = ApiResponse<Media[]> & {
    pagination: ApiPaginationInfo;
};