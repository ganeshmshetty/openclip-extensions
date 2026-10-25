# Unwrap Paragraphs

Fix text that was copied from a PDF, an email or a terminal with a line break at the end of every line.

**Unwrap Paragraphs** joins the lines of each paragraph into one line, but keeps:

- **Paragraph breaks**: blank lines still separate paragraphs (several blank lines become one).
- **List items**: lines starting with `-`, `*`, `+`, `•`, `1.` or `1)` stay on their own line; wrapped continuation lines are joined onto the item.

Unlike Remove Line Breaks, which flattens everything into a single line, this keeps the document's structure.

## Requirements

- OpenClip 1.1.0 or later.
