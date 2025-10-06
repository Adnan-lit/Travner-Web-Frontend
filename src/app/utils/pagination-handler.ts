import { ApiPaginationInfo } from '../models/api-response.model';

/**
 * Pagination Handler
 * Implements pagination according to Travner API specifications
 */
export class PaginationHandler {
  /**
   * Default pagination parameters
   */
  static readonly DEFAULT_PAGE = 0;
  static readonly DEFAULT_SIZE = 10;

  /**
   * Create HTTP parameters for pagination
   * @param page Page number (0-based)
   * @param size Page size
   * @param sortBy Field to sort by
   * @param direction Sort direction (asc/desc)
   * @returns URLSearchParams object with pagination parameters
   */
  static createPaginationParams(
    page: number = this.DEFAULT_PAGE,
    size: number = this.DEFAULT_SIZE,
    sortBy?: string,
    direction?: 'asc' | 'desc'
  ): URLSearchParams {
    const params = new URLSearchParams();
    
    params.set('page', page.toString());
    params.set('size', size.toString());
    
    if (sortBy) {
      params.set('sortBy', sortBy);
    }
    
    if (direction) {
      params.set('direction', direction);
    }
    
    return params;
  }

  /**
   * Parse pagination info from API response
   * @param pagination Pagination object from API
   * @returns Normalized pagination info
   */
  static parsePaginationInfo(pagination: any): ApiPaginationInfo | null {
    if (!pagination || typeof pagination !== 'object') {
      return null;
    }

    return {
      page: this.parseNumber(pagination.page) ?? this.parseNumber(pagination.number) ?? this.parseNumber(pagination.pageNumber) ?? 0,
      size: this.parseNumber(pagination.size) ?? this.parseNumber(pagination.pageSize) ?? this.DEFAULT_SIZE,
      totalElements: this.parseNumber(pagination.totalElements) ?? this.parseNumber(pagination.total_elements) ?? 0,
      totalPages: this.parseNumber(pagination.totalPages) ?? this.parseNumber(pagination.total_pages) ?? 0,
      first: pagination.first ?? (this.parseNumber(pagination.page) === 0),
      last: pagination.last ?? (this.parseNumber(pagination.page) === (this.parseNumber(pagination.totalPages) ?? 0) - 1)
    };
  }

  /**
   * Safely parse a value to number
   * @param value Value to parse
   * @returns Parsed number or null if invalid
   */
  private static parseNumber(value: any): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Check if pagination has more pages
   * @param pagination Pagination info
   * @returns True if there are more pages
   */
  static hasNextPage(pagination: ApiPaginationInfo): boolean {
    return pagination.page < pagination.totalPages - 1;
  }

  /**
   * Check if pagination has previous pages
   * @param pagination Pagination info
   * @returns True if there are previous pages
   */
  static hasPreviousPage(pagination: ApiPaginationInfo): boolean {
    return pagination.page > 0;
  }

  /**
   * Get the next page number
   * @param pagination Pagination info
   * @returns Next page number or current page if no next page
   */
  static getNextPage(pagination: ApiPaginationInfo): number {
    return this.hasNextPage(pagination) ? pagination.page + 1 : pagination.page;
  }

  /**
   * Get the previous page number
   * @param pagination Pagination info
   * @returns Previous page number or current page if no previous page
   */
  static getPreviousPage(pagination: ApiPaginationInfo): number {
    return this.hasPreviousPage(pagination) ? pagination.page - 1 : pagination.page;
  }

  /**
   * Create pagination info for empty results
   * @param page Current page
   * @param size Page size
   * @returns Pagination info for empty results
   */
  static createEmptyPagination(page: number = this.DEFAULT_PAGE, size: number = this.DEFAULT_SIZE): ApiPaginationInfo {
    return {
      page,
      size,
      totalElements: 0,
      totalPages: 0
    };
  }
}