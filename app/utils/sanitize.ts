import xss, { FilterXSS, whiteList, escapeAttrValue } from 'xss';

// Gabungan tag whitelist default dari xss plus penambahan tag formatting & custom
const customWhiteList: Record<string, string[]> = {
    ...whiteList,
    span: ['class', 'style', 'id', 'data-id', 'data-label'],
    img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'class', 'style'],
    a: ['href', 'name', 'target', 'rel', 'class', 'style', 'id'],
    p: ['class', 'style', 'id'],
    div: ['class', 'style', 'id'],
    h1: ['class', 'style', 'id'],
    h2: ['class', 'style', 'id'],
    u: ['class', 'style', 'id'],
    s: ['class', 'style', 'id'],
    del: ['class', 'style', 'id'],
    br: ['class', 'style', 'id'],
    hr: ['class', 'style', 'id'],
    code: ['class', 'style', 'id'],
    pre: ['class', 'style', 'id'],
    strong: ['class', 'style', 'id'],
    em: ['class', 'style', 'id'],
    b: ['class', 'style', 'id'],
    i: ['class', 'style', 'id'],
    ul: ['class', 'style', 'id'],
    ol: ['class', 'style', 'id'],
    li: ['class', 'style', 'id'],
    blockquote: ['class', 'style', 'id']
};

const xssFilter = new FilterXSS({
    whiteList: customWhiteList,
    onTagAttr: (tag, name, value) => {
        // Izinkan semua atribut data-*, class, style, id, target, rel agar format Tiptap & Mention bekerja dengan aman
        if (name.startsWith('data-') || name === 'class' || name === 'id' || name === 'style' || name === 'target' || name === 'rel') {
            return `${name}="${escapeAttrValue(value)}"`;
        }
    }
});

export function sanitize(html?: string | null): string {
    if (!html) return '';
    return xssFilter.process(html);
}

export const DOMPurify = {
    sanitize
};

export default DOMPurify;
