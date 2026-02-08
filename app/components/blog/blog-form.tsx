import { useState, useEffect } from "react";
import { useModal } from "~/components/common/modal-context";
import { TipTapEditor } from "./tiptap-editor";
import { BlogImageUpload } from "./blog-image-upload";

interface BlogFormProps {
  initialData?: {
    id?: string;
    title?: string;
    content?: string;
    excerpt?: string;
    featuredImage?: string;
    status?: "draft" | "published";
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
      keywords?: string[];
      ogImage?: string;
    };
    categories?: string[];
    tags?: string[];
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}

export function BlogForm({ initialData, onSubmit, onCancel }: BlogFormProps) {
  const { showAlert } = useModal();
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || "");
  const [status, setStatus] = useState<"draft" | "published">(initialData?.status || "draft");
  const [seoMetaTitle, setSeoMetaTitle] = useState(initialData?.seo?.metaTitle || "");
  const [seoMetaDescription, setSeoMetaDescription] = useState(initialData?.seo?.metaDescription || "");
  const [seoKeywords, setSeoKeywords] = useState(initialData?.seo?.keywords?.join(", ") || "");
  const [seoOgImage, setSeoOgImage] = useState(initialData?.seo?.ogImage || "");
  const [categories, setCategories] = useState<string[]>(initialData?.categories || []);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !excerpt.trim()) {
      await showAlert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        content,
        excerpt: excerpt.trim(),
        featuredImage: featuredImage || undefined,
        status,
        seo: {
          metaTitle: seoMetaTitle.trim() || undefined,
          metaDescription: seoMetaDescription.trim() || undefined,
          keywords: seoKeywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          ogImage: seoOgImage.trim() || undefined,
        },
        categories,
        tags,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
    }
  };

  const removeCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block font-['Satoshi'] font-medium text-neutral-900 mb-2">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
          required
        />
      </div>

      <div>
        <label className="block font-['Satoshi'] font-medium text-neutral-900 mb-2">
          Excerpt *
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          className="w-full rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
          required
        />
      </div>

      <div>
        <label className="block font-['Satoshi'] font-medium text-neutral-900 mb-2">
          Content *
        </label>
        <TipTapEditor content={content} onChange={setContent} />
      </div>

      <div>
        <label className="block font-['Satoshi'] font-medium text-neutral-900 mb-2">
          Featured Image
        </label>
        <BlogImageUpload value={featuredImage} onChange={setFeaturedImage} />
      </div>

      <div>
        <label className="block font-['Satoshi'] font-medium text-neutral-900 mb-2">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "published")}
          className="w-full rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div>
        <label className="block font-['Satoshi'] font-medium text-neutral-900 mb-2">
          Categories
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCategory();
              }
            }}
            placeholder="Add category"
            className="flex-1 rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
          />
          <button
            type="button"
            onClick={addCategory}
            className="rounded-lg border-2 border-neutral-900 bg-violet-500 px-4 py-2 font-['Satoshi'] font-medium text-white"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-sm font-['Satoshi']"
            >
              {cat}
              <button
                type="button"
                onClick={() => removeCategory(cat)}
                className="text-violet-600 hover:text-violet-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-['Satoshi'] font-medium text-neutral-900 mb-2">
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add tag"
            className="flex-1 rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
          />
          <button
            type="button"
            onClick={addTag}
            className="rounded-lg border-2 border-neutral-900 bg-violet-500 px-4 py-2 font-['Satoshi'] font-medium text-white"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-['Satoshi']"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-emerald-600 hover:text-emerald-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="font-['Satoshi'] font-medium text-violet-600 hover:text-violet-800"
        >
          {showAdvanced ? "Hide" : "Show"} Advanced SEO Settings
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 rounded-lg border-2 border-neutral-900 bg-white p-4 overflow-hidden">
            <div>
              <label className="block font-['Satoshi'] font-medium text-neutral-900 mb-2">
                SEO Meta Title
              </label>
              <input
                type="text"
                value={seoMetaTitle}
                onChange={(e) => setSeoMetaTitle(e.target.value)}
                maxLength={60}
                className="w-full rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
              />
              <p className="mt-1 text-xs font-['Satoshi'] text-gray-500">
                {seoMetaTitle.length}/60 characters
              </p>
            </div>

            <div>
              <label className="block font-['Satoshi'] font-medium text-neutral-900 mb-2">
                SEO Meta Description
              </label>
              <textarea
                value={seoMetaDescription}
                onChange={(e) => setSeoMetaDescription(e.target.value)}
                maxLength={160}
                rows={3}
                className="w-full rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
              />
              <p className="mt-1 text-xs font-['Satoshi'] text-gray-500">
                {seoMetaDescription.length}/160 characters
              </p>
            </div>

            <div>
              <label className="block font-['Satoshi'] font-medium text-neutral-900 mb-2">
                SEO Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="keyword1, keyword2, keyword3"
                className="w-full rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
              />
            </div>

            <div>
              <label className="block font-['Satoshi'] font-medium text-neutral-900 mb-2">
                Open Graph Image URL
              </label>
              <input
                type="url"
                value={seoOgImage}
                onChange={(e) => setSeoOgImage(e.target.value)}
                className="w-full rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg border-2 border-neutral-900 bg-violet-500 px-6 py-3 font-['Satoshi'] font-medium text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
        >
          {loading ? "Saving..." : initialData?.id ? "Update Post" : "Create Post"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border-2 border-neutral-900 bg-white px-6 py-3 font-['Satoshi'] font-medium text-neutral-900"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

