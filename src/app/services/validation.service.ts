import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

@Injectable({
    providedIn: 'root'
})
export class ValidationService {

    /**
     * Validate email format
     */
    validateEmail(email: string): ValidationResult {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);

        return {
            isValid,
            errors: isValid ? [] : ['Please enter a valid email address']
        };
    }

    /**
     * Validate password strength
     */
    validatePassword(password: string): ValidationResult {
        const errors: string[] = [];

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate username format
     */
    validateUsername(username: string): ValidationResult {
        const errors: string[] = [];

        if (username.length < 3) {
            errors.push('Username must be at least 3 characters long');
        }

        if (username.length > 20) {
            errors.push('Username must be no more than 20 characters long');
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            errors.push('Username can only contain letters, numbers, hyphens, and underscores');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate required field
     */
    validateRequired(value: any, fieldName: string): ValidationResult {
        const isValid = value !== null && value !== undefined && value !== '';

        return {
            isValid,
            errors: isValid ? [] : [`${fieldName} is required`]
        };
    }
}