import sanitizeHtml from 'sanitize-html';

export function sanitize(html?: string | null): string {
    if (!html) return '';
    return sanitizeHtml(html, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            'img', 'span', 'h1', 'h2', 'u', 's', 'del', 'br', 'hr', 'code', 'pre'
        ]),
        allowedAttributes: {
            '*': ['class', 'style', 'id', 'data-*'],
            'a': ['href', 'name', 'target', 'rel'],
            'img': ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading']
        },
        allowedSchemes: ['http', 'https', 'mailto', 'data']
    });
}

export const DOMPurify = {
    sanitize
};

export default DOMPurify;
