import { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { useOpsGuard } from "~/lib/ops-guard";
import { getToken } from "~/lib/api";
import { toast } from "sonner";
import { DashboardLayout } from "~/components/dashboard/layout";
import { ResumeViewer } from "~/components/internship/resume-viewer";
import { ForwardModal } from "~/components/internship/forward-modal";
import { FiDownload, FiEye } from "react-icons/fi";
import type { Route } from "./+types/$id.applications";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Applications – Maverick" },
    {
      name: "description",
      content: "Review internship applications",
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { id } = params;
  const { getUserFromRequest } = await import("~/lib/auth-helper.server");
  const db = (await import("~/lib/db.server")).default;
  const { sql } = await import("drizzle-orm");
  
  // Try to authenticate, but don't fail if it doesn't work
  // The client-side useOpsGuard will handle redirecting unauthenticated users
  const user = await getUserFromRequest(request);
  
  // If user is authenticated, check role
  if (user) {
    const result = await db.execute(
      sql`SELECT role FROM public."user" WHERE id = ${user.id} LIMIT 1`
    );

    if (result.rows.length > 0) {
      const role = result.rows[0].role as string | null;
      if (role !== "ops" && role !== "admin") {
        // User is authenticated but doesn't have the right role
        throw new Response("Forbidden - Ops or Admin access required", { status: 403 });
      }
    }
  }

  // Fetch internship directly from database (even if not authenticated)
  // The component will handle showing/hiding based on auth status
  const internshipResult = await db.execute(
    sql`SELECT * FROM public.internships WHERE id = ${id} LIMIT 1`
  );

  if (internshipResult.rows.length === 0) {
    throw new Response("Internship not found", { status: 404 });
  }

  return { internship: internshipResult.rows[0] };
}

interface Application {
  id: string;
  user_id: string;
  resume_id: string;
  status: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string | null;
  resume_name?: string;
}

export default function ApplicationsList({ data }: Route.ComponentProps) {
  const loaderData = useLoaderData() as { internship: any } | undefined;
  const internship = (loaderData?.internship || data?.internship) as any | undefined;
  const navigate = useNavigate();
  const { isAuthorized, isPending } = useOpsGuard();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [viewingResume, setViewingResume] = useState<{
    applicationId: string;
    resumeName: string;
    userName: string;
  } | null>(null);

  useEffect(() => {
    if (isAuthorized && internship) {
      loadApplications();
    }
  }, [isAuthorized, internship, statusFilter]);

  const loadApplications = async () => {
    if (!internship) return;

    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/internships/${internship.id}/applications?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load applications");
      }

      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error("Error loading applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(`/api/internships/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update application status");
      }

      toast.success("Application status updated");
      loadApplications();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update application status");
    }
  };

  const handleViewResume = (applicationId: string, resumeName: string, userName: string) => {
    setViewingResume({ applicationId, resumeName, userName });
  };

  const handleForward = () => {
    if (selectedApplications.length === 0) {
      toast.error("Please select at least one application to forward");
      return;
    }
    setShowForwardModal(true);
  };

  const handleDownloadResume = async (applicationId: string, resumeName: string, userName: string) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(`/api/internships/applications/${applicationId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download resume");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Determine filename based on content type
      const contentType = response.headers.get("content-type");
      const extension = contentType?.includes("application/pdf") ? "pdf" : "json";
      a.download = `${userName}-${resumeName}-${applicationId}.${extension}`.replace(/[^a-zA-Z0-9.-]/g, "_");
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Resume downloaded");
    } catch (error) {
      console.error("Error downloading resume:", error);
      toast.error("Failed to download resume");
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-['Satoshi'] text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthorized || !internship) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <button
            onClick={() => navigate(`/internships/${internship.id}`)}
            className="mb-4 text-violet-600 hover:underline font-['Satoshi']"
          >
            ← Back to Internship
          </button>
          <h1 className="mb-2 font-['Clash_Display'] text-4xl font-bold text-neutral-900">
            Applications: {internship.title}
          </h1>
          <p className="font-['Satoshi'] text-gray-600">
            {internship.company_name}
          </p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi']"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
            <option value="accepted">Accepted</option>
          </select>
          {selectedApplications.length > 0 && (
            <button
              onClick={handleForward}
              className="rounded-lg border-2 border-neutral-900 bg-violet-600 px-4 py-2 font-['Satoshi'] font-bold text-white transition-colors hover:bg-violet-700"
            >
              Forward Selected ({selectedApplications.length})
            </button>
          )}
        </div>

        {loading ? (
          <p className="font-['Satoshi'] text-gray-600">Loading applications...</p>
        ) : applications.length === 0 ? (
          <p className="font-['Satoshi'] text-gray-600">No applications found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-2 border-neutral-900">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                    <input
                      type="checkbox"
                      checked={selectedApplications.length === applications.length && applications.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedApplications(applications.map((a) => a.id));
                        } else {
                          setSelectedApplications([]);
                        }
                      }}
                      className="rounded border-neutral-900"
                    />
                  </th>
                  <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                    Student
                  </th>
                  <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                    Email
                  </th>
                  <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                    Phone
                  </th>
                  <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                    Resume
                  </th>
                  <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                    Applied
                  </th>
                  <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                    Status
                  </th>
                  <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                      <input
                        type="checkbox"
                        checked={selectedApplications.includes(app.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedApplications([...selectedApplications, app.id]);
                          } else {
                            setSelectedApplications(selectedApplications.filter((id) => id !== app.id));
                          }
                        }}
                        className="rounded border-neutral-900"
                      />
                    </td>
                    <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                      {app.user_name || "N/A"}
                    </td>
                    <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                      {app.user_email || "N/A"}
                    </td>
                    <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                      {app.user_phone || "N/A"}
                    </td>
                    <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                      <div className="flex items-center gap-2">
                        <span>{app.resume_name || "N/A"}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleViewResume(app.id, app.resume_name || "Resume", app.user_name || "Student")}
                            className="rounded border border-neutral-900 bg-white px-2 py-1 text-sm font-['Satoshi'] hover:bg-gray-50 flex items-center gap-1"
                            title="View Resume"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadResume(app.id, app.resume_name || "resume", app.user_name || "student")}
                            className="rounded border border-neutral-900 bg-white px-2 py-1 text-sm font-['Satoshi'] hover:bg-gray-50 flex items-center gap-1"
                            title="Download Resume"
                          >
                            <FiDownload className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          app.status === "accepted"
                            ? "bg-green-100 text-green-700"
                            : app.status === "shortlisted"
                            ? "bg-blue-100 text-blue-700"
                            : app.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                        className="rounded border border-neutral-900 px-2 py-1 text-sm font-['Satoshi']"
                      >
                        <option value="pending">Pending</option>
                        <option value="shortlisted">Shortlist</option>
                        <option value="rejected">Reject</option>
                        <option value="accepted">Accept</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewingResume && (
          <ResumeViewer
            applicationId={viewingResume.applicationId}
            resumeName={viewingResume.resumeName}
            userName={viewingResume.userName}
            onClose={() => setViewingResume(null)}
          />
        )}

        {showForwardModal && (
          <ForwardModal
            internshipId={internship.id}
            applicationIds={selectedApplications}
            onClose={() => {
              setShowForwardModal(false);
              setSelectedApplications([]);
            }}
            onSuccess={() => {
              setShowForwardModal(false);
              setSelectedApplications([]);
              loadApplications();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

