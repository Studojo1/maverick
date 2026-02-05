import { useNavigate } from "react-router";
import { useOpsGuard } from "~/lib/ops-guard";
import { getToken } from "~/lib/api";
import { toast } from "sonner";
import { BlogForm } from "~/components/blog/blog-form";
import { DashboardLayout } from "~/components/dashboard/layout";
import type { Route } from "./+types/new";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New Blog Post – Maverick" },
    {
      name: "description",
      content: "Create a new blog post",
    },
  ];
}

export default function NewBlogPost() {
  const navigate = useNavigate();
  const { isAuthorized, isPending } = useOpsGuard();

  const handleSubmit = async (data: any) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create post";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch {
          // If response is not JSON, try to get text
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch {
            // Fallback to status text
            errorMessage = response.statusText || errorMessage;
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success("Post created successfully");
      navigate(`/blog/${result.post.id}`);
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post");
    }
  };

  if (isPending) {
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

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="font-['Clash_Display'] text-4xl font-bold text-neutral-900">
            New Blog Post
          </h1>
          <p className="mt-2 font-['Satoshi'] text-sm text-gray-600">
            Create a new blog post
          </p>
        </div>

        <div className="rounded-lg border-2 border-neutral-900 bg-white p-8 overflow-hidden">
          <BlogForm onSubmit={handleSubmit} onCancel={() => navigate("/")}           />
        </div>
      </div>
    </DashboardLayout>
  );
}

