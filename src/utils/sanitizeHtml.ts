import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 
  'strong', 'b', // Allow both strong and b for bold
  'em', 'i',   // Allow both em and i for italic
  'br', 
  'img', 
  'a',
  'span', // For potential Tiptap marks or simple inline styling
  'ul', 'ol', 'li', // If you enable lists in Tiptap later
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', // If you enable headings
  'blockquote', // If you enable blockquotes
  'pre', 'code' // If you enable code blocks/inline code
];

const ALLOWED_ATTR = [
  'href', // for <a>
  'src',  // for <img>
  'alt',  // for <img>
  'title',// for <img> and <a> (tooltips)
  'target',// for <a> (e.g., _blank)
  'rel',   // for <a> (e.g., noopener noreferrer)
  'class', // Be cautious with this. Only allow if you control CSS and know what classes to expect.
         // For now, let's include it for Tiptap mention/tag styling which often uses spans with classes.
];

/**
 * Sanitizes an HTML string to prevent XSS attacks, allowing a specific set of tags and attributes.
 * @param dirtyHtml The potentially unsafe HTML string.
 * @returns A sanitized HTML string.
 */
export const sanitizeHtml = (dirtyHtml: string | undefined | null): string => {
  if (!dirtyHtml) {
    return '';
  }
  return DOMPurify.sanitize(dirtyHtml, {
    USE_PROFILES: { html: true }, // Ensures it's treated as an HTML snippet
    ALLOWED_TAGS: ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTR,
    // FORBID_TAGS: [], // You can explicitly forbid certain tags if needed
    // FORBID_ATTR: [], // You can explicitly forbid certain attributes if needed
  });
}; 