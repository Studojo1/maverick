import React, { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { useOpsGuard } from "~/lib/ops-guard";
import { getToken } from "~/lib/api";
import { toast } from "sonner";
import { DashboardLayout } from "~/components/dashboard/layout";
import { ResumeViewer } from "~/components/internship/resume-viewer";
import { ForwardModal } from "~/components/internship/forward-modal";
import { FiDownload, FiEye, FiChevronDown, FiChevronUp } from "react-icons/fi";
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

interface QuestionResponse {
  question_id: string;
  question_text: string;
  question_type: string;
  order: number;
  response: any;
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
  resume_downloaded_at?: string | null;
  question_responses?: QuestionResponse[];
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
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());
  const [downloadingZip, setDownloadingZip] = useState<"new" | "all" | null>(null);

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

  const formatResponse = (response: any, questionType: string): string => {
    if (response === null || response === undefined) {
      return "No response";
    }

    switch (questionType) {
      case "multiple_choice":
      case "yes_no":
        return String(response);
      
      case "checkbox":
        if (Array.isArray(response)) {
          return response.join(", ");
        }
        return String(response);
      
      case "rating":
      case "number":
        return String(response);
      
      case "date":
        if (response) {
          try {
            return new Date(response).toLocaleDateString();
          } catch {
            return String(response);
          }
        }
        return String(response);
      
      case "file_upload":
        return response ? `File: ${response}` : "No file uploaded";
      
      case "textarea":
      case "text":
      default:
        return String(response);
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

  const handleDownloadZip = async (scope: "new" | "all") => {
    if (!internship) return;
    setDownloadingZip(scope);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        `/api/internships/${internship.id}/applications/download-zip?scope=${scope}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const err = await response.json();
          if (err?.error) detail = err.error;
        } catch {
          // Non-JSON error body; keep the status code.
        }
        throw new Error(`Failed to download resumes (${detail})`);
      }

      // When there is nothing to bundle the API returns JSON, not a zip.
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const info = await response.json();
        toast.info(info.message || "No resumes to download.");
        return;
      }

      const count = response.headers.get("X-Resume-Count");
      const blob = await response.blob();

      // Pull the "company - role.zip" name straight from the response header.
      let filename = "resumes.zip";
      const disposition = response.headers.get("content-disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      if (match) filename = match[1];

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Downloaded ${count || ""} resume${count === "1" ? "" : "s"}`.trim()
      );
      // Refresh so the freshly downloaded rows show as downloaded.
      loadApplications();
    } catch (error: any) {
      console.error("Error downloading resumes:", error);
      toast.error(error?.message || "Failed to download resumes");
    } finally {
      setDownloadingZip(null);
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
            onClick={() => navigate("/internships")}
            className="mb-4 text-violet-600 hover:underline font-['Satoshi']"
          >
            ← Back to Internships
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="mb-2 font-['Clash_Display'] text-4xl font-bold text-neutral-900">
                Applications: {internship.title}
              </h1>
              <p className="font-['Satoshi'] text-gray-600">
                {internship.company_name}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleDownloadZip("new")}
                disabled={downloadingZip !== null}
                className="flex items-center gap-2 rounded-lg border-2 border-neutral-900 bg-violet-600 px-4 py-2 font-['Satoshi'] font-bold text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiDownload className="h-4 w-4" />
                {downloadingZip === "new" ? "Preparing..." : "Download new resumes"}
              </button>
              <button
                onClick={() => handleDownloadZip("all")}
                disabled={downloadingZip !== null}
                className="flex items-center gap-2 rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi'] font-medium text-neutral-900 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiDownload className="h-4 w-4" />
                {downloadingZip === "all" ? "Preparing..." : "Download all resumes"}
              </button>
            </div>
          </div>
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
                  <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                    Questions
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const isExpanded = expandedApplications.has(app.id);
                  const hasResponses = app.question_responses && app.question_responses.length > 0;
                  
                  const isDownloaded = Boolean(app.resume_downloaded_at);

                  return (
                    <React.Fragment key={app.id}>
                      <tr className={isDownloaded ? "bg-sky-100" : undefined}>
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
                        {isDownloaded && (
                          <span className="rounded-full bg-sky-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-800">
                            Downloaded
                          </span>
                        )}
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
                    <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                      {hasResponses ? (
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedApplications);
                            if (isExpanded) {
                              newExpanded.delete(app.id);
                            } else {
                              newExpanded.add(app.id);
                            }
                            setExpandedApplications(newExpanded);
                          }}
                          className="flex items-center gap-2 rounded border border-neutral-900 bg-white px-3 py-1 text-sm font-['Satoshi'] hover:bg-gray-50"
                        >
                          {isExpanded ? (
                            <>
                              <FiChevronUp className="w-4 h-4" />
                              Hide ({app.question_responses?.length || 0})
                            </>
                          ) : (
                            <>
                              <FiChevronDown className="w-4 h-4" />
                              View ({app.question_responses?.length || 0})
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-gray-400">No responses</span>
                      )}
                    </td>
                  </tr>
                  {isExpanded && hasResponses && (
                    <tr>
                      <td colSpan={9} className="border-2 border-neutral-900 bg-gray-50 px-4 py-4">
                        <div className="space-y-4">
                          <h4 className="font-['Clash_Display'] text-lg font-bold text-neutral-900">
                            Question Responses
                          </h4>
                          <div className="space-y-3">
                            {app.question_responses?.map((qr, idx) => (
                              <div key={qr.question_id || idx} className="rounded-lg border-2 border-neutral-900 bg-white p-4">
                                <div className="mb-2 font-['Satoshi'] font-medium text-neutral-900">
                                  {qr.question_text || `Question ${idx + 1}`}
                                </div>
                                <div className="font-['Satoshi'] text-gray-700">
                                  {formatResponse(qr.response, qr.question_type)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                    </React.Fragment>
                  );
                })}
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

