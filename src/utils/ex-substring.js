export function extractSubstring(input) {
    const parts = input.split('/');
    if (parts.length > 1) {
        return parts.slice(1).join('/');
    } else {
        return "";
    }
}