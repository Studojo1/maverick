import { useState, useEffect } from "react";
import { FiX, FiDownload } from "react-icons/fi";
import { toast } from "sonner";

interface ResumeViewerProps {
  applicationId: string;
  resumeName: string;
  userName: string;
  onClose: () => void;
}

interface ResumeData {
  title?: string;
  summary?: string;
  contact_info?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
  };
  work_experiences?: Array<{
    company?: string;
    role?: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
    description?: string;
  }>;
  educations?: Array<{
    institution?: string;
    degree?: string;
    field_of_study?: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
    description?: string;
  }>;
  skills?: Array<{
    category?: string;
    name?: string;
    proficiency?: string;
  }>;
  projects?: Array<{
    title?: string;
    url?: string;
    start_date?: string;
    end_date?: string;
    description?: string;
  }>;
  certifications?: Array<{
    name?: string;
    issuer?: string;
    issue_date?: string;
    expiry_date?: string;
    url?: string;
  }>;
}

export function ResumeViewer({
  applicationId,
  resumeName,
  userName,
  onClose,
}: ResumeViewerProps) {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    loadResume();
    
    // Cleanup PDF URL on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [applicationId]);

  const loadResume = async () => {
    try {
      setLoading(true);
      const token = await import("~/lib/api").then((m) => m.getToken());
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      // Fetch resume data for viewing
      const response = await fetch(`/api/internships/applications/${applicationId}/view`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load resume");
      }

      const data = await response.json();
      setResumeData(data.resume);

      // Also try to generate PDF for viewing
      try {
        const pdfResponse = await fetch(`/api/internships/applications/${applicationId}/download`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (pdfResponse.ok && pdfResponse.headers.get("content-type")?.includes("application/pdf")) {
          const pdfBlob = await pdfResponse.blob();
          const url = URL.createObjectURL(pdfBlob);
          setPdfUrl(url);
        }
      } catch (error) {
        console.error("Failed to load PDF:", error);
      }
    } catch (error) {
      console.error("Error loading resume:", error);
      toast.error("Failed to load resume");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const token = await import("~/lib/api").then((m) => m.getToken());
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="rounded-lg bg-white p-8">
          <p className="font-['Satoshi'] text-gray-600">Loading resume...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative h-full w-full max-w-5xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-neutral-900 bg-white px-6 py-4">
          <div>
            <h2 className="font-['Clash_Display'] text-2xl font-bold text-neutral-900">
              {resumeName || "Resume"}
            </h2>
            <p className="font-['Satoshi'] text-sm text-gray-600">{userName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi'] text-sm font-medium text-neutral-900 transition-colors hover:bg-gray-50"
            >
              <FiDownload className="h-4 w-4" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-lg border-2 border-neutral-900 bg-white p-2 font-['Satoshi'] text-neutral-900 transition-colors hover:bg-gray-50"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-80px)] overflow-y-auto px-6 py-8">
          {pdfUrl ? (
            <div className="h-full">
              <iframe
                src={pdfUrl}
                className="h-full w-full rounded-lg border-2 border-neutral-900"
                title="Resume PDF"
              />
            </div>
          ) : resumeData ? (
            <div className="mx-auto max-w-3xl space-y-8 font-['Satoshi']">
              {/* Header Section */}
              <div className="text-center">
                <h1 className="mb-2 font-['Clash_Display'] text-4xl font-bold text-neutral-900">
                  {resumeData.contact_info?.name || resumeData.title || "Resume"}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
                  {resumeData.contact_info?.email && (
                    <span>{resumeData.contact_info.email}</span>
                  )}
                  {resumeData.contact_info?.phone && (
                    <span>{resumeData.contact_info.phone}</span>
                  )}
                  {resumeData.contact_info?.location && (
                    <span>{resumeData.contact_info.location}</span>
                  )}
                  {resumeData.contact_info?.linkedin && (
                    <a
                      href={resumeData.contact_info.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 hover:underline"
                    >
                      LinkedIn
                    </a>
                  )}
                  {resumeData.contact_info?.website && (
                    <a
                      href={resumeData.contact_info.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 hover:underline"
                    >
                      Website
                    </a>
                  )}
                </div>
              </div>

              {/* Summary */}
              {resumeData.summary && (
                <div>
                  <h2 className="mb-2 border-b-2 border-neutral-900 font-['Clash_Display'] text-xl font-bold text-neutral-900">
                    Summary
                  </h2>
                  <p className="font-['Satoshi'] text-gray-700">{resumeData.summary}</p>
                </div>
              )}

              {/* Work Experience */}
              {resumeData.work_experiences && resumeData.work_experiences.length > 0 && (
                <div>
                  <h2 className="mb-4 border-b-2 border-neutral-900 font-['Clash_Display'] text-xl font-bold text-neutral-900">
                    Work Experience
                  </h2>
                  <div className="space-y-4">
                    {resumeData.work_experiences.map((exp, idx) => (
                      <div key={idx} className="border-l-2 border-violet-600 pl-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-['Clash_Display'] text-lg font-bold text-neutral-900">
                              {exp.role || "Role"}
                            </h3>
                            <p className="font-['Satoshi'] text-gray-600">{exp.company || "Company"}</p>
                          </div>
                          <div className="text-right font-['Satoshi'] text-sm text-gray-600">
                            {exp.start_date && formatDate(exp.start_date)}
                            {exp.start_date && (exp.end_date || exp.is_current) && " - "}
                            {exp.is_current ? "Present" : exp.end_date ? formatDate(exp.end_date) : ""}
                          </div>
                        </div>
                        {exp.description && (
                          <p className="mt-2 font-['Satoshi'] text-gray-700">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {resumeData.educations && resumeData.educations.length > 0 && (
                <div>
                  <h2 className="mb-4 border-b-2 border-neutral-900 font-['Clash_Display'] text-xl font-bold text-neutral-900">
                    Education
                  </h2>
                  <div className="space-y-4">
                    {resumeData.educations.map((edu, idx) => (
                      <div key={idx} className="border-l-2 border-violet-600 pl-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-['Clash_Display'] text-lg font-bold text-neutral-900">
                              {edu.degree || "Degree"}
                            </h3>
                            <p className="font-['Satoshi'] text-gray-600">
                              {edu.institution || "Institution"}
                              {edu.field_of_study && ` - ${edu.field_of_study}`}
                            </p>
                          </div>
                          <div className="text-right font-['Satoshi'] text-sm text-gray-600">
                            {edu.start_date && formatDate(edu.start_date)}
                            {edu.start_date && (edu.end_date || edu.is_current) && " - "}
                            {edu.is_current ? "Present" : edu.end_date ? formatDate(edu.end_date) : ""}
                          </div>
                        </div>
                        {edu.description && (
                          <p className="mt-2 font-['Satoshi'] text-gray-700">{edu.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {resumeData.skills && resumeData.skills.length > 0 && (
                <div>
                  <h2 className="mb-4 border-b-2 border-neutral-900 font-['Clash_Display'] text-xl font-bold text-neutral-900">
                    Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg border-2 border-neutral-900 bg-violet-50 px-3 py-1 font-['Satoshi'] text-sm text-neutral-900"
                      >
                        {skill.name || skill.category || "Skill"}
                        {skill.proficiency && ` (${skill.proficiency})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {resumeData.projects && resumeData.projects.length > 0 && (
                <div>
                  <h2 className="mb-4 border-b-2 border-neutral-900 font-['Clash_Display'] text-xl font-bold text-neutral-900">
                    Projects
                  </h2>
                  <div className="space-y-4">
                    {resumeData.projects.map((project, idx) => (
                      <div key={idx} className="border-l-2 border-violet-600 pl-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-['Clash_Display'] text-lg font-bold text-neutral-900">
                              {project.title || "Project"}
                            </h3>
                            {project.url && (
                              <a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-['Satoshi'] text-sm text-violet-600 hover:underline"
                              >
                                {project.url}
                              </a>
                            )}
                          </div>
                          <div className="text-right font-['Satoshi'] text-sm text-gray-600">
                            {project.start_date && formatDate(project.start_date)}
                            {project.start_date && project.end_date && " - "}
                            {project.end_date && formatDate(project.end_date)}
                          </div>
                        </div>
                        {project.description && (
                          <p className="mt-2 font-['Satoshi'] text-gray-700">{project.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {resumeData.certifications && resumeData.certifications.length > 0 && (
                <div>
                  <h2 className="mb-4 border-b-2 border-neutral-900 font-['Clash_Display'] text-xl font-bold text-neutral-900">
                    Certifications
                  </h2>
                  <div className="space-y-3">
                    {resumeData.certifications.map((cert, idx) => (
                      <div key={idx} className="flex items-start justify-between border-l-2 border-violet-600 pl-4">
                        <div>
                          <h3 className="font-['Clash_Display'] text-lg font-bold text-neutral-900">
                            {cert.name || "Certification"}
                          </h3>
                          <p className="font-['Satoshi'] text-gray-600">{cert.issuer || "Issuer"}</p>
                          {cert.url && (
                            <a
                              href={cert.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-['Satoshi'] text-sm text-violet-600 hover:underline"
                            >
                              View Certificate
                            </a>
                          )}
                        </div>
                        <div className="text-right font-['Satoshi'] text-sm text-gray-600">
                          {cert.issue_date && formatDate(cert.issue_date)}
                          {cert.expiry_date && ` - ${formatDate(cert.expiry_date)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="font-['Satoshi'] text-gray-600">No resume data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

