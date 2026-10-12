/**
 * An import's length as it reads on one line with standard spacing, however
 * it is currently written. Measuring the raw text would let a formatter undo
 * a correct order: `{a}` → `{ a }` adds two characters, and wrapping a long
 * import onto several lines adds indentation and newlines. Normalising first
 * makes the order the same before and after oxfmt runs.
 */
export function measure(text: string): number {
    return text
        .replace(/\s+/g, ' ')
        .replace(/\s*([{},])\s*/g, '$1')
        .replace(/,}/g, '}')
        .replace(/;\s*$/, '')
        .replace(/,/g, ', ')
        .replace(/{/g, ' { ')
        .replace(/}/g, ' } ')
        .replace(/\s+/g, ' ')
        .trim().length;
}
