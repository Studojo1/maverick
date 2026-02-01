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
  
  const user = await getUserFromRequest(request);
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // Check if user has ops or admin role
  const result = await db.execute(
    sql`SELECT role FROM public."user" WHERE id = ${user.id} LIMIT 1`
  );

  if (result.rows.length === 0) {
    throw new Response("User not found", { status: 404 });
  }

  const role = result.rows[0].role as string | null;
  if (role !== "ops" && role !== "admin") {
    throw new Response("Forbidden - Ops or Admin access required", { status: 403 });
  }

  // Fetch internship directly from database
  const internshipResult = await db.execute(
    sql`SELECT * FROM public.internships WHERE id = ${id} LIMIT 1`
  );

  if (internshipResult.rows.length === 0) {
    throw new Response("Internship not found", { status: 404 });
  }

  return { internship: internshipResult.rows[0] };
}

export default function EditInternship({ data }: Route.ComponentProps) {
  const loaderData = useLoaderData() as { internship: any } | undefined;
  const internship = (loaderData?.internship || data?.internship) as any | undefined;
  const navigate = useNavigate();
  const { isAuthorized, isPending } = useOpsGuard();

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
          <div className="mt-6 rounded-lg border-2 border-neutral-900 bg-violet-50 p-4">
            <p className="mb-2 font-['Satoshi'] font-medium text-neutral-900">
              Public URL:
            </p>
            <a
              href={`${typeof window !== "undefined" ? window.location.origin.replace(":3002", ":3000") : ""}/internships/${internship.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-['Satoshi'] text-violet-600 hover:underline break-all"
            >
              {typeof window !== "undefined" ? window.location.origin.replace(":3002", ":3000") : ""}/internships/{internship.slug}
            </a>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

