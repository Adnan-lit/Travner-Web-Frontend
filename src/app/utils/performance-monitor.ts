/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
    private static timers: Map<string, number> = new Map();

    /**
     * Start timing an operation
     */
    static startTiming(operation: string): void {
        this.timers.set(operation, performance.now());
    }

    /**
     * End timing an operation and log the result
     */
    static endTiming(operation: string): number {
        const startTime = this.timers.get(operation);
        if (!startTime) {
            console.warn(`No start time found for operation: ${operation}`);
            return 0;
        }

        const duration = performance.now() - startTime;
        this.timers.delete(operation);

        if (localStorage.getItem('travner_debug') === 'true') {
            console.log(`⏱️ ${operation} took ${duration.toFixed(2)}ms`);
        }

        return duration;
    }

    /**
     * Measure and log memory usage
     */
    static logMemoryUsage(context: string): void {
        if (localStorage.getItem('travner_debug') === 'true' && (performance as any).memory) {
            const memory = (performance as any).memory;
            console.log(`🧠 Memory usage (${context}):`, {
                used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
                total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
                limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
            });
        }
    }

    /**
     * Monitor DOM node count
     */
    static logDOMComplexity(context: string): void {
        if (localStorage.getItem('travner_debug') === 'true') {
            const nodeCount = document.getElementsByTagName('*').length;
            console.log(`🏗️ DOM complexity (${context}): ${nodeCount} elements`);
        }
    }

    /**
     * Check if performance is degraded
     */
    static checkPerformance(): {
        slowOperations: string[];
        highMemoryUsage: boolean;
        complexDOM: boolean;
    } {
        const result = {
            slowOperations: [] as string[],
            highMemoryUsage: false,
            complexDOM: false
        };

        // Check for slow operations (> 100ms)
        this.timers.forEach((startTime, operation) => {
            const duration = performance.now() - startTime;
            if (duration > 100) {
                result.slowOperations.push(`${operation} (${duration.toFixed(2)}ms)`);
            }
        });

        // Check memory usage
        if ((performance as any).memory) {
            const memory = (performance as any).memory;
            const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
            result.highMemoryUsage = usageRatio > 0.8; // 80% threshold
        }

        // Check DOM complexity
        const nodeCount = document.getElementsByTagName('*').length;
        result.complexDOM = nodeCount > 1000; // 1000 elements threshold

        return result;
    }
}