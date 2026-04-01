import DOMPurify from 'dompurify';

/**
 * Sanitize HTML to prevent XSS attacks.
 * Allows safe subset of HTML for document rendering.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr', 'span', 'div',
      'strong', 'em', 'b', 'i', 'u',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'small', 'sub', 'sup',
    ],
    ALLOWED_ATTR: [
      'class', 'style', 'href', 'src', 'alt', 'title',
      'colspan', 'rowspan', 'width', 'height',
    ],
    ALLOW_DATA_ATTR: false,
  });
}
