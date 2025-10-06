// Type-safe interfaces for better type checking

export interface User {
    id: {
        timestamp: number;
        date: string;
    };
    userName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    roles?: string[];
    bio?: string | null;
    profileImageUrl?: string | null;
    location?: string | null;
    createdAt?: string;
    lastLoginAt?: string;
    active?: boolean;
}

export interface AdminUser extends User {
    isActive: boolean;
    lastLoginAt?: string;
    profilePictureUrl?: string;
}

export interface DiagnosticStep {
    step: string;
    status: string;
    data: any;
}

export interface DiagnosticResults {
    timestamp: string;
    status: string;
    steps: DiagnosticStep[];
}

export interface UserFilter {
    search: string;
    role: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

export interface SystemStats {
    totalUsers: number;
    totalPosts: number;
    totalActiveUsers: number;
    totalAdmins: number;
}

export interface ApiError {
    message: string;
    status?: number;
    error?: string;
}