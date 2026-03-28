import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { useState, useEffect } from "react";
import { FiBold, FiItalic, FiUnderline, FiCode, FiLink, FiImage, FiAlignLeft, FiAlignCenter, FiAlignRight, FiList, FiType, FiMinus, FiMessageSquare, FiUpload, FiZap, FiMousePointer } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "~/components/common/modal-context";
import { StudojoCTA } from "./tiptap-cta-extension";
import { ButtonBlock } from "./tiptap-button-extension";

interface TipTapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

export function TipTapEditor({ content = "", onChange, placeholder = "Start writing..." }: TipTapEditorProps) {
  const { showAlert } = useModal();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // Disable link and underline from StarterKit since we're adding them separately
        link: false,
        underline: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-violet-600 underline",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      StudojoCTA,
      ButtonBlock,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor-content",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setShowLinkDialog(false);
    }
  };

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setShowImageDialog(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      await showAlert("Please upload a JPEG, PNG, or WebP image");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      await showAlert("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/blog/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      editor.chain().focus().setImage({ src: data.url }).run();
    } catch (error) {
      console.error("Error uploading image:", error);
      await showAlert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const ToolbarButton = ({ 
    onClick, 
    isActive, 
    title, 
    children, 
    disabled = false 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    title: string; 
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative p-2.5 rounded-md border-2 border-neutral-900 
        transition-all duration-200 ease-out
        flex items-center justify-center
        w-10 h-10
        ${isActive 
          ? "bg-violet-500 text-white shadow-[2px_2px_0px_0px_rgba(25,26,35,1)]" 
          : "bg-white text-neutral-900 hover:bg-violet-50 hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)]"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
      `}
      title={title}
    >
      {children}
    </motion.button>
  );

  return (
    <div className="relative border-2 border-neutral-900 rounded-lg bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(25,26,35,1)]">
      {/* Animated Wave Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
        <div className="wave-bg"></div>
      </div>

      {/* Toolbar */}
      <div className="relative flex flex-wrap items-center gap-2 p-3 border-b-2 border-neutral-900 bg-gradient-to-r from-violet-50 via-purple-50 to-teal-50">
        {/* Text Formatting Group */}
        <div className="flex items-center gap-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold (Ctrl+B)"
          >
            <FiBold className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic (Ctrl+I)"
          >
            <FiItalic className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline (Ctrl+U)"
          >
            <FiUnderline className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <FiMinus className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            title="Inline Code"
          >
            <FiCode className="w-5 h-5" />
          </ToolbarButton>
        </div>

        <div className="w-px h-8 bg-neutral-900" />

        {/* Headings Group */}
        <div className="flex items-center gap-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <span className="font-bold text-xs leading-none">H1</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <span className="font-bold text-xs leading-none">H2</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <span className="font-bold text-xs leading-none">H3</span>
          </ToolbarButton>
        </div>

        <div className="w-px h-8 bg-neutral-900" />

        {/* Lists Group */}
        <div className="flex items-center gap-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <FiList className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <FiType className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Blockquote"
          >
            <FiMessageSquare className="w-5 h-5" />
          </ToolbarButton>
        </div>

        <div className="w-px h-8 bg-neutral-900" />

        {/* Alignment Group */}
        <div className="flex items-center gap-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            title="Align Left"
          >
            <FiAlignLeft className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            <FiAlignCenter className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            <FiAlignRight className="w-5 h-5" />
          </ToolbarButton>
        </div>

        <div className="w-px h-8 bg-neutral-900" />

        {/* CTA & Button Blocks */}
        <div className="flex items-center gap-1.5">
          <ToolbarButton
            onClick={() => (editor as any).chain().focus().insertStudojoCTA().run()}
            isActive={false}
            title="Insert Outreach CTA Block"
          >
            <FiZap className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => (editor as any).chain().focus().insertButtonBlock().run()}
            isActive={false}
            title="Insert Custom Button"
          >
            <FiMousePointer className="w-5 h-5" />
          </ToolbarButton>
        </div>

        <div className="w-px h-8 bg-neutral-900" />

        {/* Insert Group */}
        <div className="flex items-center gap-1.5">
          <ToolbarButton
            onClick={() => setShowLinkDialog(true)}
            isActive={false}
            title="Insert Link"
          >
            <FiLink className="w-5 h-5" />
          </ToolbarButton>
          <div className="relative">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              title="Upload Image"
              disabled={isUploading}
            />
            <ToolbarButton
              onClick={() => {}}
              isActive={false}
              title="Upload Image"
              disabled={isUploading}
            >
              {isUploading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full"
                />
              ) : (
                <FiUpload className="w-5 h-5" />
              )}
            </ToolbarButton>
          </div>
          <ToolbarButton
            onClick={() => setShowImageDialog(true)}
            isActive={false}
            title="Insert Image URL"
          >
            <FiImage className="w-5 h-5" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Link Dialog */}
      <AnimatePresence>
        {showLinkDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowLinkDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white p-6 rounded-lg border-2 border-neutral-900 max-w-md w-full mx-4 shadow-[6px_6px_0px_0px_rgba(25,26,35,1)]"
            >
              <h3 className="font-['Clash_Display'] font-bold text-xl mb-4 text-neutral-900">Insert Link</h3>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full p-3 border-2 border-neutral-900 rounded-lg mb-4 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addLink();
                  } else if (e.key === "Escape") {
                    setShowLinkDialog(false);
                  }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  onClick={addLink}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 p-3 bg-violet-500 text-white rounded-lg border-2 border-neutral-900 font-['Satoshi'] font-medium shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] hover:shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-shadow"
                >
                  Add Link
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowLinkDialog(false);
                    setLinkUrl("");
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 p-3 bg-white rounded-lg border-2 border-neutral-900 font-['Satoshi'] font-medium hover:bg-gray-50"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image URL Dialog */}
      <AnimatePresence>
        {showImageDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowImageDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white p-6 rounded-lg border-2 border-neutral-900 max-w-md w-full mx-4 shadow-[6px_6px_0px_0px_rgba(25,26,35,1)]"
            >
              <h3 className="font-['Clash_Display'] font-bold text-xl mb-4 text-neutral-900">Insert Image URL</h3>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full p-3 border-2 border-neutral-900 rounded-lg mb-4 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addImage();
                  } else if (e.key === "Escape") {
                    setShowImageDialog(false);
                  }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  onClick={addImage}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 p-3 bg-violet-500 text-white rounded-lg border-2 border-neutral-900 font-['Satoshi'] font-medium shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] hover:shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-shadow"
                >
                  Add Image
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowImageDialog(false);
                    setImageUrl("");
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 p-3 bg-white rounded-lg border-2 border-neutral-900 font-['Satoshi'] font-medium hover:bg-gray-50"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
