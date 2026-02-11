import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useOpsGuard } from "~/lib/ops-guard";
import { getToken } from "~/lib/api";
import { DashboardLayout } from "~/components/dashboard/layout";
import { toast } from "sonner";
import type { Route } from "./+types/index";

interface BlogPostSummary {
  id: string;
  title: string;
  status: "draft" | "published";
  created_at: string;
  view_count: number;
}

interface BlogListResponse {
  posts: BlogPostSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Blog Posts – Maverick" },
    {
      name: "description",
      content: "Manage blog posts in the Maverick Ops dashboard.",
    },
  ];
}

export default function BlogList() {
  const { isAuthorized, isPending } = useOpsGuard();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BlogListResponse | null>(null);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";

  useEffect(() => {
    if (isAuthorized) {
      void loadPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, page, limit, status, search]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (status) params.set("status", status);
      if (search) params.set("search", search);

      const response = await fetch(`/api/blog?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load blog posts");
      }

      const json = (await response.json()) as BlogListResponse;
      setData(json);
    } catch (error) {
      console.error("Error loading blog posts:", error);
      toast.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  };

  const updateSearchParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    // Reset to first page when filters change
    if (key === "search" || key === "status" || key === "limit") {
      next.set("page", "1");
    }
    setSearchParams(next);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1) return;
    if (data && nextPage > data.totalPages) return;
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
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
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-['Clash_Display'] text-4xl font-bold text-neutral-900">
              Blog Posts
            </h1>
            <p className="mt-2 font-['Satoshi'] text-sm text-gray-600">
              Manage all blog content, drafts, and published posts.
            </p>
          </div>
          <Link
            to="/blog/new"
            className="inline-flex items-center justify-center rounded-lg border-2 border-neutral-900 bg-violet-600 px-4 py-2 font-['Satoshi'] text-sm font-medium text-white shadow-sm transition hover:bg-violet-700"
          >
            New post
          </Link>
        </div>

        <div className="mb-6 rounded-lg border-2 border-neutral-900 bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-3">
              <input
                type="text"
                placeholder="Search by title or excerpt..."
                value={search}
                onChange={(e) => updateSearchParam("search", e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 font-['Satoshi'] text-sm text-neutral-900 placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <select
                value={status}
                onChange={(e) => updateSearchParam("status", e.target.value)}
                className="w-36 rounded-md border border-neutral-300 bg-white px-3 py-2 font-['Satoshi'] text-sm text-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-['Satoshi'] text-xs text-gray-500">
                Per page
              </span>
              <select
                value={String(limit)}
                onChange={(e) => updateSearchParam("limit", e.target.value)}
                className="w-20 rounded-md border border-neutral-300 bg-white px-2 py-1 font-['Satoshi'] text-xs text-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border-2 border-neutral-900 bg-white">
          {loading ? (
            <div className="p-6">
              <p className="font-['Satoshi'] text-sm text-gray-600">
                Loading posts...
              </p>
            </div>
          ) : !data || data.posts.length === 0 ? (
            <div className="p-6">
              <p className="font-['Satoshi'] text-sm text-gray-600">
                No posts found. Try adjusting your filters or create a new post.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y-2 divide-neutral-900">
                  <thead className="bg-neutral-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-['Satoshi'] font-semibold uppercase tracking-wide text-gray-600">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-['Satoshi'] font-semibold uppercase tracking-wide text-gray-600">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-['Satoshi'] font-semibold uppercase tracking-wide text-gray-600">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-['Satoshi'] font-semibold uppercase tracking-wide text-gray-600">
                        Views
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-['Satoshi'] font-semibold uppercase tracking-wide text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-neutral-900">
                    {data.posts.map((post) => (
                      <tr key={post.id} className="hover:bg-neutral-50">
                        <td className="max-w-md px-4 py-3 align-top">
                          <div className="flex flex-col">
                            <Link
                              to={`/blog/${post.id}`}
                              className="font-['Satoshi'] text-sm font-medium text-neutral-900 hover:text-violet-600"
                            >
                              {post.title}
                            </Link>
                            <span className="mt-1 font-['Satoshi'] text-xs text-gray-500">
                              ID: {post.id}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
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
                        <td className="px-4 py-3 align-top">
                          <span className="font-['Satoshi'] text-xs text-gray-700">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="font-['Satoshi'] text-xs text-gray-700">
                            {post.view_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/blog/${post.id}`}
                              className="inline-flex items-center rounded-md border border-neutral-300 px-3 py-1 text-xs font-['Satoshi'] text-neutral-900 hover:border-neutral-900"
                            >
                              Edit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t-2 border-neutral-900 px-4 py-3">
                <div className="font-['Satoshi'] text-xs text-gray-600">
                  Showing{" "}
                  <span className="font-medium">
                    {(page - 1) * limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(page * limit, data.total)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{data.total}</span> posts
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="inline-flex items-center rounded-md border border-neutral-300 px-3 py-1 text-xs font-['Satoshi'] text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 hover:border-neutral-900"
                  >
                    Previous
                  </button>
                  <span className="font-['Satoshi'] text-xs text-gray-600">
                    Page{" "}
                    <span className="font-medium">
                      {page}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {data.totalPages || 1}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={data.totalPages !== 0 && page >= data.totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="inline-flex items-center rounded-md border border-neutral-300 px-3 py-1 text-xs font-['Satoshi'] text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 hover:border-neutral-900"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

