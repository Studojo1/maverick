import { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { useOpsGuard } from "~/lib/ops-guard";
import { getToken } from "~/lib/api";
import { toast } from "sonner";
import { DashboardLayout } from "~/components/dashboard/layout";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import { FiPlus, FiTrash2, FiEdit2 } from "react-icons/fi";
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

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;

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
  const [archiving, setArchiving] = useState(false);
  const [partnerUsers, setPartnerUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "viewer" as "admin" | "viewer",
  });

  useEffect(() => {
    if (company) {
      setName(company.name || "");
      setEmail(company.email || "");
      setPhone(company.phone || "");
      setWebsite(company.website || "");
      loadPartnerUsers();
    }
  }, [company]);

  const loadPartnerUsers = async () => {
    if (!company) return;
    try {
      setLoadingUsers(true);
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`/api/companies/${company.id}/partner-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load partner users");
      }

      const data = await response.json();
      setPartnerUsers(data.users || []);
    } catch (error) {
      console.error("Error loading partner users:", error);
      toast.error("Failed to load partner users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async () => {
    if (!company) return;
    if (!userForm.email || !userForm.password || !userForm.name) {
      toast.error("Email, password, and name are required");
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(`/api/companies/${company.id}/partner-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: userForm.email,
          password: userForm.password,
          name: userForm.name,
          userRole: userForm.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create partner user");
      }

      toast.success("Partner user created");
      setShowUserForm(false);
      setUserForm({ email: "", password: "", name: "", role: "viewer" });
      loadPartnerUsers();
    } catch (error: any) {
      console.error("Error creating partner user:", error);
      toast.error(error.message || "Failed to create partner user");
    }
  };

  const handleUpdateUser = async () => {
    if (!company || !editingUser) return;
    if (!userForm.email || !userForm.name) {
      toast.error("Email and name are required");
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(`/api/companies/${company.id}/partner-users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: editingUser.id,
          email: userForm.email,
          password: userForm.password || undefined,
          name: userForm.name,
          userRole: userForm.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update partner user");
      }

      toast.success("Partner user updated");
      setEditingUser(null);
      setShowUserForm(false);
      setUserForm({ email: "", password: "", name: "", role: "viewer" });
      loadPartnerUsers();
    } catch (error: any) {
      console.error("Error updating partner user:", error);
      toast.error(error.message || "Failed to update partner user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!company) return;
    if (!window.confirm("Are you sure you want to delete this partner user?")) {
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(`/api/companies/${company.id}/partner-users?userId=${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete partner user");
      }

      toast.success("Partner user deleted");
      loadPartnerUsers();
    } catch (error: any) {
      console.error("Error deleting partner user:", error);
      toast.error(error.message || "Failed to delete partner user");
    }
  };

  const handleArchive = async () => {
    if (!company) return;
    if (
      !window.confirm(
        `Archive ${company.name}? This hides the company from Maverick, but keeps its history.`
      )
    ) {
      return;
    }

    try {
      setArchiving(true);
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to archive company");
      }

      toast.success("Company archived");
      navigate("/companies");
    } catch (error: any) {
      console.error("Error archiving company:", error);
      toast.error(error.message || "Failed to archive company");
    } finally {
      setArchiving(false);
    }
  };

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
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-['Clash_Display'] text-4xl font-bold text-neutral-900">
              Edit Company
            </h1>
            <p className="mt-2 font-['Satoshi'] text-sm text-gray-600">
              {company.name}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleArchive}
              disabled={archiving}
              className="rounded-lg border-2 border-red-600 bg-red-50 px-4 py-2 font-['Satoshi'] text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {archiving ? "Archiving..." : "Archive company"}
            </button>
          </div>
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

        {/* Partner Users Section */}
        <div className="mt-8 rounded-lg border-2 border-neutral-900 bg-white p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-['Clash_Display'] text-2xl font-bold text-neutral-900">
                Partner Users
              </h2>
              <p className="mt-1 font-['Satoshi'] text-sm text-gray-600">
                Manage partner access for this company
              </p>
            </div>
            {!showUserForm && !editingUser && (
              <button
                type="button"
                onClick={() => {
                  setShowUserForm(true);
                  setEditingUser(null);
                  setUserForm({ email: "", password: "", name: "", role: "viewer" });
                }}
                className="flex items-center gap-2 rounded-lg border-2 border-neutral-900 bg-violet-600 px-4 py-2 font-['Satoshi'] text-sm font-bold text-white transition-colors hover:bg-violet-700"
              >
                <FiPlus className="h-4 w-4" />
                Add Partner User
              </button>
            )}
          </div>

          {/* User Form */}
          {(showUserForm || editingUser) && (
            <div className="mb-6 rounded-lg border-2 border-neutral-900 bg-neutral-50 p-6">
              <h3 className="mb-4 font-['Satoshi'] text-lg font-bold text-neutral-900">
                {editingUser ? "Edit Partner User" : "New Partner User"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block font-['Satoshi'] text-sm font-medium text-neutral-900">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full rounded-lg border-2 border-neutral-900 px-3 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-['Satoshi'] text-sm font-medium text-neutral-900">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full rounded-lg border-2 border-neutral-900 px-3 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="user@company.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-['Satoshi'] text-sm font-medium text-neutral-900">
                    Password {editingUser ? "(leave blank to keep current)" : "*"}
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full rounded-lg border-2 border-neutral-900 px-3 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder={editingUser ? "••••••••" : "••••••••"}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-['Satoshi'] text-sm font-medium text-neutral-900">
                    Role *
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as "admin" | "viewer" })}
                    className="w-full rounded-lg border-2 border-neutral-900 px-3 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserForm(false);
                      setEditingUser(null);
                      setUserForm({ email: "", password: "", name: "", role: "viewer" });
                    }}
                    className="flex-1 rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={editingUser ? handleUpdateUser : handleCreateUser}
                    className="flex-1 rounded-lg border-2 border-neutral-900 bg-violet-600 px-4 py-2 font-['Satoshi'] text-sm font-bold text-white transition-colors hover:bg-violet-700"
                  >
                    {editingUser ? "Update User" : "Create User"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Users List */}
          {loadingUsers ? (
            <p className="font-['Satoshi'] text-gray-600">Loading partner users...</p>
          ) : partnerUsers.length === 0 ? (
            <p className="font-['Satoshi'] text-gray-600">No partner users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-2 border-neutral-900">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                      Name
                    </th>
                    <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                      Email
                    </th>
                    <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                      Role
                    </th>
                    <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {partnerUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                        {user.name}
                      </td>
                      <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                        {user.email}
                      </td>
                      <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                        <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(user);
                              setShowUserForm(false);
                              setUserForm({
                                email: user.email,
                                password: "",
                                name: user.name,
                                role: user.role,
                              });
                            }}
                            className="inline-flex items-center gap-1 text-sm text-violet-600 hover:underline"
                          >
                            <FiEdit2 className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id)}
                            className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
                          >
                            <FiTrash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

