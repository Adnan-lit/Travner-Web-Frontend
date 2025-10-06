/**
 * Lightweight image utility for placeholder generation
 */
export class ImageUtil {

    /**
     * Generate a minimal SVG placeholder
     */
    static generatePlaceholder(
        width: number = 300,
        height: number = 200,
        text: string = 'No Image',
        bgColor: string = '#f1f5f9',
        textColor: string = '#64748b'
    ): string {
        // Minified SVG for smaller bundle size
        const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${bgColor}"/><text x="50%" y="50%" font-family="Arial,sans-serif" font-size="16" fill="${textColor}" text-anchor="middle" dy=".3em">${text}</text></svg>`;
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    /**
     * Lazy-loaded placeholders to reduce initial bundle size
     */
    private static _placeholders: Record<string, string> | null = null;

    static get PLACEHOLDERS(): Record<string, string> {
        if (!this._placeholders) {
            this._placeholders = {
                PRODUCT_LIST: this.generatePlaceholder(300, 200, 'Product Image'),
                PRODUCT_DETAIL: this.generatePlaceholder(400, 300, 'Product Image'),
                CART_ITEM: this.generatePlaceholder(100, 100, 'Item'),
                ADMIN_PRODUCT: this.generatePlaceholder(200, 150, 'Product'),
                NO_IMAGE: this.generatePlaceholder(300, 200, 'No Image Available'),
                IMAGE_NOT_AVAILABLE: this.generatePlaceholder(300, 200, 'Image Not Available'),
                LOADING: this.generatePlaceholder(300, 200, 'Loading...', '#e2e8f0', '#94a3b8')
            };
        }
        return this._placeholders;
    }

    /**
     * Handle image error by setting fallback placeholder
     */
    static handleImageError(event: Event, fallbackType: string = 'NO_IMAGE'): void {
        const img = event.target as HTMLImageElement;
        if (img) {
            img.src = this.PLACEHOLDERS[fallbackType] || this.PLACEHOLDERS['NO_IMAGE'];
        }
    }

    /**
     * Get appropriate placeholder for different contexts
     */
    static getPlaceholder(context: 'product-list' | 'product-detail' | 'cart' | 'admin' = 'product-list'): string {
        switch (context) {
            case 'product-list':
                return this.PLACEHOLDERS['PRODUCT_LIST'];
            case 'product-detail':
                return this.PLACEHOLDERS['PRODUCT_DETAIL'];
            case 'cart':
                return this.PLACEHOLDERS['CART_ITEM'];
            case 'admin':
                return this.PLACEHOLDERS['ADMIN_PRODUCT'];
            default:
                return this.PLACEHOLDERS['NO_IMAGE'];
        }
    }

    /**
     * Create sample product images with different themes (optimized)
     */
    static createSampleProductImage(productName: string, size: { width: number, height: number } = { width: 300, height: 200 }): string {
        // Reduced color palette for smaller bundle
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
        const colorIndex = productName.length % colors.length;

        return this.generatePlaceholder(
            size.width,
            size.height,
            productName,
            colors[colorIndex],
            '#ffffff'
        );
    }
}