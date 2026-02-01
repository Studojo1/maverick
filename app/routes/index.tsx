import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useOpsGuard } from "~/lib/ops-guard";
import { getToken } from "~/lib/api";
import { toast } from "sonner";
import { DashboardLayout } from "~/components/dashboard/layout";
import type { Route } from "./+types/index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Maverick – Blog Editor" },
    {
      name: "description",
      content: "Blog editor dashboard",
    },
  ];
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  view_count: number;
}

export default function BlogList() {
  const { isAuthorized, isPending } = useOpsGuard();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isAuthorized) {
      loadPosts();
    }
  }, [isAuthorized, page, statusFilter, search]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`/api/blog?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load posts");
      }

      const data = await response.json();
      setPosts(data.posts || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(`/api/blog/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      toast.success("Post deleted successfully");
      loadPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
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
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-['Clash_Display'] text-4xl font-bold text-neutral-900">
              Blog Posts
            </h1>
            <p className="mt-2 font-['Satoshi'] text-sm text-gray-600">
              Manage your blog posts
            </p>
          </div>
          <Link
            to="/blog/new"
            className="rounded-lg border-2 border-neutral-900 bg-violet-500 px-6 py-3 font-['Satoshi'] font-medium text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            New Post
          </Link>
        </div>

        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-500 border-r-transparent"></div>
            <p className="font-['Satoshi'] text-sm text-gray-600">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-lg border-2 border-neutral-900 bg-white p-12 text-center overflow-hidden">
            <p className="font-['Satoshi'] text-gray-600">No posts found</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border-2 border-neutral-900 bg-white overflow-hidden">
              <table className="w-full">
                <thead className="bg-studojo-surface-muted">
                  <tr>
                    <th className="px-6 py-3 text-left font-['Satoshi'] font-bold text-sm text-neutral-900">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left font-['Satoshi'] font-bold text-sm text-neutral-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-['Satoshi'] font-bold text-sm text-neutral-900">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left font-['Satoshi'] font-bold text-sm text-neutral-900">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right font-['Satoshi'] font-bold text-sm text-neutral-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-neutral-900">
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td className="px-6 py-4">
                        <Link
                          to={`/blog/${post.id}`}
                          className="font-['Satoshi'] font-medium text-neutral-900 hover:text-violet-600"
                        >
                          {post.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-['Satoshi'] font-medium ${
                            post.status === "published"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-['Satoshi'] text-sm text-gray-600">
                        {post.view_count}
                      </td>
                      <td className="px-6 py-4 font-['Satoshi'] text-sm text-gray-600">
                        {new Date(post.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/blog/${post.id}`}
                            className="rounded border-2 border-neutral-900 bg-white px-3 py-1 font-['Satoshi'] text-sm font-medium hover:bg-gray-50"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="rounded border-2 border-red-500 bg-white px-3 py-1 font-['Satoshi'] text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi'] text-sm font-medium disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="flex items-center px-4 font-['Satoshi'] text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi'] text-sm font-medium disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

