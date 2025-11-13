
export const isWebGLAvailable = (): boolean => {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        // Check if context was created and is a WebGL context
        if (gl && gl instanceof WebGLRenderingContext) {
            // A minimal check to see if the context is functional. 
            // Attempting to get a parameter will fail on non-functional contexts.
            const version = gl.getParameter(gl.VERSION);
            // Ensure version is a non-empty string.
            return typeof version === 'string' && version.length > 0;
        }
        
        return false;
    } catch (e) {
        // If any part of this process throws an error, assume no support.
        return false;
    }
};
