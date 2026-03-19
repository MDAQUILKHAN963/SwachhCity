/**
 * Utility to handle image URLs from both local and cloud storage
 */
export const getImageUrl = (path) => {
    if (!path) return null;

    // If it's already a full URL (Cloudinary), return it
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Otherwise, it's a local path, prepend the backend API URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Ensure we don't have double slashes
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
};
