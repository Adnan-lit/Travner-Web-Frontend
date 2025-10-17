import { ApiResponse, ApiPaginationInfo } from './api-response.model';
import { MediaFile } from './common.model';

// Extended Media interface that includes both MediaFile properties and legacy properties
export interface Media extends MediaFile {
  url?: string;
  createdAt?: string;
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