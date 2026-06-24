import { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { useOpsGuard } from "~/lib/ops-guard";
import { getToken } from "~/lib/api";
import { toast } from "sonner";
import { InternshipForm } from "~/components/internship/internship-form";
import { DashboardLayout } from "~/components/dashboard/layout";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import type { Route } from "./+types/$id";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Edit Internship – Maverick" },
    {
      name: "description",
      content: "Edit internship listing",
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { id } = params;
  
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

  // Public links live on the main studojo.com domain, not on maverick.*.
  const publicBaseUrl = (process.env.SITE_URL || "https://studojo.com").replace(/\/$/, "");

  return { internship: internshipResult.rows[0], publicBaseUrl };
}

export default function EditInternship({ data }: Route.ComponentProps) {
  const loaderData = useLoaderData() as
    | { internship: any; publicBaseUrl: string }
    | undefined;
  const internship = (loaderData?.internship || data?.internship) as any | undefined;
  const publicBaseUrl =
    loaderData?.publicBaseUrl || (data as any)?.publicBaseUrl || "https://studojo.com";
  const publicUrl = internship ? `${publicBaseUrl}/internships/${internship.slug}` : "";
  const navigate = useNavigate();
  const { isAuthorized, isPending } = useOpsGuard();

  // WhatsApp outreach message (generated on demand, not persisted).
  const [waMessage, setWaMessage] = useState<string | null>(null);
  const [waLoading, setWaLoading] = useState(false);
  const [waCopied, setWaCopied] = useState(false);

  const generateWhatsApp = async () => {
    if (!internship) return;
    setWaLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
      const response = await fetch(`/api/internships/${internship.id}/whatsapp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to generate WhatsApp message");
      }
      setWaMessage(result.message);
    } catch (error: any) {
      console.error("Error generating WhatsApp message:", error);
      toast.error(error.message || "Failed to generate WhatsApp message");
    } finally {
      setWaLoading(false);
    }
  };

  // Auto-generate once when viewing a published opening.
  useEffect(() => {
    if (internship?.status === "published" && waMessage === null && !waLoading) {
      generateWhatsApp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internship?.status]);

  const copyWhatsApp = async () => {
    if (!waMessage) return;
    try {
      await navigator.clipboard.writeText(waMessage);
      setWaCopied(true);
      toast.success("WhatsApp message copied");
      setTimeout(() => setWaCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleSubmit = async (formData: any) => {
    if (!internship) return;

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(`/api/internships/${internship.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update internship");
      }

      toast.success("Internship updated successfully");
      navigate(`/internships/${internship.id}`);
    } catch (error: any) {
      console.error("Error updating internship:", error);
      toast.error(error.message || "Failed to update internship");
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

  if (!isAuthorized || !internship) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="font-['Clash_Display'] text-4xl font-bold text-neutral-900">
            Edit Internship
          </h1>
          <p className="mt-2 font-['Satoshi'] text-sm text-gray-600">
            {internship.title} at {internship.company_name}
          </p>
        </div>

        <div className="rounded-lg border-2 border-neutral-900 bg-white p-8 overflow-hidden">
          <InternshipForm
            initialData={internship}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/internships")}
          />
        </div>

        {internship.status === "published" && (
          <>
            <div className="mt-6 rounded-lg border-2 border-neutral-900 bg-violet-50 p-4">
              <p className="mb-2 font-['Satoshi'] font-medium text-neutral-900">
                Public URL:
              </p>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-['Satoshi'] text-violet-600 hover:underline break-all"
              >
                {publicUrl}
              </a>
            </div>

            <div className="mt-6 rounded-lg border-2 border-neutral-900 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-['Satoshi'] font-medium text-neutral-900">
                  WhatsApp message
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={generateWhatsApp}
                    disabled={waLoading}
                    className="rounded-lg border-2 border-neutral-900 bg-white px-3 py-1.5 font-['Satoshi'] text-sm font-medium hover:bg-neutral-100 disabled:opacity-50"
                  >
                    {waLoading ? "Generating..." : waMessage ? "Regenerate" : "Generate"}
                  </button>
                  <button
                    type="button"
                    onClick={copyWhatsApp}
                    disabled={!waMessage || waLoading}
                    className="rounded-lg border-2 border-neutral-900 bg-violet-600 px-3 py-1.5 font-['Satoshi'] text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {waCopied ? "Copied!" : "Copy WhatsApp Message"}
                  </button>
                </div>
              </div>
              {waLoading && !waMessage ? (
                <p className="font-['Satoshi'] text-sm text-gray-600">
                  Generating message...
                </p>
              ) : waMessage ? (
                <textarea
                  readOnly
                  value={waMessage}
                  rows={12}
                  className="w-full whitespace-pre-wrap rounded-lg border-2 border-neutral-900 px-4 py-3 font-['Satoshi'] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              ) : (
                <p className="font-['Satoshi'] text-sm text-gray-600">
                  No message yet. Click Generate to create a WhatsApp blast with
                  the public link.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

