import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useOpsGuard } from "~/lib/ops-guard";
import { useModal } from "~/components/common/modal-context";
import { getToken } from "~/lib/api";
import { toast } from "sonner";
import { DashboardLayout } from "~/components/dashboard/layout";
import type { Route } from "./+types/index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Internships – Maverick" },
    {
      name: "description",
      content: "Manage internship listings",
    },
  ];
}

type PipelineStatus =
  | "published"
  | "applications_sent"
  | "interviews"
  | "closed";

// Internal pipeline tracker shown in the table. This is separate from the
// public `status` field and never changes what shows on studojo.com.
const PIPELINE_OPTIONS: {
  value: PipelineStatus;
  label: string;
  rowClass: string;
}[] = [
  { value: "published", label: "Published", rowClass: "bg-sky-100" },
  { value: "applications_sent", label: "Applications sent", rowClass: "bg-green-100" },
  { value: "interviews", label: "Interviews going on", rowClass: "bg-yellow-100" },
  { value: "closed", label: "Closed", rowClass: "bg-red-100" },
];

function pipelineRowClass(status: string | null | undefined): string {
  return (
    PIPELINE_OPTIONS.find((o) => o.value === status)?.rowClass ?? "bg-sky-100"
  );
}

interface Internship {
  id: string;
  title: string;
  company_name: string;
  status: "draft" | "published" | "closed";
  /** Internal pipeline label (separate from public status). */
  pipeline_status?: PipelineStatus | null;
  slug: string;
  view_count: number;
  click_count: number;
  application_count: number;
  created_at: string;
  updated_at: string;
}

export default function InternshipsList() {
  const { isAuthorized, isPending } = useOpsGuard();
  const { showConfirm } = useModal();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isAuthorized) {
      loadInternships();
    }
  }, [isAuthorized, page, statusFilter, search]);

  const loadInternships = async () => {
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

      const response = await fetch(`/api/internships?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load internships");
      }

      const data = await response.json();
      setInternships(data.internships || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error loading internships:", error);
      toast.error("Failed to load internships");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("Are you sure you want to delete this internship?");
    if (!confirmed) {
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(`/api/internships/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete internship");
      }

      toast.success("Internship deleted successfully");
      loadInternships();
    } catch (error) {
      console.error("Error deleting internship:", error);
      toast.error("Failed to delete internship");
    }
  };

  const handlePipelineStatusChange = async (
    id: string,
    next: PipelineStatus
  ) => {
    const previous = internships.find((i) => i.id === id)?.pipeline_status;
    // Optimistic update so the row recolours instantly.
    setInternships((prev) =>
      prev.map((i) => (i.id === id ? { ...i, pipeline_status: next } : i))
    );

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/internships/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pipeline_status: next }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
      // Roll back the optimistic change.
      setInternships((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, pipeline_status: previous } : i
        )
      );
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-['Satoshi'] text-gray-600">Loading...</p>
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
            <h1 className="mb-2 font-['Clash_Display'] text-4xl font-bold text-neutral-900">
              Internships
            </h1>
            <p className="font-['Satoshi'] text-gray-600">
              Manage internship listings
            </p>
          </div>
          <Link
            to="/internships/new"
            className="rounded-lg border-2 border-neutral-900 bg-violet-600 px-6 py-2 font-['Satoshi'] font-medium text-white transition-colors hover:bg-violet-700"
          >
            Create New
          </Link>
        </div>

        <div className="mb-6 flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi']"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search internships..."
            className="flex-1 rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi']"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                loadInternships();
              }
            }}
          />
        </div>

        {loading ? (
          <p className="font-['Satoshi'] text-gray-600">Loading internships...</p>
        ) : internships.length === 0 ? (
          <p className="font-['Satoshi'] text-gray-600">No internships found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-2 border-neutral-900">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                      S.No
                    </th>
                    <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                      Title
                    </th>
                    <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                      Company
                    </th>
                    <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                      Status
                    </th>
                    <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                      Views
                    </th>
                    <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                      Clicks
                    </th>
                    <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                      Applications
                    </th>
                    <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {internships.map((internship, index) => {
                    const serialNumber = (page - 1) * 10 + index + 1;
                    const pipelineStatus =
                      internship.pipeline_status || "published";
                    return (
                      <tr
                        key={internship.id}
                        className={pipelineRowClass(pipelineStatus)}
                      >
                        <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                          {serialNumber}
                        </td>
                        <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                          <Link
                            to={`/internships/${internship.id}`}
                            className="text-violet-600 hover:underline"
                          >
                            {internship.title}
                          </Link>
                        </td>
                        <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                          {internship.company_name}
                        </td>
                        <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                          <select
                            value={pipelineStatus}
                            onChange={(e) =>
                              handlePipelineStatusChange(
                                internship.id,
                                e.target.value as PipelineStatus
                              )
                            }
                            className="w-full rounded-lg border-2 border-neutral-900 bg-white px-2 py-1 font-['Satoshi'] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
                          >
                            {PIPELINE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                          {internship.view_count}
                        </td>
                        <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                          {internship.click_count}
                        </td>
                        <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                          {internship.application_count}
                        </td>
                        <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                          <div className="flex gap-2">
                            <Link
                              to={`/internships/${internship.id}`}
                              className="text-violet-600 hover:underline"
                            >
                              Edit
                            </Link>
                            <Link
                              to={`/internships/${internship.id}/applications`}
                              className="text-violet-600 hover:underline"
                            >
                              View Applications
                            </Link>
                            <button
                              onClick={() => handleDelete(internship.id)}
                              className="text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] font-medium disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="flex items-center px-4 font-['Satoshi']">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] font-medium disabled:opacity-50"
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

