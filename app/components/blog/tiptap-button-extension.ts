import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React, { useState } from "react";

/**
 * ButtonBlock — custom Tiptap block node.
 *
 * In the editor: renders as an editable button preview (click the pencil to set text + URL).
 * In HTML output: serializes as a styled <a> tag with inline styles.
 * The blog renderer displays it as a clickable button — no extra processing needed.
 */

function ButtonBlockView({ node, updateAttributes }: any) {
  const [editing, setEditing] = useState(!node.attrs.href);
  const [labelVal, setLabelVal] = useState(node.attrs.label || "");
  const [hrefVal, setHrefVal] = useState(node.attrs.href || "");

  const save = () => {
    if (labelVal.trim()) {
      updateAttributes({ label: labelVal.trim(), href: hrefVal.trim() || "#" });
      setEditing(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); save(); }
    if (e.key === "Escape") { setEditing(false); }
  };

  return React.createElement(
    NodeViewWrapper,
    { style: { margin: "1rem 0" } },
    editing
      ? React.createElement(
          "div",
          {
            contentEditable: false,
            style: {
              display: "flex",
              flexWrap: "wrap" as const,
              gap: "0.5rem",
              alignItems: "center",
              padding: "0.75rem 1rem",
              background: "#f5f3ff",
              borderRadius: "0.625rem",
              border: "2px dashed #8b5cf6",
            },
          },
          React.createElement("input", {
            autoFocus: true,
            placeholder: "Button label",
            value: labelVal,
            onChange: (e: any) => setLabelVal(e.target.value),
            onKeyDown,
            style: {
              flex: "1 1 120px",
              minWidth: 0,
              height: "2.25rem",
              padding: "0 0.75rem",
              borderRadius: "0.5rem",
              border: "2px solid #8b5cf6",
              fontFamily: "'Satoshi', sans-serif",
              fontSize: "0.875rem",
              outline: "none",
            },
          }),
          React.createElement("input", {
            placeholder: "https://studojo.com/...",
            value: hrefVal,
            onChange: (e: any) => setHrefVal(e.target.value),
            onKeyDown,
            style: {
              flex: "2 1 200px",
              minWidth: 0,
              height: "2.25rem",
              padding: "0 0.75rem",
              borderRadius: "0.5rem",
              border: "2px solid #8b5cf6",
              fontFamily: "'Satoshi', sans-serif",
              fontSize: "0.875rem",
              outline: "none",
            },
          }),
          React.createElement(
            "button",
            {
              type: "button",
              onClick: save,
              style: {
                height: "2.25rem",
                padding: "0 1rem",
                borderRadius: "0.5rem",
                background: "#8b5cf6",
                color: "#fff",
                border: "2px solid #191a23",
                fontFamily: "'Satoshi', sans-serif",
                fontWeight: 600,
                fontSize: "0.8125rem",
                cursor: "pointer",
                whiteSpace: "nowrap" as const,
              },
            },
            "Save"
          )
        )
      : React.createElement(
          "div",
          {
            contentEditable: false,
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            },
          },
          React.createElement(
            "a",
            {
              href: node.attrs.href,
              target: "_blank",
              rel: "noreferrer",
              style: {
                display: "inline-flex",
                alignItems: "center",
                height: "2.5rem",
                padding: "0 1.25rem",
                borderRadius: "0.625rem",
                background: "#8b5cf6",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.875rem",
                fontFamily: "'Satoshi', sans-serif",
                textDecoration: "none",
                border: "2px solid #191a23",
                boxShadow: "2px 2px 0 #191a23",
                whiteSpace: "nowrap" as const,
              },
            },
            node.attrs.label || "Button"
          ),
          React.createElement(
            "button",
            {
              type: "button",
              title: "Edit button",
              onClick: () => {
                setLabelVal(node.attrs.label || "");
                setHrefVal(node.attrs.href || "");
                setEditing(true);
              },
              style: {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "1.75rem",
                height: "1.75rem",
                borderRadius: "0.375rem",
                border: "1.5px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
                color: "#6b7280",
                fontSize: "0.75rem",
              },
            },
            "✏️"
          )
        )
  );
}

export const ButtonBlock = Node.create({
  name: "buttonBlock",
  group: "block",
  content: "",
  atom: true,

  addAttributes() {
    return {
      label: { default: "Try for free" },
      href: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'a[data-studojo-btn]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const label = HTMLAttributes.label || "Try for free";
    const href = HTMLAttributes.href || "#";
    return [
      "div",
      { style: "margin:1rem 0;" },
      [
        "a",
        mergeAttributes(
          {
            href,
            target: "_blank",
            rel: "noopener noreferrer",
            "data-studojo-btn": "1",
            style: [
              "display:inline-flex",
              "align-items:center",
              "height:2.5rem",
              "padding:0 1.25rem",
              "border-radius:0.625rem",
              "background:#8b5cf6",
              "color:#fff",
              "font-weight:600",
              "font-size:0.875rem",
              "font-family:'Satoshi',sans-serif",
              "text-decoration:none",
              "border:2px solid #191a23",
              "box-shadow:2px 2px 0 #191a23",
              "white-space:nowrap",
            ].join(";"),
          },
          {}
        ),
        label,
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ButtonBlockView);
  },

  addCommands() {
    return {
      insertButtonBlock:
        (attrs?: { label?: string; href?: string }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: { label: attrs?.label || "", href: attrs?.href || "" },
          });
        },
    } as any;
  },
});
