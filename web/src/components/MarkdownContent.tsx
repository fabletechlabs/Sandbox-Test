import { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import mermaid from 'mermaid';

// Render markdown headings one level below their source depth (`#` -> <h2>,
// `##` -> <h3>, ...) so a doc's own top-level heading never collides with
// the page's single <h1> (the doc title, rendered by DocView above this).
// `text` is already the inline-rendered heading content in marked v12.
marked.use({
  renderer: {
    heading(text: string, level: number): string {
      const newLevel = Math.min(level + 1, 6);
      return `<h${newLevel}>${text}</h${newLevel}>\n`;
    },
  },
});

let mermaidInitialized = false;

function ensureMermaidInitialized(): void {
  if (mermaidInitialized) {
    return;
  }
  // securityLevel:'strict' makes mermaid sanitize/escape the diagram source it
  // renders. htmlLabels:false makes node labels native SVG <text> instead of
  // HTML inside <foreignObject>, so they survive our svg-profile sanitize
  // below (foreignObject HTML would be stripped, leaving empty-looking boxes).
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'neutral',
    flowchart: { htmlLabels: false },
  });
  mermaidInitialized = true;
}

/** Builds the "diagram could not be rendered" fallback markup for a mermaid block. */
function buildMermaidErrorBlock(source: string): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'mermaid-error-block';

  const notice = document.createElement('p');
  notice.className = 'mermaid-error-text';
  notice.textContent = 'This diagram could not be rendered. Showing the raw source instead.';

  const pre = document.createElement('pre');
  const code = document.createElement('code');
  code.textContent = source;
  pre.appendChild(code);

  wrapper.appendChild(notice);
  wrapper.appendChild(pre);
  return wrapper;
}

/** Builds the rendered-diagram markup, with the raw source kept nearby as its text alternative. */
function buildMermaidFigure(svg: string, source: string): HTMLElement {
  const figure = document.createElement('figure');
  figure.className = 'mermaid-figure';

  const diagram = document.createElement('div');
  diagram.className = 'mermaid-diagram';
  diagram.setAttribute('role', 'img');
  diagram.setAttribute('aria-label', 'Diagram rendered from mermaid markup. The source is available below.');
  // Node labels are native SVG <text> (htmlLabels:false at init), so the svg
  // profile keeps them; mermaid's strict mode already escaped the source.
  diagram.innerHTML = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });

  const details = document.createElement('details');
  details.className = 'mermaid-source';
  const summary = document.createElement('summary');
  summary.textContent = 'View diagram source';
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  code.textContent = source;
  pre.appendChild(code);
  details.appendChild(summary);
  details.appendChild(pre);

  figure.appendChild(diagram);
  figure.appendChild(details);
  return figure;
}

export interface MarkdownContentProps {
  markdown: string;
}

/**
 * Renders a markdown string as sanitized HTML and turns any fenced
 * ```mermaid code blocks into rendered diagrams.
 *
 * Safety: `marked` only ever produces an HTML *string* — it is never
 * inserted into the DOM directly. `DOMPurify.sanitize()` runs on that
 * string (and again on any mermaid-generated SVG) before either is
 * assigned via `dangerouslySetInnerHTML`, so untrusted markdown/mermaid
 * input cannot inject scripts or event handlers. A mermaid parse/render
 * failure is caught per-block and falls back to the raw source plus an
 * inline notice instead of throwing and breaking the page.
 */
function MarkdownContent({ markdown }: MarkdownContentProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [html, setHtml] = useState('');

  useEffect(() => {
    const rawHtml = marked.parse(markdown || '', { async: false }) as string;
    setHtml(DOMPurify.sanitize(rawHtml));
  }, [markdown]);

  // Runs after `html` has actually been committed to the DOM, so the
  // mermaid code blocks exist to query and replace.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const codeBlocks = Array.from(container.querySelectorAll<HTMLElement>('code.language-mermaid'));

    codeBlocks.forEach((codeEl, index) => {
      const target = codeEl.closest('pre') ?? codeEl;
      const source = codeEl.textContent ?? '';
      if (!source.trim()) {
        return;
      }

      ensureMermaidInitialized();
      const diagramId = `doc-mermaid-${index}-${Math.random().toString(36).slice(2, 8)}`;

      mermaid
        .render(diagramId, source)
        .then(({ svg }) => {
          target.replaceWith(buildMermaidFigure(svg, source));
        })
        .catch(() => {
          target.replaceWith(buildMermaidErrorBlock(source));
        })
        .finally(() => {
          // When a diagram fails to parse, mermaid can leave its own error
          // node attached directly to <body>, outside React's tree; left alone
          // these pile up and can intercept clicks. Remove only such stray
          // top-level nodes for this render — never the SVG we injected into
          // the figure above, which also carries the diagram id but lives
          // inside .mermaid-diagram rather than directly under <body>.
          for (const id of [diagramId, `d${diagramId}`]) {
            const stray = document.getElementById(id);
            if (stray && stray.parentElement === document.body) {
              stray.remove();
            }
          }
        });
    });
  }, [html]);

  if (!markdown.trim()) {
    return <p className="doc-body-empty">This doc has no content yet.</p>;
  }

  // `html` is DOMPurify-sanitized above before it ever reaches dangerouslySetInnerHTML.
  return <article className="doc-body" ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default MarkdownContent;
