/** Empty paragraph node — the Slate/Plate default block */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EMPTY_PARAGRAPH = { type: 'p', children: [{ text: '' }] } as any

/** Create a fresh empty paragraph (use when inserting new nodes to avoid shared references) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const emptyParagraph = (): any => ({ type: 'p', children: [{ text: '' }] })
