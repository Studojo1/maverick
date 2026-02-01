import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useOpsGuard } from "~/lib/ops-guard";
import { getToken } from "~/lib/api";
import { toast } from "sonner";
import { BlogForm } from "~/components/blog/blog-form";
import { DashboardLayout } from "~/components/dashboard/layout";
import type { Route } from "./+types/$id";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Edit Blog Post – Maverick" },
    {
      name: "description",
      content: "Edit blog post",
    },
  ];
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  status: "draft" | "published";
  seo_meta_title?: string;
  seo_meta_description?: string;
  seo_keywords?: string[];
  seo_og_image?: string;
  categories?: string[];
  tags?: string[];
  reading_time: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export default function EditBlogPost() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthorized, isPending } = useOpsGuard();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthorized && id) {
      loadPost();
    }
  }, [isAuthorized, id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(`/api/blog/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load post");
      }

      const data = await response.json();
      setPost(data.post);
    } catch (error) {
      console.error("Error loading post:", error);
      toast.error("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(`/api/blog/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update post");
      }

      toast.success("Post updated successfully");
      navigate("/");
    } catch (error: any) {
      console.error("Error updating post:", error);
      toast.error(error.message || "Failed to update post");
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-500 border-r-transparent"></div>
          <p className="font-['Satoshi'] text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (!post) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl">
          <p className="font-['Satoshi'] text-gray-600">Post not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="font-['Clash_Display'] text-4xl font-bold text-neutral-900">
            Edit Blog Post
          </h1>
          <p className="mt-2 font-['Satoshi'] text-sm text-gray-600">
            {post.title}
          </p>
        </div>

        <div className="mb-4 rounded-lg border-2 border-neutral-900 bg-white p-4 overflow-hidden">
          <div className="grid grid-cols-2 gap-4 font-['Satoshi'] text-sm">
            <div>
              <span className="text-gray-600">Reading Time:</span>{" "}
              <span className="font-medium">{post.reading_time} min</span>
            </div>
            <div>
              <span className="text-gray-600">Views:</span>{" "}
              <span className="font-medium">{post.view_count}</span>
            </div>
            <div>
              <span className="text-gray-600">Created:</span>{" "}
              <span className="font-medium">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Updated:</span>{" "}
              <span className="font-medium">
                {new Date(post.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border-2 border-neutral-900 bg-white p-8 overflow-hidden">
          <BlogForm
            initialData={{
              id: post.id,
              title: post.title,
              content: post.content,
              excerpt: post.excerpt,
              featuredImage: post.featured_image,
              status: post.status,
              seo: {
                metaTitle: post.seo_meta_title,
                metaDescription: post.seo_meta_description,
                keywords: post.seo_keywords,
                ogImage: post.seo_og_image,
              },
              categories: post.categories,
              tags: post.tags,
            }}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/")}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

