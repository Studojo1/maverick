import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import React from "react";

/**
 * StudojoCTA — custom Tiptap block node.
 *
 * In the editor: renders as a branded purple CTA preview block (non-editable).
 * In HTML output: serializes as <div data-studojo-cta="outreach"></div>
 * The frontend blog renderer detects this marker and replaces it with the
 * fully-styled CTA component.
 */

// ── React node view (editor preview) ──────────────────────────────────────

function CTABlockView() {
  return React.createElement(
    NodeViewWrapper,
    null,
    React.createElement(
      "div",
      {
        contentEditable: false,
        "data-studojo-cta": "outreach",
        style: {
          margin: "1.5rem 0",
          padding: "1.25rem 1.5rem",
          background: "rgba(139,92,246,0.07)",
          borderRadius: "0.75rem",
          border: "2px solid #191a23",
          display: "flex",
          flexWrap: "wrap" as const,
          alignItems: "center",
          gap: "1rem",
          userSelect: "none" as const,
          cursor: "default",
          fontFamily: "'Satoshi', sans-serif",
        },
      },
      React.createElement(
        "div",
        { style: { flex: 1, minWidth: 0 } },
        React.createElement(
          "p",
          {
            style: {
              fontFamily: "'Clash Display', sans-serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#191a23",
              margin: "0 0 0.25rem 0",
            },
          },
          "Land your next role, faster."
        ),
        React.createElement(
          "p",
          {
            style: {
              fontSize: "0.875rem",
              color: "#64748b",
              margin: 0,
            },
          },
          "Find and contact the right hiring managers — without the cold email guesswork."
        )
      ),
      React.createElement(
        "div",
        {
          style: {
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            height: "2.5rem",
            padding: "0 1.25rem",
            borderRadius: "0.625rem",
            background: "#8b5cf6",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.875rem",
            border: "2px solid #191a23",
            boxShadow: "2px 2px 0 #191a23",
            whiteSpace: "nowrap" as const,
          },
        },
        "Try for free →"
      ),
      React.createElement(
        "div",
        {
          style: {
            width: "100%",
            marginTop: "0.5rem",
            fontSize: "0.7rem",
            color: "#94a3b8",
            textAlign: "center" as const,
          },
        },
        "🔗 Studojo Outreach CTA — will render as an interactive button block"
      )
    )
  );
}

// ── Tiptap Node definition ─────────────────────────────────────────────────

export const StudojoCTA = Node.create({
  name: "studojoCta",
  group: "block",
  content: "",
  atom: true, // non-editable, treated as a single unit

  addAttributes() {
    return {
      variant: { default: "outreach" },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-studojo-cta="outreach"]' },
      { tag: "div[data-studojo-cta]" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-studojo-cta": "outreach" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CTABlockView);
  },

  addCommands() {
    return {
      insertStudojoCTA:
        () =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name });
        },
    } as any;
  },
});
