import { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { useOpsGuard } from "~/lib/ops-guard";
import { getToken } from "~/lib/api";
import { toast } from "sonner";
import { DashboardLayout } from "~/components/dashboard/layout";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import type { Route } from "./+types/$id";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Edit Company – Maverick" },
    {
      name: "description",
      content: "Edit company information",
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { id } = params;
  const user = await getUserFromRequest(request);

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const roleResult = await db.execute(
    sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`
  );

  if (roleResult.rows.length === 0) {
    throw new Response("User not found", { status: 404 });
  }

  const role = roleResult.rows[0].role as string | null;
  if (role !== "ops" && role !== "admin") {
    throw new Response("Forbidden - Ops or Admin access required", { status: 403 });
  }

  const result = await db.execute(
    sql`SELECT * FROM companies WHERE id = ${id} LIMIT 1`
  );

  if (result.rows.length === 0) {
    throw new Response("Company not found", { status: 404 });
  }

  return { company: result.rows[0] };
}

export default function EditCompany({ data }: Route.ComponentProps) {
  const loaderData = useLoaderData() as { company: any } | undefined;
  const company = (loaderData?.company || data?.company) as any | undefined;
  const navigate = useNavigate();
  const { isAuthorized, isPending } = useOpsGuard();
  const [name, setName] = useState(company?.name || "");
  const [email, setEmail] = useState(company?.email || "");
  const [phone, setPhone] = useState(company?.phone || "");
  const [website, setWebsite] = useState(company?.website || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name || "");
      setEmail(company.email || "");
      setPhone(company.phone || "");
      setWebsite(company.website || "");
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !company) {
      toast.error("Company name is required");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          website: website.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update company");
      }

      toast.success("Company updated successfully");
      navigate("/companies");
    } catch (error: any) {
      console.error("Error updating company:", error);
      toast.error(error.message || "Failed to update company");
    } finally {
      setLoading(false);
    }
  };

  if (isPending || isAuthorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-['Satoshi'] text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthorized || !company) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="font-['Clash_Display'] text-4xl font-bold text-neutral-900">
            Edit Company
          </h1>
          <p className="mt-2 font-['Satoshi'] text-sm text-gray-600">
            {company.name}
          </p>
        </div>

        <div className="rounded-lg border-2 border-neutral-900 bg-white p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
                Company Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g., Tech Corp"
              />
            </div>

            <div>
              <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="contact@company.com"
              />
            </div>

            <div>
              <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="https://company.com"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate("/companies")}
                className="flex-1 rounded-lg border-2 border-neutral-900 px-6 py-3 font-['Satoshi'] font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg border-2 border-neutral-900 bg-violet-600 px-6 py-3 font-['Satoshi'] font-bold text-white transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update Company"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

