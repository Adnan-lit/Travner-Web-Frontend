export class ImageUtil {
    static handleImageError(event: Event, type: string = 'default'): void {
        const target = event.target as HTMLImageElement;

        // Set appropriate placeholder based on type
        switch (type) {
            case 'product-list':
                target.src = 'https://placehold.co/300x300/ff0000/ffffff?text=Product+List+Image+Error';
                break;
            case 'product-detail':
                target.src = 'https://placehold.co/400x400/ff0000/ffffff?text=Product+Detail+Image+Error';
                break;
            case 'profile':
                target.src = 'https://placehold.co/200x200/ff0000/ffffff?text=Profile+Image+Error';
                break;
            case 'post':
                target.src = 'https://placehold.co/500x300/ff0000/ffffff?text=Post+Image+Error';
                break;
            case 'cart':
                target.src = 'https://placehold.co/100x100/ff0000/ffffff?text=Cart+Image+Error';
                break;
            default:
                target.src = 'https://placehold.co/200x200/ff0000/ffffff?text=Image+Error';
        }

        // Prevent infinite loop if placeholder also fails
        target.onerror = null;
    }

    static getPlaceholder(type: string = 'default'): string {
        switch (type) {
            case 'product-list':
                return 'https://placehold.co/300x300/cccccc/969696?text=Product+Image';
            case 'product-detail':
                return 'https://placehold.co/400x400/cccccc/969696?text=Product+Detail';
            case 'profile':
                return 'https://placehold.co/200x200/cccccc/969696?text=Profile';
            case 'post':
                return 'https://placehold.co/500x300/cccccc/969696?text=Post+Image';
            case 'cart':
                return 'https://placehold.co/100x100/cccccc/969696?text=Cart+Item';
            default:
                return 'https://placehold.co/200x200/cccccc/969696?text=Placeholder';
        }
    }
}