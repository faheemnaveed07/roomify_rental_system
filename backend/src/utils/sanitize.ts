const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

export const sanitizeText = (value: string): string => {
    return value.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
};

export default sanitizeText;
