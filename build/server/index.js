import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, useNavigate, useLocation, Link, useSearchParams, useParams, useLoaderData } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { Toaster, toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { lastLoginMethodClient, jwtClient, adminClient, phoneNumberClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { FiHome, FiBook, FiBriefcase, FiBold, FiItalic, FiUnderline, FiMinus, FiCode, FiList, FiType, FiMessageSquare, FiAlignLeft, FiAlignCenter, FiAlignRight, FiLink, FiUpload, FiImage, FiEdit2, FiX, FiCopy, FiDownload } from "react-icons/fi";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link$1 from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { motion, AnimatePresence } from "framer-motion";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import slugify from "slugify";
import readingTime from "reading-time";
import { randomBytes } from "crypto";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders
    });
  }
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId = setTimeout(
      () => abort(),
      streamTimeout + 1e3
    );
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = void 0;
              callback();
            }
          });
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          pipe(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [{
  rel: "icon",
  href: "/favicon.png",
  type: "image/png"
}, {
  rel: "preconnect",
  href: "https://api.fontshare.com"
}, {
  rel: "stylesheet",
  href: "https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=satoshi@400,500,700,900&display=swap"
}];
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [children, /* @__PURE__ */ jsx(Toaster, {
        position: "top-right",
        toastOptions: {
          classNames: {
            toast: "font-['Satoshi']",
            title: "font-['Satoshi'] font-medium",
            description: "font-['Satoshi']",
            success: "bg-emerald-50 border-emerald-200 text-emerald-900",
            error: "bg-red-50 border-red-200 text-red-900",
            info: "bg-blue-50 border-blue-200 text-blue-900"
          }
        }
      }), /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
const getAuthBaseURL = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    if (port === "3002" || window.location.port === "3002") {
      return `http://${host}:3000`;
    }
    if (host.startsWith("maverick.")) {
      const baseHost = host.replace(/^maverick\./, "");
      return `${protocol}//${baseHost}`;
    }
    if (window.location.origin.includes(":3002")) {
      return window.location.origin.replace(":3002", ":3000");
    }
    return window.location.origin;
  }
  return process.env.VITE_AUTH_URL || "http://localhost:3000";
};
const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
  plugins: [
    lastLoginMethodClient(),
    jwtClient(),
    adminClient(),
    phoneNumberClient(),
    twoFactorClient({
      onTwoFactorRedirect: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/auth/2fa";
        }
      }
    })
  ]
});
function getFrontendUrl() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    if (port === "3002" || window.location.port === "3002") {
      return `http://${host}:3000`;
    }
    if (host.startsWith("maverick.")) {
      const baseHost = host.replace(/^maverick\./, "");
      return `${protocol}//${baseHost}`;
    }
    if (window.location.origin.includes(":3002")) {
      return window.location.origin.replace(":3002", ":3000");
    }
    return window.location.origin;
  }
  return process.env.VITE_AUTH_URL || "http://localhost:3000";
}
async function getToken() {
  const { data, error } = await authClient.token();
  if (!error && data?.token) {
    return data.token;
  }
  try {
    const frontendUrl = getFrontendUrl();
    const response = await fetch(`${frontendUrl}/api/auth/share-token`, {
      method: "GET",
      credentials: "include",
      mode: "cors",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (response.ok) {
      const data2 = await response.json();
      if (data2.token) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("maverick_token", data2.token);
        }
        return data2.token;
      }
    } else {
      if (typeof window !== "undefined") {
        const storedToken = sessionStorage.getItem("maverick_token");
        if (storedToken) {
          return storedToken;
        }
      }
    }
  } catch (error2) {
    console.debug("Failed to get token from frontend:", error2);
    if (typeof window !== "undefined") {
      const storedToken = sessionStorage.getItem("maverick_token");
      if (storedToken) {
        return storedToken;
      }
    }
  }
  return null;
}
function useOpsGuard() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(null);
  const { data: session, isPending } = authClient.useSession();
  const checkedRef = useRef(false);
  useEffect(() => {
    if (checkedRef.current) return;
    const checkAuth = async () => {
      if (isPending) return;
      if (!session?.user) {
        checkedRef.current = true;
        navigate("/login?redirect=" + encodeURIComponent(window.location.pathname), { replace: true });
        return;
      }
      try {
        const token = await getToken();
        if (!token) {
          checkedRef.current = true;
          navigate("/login?redirect=" + encodeURIComponent(window.location.pathname), { replace: true });
          return;
        }
        const response = await fetch("/api/auth/check-role", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.role === "ops" || data.role === "admin") {
            checkedRef.current = true;
            setIsAuthorized(true);
          } else {
            checkedRef.current = true;
            navigate("/login?error=not_ops", { replace: true });
          }
        } else {
          checkedRef.current = true;
          navigate("/login?error=not_ops", { replace: true });
        }
      } catch (error) {
        console.error("Ops check failed:", error);
        checkedRef.current = true;
        navigate("/login?redirect=" + encodeURIComponent(window.location.pathname), { replace: true });
      }
    };
    checkAuth();
  }, [session, isPending, navigate]);
  return { isAuthorized, isPending };
}
function DashboardLayout({ children }) {
  const location = useLocation();
  const { data: session } = authClient.useSession();
  const navigation = [
    { name: "Dashboard", href: "/", icon: FiHome },
    { name: "Blog", href: "/", icon: FiBook },
    { name: "Internships", href: "/internships", icon: FiBriefcase }
  ];
  const isActive = (href) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsx("div", { className: "fixed inset-y-0 left-0 w-64 bg-white border-r-2 border-neutral-900", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-6 border-b-2 border-neutral-900", children: [
        /* @__PURE__ */ jsx("h1", { className: "font-['Clash_Display'] text-2xl font-bold text-neutral-900", children: "Maverick" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 font-['Satoshi'] text-sm text-gray-600", children: "Ops Dashboard" })
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "flex-1 p-4 space-y-2", children: navigation.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return /* @__PURE__ */ jsxs(
          Link,
          {
            to: item.href,
            className: `flex items-center gap-3 px-4 py-3 rounded-lg font-['Satoshi'] font-medium transition-colors ${active ? "bg-violet-100 text-violet-700 border-2 border-violet-300" : "text-gray-700 hover:bg-gray-100"}`,
            children: [
              /* @__PURE__ */ jsx(Icon, { className: "w-5 h-5" }),
              item.name
            ]
          },
          item.name
        );
      }) }),
      /* @__PURE__ */ jsx("div", { className: "p-4 border-t-2 border-neutral-900", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "font-['Satoshi'] font-bold text-violet-700", children: session?.user?.name?.charAt(0).toUpperCase() || "U" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx("p", { className: "font-['Satoshi'] font-medium text-neutral-900 truncate", children: session?.user?.name || "User" }),
          /* @__PURE__ */ jsx("p", { className: "font-['Satoshi'] text-xs text-gray-600 truncate", children: session?.user?.email || "" })
        ] })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "pl-64", children: /* @__PURE__ */ jsx("main", { className: "p-8", children }) })
  ] });
}
function meta$7({}) {
  return [{
    title: "Maverick – Blog Editor"
  }, {
    name: "description",
    content: "Blog editor dashboard"
  }];
}
const index$1 = UNSAFE_withComponentProps(function BlogList() {
  const {
    isAuthorized,
    isPending
  } = useOpsGuard();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
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
        limit: "10"
      });
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (search) {
        params.append("search", search);
      }
      const response = await fetch(`/api/blog?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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
  const handleDelete = async (id) => {
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
          Authorization: `Bearer ${token}`
        }
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
    return /* @__PURE__ */ jsx("div", {
      className: "flex min-h-screen items-center justify-center",
      children: /* @__PURE__ */ jsxs("div", {
        className: "text-center",
        children: [/* @__PURE__ */ jsx("div", {
          className: "mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-500 border-r-transparent"
        }), /* @__PURE__ */ jsx("p", {
          className: "font-['Satoshi'] text-sm text-gray-600",
          children: "Loading..."
        })]
      })
    });
  }
  if (!isAuthorized) {
    return null;
  }
  return /* @__PURE__ */ jsx(DashboardLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "mx-auto max-w-7xl",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "mb-8 flex items-center justify-between",
        children: [/* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("h1", {
            className: "font-['Clash_Display'] text-4xl font-bold text-neutral-900",
            children: "Blog Posts"
          }), /* @__PURE__ */ jsx("p", {
            className: "mt-2 font-['Satoshi'] text-sm text-gray-600",
            children: "Manage your blog posts"
          })]
        }), /* @__PURE__ */ jsx(Link, {
          to: "/blog/new",
          className: "rounded-lg border-2 border-neutral-900 bg-violet-500 px-6 py-3 font-['Satoshi'] font-medium text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px]",
          children: "New Post"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "mb-6 flex gap-4",
        children: [/* @__PURE__ */ jsx("input", {
          type: "text",
          placeholder: "Search posts...",
          value: search,
          onChange: (e) => setSearch(e.target.value),
          className: "flex-1 rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
        }), /* @__PURE__ */ jsxs("select", {
          value: statusFilter,
          onChange: (e) => setStatusFilter(e.target.value),
          className: "rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']",
          children: [/* @__PURE__ */ jsx("option", {
            value: "all",
            children: "All Status"
          }), /* @__PURE__ */ jsx("option", {
            value: "draft",
            children: "Draft"
          }), /* @__PURE__ */ jsx("option", {
            value: "published",
            children: "Published"
          })]
        })]
      }), loading ? /* @__PURE__ */ jsxs("div", {
        className: "text-center py-12",
        children: [/* @__PURE__ */ jsx("div", {
          className: "mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-500 border-r-transparent"
        }), /* @__PURE__ */ jsx("p", {
          className: "font-['Satoshi'] text-sm text-gray-600",
          children: "Loading posts..."
        })]
      }) : posts.length === 0 ? /* @__PURE__ */ jsx("div", {
        className: "rounded-lg border-2 border-neutral-900 bg-white p-12 text-center overflow-hidden",
        children: /* @__PURE__ */ jsx("p", {
          className: "font-['Satoshi'] text-gray-600",
          children: "No posts found"
        })
      }) : /* @__PURE__ */ jsxs(Fragment, {
        children: [/* @__PURE__ */ jsx("div", {
          className: "rounded-lg border-2 border-neutral-900 bg-white overflow-hidden",
          children: /* @__PURE__ */ jsxs("table", {
            className: "w-full",
            children: [/* @__PURE__ */ jsx("thead", {
              className: "bg-studojo-surface-muted",
              children: /* @__PURE__ */ jsxs("tr", {
                children: [/* @__PURE__ */ jsx("th", {
                  className: "px-6 py-3 text-left font-['Satoshi'] font-bold text-sm text-neutral-900",
                  children: "Title"
                }), /* @__PURE__ */ jsx("th", {
                  className: "px-6 py-3 text-left font-['Satoshi'] font-bold text-sm text-neutral-900",
                  children: "Status"
                }), /* @__PURE__ */ jsx("th", {
                  className: "px-6 py-3 text-left font-['Satoshi'] font-bold text-sm text-neutral-900",
                  children: "Views"
                }), /* @__PURE__ */ jsx("th", {
                  className: "px-6 py-3 text-left font-['Satoshi'] font-bold text-sm text-neutral-900",
                  children: "Created"
                }), /* @__PURE__ */ jsx("th", {
                  className: "px-6 py-3 text-right font-['Satoshi'] font-bold text-sm text-neutral-900",
                  children: "Actions"
                })]
              })
            }), /* @__PURE__ */ jsx("tbody", {
              className: "divide-y-2 divide-neutral-900",
              children: posts.map((post) => /* @__PURE__ */ jsxs("tr", {
                children: [/* @__PURE__ */ jsx("td", {
                  className: "px-6 py-4",
                  children: /* @__PURE__ */ jsx(Link, {
                    to: `/blog/${post.id}`,
                    className: "font-['Satoshi'] font-medium text-neutral-900 hover:text-violet-600",
                    children: post.title
                  })
                }), /* @__PURE__ */ jsx("td", {
                  className: "px-6 py-4",
                  children: /* @__PURE__ */ jsx("span", {
                    className: `inline-flex rounded-full px-3 py-1 text-xs font-['Satoshi'] font-medium ${post.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"}`,
                    children: post.status
                  })
                }), /* @__PURE__ */ jsx("td", {
                  className: "px-6 py-4 font-['Satoshi'] text-sm text-gray-600",
                  children: post.view_count
                }), /* @__PURE__ */ jsx("td", {
                  className: "px-6 py-4 font-['Satoshi'] text-sm text-gray-600",
                  children: new Date(post.created_at).toLocaleDateString()
                }), /* @__PURE__ */ jsx("td", {
                  className: "px-6 py-4 text-right",
                  children: /* @__PURE__ */ jsxs("div", {
                    className: "flex justify-end gap-2",
                    children: [/* @__PURE__ */ jsx(Link, {
                      to: `/blog/${post.id}`,
                      className: "rounded border-2 border-neutral-900 bg-white px-3 py-1 font-['Satoshi'] text-sm font-medium hover:bg-gray-50",
                      children: "Edit"
                    }), /* @__PURE__ */ jsx("button", {
                      onClick: () => handleDelete(post.id),
                      className: "rounded border-2 border-red-500 bg-white px-3 py-1 font-['Satoshi'] text-sm font-medium text-red-600 hover:bg-red-50",
                      children: "Delete"
                    })]
                  })
                })]
              }, post.id))
            })]
          })
        }), totalPages > 1 && /* @__PURE__ */ jsxs("div", {
          className: "mt-6 flex justify-center gap-2",
          children: [/* @__PURE__ */ jsx("button", {
            onClick: () => setPage((p) => Math.max(1, p - 1)),
            disabled: page === 1,
            className: "rounded border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi'] text-sm font-medium disabled:opacity-50",
            children: "Previous"
          }), /* @__PURE__ */ jsxs("span", {
            className: "flex items-center px-4 font-['Satoshi'] text-sm text-gray-600",
            children: ["Page ", page, " of ", totalPages]
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => setPage((p) => Math.min(totalPages, p + 1)),
            disabled: page === totalPages,
            className: "rounded border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi'] text-sm font-medium disabled:opacity-50",
            children: "Next"
          })]
        })]
      })]
    })
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index$1,
  meta: meta$7
}, Symbol.toStringTag, { value: "Module" }));
function meta$6({}) {
  return [{
    title: "Maverick Login – Studojo"
  }, {
    name: "description",
    content: "Maverick blog editor login"
  }];
}
const login = UNSAFE_withComponentProps(function MaverickLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const {
    data: session,
    isPending
  } = authClient.useSession();
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const tokenMatch = hash.match(/token=([^&]+)/);
      if (tokenMatch) {
        const token = decodeURIComponent(tokenMatch[1]);
        sessionStorage.setItem("maverick_token", token);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        checkOpsAndRedirect();
      }
    }
  }, []);
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "not_ops") {
      setError("You do not have ops or admin access. Please contact an administrator.");
    }
  }, [searchParams]);
  useEffect(() => {
    if (!isPending && session) {
      checkOpsAndRedirect();
    }
  }, [isPending, session]);
  const checkOpsAndRedirect = async () => {
    if (!session?.user) return;
    try {
      const token = await getToken();
      if (!token) {
        setError("Failed to get authentication token");
        return;
      }
      const response = await fetch("/api/auth/check-role", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const redirectTo = searchParams.get("redirect") || "/";
        navigate(redirectTo, {
          replace: true
        });
      } else {
        setError("You do not have ops or admin access. Please contact an administrator.");
      }
    } catch (err) {
      setError(err.message || "Failed to verify ops access");
    }
  };
  const handleGoogleSignIn = () => {
    setError(null);
    const callbackURL = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";
    authClient.signIn.social({
      provider: "google",
      callbackURL
    });
  };
  if (!isPending && session) {
    return /* @__PURE__ */ jsx("div", {
      className: "flex min-h-screen items-center justify-center bg-gray-50",
      children: /* @__PURE__ */ jsxs("div", {
        className: "text-center",
        children: [/* @__PURE__ */ jsx("div", {
          className: "mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-500 border-r-transparent"
        }), /* @__PURE__ */ jsx("p", {
          className: "font-['Satoshi'] text-sm text-gray-600",
          children: "Verifying ops access..."
        })]
      })
    });
  }
  return /* @__PURE__ */ jsx("div", {
    className: "flex min-h-screen items-center justify-center bg-gray-50 px-4",
    children: /* @__PURE__ */ jsxs("div", {
      className: "w-full max-w-md",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "mb-8 text-center",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "font-['Clash_Display'] text-3xl font-medium leading-tight tracking-tight text-neutral-950",
          children: "Maverick"
        }), /* @__PURE__ */ jsx("p", {
          className: "mt-2 font-['Satoshi'] text-sm font-normal leading-6 text-gray-600",
          children: "Sign in to access the Ops platform."
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "rounded-2xl bg-white p-8 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-2 outline-offset-[-2px] outline-black",
        children: [error && /* @__PURE__ */ jsx("div", {
          className: "mb-6 rounded-lg bg-red-50 border-2 border-red-200 p-3 overflow-hidden",
          children: /* @__PURE__ */ jsx("p", {
            className: "font-['Satoshi'] text-sm font-medium text-red-900",
            children: error
          })
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex flex-col gap-4",
          children: [/* @__PURE__ */ jsxs("button", {
            type: "button",
            onClick: handleGoogleSignIn,
            className: "flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-neutral-900 bg-white font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950 transition-transform hover:translate-x-[2px] hover:translate-y-[2px]",
            children: [/* @__PURE__ */ jsxs("svg", {
              className: "h-5 w-5",
              viewBox: "0 0 24 24",
              children: [/* @__PURE__ */ jsx("path", {
                fill: "currentColor",
                d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              }), /* @__PURE__ */ jsx("path", {
                fill: "currentColor",
                d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              }), /* @__PURE__ */ jsx("path", {
                fill: "currentColor",
                d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              }), /* @__PURE__ */ jsx("path", {
                fill: "currentColor",
                d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              })]
            }), "Continue with Google"]
          }), /* @__PURE__ */ jsxs("div", {
            className: "relative",
            children: [/* @__PURE__ */ jsx("div", {
              className: "absolute inset-0 flex items-center",
              children: /* @__PURE__ */ jsx("div", {
                className: "w-full border-t border-gray-200"
              })
            }), /* @__PURE__ */ jsx("div", {
              className: "relative flex justify-center text-sm",
              children: /* @__PURE__ */ jsx("span", {
                className: "bg-white px-2 font-['Satoshi'] text-gray-500",
                children: "Or"
              })
            })]
          }), /* @__PURE__ */ jsx("button", {
            type: "button",
            onClick: () => {
              let frontendUrl = "http://localhost:3000";
              if (typeof window !== "undefined") {
                const host = window.location.hostname;
                const port = window.location.port;
                const protocol = window.location.protocol;
                if (port === "3002" || window.location.port === "3002") {
                  frontendUrl = `http://${host}:3000`;
                } else if (host.startsWith("maverick.")) {
                  const baseHost = host.replace(/^maverick\./, "");
                  frontendUrl = `${protocol}//${baseHost}`;
                } else if (window.location.origin.includes(":3002")) {
                  frontendUrl = window.location.origin.replace(":3002", ":3000");
                } else {
                  frontendUrl = window.location.origin;
                }
              }
              const redirectUrl = `${frontendUrl}/api/auth/share-token-redirect?redirect=${encodeURIComponent(window.location.href)}`;
              window.location.href = redirectUrl;
            },
            className: "flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-violet-500 bg-violet-50 font-['Satoshi'] text-sm font-medium leading-5 text-violet-700 transition-transform hover:translate-x-[2px] hover:translate-y-[2px]",
            children: "Use credentials from main app"
          })]
        })]
      })]
    })
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: login,
  meta: meta$6
}, Symbol.toStringTag, { value: "Module" }));
function TipTapEditor({ content = "", onChange, placeholder = "Start writing..." }) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        // Disable link and underline from StarterKit since we're adding them separately
        link: false,
        underline: false
      }),
      Image.configure({
        inline: true,
        allowBase64: true
      }),
      Link$1.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-violet-600 underline"
        }
      }),
      Placeholder.configure({
        placeholder
      }),
      Typography,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"]
      }),
      Color,
      Highlight.configure({
        multicolor: true
      })
    ],
    content,
    onUpdate: ({ editor: editor2 }) => {
      onChange?.(editor2.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor-content"
      }
    }
  });
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);
  if (!editor) {
    return null;
  }
  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setShowLinkDialog(false);
    }
  };
  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setShowImageDialog(false);
    }
  };
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      alert("Please upload a JPEG, PNG, or WebP image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/blog/upload-image", {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      const data = await response.json();
      editor.chain().focus().setImage({ src: data.url }).run();
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };
  const ToolbarButton = ({
    onClick,
    isActive,
    title,
    children,
    disabled = false
  }) => /* @__PURE__ */ jsx(
    motion.button,
    {
      type: "button",
      onClick,
      disabled,
      whileHover: { scale: 1.05 },
      whileTap: { scale: 0.95 },
      className: `
        relative p-2.5 rounded-md border-2 border-neutral-900 
        transition-all duration-200 ease-out
        flex items-center justify-center
        w-10 h-10
        ${isActive ? "bg-violet-500 text-white shadow-[2px_2px_0px_0px_rgba(25,26,35,1)]" : "bg-white text-neutral-900 hover:bg-violet-50 hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)]"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
      `,
      title,
      children
    }
  );
  return /* @__PURE__ */ jsxs("div", { className: "relative border-2 border-neutral-900 rounded-lg bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(25,26,35,1)]", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 pointer-events-none overflow-hidden opacity-5", children: /* @__PURE__ */ jsx("div", { className: "wave-bg" }) }),
    /* @__PURE__ */ jsxs("div", { className: "relative flex flex-wrap items-center gap-2 p-3 border-b-2 border-neutral-900 bg-gradient-to-r from-violet-50 via-purple-50 to-teal-50", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            onClick: () => editor.chain().focus().toggleBold().run(),
            isActive: editor.isActive("bold"),
            title: "Bold (Ctrl+B)",
            children: /* @__PURE__ */ jsx(FiBold, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            onClick: () => editor.chain().focus().toggleItalic().run(),
            isActive: editor.isActive("italic"),
            title: "Italic (Ctrl+I)",
            children: /* @__PURE__ */ jsx(FiItalic, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            onClick: () => editor.chain().focus().toggleUnderline().run(),
            isActive: editor.isActive("underline"),
            title: "Underline (Ctrl+U)",
            children: /* @__PURE__ */ jsx(FiUnderline, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            onClick: () => editor.chain().focus().toggleStrike().run(),
            isActive: editor.isActive("strike"),
            title: "Strikethrough",
            children: /* @__PURE__ */ jsx(FiMinus, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            onClick: () => editor.chain().focus().toggleCode().run(),
            isActive: editor.isActive("code"),
            title: "Inline Code",
            children: /* @__PURE__ */ jsx(FiCode, { className: "w-5 h-5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-neutral-900" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
            isActive: editor.isActive("heading", { level: 1 }),
            title: "Heading 1",
            children: /* @__PURE__ */ jsx("span", { className: "font-bold text-xs leading-none", children: "H1" })
          }
        ),
        /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
            isActive: editor.isActive("heading", { level: 2 }),
            title: "Heading 2",
            children: /* @__PURE__ */ jsx("span", { className: "font-bold text-xs leading-none", children: "H2" })
          }
        ),
        /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
            isActive: editor.isActive("heading", { level: 3 }),
            title: "Heading 3",
            children: /* @__PURE__ */ jsx("span", { className: "font-bold text-xs leading-none", children: "H3" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-neutral-900" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            onClick: () => editor.chain().focus().toggleBulletList().run(),
            isActive: editor.isActive("bulletList"),
            title: "Bullet List",
            children: /* @__PURE__ */ jsx(FiList, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            onClick: () => editor.chain().focus().toggleOrderedList().run(),
            isActive: editor.isActive("orderedList"),
            title: "Numbered List",
            children: /* @__PURE__ */ jsx(FiType, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            onClick: () => editor.chain().focus().toggleBlockquote().run(),
            isActive: editor.isActive("blockquote"),
            title: "Blockquote",
            children: /* @__PURE__ */ jsx(FiMessageSquare, { className: "w-5 h-5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-neutral-900" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            onClick: () => editor.chain().focus().setTextAlign("left").run(),
            isActive: editor.isActive({ textAlign: "left" }),
            title: "Align Left",
            children: /* @__PURE__ */ jsx(FiAlignLeft, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            onClick: () => editor.chain().focus().setTextAlign("center").run(),
            isActive: editor.isActive({ textAlign: "center" }),
            title: "Align Center",
            children: /* @__PURE__ */ jsx(FiAlignCenter, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            onClick: () => editor.chain().focus().setTextAlign("right").run(),
            isActive: editor.isActive({ textAlign: "right" }),
            title: "Align Right",
            children: /* @__PURE__ */ jsx(FiAlignRight, { className: "w-5 h-5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-neutral-900" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            onClick: () => setShowLinkDialog(true),
            isActive: false,
            title: "Insert Link",
            children: /* @__PURE__ */ jsx(FiLink, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "file",
              accept: "image/jpeg,image/jpg,image/png,image/webp",
              onChange: handleImageUpload,
              className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10",
              title: "Upload Image",
              disabled: isUploading
            }
          ),
          /* @__PURE__ */ jsx(
            ToolbarButton,
            {
              onClick: () => {
              },
              isActive: false,
              title: "Upload Image",
              disabled: isUploading,
              children: isUploading ? /* @__PURE__ */ jsx(
                motion.div,
                {
                  animate: { rotate: 360 },
                  transition: { duration: 1, repeat: Infinity, ease: "linear" },
                  className: "w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full"
                }
              ) : /* @__PURE__ */ jsx(FiUpload, { className: "w-5 h-5" })
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            onClick: () => setShowImageDialog(true),
            isActive: false,
            title: "Insert Image URL",
            children: /* @__PURE__ */ jsx(FiImage, { className: "w-5 h-5" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "relative bg-white", children: /* @__PURE__ */ jsx(EditorContent, { editor }) }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: showLinkDialog && /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm",
        onClick: () => setShowLinkDialog(false),
        children: /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { scale: 0.9, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0.9, opacity: 0 },
            onClick: (e) => e.stopPropagation(),
            className: "bg-white p-6 rounded-lg border-2 border-neutral-900 max-w-md w-full mx-4 shadow-[6px_6px_0px_0px_rgba(25,26,35,1)]",
            children: [
              /* @__PURE__ */ jsx("h3", { className: "font-['Clash_Display'] font-bold text-xl mb-4 text-neutral-900", children: "Insert Link" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "url",
                  value: linkUrl,
                  onChange: (e) => setLinkUrl(e.target.value),
                  placeholder: "https://example.com",
                  className: "w-full p-3 border-2 border-neutral-900 rounded-lg mb-4 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
                  onKeyDown: (e) => {
                    if (e.key === "Enter") {
                      addLink();
                    } else if (e.key === "Escape") {
                      setShowLinkDialog(false);
                    }
                  },
                  autoFocus: true
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx(
                  motion.button,
                  {
                    type: "button",
                    onClick: addLink,
                    whileHover: { scale: 1.02 },
                    whileTap: { scale: 0.98 },
                    className: "flex-1 p-3 bg-violet-500 text-white rounded-lg border-2 border-neutral-900 font-['Satoshi'] font-medium shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] hover:shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-shadow",
                    children: "Add Link"
                  }
                ),
                /* @__PURE__ */ jsx(
                  motion.button,
                  {
                    type: "button",
                    onClick: () => {
                      setShowLinkDialog(false);
                      setLinkUrl("");
                    },
                    whileHover: { scale: 1.02 },
                    whileTap: { scale: 0.98 },
                    className: "flex-1 p-3 bg-white rounded-lg border-2 border-neutral-900 font-['Satoshi'] font-medium hover:bg-gray-50",
                    children: "Cancel"
                  }
                )
              ] })
            ]
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: showImageDialog && /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm",
        onClick: () => setShowImageDialog(false),
        children: /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { scale: 0.9, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0.9, opacity: 0 },
            onClick: (e) => e.stopPropagation(),
            className: "bg-white p-6 rounded-lg border-2 border-neutral-900 max-w-md w-full mx-4 shadow-[6px_6px_0px_0px_rgba(25,26,35,1)]",
            children: [
              /* @__PURE__ */ jsx("h3", { className: "font-['Clash_Display'] font-bold text-xl mb-4 text-neutral-900", children: "Insert Image URL" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "url",
                  value: imageUrl,
                  onChange: (e) => setImageUrl(e.target.value),
                  placeholder: "https://example.com/image.jpg",
                  className: "w-full p-3 border-2 border-neutral-900 rounded-lg mb-4 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
                  onKeyDown: (e) => {
                    if (e.key === "Enter") {
                      addImage();
                    } else if (e.key === "Escape") {
                      setShowImageDialog(false);
                    }
                  },
                  autoFocus: true
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx(
                  motion.button,
                  {
                    type: "button",
                    onClick: addImage,
                    whileHover: { scale: 1.02 },
                    whileTap: { scale: 0.98 },
                    className: "flex-1 p-3 bg-violet-500 text-white rounded-lg border-2 border-neutral-900 font-['Satoshi'] font-medium shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] hover:shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-shadow",
                    children: "Add Image"
                  }
                ),
                /* @__PURE__ */ jsx(
                  motion.button,
                  {
                    type: "button",
                    onClick: () => {
                      setShowImageDialog(false);
                      setImageUrl("");
                    },
                    whileHover: { scale: 1.02 },
                    whileTap: { scale: 0.98 },
                    className: "flex-1 p-3 bg-white rounded-lg border-2 border-neutral-900 font-['Satoshi'] font-medium hover:bg-gray-50",
                    children: "Cancel"
                  }
                )
              ] })
            ]
          }
        )
      }
    ) })
  ] });
}
function BlogImageUpload({ value, onChange, className = "" }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const [imageError, setImageError] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const fileInputRef = useRef(null);
  useEffect(() => {
    if (value) {
      setPreview(value);
      setImageError(false);
      setShowEdit(false);
    } else {
      setPreview(null);
    }
  }, [value]);
  const handleFileSelect = async (file) => {
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      alert("Please upload a JPEG, PNG, or WebP image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/blog/upload-image", {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      const data = await response.json();
      setPreview(data.url);
      onChange?.(data.url);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleRemove = () => {
    setPreview(null);
    setShowEdit(false);
    onChange?.("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const handleEdit = () => {
    setShowEdit(true);
  };
  const handleCancelEdit = () => {
    setShowEdit(false);
  };
  if (preview && !showEdit) {
    return /* @__PURE__ */ jsx("div", { className, children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        className: "relative rounded-lg border-2 border-neutral-900 overflow-hidden bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(25,26,35,1)]",
        children: [
          /* @__PURE__ */ jsx("div", { className: "relative h-64 w-full overflow-hidden", children: imageError ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full bg-neutral-200 p-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-['Satoshi'] text-neutral-600 mb-2", children: "Image failed to load" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-['Satoshi'] text-neutral-500 break-all text-center px-4", children: preview })
          ] }) : /* @__PURE__ */ jsx(
            "img",
            {
              src: preview,
              alt: "Featured image preview",
              className: "h-full w-full object-cover transition-transform hover:scale-105",
              onError: () => setImageError(true),
              onLoad: () => setImageError(false)
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "absolute top-3 right-3 flex gap-2", children: [
            /* @__PURE__ */ jsx(
              motion.button,
              {
                type: "button",
                onClick: handleEdit,
                whileHover: { scale: 1.1 },
                whileTap: { scale: 0.9 },
                className: "rounded-full bg-violet-500 p-2 text-white shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] hover:bg-violet-600 hover:shadow-[3px_3px_0px_0px_rgba(25,26,35,1)] transition-all border-2 border-neutral-900",
                title: "Edit/Replace image",
                children: /* @__PURE__ */ jsx(FiEdit2, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              motion.button,
              {
                type: "button",
                onClick: handleRemove,
                whileHover: { scale: 1.1 },
                whileTap: { scale: 0.9 },
                className: "rounded-full bg-red-500 p-2 text-white shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] hover:bg-red-600 hover:shadow-[3px_3px_0px_0px_rgba(25,26,35,1)] transition-all border-2 border-neutral-900",
                title: "Remove image",
                children: /* @__PURE__ */ jsx(FiX, { className: "w-4 h-4" })
              }
            )
          ] })
        ]
      }
    ) });
  }
  return /* @__PURE__ */ jsxs("div", { className, children: [
    showEdit && preview && /* @__PURE__ */ jsxs("div", { className: "mb-4 p-3 rounded-lg border-2 border-neutral-900 bg-violet-50", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-['Satoshi'] text-neutral-700 mb-2", children: "Current image URL:" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs font-['Satoshi'] text-neutral-600 break-all mb-3", children: preview }),
      /* @__PURE__ */ jsx(
        motion.button,
        {
          type: "button",
          onClick: handleCancelEdit,
          whileHover: { scale: 1.02 },
          whileTap: { scale: 0.98 },
          className: "text-sm font-['Satoshi'] text-violet-600 hover:text-violet-800 underline",
          children: "Cancel editing"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        onDrop: handleDrop,
        onDragOver: handleDragOver,
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        className: "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-900 bg-studojo-surface-muted p-8 transition-colors hover:bg-violet-50",
        children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: fileInputRef,
              type: "file",
              accept: "image/jpeg,image/jpg,image/png,image/webp",
              onChange: (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileSelect(file);
                }
              },
              className: "hidden"
            }
          ),
          uploading ? /* @__PURE__ */ jsx(
            motion.div,
            {
              animate: { rotate: 360 },
              transition: { duration: 1, repeat: Infinity, ease: "linear" },
              className: "mb-4 h-12 w-12 border-4 border-neutral-900 border-t-violet-500 rounded-full"
            }
          ) : /* @__PURE__ */ jsx(FiUpload, { className: "mb-4 h-12 w-12 text-gray-400" }),
          /* @__PURE__ */ jsx("p", { className: "mb-2 font-['Satoshi'] text-sm font-medium text-gray-600", children: uploading ? "Uploading..." : showEdit ? "Upload a new image to replace the current one" : "Drag and drop an image, or click to select" }),
          /* @__PURE__ */ jsx(
            motion.button,
            {
              type: "button",
              onClick: () => fileInputRef.current?.click(),
              disabled: uploading,
              whileHover: { scale: 1.02 },
              whileTap: { scale: 0.98 },
              className: "rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi'] text-sm font-medium hover:bg-gray-50 disabled:opacity-50 shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] hover:shadow-[3px_3px_0px_0px_rgba(25,26,35,1)] transition-shadow",
              children: uploading ? "Uploading..." : "Select Image"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs font-['Satoshi'] text-gray-500", children: "JPEG, PNG, or WebP (max 5MB)" })
        ]
      }
    )
  ] });
}
function BlogForm({ initialData, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || "");
  const [status, setStatus] = useState(initialData?.status || "draft");
  const [seoMetaTitle, setSeoMetaTitle] = useState(initialData?.seo?.metaTitle || "");
  const [seoMetaDescription, setSeoMetaDescription] = useState(initialData?.seo?.metaDescription || "");
  const [seoKeywords, setSeoKeywords] = useState(initialData?.seo?.keywords?.join(", ") || "");
  const [seoOgImage, setSeoOgImage] = useState(initialData?.seo?.ogImage || "");
  const [categories, setCategories] = useState(initialData?.categories || []);
  const [tags, setTags] = useState(initialData?.tags || []);
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !excerpt.trim()) {
      alert("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        content,
        excerpt: excerpt.trim(),
        featuredImage: featuredImage || void 0,
        status,
        seo: {
          metaTitle: seoMetaTitle.trim() || void 0,
          metaDescription: seoMetaDescription.trim() || void 0,
          keywords: seoKeywords.split(",").map((k) => k.trim()).filter(Boolean),
          ogImage: seoOgImage.trim() || void 0
        },
        categories,
        tags
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };
  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
    }
  };
  const removeCategory = (cat) => {
    setCategories(categories.filter((c) => c !== cat));
  };
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };
  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "block font-['Satoshi'] font-medium text-neutral-900 mb-2", children: "Title *" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: title,
          onChange: (e) => setTitle(e.target.value),
          className: "w-full rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']",
          required: true
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "block font-['Satoshi'] font-medium text-neutral-900 mb-2", children: "Excerpt *" }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          value: excerpt,
          onChange: (e) => setExcerpt(e.target.value),
          rows: 3,
          className: "w-full rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']",
          required: true
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "block font-['Satoshi'] font-medium text-neutral-900 mb-2", children: "Content *" }),
      /* @__PURE__ */ jsx(TipTapEditor, { content, onChange: setContent })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "block font-['Satoshi'] font-medium text-neutral-900 mb-2", children: "Featured Image" }),
      /* @__PURE__ */ jsx(BlogImageUpload, { value: featuredImage, onChange: setFeaturedImage })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "block font-['Satoshi'] font-medium text-neutral-900 mb-2", children: "Status" }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          value: status,
          onChange: (e) => setStatus(e.target.value),
          className: "w-full rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']",
          children: [
            /* @__PURE__ */ jsx("option", { value: "draft", children: "Draft" }),
            /* @__PURE__ */ jsx("option", { value: "published", children: "Published" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "block font-['Satoshi'] font-medium text-neutral-900 mb-2", children: "Categories" }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-2", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: newCategory,
            onChange: (e) => setNewCategory(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCategory();
              }
            },
            placeholder: "Add category",
            className: "flex-1 rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: addCategory,
            className: "rounded-lg border-2 border-neutral-900 bg-violet-500 px-4 py-2 font-['Satoshi'] font-medium text-white",
            children: "Add"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: categories.map((cat) => /* @__PURE__ */ jsxs(
        "span",
        {
          className: "inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-sm font-['Satoshi']",
          children: [
            cat,
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => removeCategory(cat),
                className: "text-violet-600 hover:text-violet-800",
                children: "×"
              }
            )
          ]
        },
        cat
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "block font-['Satoshi'] font-medium text-neutral-900 mb-2", children: "Tags" }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-2", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: newTag,
            onChange: (e) => setNewTag(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            },
            placeholder: "Add tag",
            className: "flex-1 rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: addTag,
            className: "rounded-lg border-2 border-neutral-900 bg-violet-500 px-4 py-2 font-['Satoshi'] font-medium text-white",
            children: "Add"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: tags.map((tag) => /* @__PURE__ */ jsxs(
        "span",
        {
          className: "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-['Satoshi']",
          children: [
            tag,
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => removeTag(tag),
                className: "text-emerald-600 hover:text-emerald-800",
                children: "×"
              }
            )
          ]
        },
        tag
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setShowAdvanced(!showAdvanced),
          className: "font-['Satoshi'] font-medium text-violet-600 hover:text-violet-800",
          children: [
            showAdvanced ? "Hide" : "Show",
            " Advanced SEO Settings"
          ]
        }
      ),
      showAdvanced && /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-4 rounded-lg border-2 border-neutral-900 bg-white p-4 overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block font-['Satoshi'] font-medium text-neutral-900 mb-2", children: "SEO Meta Title" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: seoMetaTitle,
              onChange: (e) => setSeoMetaTitle(e.target.value),
              maxLength: 60,
              className: "w-full rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
            }
          ),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs font-['Satoshi'] text-gray-500", children: [
            seoMetaTitle.length,
            "/60 characters"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block font-['Satoshi'] font-medium text-neutral-900 mb-2", children: "SEO Meta Description" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: seoMetaDescription,
              onChange: (e) => setSeoMetaDescription(e.target.value),
              maxLength: 160,
              rows: 3,
              className: "w-full rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
            }
          ),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs font-['Satoshi'] text-gray-500", children: [
            seoMetaDescription.length,
            "/160 characters"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block font-['Satoshi'] font-medium text-neutral-900 mb-2", children: "SEO Keywords (comma-separated)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: seoKeywords,
              onChange: (e) => setSeoKeywords(e.target.value),
              placeholder: "keyword1, keyword2, keyword3",
              className: "w-full rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block font-['Satoshi'] font-medium text-neutral-900 mb-2", children: "Open Graph Image URL" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "url",
              value: seoOgImage,
              onChange: (e) => setSeoOgImage(e.target.value),
              className: "w-full rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi']"
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: loading,
          className: "rounded-lg border-2 border-neutral-900 bg-violet-500 px-6 py-3 font-['Satoshi'] font-medium text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50",
          children: loading ? "Saving..." : initialData?.id ? "Update Post" : "Create Post"
        }
      ),
      onCancel && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onCancel,
          className: "rounded-lg border-2 border-neutral-900 bg-white px-6 py-3 font-['Satoshi'] font-medium text-neutral-900",
          children: "Cancel"
        }
      )
    ] })
  ] });
}
function meta$5({}) {
  return [{
    title: "New Blog Post – Maverick"
  }, {
    name: "description",
    content: "Create a new blog post"
  }];
}
const _new$1 = UNSAFE_withComponentProps(function NewBlogPost() {
  const navigate = useNavigate();
  const {
    isAuthorized,
    isPending
  } = useOpsGuard();
  const handleSubmit = async (data) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
      const response = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create post");
      }
      const result = await response.json();
      toast.success("Post created successfully");
      navigate(`/blog/${result.post.id}`);
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post");
    }
  };
  if (isPending) {
    return /* @__PURE__ */ jsx("div", {
      className: "flex min-h-screen items-center justify-center",
      children: /* @__PURE__ */ jsxs("div", {
        className: "text-center",
        children: [/* @__PURE__ */ jsx("div", {
          className: "mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-500 border-r-transparent"
        }), /* @__PURE__ */ jsx("p", {
          className: "font-['Satoshi'] text-sm text-gray-600",
          children: "Loading..."
        })]
      })
    });
  }
  if (!isAuthorized) {
    return null;
  }
  return /* @__PURE__ */ jsx(DashboardLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "mx-auto max-w-4xl",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "mb-8",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "font-['Clash_Display'] text-4xl font-bold text-neutral-900",
          children: "New Blog Post"
        }), /* @__PURE__ */ jsx("p", {
          className: "mt-2 font-['Satoshi'] text-sm text-gray-600",
          children: "Create a new blog post"
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "rounded-lg border-2 border-neutral-900 bg-white p-8 overflow-hidden",
        children: /* @__PURE__ */ jsx(BlogForm, {
          onSubmit: handleSubmit,
          onCancel: () => navigate("/")
        })
      })]
    })
  });
});
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _new$1,
  meta: meta$5
}, Symbol.toStringTag, { value: "Module" }));
function meta$4({}) {
  return [{
    title: "Edit Blog Post – Maverick"
  }, {
    name: "description",
    content: "Edit blog post"
  }];
}
const $id$1 = UNSAFE_withComponentProps(function EditBlogPost() {
  const navigate = useNavigate();
  const {
    id
  } = useParams();
  const {
    isAuthorized,
    isPending
  } = useOpsGuard();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (isAuthorized && id) {
      loadPost();
    }
  }, [isAuthorized, id]);
  const loadPost = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
      const response = await fetch(`/api/blog/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to load post");
      }
      const data = await response.json();
      setPost(data.post);
    } catch (error) {
      console.error("Error loading post:", error);
      toast.error("Failed to load post");
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (data) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
      const response = await fetch(`/api/blog/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update post");
      }
      toast.success("Post updated successfully");
      navigate("/");
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error(error.message || "Failed to update post");
    }
  };
  if (isPending || loading) {
    return /* @__PURE__ */ jsx("div", {
      className: "flex min-h-screen items-center justify-center",
      children: /* @__PURE__ */ jsxs("div", {
        className: "text-center",
        children: [/* @__PURE__ */ jsx("div", {
          className: "mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-500 border-r-transparent"
        }), /* @__PURE__ */ jsx("p", {
          className: "font-['Satoshi'] text-sm text-gray-600",
          children: "Loading..."
        })]
      })
    });
  }
  if (!isAuthorized) {
    return null;
  }
  if (!post) {
    return /* @__PURE__ */ jsx(DashboardLayout, {
      children: /* @__PURE__ */ jsx("div", {
        className: "mx-auto max-w-4xl",
        children: /* @__PURE__ */ jsx("p", {
          className: "font-['Satoshi'] text-gray-600",
          children: "Post not found"
        })
      })
    });
  }
  return /* @__PURE__ */ jsx(DashboardLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "mx-auto max-w-4xl",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "mb-8",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "font-['Clash_Display'] text-4xl font-bold text-neutral-900",
          children: "Edit Blog Post"
        }), /* @__PURE__ */ jsx("p", {
          className: "mt-2 font-['Satoshi'] text-sm text-gray-600",
          children: post.title
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "mb-4 rounded-lg border-2 border-neutral-900 bg-white p-4 overflow-hidden",
        children: /* @__PURE__ */ jsxs("div", {
          className: "grid grid-cols-2 gap-4 font-['Satoshi'] text-sm",
          children: [/* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("span", {
              className: "text-gray-600",
              children: "Reading Time:"
            }), " ", /* @__PURE__ */ jsxs("span", {
              className: "font-medium",
              children: [post.reading_time, " min"]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("span", {
              className: "text-gray-600",
              children: "Views:"
            }), " ", /* @__PURE__ */ jsx("span", {
              className: "font-medium",
              children: post.view_count
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("span", {
              className: "text-gray-600",
              children: "Created:"
            }), " ", /* @__PURE__ */ jsx("span", {
              className: "font-medium",
              children: new Date(post.created_at).toLocaleDateString()
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("span", {
              className: "text-gray-600",
              children: "Updated:"
            }), " ", /* @__PURE__ */ jsx("span", {
              className: "font-medium",
              children: new Date(post.updated_at).toLocaleDateString()
            })]
          })]
        })
      }), /* @__PURE__ */ jsx("div", {
        className: "rounded-lg border-2 border-neutral-900 bg-white p-8 overflow-hidden",
        children: /* @__PURE__ */ jsx(BlogForm, {
          initialData: {
            id: post.id,
            title: post.title,
            content: post.content,
            excerpt: post.excerpt,
            featuredImage: post.featured_image,
            status: post.status,
            seo: {
              metaTitle: post.seo_meta_title,
              metaDescription: post.seo_meta_description,
              keywords: post.seo_keywords,
              ogImage: post.seo_og_image
            },
            categories: post.categories,
            tags: post.tags
          },
          onSubmit: handleSubmit,
          onCancel: () => navigate("/")
        })
      })]
    })
  });
});
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: $id$1,
  meta: meta$4
}, Symbol.toStringTag, { value: "Module" }));
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
const db = drizzle({ client: pool });
const db_server = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: db
}, Symbol.toStringTag, { value: "Module" }));
const JWKS_URL = process.env.JWKS_URL || process.env.VITE_AUTH_URL ? `${process.env.VITE_AUTH_URL || "http://localhost:3000"}/api/auth/jwks` : "http://localhost:3000/api/auth/jwks";
let jwks = null;
function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(JWKS_URL));
  }
  return jwks;
}
async function verifyToken(token) {
  try {
    const jwksSet = getJWKS();
    const { payload } = await jwtVerify(token, jwksSet, {
      algorithms: ["RS256", "ES256", "EdDSA"]
      // Common algorithms used by Better Auth
    });
    const userId = payload.sub || payload.userId;
    if (!userId || typeof userId !== "string") {
      return null;
    }
    return userId;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("JWT verification failed:", error);
    }
    return null;
  }
}
async function loader$9({
  request
}) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return Response.json({
      error: "Not authenticated"
    }, {
      status: 401
    });
  }
  const token = authHeader.substring(7);
  try {
    const userId = await verifyToken(token);
    if (!userId) {
      return Response.json({
        error: "Invalid or expired token"
      }, {
        status: 401
      });
    }
    const result = await db.execute(sql`SELECT role FROM "user" WHERE id = ${userId} LIMIT 1`);
    if (result.rows.length === 0) {
      return Response.json({
        error: "User not found"
      }, {
        status: 404
      });
    }
    const role = result.rows[0].role;
    if (role !== "ops" && role !== "admin") {
      return Response.json({
        error: "Forbidden - Ops or Admin access required"
      }, {
        status: 403
      });
    }
    return Response.json({
      role
    });
  } catch (error) {
    console.error("Error checking role:", error);
    return Response.json({
      error: "Invalid token"
    }, {
      status: 401
    });
  }
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$9
}, Symbol.toStringTag, { value: "Module" }));
async function getUserIdFromToken(token) {
  return verifyToken(token);
}
async function getUserInfo(userId) {
  try {
    const result = await db.execute(
      sql`SELECT id, name, email FROM "user" WHERE id = ${userId} LIMIT 1`
    );
    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email
    };
  } catch (error) {
    console.error("Error getting user info:", error);
    return null;
  }
}
async function getUserFromRequest(request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const userId = await getUserIdFromToken(token);
    if (userId) {
      return getUserInfo(userId);
    }
  }
  const frontendUrl = process.env.VITE_AUTH_URL || "https://studojo.pro";
  const cookies = request.headers.get("Cookie");
  if (cookies) {
    cookies.match(/(?:^|;\s*)(?:better-auth\.session_token|session_token|better-auth\.session)=([^;]+)/i);
    try {
      const origin = request.headers.get("Origin") || `https://${new URL(frontendUrl).hostname}`;
      const response = await fetch(`${frontendUrl}/api/auth/share-token`, {
        method: "GET",
        headers: {
          "Cookie": cookies,
          "Content-Type": "application/json",
          "User-Agent": request.headers.get("User-Agent") || "Maverick/1.0",
          "Origin": origin,
          "Referer": request.headers.get("Referer") || `${origin}/`
        },
        // Important: don't follow redirects
        redirect: "manual"
      });
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          const userId = await getUserIdFromToken(data.token);
          if (userId) {
            return getUserInfo(userId);
          }
        }
      } else {
        console.debug(`[auth-helper] Failed to get token from frontend: ${response.status} ${response.statusText}`);
        try {
          const text = await response.text();
          console.debug(`[auth-helper] Response: ${text.substring(0, 200)}`);
        } catch (e) {
        }
      }
    } catch (error) {
      console.debug(`[auth-helper] Failed to get token from frontend:`, error);
    }
  } else {
    console.debug("[auth-helper] No cookies found in request");
  }
  return null;
}
const authHelper_server = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getUserFromRequest,
  getUserIdFromToken,
  getUserInfo
}, Symbol.toStringTag, { value: "Module" }));
const accountName$1 = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
const accountKey$1 = process.env.AZURE_STORAGE_ACCOUNT_KEY || "";
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "blog-images";
const useLocalStack$1 = process.env.USE_LOCALSTACK === "true";
const localStackEndpoint$1 = process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566";
let blobServiceClient = null;
function getBlobServiceClient() {
  if (blobServiceClient) {
    return blobServiceClient;
  }
  if (useLocalStack$1) {
    const connectionString = `DefaultEndpointsProtocol=http;AccountName=${accountName$1};AccountKey=${accountKey$1};BlobEndpoint=${localStackEndpoint$1}/${accountName$1};`;
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  } else {
    if (!accountName$1 || !accountKey$1) {
      throw new Error("AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY are required");
    }
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName$1, accountKey$1);
    const blobServiceUrl = `https://${accountName$1}.blob.core.windows.net`;
    blobServiceClient = new BlobServiceClient(blobServiceUrl, sharedKeyCredential);
  }
  return blobServiceClient;
}
async function uploadBlogImage(file, filename) {
  const client = getBlobServiceClient();
  const containerClient = client.getContainerClient(containerName);
  await containerClient.createIfNotExists({
    access: "private"
  });
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const blobName = `blog-images/${timestamp}-${sanitizedFilename}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    await blockBlobClient.uploadData(Buffer.from(arrayBuffer), {
      blobHTTPHeaders: {
        blobContentType: file.type || "image/jpeg"
      }
    });
  } else {
    await blockBlobClient.uploadData(file, {
      blobHTTPHeaders: {
        blobContentType: "image/jpeg"
      }
    });
  }
  return `/api/images/${blobName}`;
}
const MAGIC_BYTES = {
  "image/jpeg": [[255, 216, 255]],
  "image/png": [[137, 80, 78, 71, 13, 10, 26, 10]],
  "image/webp": [[82, 73, 70, 70], [87, 69, 66, 80]]
  // RIFF...WEBP
};
async function validateFileContent(file, expectedMimeType) {
  const signatures = MAGIC_BYTES[expectedMimeType];
  if (!signatures) {
    return false;
  }
  const arrayBuffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  for (const signature of signatures) {
    let matches = true;
    for (let i = 0; i < signature.length; i++) {
      if (bytes[i] !== signature[i]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return true;
    }
  }
  return false;
}
function sanitizeFilename(filename) {
  const basename2 = filename.split("/").pop() || filename.split("\\").pop() || filename;
  const sanitized = basename2.replace(/[^a-zA-Z0-9._-]/g, "_");
  const cleaned = sanitized.replace(/^\.+/, "").trim();
  if (!cleaned) {
    return "image";
  }
  const maxLength = 255;
  if (cleaned.length > maxLength) {
    const ext = cleaned.substring(cleaned.lastIndexOf("."));
    const name = cleaned.substring(0, maxLength - ext.length);
    return name + ext;
  }
  return cleaned;
}
function generateUniqueFilename(originalFilename) {
  const sanitized = sanitizeFilename(originalFilename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const lastDot = sanitized.lastIndexOf(".");
  if (lastDot > 0) {
    const name = sanitized.substring(0, lastDot);
    const ext = sanitized.substring(lastDot);
    return `${timestamp}-${random}-${name}${ext}`;
  }
  return `${timestamp}-${random}-${sanitized}`;
}
async function action$6({
  request
}) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const result = await db.execute(sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`);
  if (result.rows.length === 0) {
    return Response.json({
      error: "User not found"
    }, {
      status: 404
    });
  }
  const role = result.rows[0].role;
  if (role !== "ops" && role !== "admin") {
    return Response.json({
      error: "Forbidden - Ops or Admin access required"
    }, {
      status: 403
    });
  }
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) {
    return Response.json({
      error: "No file provided"
    }, {
      status: 400
    });
  }
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const mimeType = file.type || "image/jpeg";
  if (!allowedTypes.includes(mimeType)) {
    return Response.json({
      error: "Invalid file type. Only JPEG, PNG, and WebP are allowed."
    }, {
      status: 400
    });
  }
  const isValidContent = await validateFileContent(file, mimeType);
  if (!isValidContent) {
    return Response.json({
      error: "File content does not match declared file type. Possible file type spoofing."
    }, {
      status: 400
    });
  }
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return Response.json({
      error: "File size exceeds 5MB limit."
    }, {
      status: 400
    });
  }
  try {
    const uniqueFilename = generateUniqueFilename(file.name);
    const url = await uploadBlogImage(file, uniqueFilename);
    return Response.json({
      url,
      filename: uniqueFilename
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return Response.json({
      error: "Failed to upload image",
      details: error.message
    }, {
      status: 500
    });
  }
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6
}, Symbol.toStringTag, { value: "Module" }));
async function loader$8({
  request,
  params
}) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const roleResult = await db.execute(sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`);
  if (roleResult.rows.length === 0) {
    return Response.json({
      error: "User not found"
    }, {
      status: 404
    });
  }
  const role = roleResult.rows[0].role;
  if (role !== "ops" && role !== "admin") {
    return Response.json({
      error: "Forbidden - Ops or Admin access required"
    }, {
      status: 403
    });
  }
  const {
    id
  } = params;
  const result = await db.execute(sql`SELECT * FROM blog_posts WHERE id = ${id} LIMIT 1`);
  if (result.rows.length === 0) {
    return Response.json({
      error: "Post not found"
    }, {
      status: 404
    });
  }
  return Response.json({
    post: result.rows[0]
  });
}
async function action$5({
  request,
  params
}) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const roleResult = await db.execute(sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`);
  if (roleResult.rows.length === 0) {
    return Response.json({
      error: "User not found"
    }, {
      status: 404
    });
  }
  const role = roleResult.rows[0].role;
  if (role !== "ops" && role !== "admin") {
    return Response.json({
      error: "Forbidden - Ops or Admin access required"
    }, {
      status: 403
    });
  }
  const {
    id
  } = params;
  const method = request.method;
  if (method === "PUT") {
    const existingResult = await db.execute(sql`SELECT * FROM blog_posts WHERE id = ${id} LIMIT 1`);
    if (existingResult.rows.length === 0) {
      return Response.json({
        error: "Post not found"
      }, {
        status: 404
      });
    }
    const existing = existingResult.rows[0];
    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      featuredImage,
      status,
      seo,
      categories,
      tags
    } = body;
    const updates = [];
    if (title !== void 0) {
      const escapedTitle = title.replace(/'/g, "''");
      updates.push(`title = '${escapedTitle}'`);
      if (title !== existing.title) {
        let slug = slugify(title, {
          lower: true,
          strict: true
        });
        let counter = 1;
        const originalSlug = slug;
        while (true) {
          const checkResult = await db.execute(sql`SELECT id FROM blog_posts WHERE slug = ${slug} AND id != ${id} LIMIT 1`);
          if (checkResult.rows.length === 0) {
            break;
          }
          slug = `${originalSlug}-${counter}`;
          counter++;
        }
        updates.push(`slug = '${slug}'`);
      }
    }
    if (content !== void 0) {
      const escapedContent = content.replace(/'/g, "''");
      updates.push(`content = '${escapedContent}'`);
      if (content !== existing.content) {
        const readingTimeResult = readingTime(content);
        const readingTimeMinutes = Math.ceil(readingTimeResult.minutes);
        updates.push(`reading_time = ${readingTimeMinutes}`);
      }
    }
    if (excerpt !== void 0) {
      const escapedExcerpt = excerpt.replace(/'/g, "''");
      updates.push(`excerpt = '${escapedExcerpt}'`);
    }
    if (featuredImage !== void 0) {
      const escapedImage = featuredImage ? featuredImage.replace(/'/g, "''") : "";
      updates.push(`featured_image = ${featuredImage ? `'${escapedImage}'` : "NULL"}`);
    }
    if (status !== void 0) {
      updates.push(`status = '${status}'`);
      if (status === "published" && existing.status !== "published") {
        updates.push(`published_at = NOW()`);
      }
    }
    if (seo !== void 0) {
      if (seo.metaTitle !== void 0) {
        const escaped = seo.metaTitle.replace(/'/g, "''");
        updates.push(`seo_meta_title = ${seo.metaTitle ? `'${escaped}'` : "NULL"}`);
      }
      if (seo.metaDescription !== void 0) {
        const escaped = seo.metaDescription.replace(/'/g, "''");
        updates.push(`seo_meta_description = ${seo.metaDescription ? `'${escaped}'` : "NULL"}`);
      }
      if (seo.keywords !== void 0) {
        const keywordsJson = JSON.stringify(seo.keywords).replace(/'/g, "''");
        updates.push(`seo_keywords = '${keywordsJson}'::jsonb`);
      }
      if (seo.ogImage !== void 0) {
        const escaped = seo.ogImage ? seo.ogImage.replace(/'/g, "''") : "";
        updates.push(`seo_og_image = ${seo.ogImage ? `'${escaped}'` : "NULL"}`);
      }
    }
    if (categories !== void 0) {
      const categoriesJson = JSON.stringify(categories).replace(/'/g, "''");
      updates.push(`categories = '${categoriesJson}'::jsonb`);
    }
    if (tags !== void 0) {
      const tagsJson = JSON.stringify(tags).replace(/'/g, "''");
      updates.push(`tags = '${tagsJson}'::jsonb`);
    }
    updates.push(`updated_at = NOW()`);
    if (updates.length === 0) {
      return Response.json({
        error: "No fields to update"
      }, {
        status: 400
      });
    }
    const updateClause = updates.join(", ");
    const result = await db.execute(sql.raw(`UPDATE blog_posts SET ${updateClause} WHERE id = '${id}' RETURNING *`));
    if (result.rows.length === 0) {
      return Response.json({
        error: "Post not found"
      }, {
        status: 404
      });
    }
    return Response.json({
      success: true,
      post: result.rows[0]
    });
  } else if (method === "DELETE") {
    const result = await db.execute(sql`DELETE FROM blog_posts WHERE id = ${id} RETURNING id`);
    if (result.rows.length === 0) {
      return Response.json({
        error: "Post not found"
      }, {
        status: 404
      });
    }
    return Response.json({
      success: true
    });
  }
  return Response.json({
    error: "Method not allowed"
  }, {
    status: 405
  });
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
async function loader$7({
  request
}) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const result = await db.execute(sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`);
  if (result.rows.length === 0) {
    return Response.json({
      error: "User not found"
    }, {
      status: 404
    });
  }
  const role = result.rows[0].role;
  if (role !== "ops" && role !== "admin") {
    return Response.json({
      error: "Forbidden - Ops or Admin access required"
    }, {
      status: 403
    });
  }
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const category = url.searchParams.get("category");
  const offset = (page - 1) * limit;
  let query = sql`SELECT * FROM blog_posts WHERE 1=1`;
  if (status) {
    query = sql`${query} AND status = ${status}`;
  }
  if (search) {
    query = sql`${query} AND (title ILIKE ${`%${search}%`} OR excerpt ILIKE ${`%${search}%`})`;
  }
  if (category) {
    query = sql`${query} AND ${category} = ANY(categories)`;
  }
  query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
  const posts = await db.execute(query);
  const countResult = await db.execute(sql`SELECT COUNT(*) as total FROM blog_posts WHERE 1=1 ${status ? sql`AND status = ${status}` : sql``} ${search ? sql`AND (title ILIKE ${`%${search}%`} OR excerpt ILIKE ${`%${search}%`})` : sql``} ${category ? sql`AND ${category} = ANY(categories)` : sql``}`);
  const total = parseInt(countResult.rows[0].total, 10);
  return Response.json({
    posts: posts.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  });
}
async function action$4({
  request
}) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const roleResult = await db.execute(sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`);
  if (roleResult.rows.length === 0) {
    return Response.json({
      error: "User not found"
    }, {
      status: 404
    });
  }
  const role = roleResult.rows[0].role;
  if (role !== "ops" && role !== "admin") {
    return Response.json({
      error: "Forbidden - Ops or Admin access required"
    }, {
      status: 403
    });
  }
  const body = await request.json();
  const {
    title,
    content,
    excerpt,
    featuredImage,
    status,
    seo,
    categories,
    tags
  } = body;
  if (!title || !content || !excerpt) {
    return Response.json({
      error: "Title, content, and excerpt are required"
    }, {
      status: 400
    });
  }
  let slug = slugify(title, {
    lower: true,
    strict: true
  });
  let counter = 1;
  let originalSlug = slug;
  while (true) {
    const existing = await db.execute(sql`SELECT id FROM blog_posts WHERE slug = ${slug} LIMIT 1`);
    if (existing.rows.length === 0) {
      break;
    }
    slug = `${originalSlug}-${counter}`;
    counter++;
  }
  const readingTimeResult = readingTime(content);
  const readingTimeMinutes = Math.ceil(readingTimeResult.minutes);
  const publishedAt = status === "published" ? /* @__PURE__ */ new Date() : null;
  const result = await db.execute(sql`
      INSERT INTO blog_posts (
        title, slug, content, excerpt, featured_image,
        author_user_id, author_name, author_email,
        status, published_at,
        seo_meta_title, seo_meta_description, seo_keywords, seo_og_image,
        categories, tags, reading_time
      ) VALUES (
        ${title}, ${slug}, ${content}, ${excerpt}, ${featuredImage || null},
        ${user.id}, ${user.name}, ${user.email},
        ${status}, ${publishedAt},
        ${seo?.metaTitle || null}, ${seo?.metaDescription || null},
        ${seo?.keywords ? sql.raw(`'${JSON.stringify(seo.keywords).replace(/'/g, "''")}'::jsonb`) : sql.raw("NULL")},
        ${seo?.ogImage || null},
        ${categories ? sql.raw(`'${JSON.stringify(categories).replace(/'/g, "''")}'::jsonb`) : sql.raw("NULL")},
        ${tags ? sql.raw(`'${JSON.stringify(tags).replace(/'/g, "''")}'::jsonb`) : sql.raw("NULL")},
        ${readingTimeMinutes}
      ) RETURNING *
    `);
  const post = result.rows[0];
  return Response.json({
    success: true,
    post
  });
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || "";
const useLocalStack = process.env.USE_LOCALSTACK === "true";
const localStackEndpoint = process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566";
async function loader$6({
  params
}) {
  let path = params["*"];
  if (!path) {
    return Response.json({
      error: "Image path required"
    }, {
      status: 400
    });
  }
  try {
    path = decodeURIComponent(path);
  } catch (e) {
    console.warn("Failed to decode image path:", path);
  }
  try {
    let blobServiceClient2;
    if (useLocalStack) {
      const connectionString = `DefaultEndpointsProtocol=http;AccountName=${accountName};AccountKey=${accountKey};BlobEndpoint=${localStackEndpoint}/${accountName};`;
      blobServiceClient2 = BlobServiceClient.fromConnectionString(connectionString);
    } else {
      if (!accountName || !accountKey) {
        return Response.json({
          error: "Blob storage not configured"
        }, {
          status: 500
        });
      }
      const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
      const blobServiceUrl = `https://${accountName}.blob.core.windows.net`;
      blobServiceClient2 = new BlobServiceClient(blobServiceUrl, sharedKeyCredential);
    }
    const parts = path.split("/");
    let containerName2;
    let blobName;
    if (parts[0] === "blog-images" && parts.length > 1) {
      containerName2 = "blog-images";
      blobName = parts.slice(1).join("/");
    } else {
      containerName2 = "blog-images";
      blobName = parts.join("/");
    }
    const containerClient = blobServiceClient2.getContainerClient(containerName2);
    const blobClient = containerClient.getBlockBlobClient(blobName);
    const exists = await blobClient.exists();
    if (!exists) {
      return Response.json({
        error: "Image not found"
      }, {
        status: 404
      });
    }
    const downloadResponse = await blobClient.download();
    if (!downloadResponse.readableStreamBody) {
      return Response.json({
        error: "Failed to download image"
      }, {
        status: 500
      });
    }
    const chunks = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const contentType = downloadResponse.contentType || (blobName.endsWith(".png") ? "image/png" : blobName.endsWith(".webp") ? "image/webp" : "image/jpeg");
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return Response.json({
      error: "Failed to serve image",
      details: error.message
    }, {
      status: 500
    });
  }
}
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
function meta$3({}) {
  return [{
    title: "Internships – Maverick"
  }, {
    name: "description",
    content: "Manage internship listings"
  }];
}
const index = UNSAFE_withComponentProps(function InternshipsList() {
  const {
    isAuthorized,
    isPending
  } = useOpsGuard();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
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
        limit: "10"
      });
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (search) {
        params.append("search", search);
      }
      const response = await fetch(`/api/internships?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this internship?")) {
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
          Authorization: `Bearer ${token}`
        }
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
  if (isPending) {
    return /* @__PURE__ */ jsx("div", {
      className: "flex min-h-screen items-center justify-center",
      children: /* @__PURE__ */ jsx("p", {
        className: "font-['Satoshi'] text-gray-600",
        children: "Loading..."
      })
    });
  }
  if (!isAuthorized) {
    return null;
  }
  return /* @__PURE__ */ jsx(DashboardLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "mx-auto max-w-7xl",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "mb-8 flex items-center justify-between",
        children: [/* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("h1", {
            className: "mb-2 font-['Clash_Display'] text-4xl font-bold text-neutral-900",
            children: "Internships"
          }), /* @__PURE__ */ jsx("p", {
            className: "font-['Satoshi'] text-gray-600",
            children: "Manage internship listings"
          })]
        }), /* @__PURE__ */ jsx(Link, {
          to: "/internships/new",
          className: "rounded-lg border-2 border-neutral-900 bg-violet-600 px-6 py-2 font-['Satoshi'] font-medium text-white transition-colors hover:bg-violet-700",
          children: "Create New"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "mb-6 flex gap-4",
        children: [/* @__PURE__ */ jsxs("select", {
          value: statusFilter,
          onChange: (e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          },
          className: "rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi']",
          children: [/* @__PURE__ */ jsx("option", {
            value: "all",
            children: "All Status"
          }), /* @__PURE__ */ jsx("option", {
            value: "draft",
            children: "Draft"
          }), /* @__PURE__ */ jsx("option", {
            value: "published",
            children: "Published"
          }), /* @__PURE__ */ jsx("option", {
            value: "closed",
            children: "Closed"
          })]
        }), /* @__PURE__ */ jsx("input", {
          type: "text",
          value: search,
          onChange: (e) => setSearch(e.target.value),
          placeholder: "Search internships...",
          className: "flex-1 rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi']",
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              setPage(1);
              loadInternships();
            }
          }
        })]
      }), loading ? /* @__PURE__ */ jsx("p", {
        className: "font-['Satoshi'] text-gray-600",
        children: "Loading internships..."
      }) : internships.length === 0 ? /* @__PURE__ */ jsx("p", {
        className: "font-['Satoshi'] text-gray-600",
        children: "No internships found."
      }) : /* @__PURE__ */ jsxs(Fragment, {
        children: [/* @__PURE__ */ jsx("div", {
          className: "overflow-x-auto",
          children: /* @__PURE__ */ jsxs("table", {
            className: "w-full border-2 border-neutral-900",
            children: [/* @__PURE__ */ jsx("thead", {
              children: /* @__PURE__ */ jsxs("tr", {
                className: "bg-neutral-100",
                children: [/* @__PURE__ */ jsx("th", {
                  className: "border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold",
                  children: "Title"
                }), /* @__PURE__ */ jsx("th", {
                  className: "border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold",
                  children: "Company"
                }), /* @__PURE__ */ jsx("th", {
                  className: "border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold",
                  children: "Status"
                }), /* @__PURE__ */ jsx("th", {
                  className: "border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold",
                  children: "Views"
                }), /* @__PURE__ */ jsx("th", {
                  className: "border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold",
                  children: "Clicks"
                }), /* @__PURE__ */ jsx("th", {
                  className: "border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold",
                  children: "Applications"
                }), /* @__PURE__ */ jsx("th", {
                  className: "border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold",
                  children: "Actions"
                })]
              })
            }), /* @__PURE__ */ jsx("tbody", {
              children: internships.map((internship) => /* @__PURE__ */ jsxs("tr", {
                children: [/* @__PURE__ */ jsx("td", {
                  className: "border-2 border-neutral-900 px-4 py-2 font-['Satoshi']",
                  children: /* @__PURE__ */ jsx(Link, {
                    to: `/internships/${internship.id}`,
                    className: "text-violet-600 hover:underline",
                    children: internship.title
                  })
                }), /* @__PURE__ */ jsx("td", {
                  className: "border-2 border-neutral-900 px-4 py-2 font-['Satoshi']",
                  children: internship.company_name
                }), /* @__PURE__ */ jsx("td", {
                  className: "border-2 border-neutral-900 px-4 py-2 font-['Satoshi']",
                  children: /* @__PURE__ */ jsx("span", {
                    className: `inline-block rounded-full px-3 py-1 text-xs font-medium ${internship.status === "published" ? "bg-green-100 text-green-700" : internship.status === "draft" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`,
                    children: internship.status
                  })
                }), /* @__PURE__ */ jsx("td", {
                  className: "border-2 border-neutral-900 px-4 py-2 font-['Satoshi']",
                  children: internship.view_count
                }), /* @__PURE__ */ jsx("td", {
                  className: "border-2 border-neutral-900 px-4 py-2 font-['Satoshi']",
                  children: internship.click_count
                }), /* @__PURE__ */ jsx("td", {
                  className: "border-2 border-neutral-900 px-4 py-2 font-['Satoshi']",
                  children: /* @__PURE__ */ jsx(Link, {
                    to: `/internships/${internship.id}/applications`,
                    className: "text-violet-600 hover:underline",
                    children: internship.application_count
                  })
                }), /* @__PURE__ */ jsx("td", {
                  className: "border-2 border-neutral-900 px-4 py-2 font-['Satoshi']",
                  children: /* @__PURE__ */ jsxs("div", {
                    className: "flex gap-2",
                    children: [/* @__PURE__ */ jsx(Link, {
                      to: `/internships/${internship.id}`,
                      className: "text-violet-600 hover:underline",
                      children: "Edit"
                    }), /* @__PURE__ */ jsx("button", {
                      onClick: () => handleDelete(internship.id),
                      className: "text-red-600 hover:underline",
                      children: "Delete"
                    })]
                  })
                })]
              }, internship.id))
            })]
          })
        }), totalPages > 1 && /* @__PURE__ */ jsxs("div", {
          className: "mt-6 flex justify-center gap-2",
          children: [/* @__PURE__ */ jsx("button", {
            onClick: () => setPage(Math.max(1, page - 1)),
            disabled: page === 1,
            className: "rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] font-medium disabled:opacity-50",
            children: "Previous"
          }), /* @__PURE__ */ jsxs("span", {
            className: "flex items-center px-4 font-['Satoshi']",
            children: ["Page ", page, " of ", totalPages]
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => setPage(Math.min(totalPages, page + 1)),
            disabled: page === totalPages,
            className: "rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] font-medium disabled:opacity-50",
            children: "Next"
          })]
        })]
      })]
    })
  });
});
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index,
  meta: meta$3
}, Symbol.toStringTag, { value: "Module" }));
function InternshipForm({ initialData, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [companyName, setCompanyName] = useState(initialData?.company_name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [requirements, setRequirements] = useState(initialData?.requirements || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [duration, setDuration] = useState(initialData?.duration || "");
  const [stipend, setStipend] = useState(initialData?.stipend || "");
  const [applicationDeadline, setApplicationDeadline] = useState(
    initialData?.application_deadline ? new Date(initialData.application_deadline).toISOString().split("T")[0] : ""
  );
  const [status, setStatus] = useState(
    initialData?.status || "draft"
  );
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !companyName.trim() || !description.trim() || !requirements.trim()) {
      alert("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        company_name: companyName.trim(),
        description,
        requirements,
        location: location.trim() || void 0,
        duration: duration.trim() || void 0,
        stipend: stipend.trim() || void 0,
        application_deadline: applicationDeadline || void 0,
        status
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "mb-2 block font-['Satoshi'] font-medium text-neutral-900", children: "Role Title *" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: title,
          onChange: (e) => setTitle(e.target.value),
          required: true,
          className: "w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500",
          placeholder: "e.g., Software Engineering Intern"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "mb-2 block font-['Satoshi'] font-medium text-neutral-900", children: "Company Name *" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: companyName,
          onChange: (e) => setCompanyName(e.target.value),
          required: true,
          className: "w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500",
          placeholder: "e.g., Tech Corp"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "mb-2 block font-['Satoshi'] font-medium text-neutral-900", children: "Description *" }),
      /* @__PURE__ */ jsx(
        TipTapEditor,
        {
          content: description,
          onChange: setDescription,
          placeholder: "Describe the internship role, responsibilities, and what the intern will learn..."
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "mb-2 block font-['Satoshi'] font-medium text-neutral-900", children: "Requirements *" }),
      /* @__PURE__ */ jsx(
        TipTapEditor,
        {
          content: requirements,
          onChange: setRequirements,
          placeholder: "List the skills, qualifications, and requirements for this internship..."
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "mb-2 block font-['Satoshi'] font-medium text-neutral-900", children: "Location" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: location,
            onChange: (e) => setLocation(e.target.value),
            className: "w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500",
            placeholder: "e.g., Remote, Mumbai, India"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "mb-2 block font-['Satoshi'] font-medium text-neutral-900", children: "Duration" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: duration,
            onChange: (e) => setDuration(e.target.value),
            className: "w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500",
            placeholder: "e.g., 3 months, 6 months"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "mb-2 block font-['Satoshi'] font-medium text-neutral-900", children: "Stipend" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: stipend,
            onChange: (e) => setStipend(e.target.value),
            className: "w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500",
            placeholder: "e.g., ₹20,000/month, Unpaid"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "mb-2 block font-['Satoshi'] font-medium text-neutral-900", children: "Application Deadline" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            value: applicationDeadline,
            onChange: (e) => setApplicationDeadline(e.target.value),
            className: "w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "mb-2 block font-['Satoshi'] font-medium text-neutral-900", children: "Status *" }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          value: status,
          onChange: (e) => setStatus(e.target.value),
          required: true,
          className: "w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500",
          children: [
            /* @__PURE__ */ jsx("option", { value: "draft", children: "Draft" }),
            /* @__PURE__ */ jsx("option", { value: "published", children: "Published" }),
            /* @__PURE__ */ jsx("option", { value: "closed", children: "Closed" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
      onCancel && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onCancel,
          className: "flex-1 rounded-lg border-2 border-neutral-900 px-6 py-3 font-['Satoshi'] font-medium text-neutral-900 transition-colors hover:bg-neutral-100",
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: loading,
          className: "flex-1 rounded-lg border-2 border-neutral-900 bg-violet-600 px-6 py-3 font-['Satoshi'] font-bold text-white transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed",
          children: loading ? "Saving..." : initialData ? "Update Internship" : "Create Internship"
        }
      )
    ] })
  ] });
}
function meta$2({}) {
  return [{
    title: "New Internship – Maverick"
  }, {
    name: "description",
    content: "Create a new internship listing"
  }];
}
const _new = UNSAFE_withComponentProps(function NewInternship() {
  const navigate = useNavigate();
  const {
    isAuthorized,
    isPending
  } = useOpsGuard();
  const handleSubmit = async (data) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
      const response = await fetch("/api/internships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create internship");
      }
      const result = await response.json();
      toast.success("Internship created successfully");
      navigate(`/internships/${result.internship.id}`);
    } catch (error) {
      console.error("Error creating internship:", error);
      toast.error(error.message || "Failed to create internship");
    }
  };
  if (isPending) {
    return /* @__PURE__ */ jsx("div", {
      className: "flex min-h-screen items-center justify-center",
      children: /* @__PURE__ */ jsxs("div", {
        className: "text-center",
        children: [/* @__PURE__ */ jsx("div", {
          className: "mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-500 border-r-transparent"
        }), /* @__PURE__ */ jsx("p", {
          className: "font-['Satoshi'] text-sm text-gray-600",
          children: "Loading..."
        })]
      })
    });
  }
  if (!isAuthorized) {
    return null;
  }
  return /* @__PURE__ */ jsx(DashboardLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "mx-auto max-w-4xl",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "mb-8",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "font-['Clash_Display'] text-4xl font-bold text-neutral-900",
          children: "New Internship"
        }), /* @__PURE__ */ jsx("p", {
          className: "mt-2 font-['Satoshi'] text-sm text-gray-600",
          children: "Create a new internship listing"
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "rounded-lg border-2 border-neutral-900 bg-white p-8 overflow-hidden",
        children: /* @__PURE__ */ jsx(InternshipForm, {
          onSubmit: handleSubmit,
          onCancel: () => navigate("/internships")
        })
      })]
    })
  });
});
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _new,
  meta: meta$2
}, Symbol.toStringTag, { value: "Module" }));
function meta$1({}) {
  return [{
    title: "Edit Internship – Maverick"
  }, {
    name: "description",
    content: "Edit internship listing"
  }];
}
async function loader$5({
  params,
  request
}) {
  const {
    id
  } = params;
  const user = await getUserFromRequest(request);
  if (user) {
    const result = await db.execute(sql`SELECT role FROM public."user" WHERE id = ${user.id} LIMIT 1`);
    if (result.rows.length > 0) {
      const role = result.rows[0].role;
      if (role !== "ops" && role !== "admin") {
        throw new Response("Forbidden - Ops or Admin access required", {
          status: 403
        });
      }
    }
  }
  const internshipResult = await db.execute(sql`SELECT * FROM public.internships WHERE id = ${id} LIMIT 1`);
  if (internshipResult.rows.length === 0) {
    throw new Response("Internship not found", {
      status: 404
    });
  }
  return {
    internship: internshipResult.rows[0]
  };
}
const $id = UNSAFE_withComponentProps(function EditInternship({
  data
}) {
  const loaderData = useLoaderData();
  const internship = loaderData?.internship || data?.internship;
  const navigate = useNavigate();
  const {
    isAuthorized,
    isPending
  } = useOpsGuard();
  const handleSubmit = async (formData) => {
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
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update internship");
      }
      toast.success("Internship updated successfully");
      navigate(`/internships/${internship.id}`);
    } catch (error) {
      console.error("Error updating internship:", error);
      toast.error(error.message || "Failed to update internship");
    }
  };
  if (isPending) {
    return /* @__PURE__ */ jsx("div", {
      className: "flex min-h-screen items-center justify-center",
      children: /* @__PURE__ */ jsxs("div", {
        className: "text-center",
        children: [/* @__PURE__ */ jsx("div", {
          className: "mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-500 border-r-transparent"
        }), /* @__PURE__ */ jsx("p", {
          className: "font-['Satoshi'] text-sm text-gray-600",
          children: "Loading..."
        })]
      })
    });
  }
  if (!isAuthorized || !internship) {
    return null;
  }
  return /* @__PURE__ */ jsx(DashboardLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "mx-auto max-w-4xl",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "mb-8",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "font-['Clash_Display'] text-4xl font-bold text-neutral-900",
          children: "Edit Internship"
        }), /* @__PURE__ */ jsxs("p", {
          className: "mt-2 font-['Satoshi'] text-sm text-gray-600",
          children: [internship.title, " at ", internship.company_name]
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "rounded-lg border-2 border-neutral-900 bg-white p-8 overflow-hidden",
        children: /* @__PURE__ */ jsx(InternshipForm, {
          initialData: internship,
          onSubmit: handleSubmit,
          onCancel: () => navigate("/internships")
        })
      }), internship.status === "published" && /* @__PURE__ */ jsxs("div", {
        className: "mt-6 rounded-lg border-2 border-neutral-900 bg-violet-50 p-4",
        children: [/* @__PURE__ */ jsx("p", {
          className: "mb-2 font-['Satoshi'] font-medium text-neutral-900",
          children: "Public URL:"
        }), /* @__PURE__ */ jsxs("a", {
          href: `${typeof window !== "undefined" ? window.location.origin.replace(":3002", ":3000") : ""}/internships/${internship.slug}`,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "font-['Satoshi'] text-violet-600 hover:underline break-all",
          children: [typeof window !== "undefined" ? window.location.origin.replace(":3002", ":3000") : "", "/internships/", internship.slug]
        })]
      })]
    })
  });
});
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: $id,
  loader: loader$5,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
function ForwardModal({
  internshipId,
  applicationIds,
  onClose,
  onSuccess
}) {
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [forwardedUrl, setForwardedUrl] = useState(null);
  const [forwardedToken, setForwardedToken] = useState(null);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
      const response = await fetch("/api/internships/applications/forward", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          application_ids: applicationIds,
          internship_id: internshipId,
          expires_at: expiresAt || void 0
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to forward applications");
      }
      const data = await response.json();
      setForwardedUrl(data.url);
      setForwardedToken(data.token);
      toast.success("Applications forwarded successfully");
    } catch (error) {
      console.error("Error forwarding applications:", error);
      toast.error(error.message || "Failed to forward applications");
    } finally {
      setLoading(false);
    }
  };
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };
  if (forwardedUrl) {
    return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-2xl rounded-lg border-2 border-neutral-900 bg-white p-6 shadow-lg", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onClose,
          className: "absolute right-4 top-4 rounded p-2 text-gray-500 hover:bg-gray-100",
          children: /* @__PURE__ */ jsx(FiX, { className: "w-5 h-5" })
        }
      ),
      /* @__PURE__ */ jsx("h2", { className: "mb-4 font-['Clash_Display'] text-2xl font-bold text-neutral-900", children: "Applications Forwarded" }),
      /* @__PURE__ */ jsxs("div", { className: "mb-4 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-2 block font-['Satoshi'] font-medium text-neutral-900", children: "Shareable URL" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: forwardedUrl,
                readOnly: true,
                className: "flex-1 rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi']"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => copyToClipboard(forwardedUrl),
                className: "rounded-lg border-2 border-neutral-900 bg-violet-600 px-4 py-2 text-white hover:bg-violet-700",
                children: /* @__PURE__ */ jsx(FiCopy, { className: "w-5 h-5" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-2 block font-['Satoshi'] font-medium text-neutral-900", children: "Token (for reference)" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: forwardedToken || "",
                readOnly: true,
                className: "flex-1 rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] font-mono text-sm"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => copyToClipboard(forwardedToken || ""),
                className: "rounded-lg border-2 border-neutral-900 bg-violet-600 px-4 py-2 text-white hover:bg-violet-700",
                children: /* @__PURE__ */ jsx(FiCopy, { className: "w-5 h-5" })
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-4", children: /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onSuccess,
          className: "flex-1 rounded-lg border-2 border-neutral-900 bg-violet-600 px-6 py-3 font-['Satoshi'] font-bold text-white transition-colors hover:bg-violet-700",
          children: "Done"
        }
      ) })
    ] }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-2xl rounded-lg border-2 border-neutral-900 bg-white p-6 shadow-lg", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onClose,
        className: "absolute right-4 top-4 rounded p-2 text-gray-500 hover:bg-gray-100",
        children: /* @__PURE__ */ jsx(FiX, { className: "w-5 h-5" })
      }
    ),
    /* @__PURE__ */ jsx("h2", { className: "mb-6 font-['Clash_Display'] text-2xl font-bold text-neutral-900", children: "Forward to Company" }),
    /* @__PURE__ */ jsxs("p", { className: "mb-4 font-['Satoshi'] text-gray-600", children: [
      "Forwarding ",
      applicationIds.length,
      " application",
      applicationIds.length !== 1 ? "s" : "",
      " to company."
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "mb-2 block font-['Satoshi'] font-medium text-neutral-900", children: "Expiration Date (optional)" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "datetime-local",
            value: expiresAt,
            onChange: (e) => setExpiresAt(e.target.value),
            className: "w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm font-['Satoshi'] text-gray-500", children: "Leave empty for no expiration" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onClose,
            className: "flex-1 rounded-lg border-2 border-neutral-900 px-6 py-3 font-['Satoshi'] font-medium text-neutral-900 transition-colors hover:bg-neutral-100",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: loading,
            className: "flex-1 rounded-lg border-2 border-neutral-900 bg-violet-600 px-6 py-3 font-['Satoshi'] font-bold text-white transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed",
            children: loading ? "Forwarding..." : "Forward Applications"
          }
        )
      ] })
    ] })
  ] }) });
}
function meta({}) {
  return [{
    title: "Applications – Maverick"
  }, {
    name: "description",
    content: "Review internship applications"
  }];
}
async function loader$4({
  params,
  request
}) {
  const {
    id
  } = params;
  const {
    getUserFromRequest: getUserFromRequest2
  } = await Promise.resolve().then(() => authHelper_server);
  const db2 = (await Promise.resolve().then(() => db_server)).default;
  const {
    sql: sql2
  } = await import("drizzle-orm");
  const user = await getUserFromRequest2(request);
  if (!user) {
    throw new Response("Unauthorized", {
      status: 401
    });
  }
  const result = await db2.execute(sql2`SELECT role FROM public."user" WHERE id = ${user.id} LIMIT 1`);
  if (result.rows.length === 0) {
    throw new Response("User not found", {
      status: 404
    });
  }
  const role = result.rows[0].role;
  if (role !== "ops" && role !== "admin") {
    throw new Response("Forbidden - Ops or Admin access required", {
      status: 403
    });
  }
  const internshipResult = await db2.execute(sql2`SELECT * FROM public.internships WHERE id = ${id} LIMIT 1`);
  if (internshipResult.rows.length === 0) {
    throw new Response("Internship not found", {
      status: 404
    });
  }
  return {
    internship: internshipResult.rows[0]
  };
}
const applications = UNSAFE_withComponentProps(function ApplicationsList({
  data
}) {
  const loaderData = useLoaderData();
  const internship = loaderData?.internship || data?.internship;
  const navigate = useNavigate();
  const {
    isAuthorized,
    isPending
  } = useOpsGuard();
  const [applications2, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [showForwardModal, setShowForwardModal] = useState(false);
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
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to load applications");
      }
      const data2 = await response.json();
      setApplications(data2.applications || []);
    } catch (error) {
      console.error("Error loading applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };
  const handleStatusUpdate = async (applicationId, newStatus) => {
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
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus
        })
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
  const handleForward = () => {
    if (selectedApplications.length === 0) {
      toast.error("Please select at least one application to forward");
      return;
    }
    setShowForwardModal(true);
  };
  const handleDownloadResume = async (applicationId, resumeName) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
      const response = await fetch(`/api/internships/applications/${applicationId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to download resume");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeName || "resume"}.json`;
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
    return /* @__PURE__ */ jsx("div", {
      className: "flex min-h-screen items-center justify-center",
      children: /* @__PURE__ */ jsx("p", {
        className: "font-['Satoshi'] text-gray-600",
        children: "Loading..."
      })
    });
  }
  if (!isAuthorized || !internship) {
    return null;
  }
  return /* @__PURE__ */ jsx(DashboardLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "mx-auto max-w-7xl",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "mb-8",
        children: [/* @__PURE__ */ jsx("button", {
          onClick: () => navigate(`/internships/${internship.id}`),
          className: "mb-4 text-violet-600 hover:underline font-['Satoshi']",
          children: "← Back to Internship"
        }), /* @__PURE__ */ jsxs("h1", {
          className: "mb-2 font-['Clash_Display'] text-4xl font-bold text-neutral-900",
          children: ["Applications: ", internship.title]
        }), /* @__PURE__ */ jsx("p", {
          className: "font-['Satoshi'] text-gray-600",
          children: internship.company_name
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "mb-6 flex items-center justify-between",
        children: [/* @__PURE__ */ jsxs("select", {
          value: statusFilter,
          onChange: (e) => setStatusFilter(e.target.value),
          className: "rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi']",
          children: [/* @__PURE__ */ jsx("option", {
            value: "all",
            children: "All Status"
          }), /* @__PURE__ */ jsx("option", {
            value: "pending",
            children: "Pending"
          }), /* @__PURE__ */ jsx("option", {
            value: "shortlisted",
            children: "Shortlisted"
          }), /* @__PURE__ */ jsx("option", {
            value: "rejected",
            children: "Rejected"
          }), /* @__PURE__ */ jsx("option", {
            value: "forwarded",
            children: "Forwarded"
          }), /* @__PURE__ */ jsx("option", {
            value: "accepted",
            children: "Accepted"
          })]
        }), selectedApplications.length > 0 && /* @__PURE__ */ jsxs("button", {
          onClick: handleForward,
          className: "rounded-lg border-2 border-neutral-900 bg-violet-600 px-6 py-2 font-['Satoshi'] font-medium text-white transition-colors hover:bg-violet-700",
          children: ["Forward Selected (", selectedApplications.length, ")"]
        })]
      }), loading ? /* @__PURE__ */ jsx("p", {
        className: "font-['Satoshi'] text-gray-600",
        children: "Loading applications..."
      }) : applications2.length === 0 ? /* @__PURE__ */ jsx("p", {
        className: "font-['Satoshi'] text-gray-600",
        children: "No applications found."
      }) : /* @__PURE__ */ jsx("div", {
        className: "overflow-x-auto",
        children: /* @__PURE__ */ jsxs("table", {
          className: "w-full border-2 border-neutral-900",
          children: [/* @__PURE__ */ jsx("thead", {
            children: /* @__PURE__ */ jsxs("tr", {
              className: "bg-neutral-100",
              children: [/* @__PURE__ */ jsx("th", {
                className: "border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold",
                children: /* @__PURE__ */ jsx("input", {
                  type: "checkbox",
                  checked: selectedApplications.length === applications2.length && applications2.length > 0,
                  onChange: (e) => {
                    if (e.target.checked) {
                      setSelectedApplications(applications2.map((app) => app.id));
                    } else {
                      setSelectedApplications([]);
                    }
                  }
                })
              }), /* @__PURE__ */ jsx("th", {
                className: "border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold",
                children: "Student"
              }), /* @__PURE__ */ jsx("th", {
                className: "border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold",
                children: "Email"
              }), /* @__PURE__ */ jsx("th", {
                className: "border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold",
                children: "Resume"
              }), /* @__PURE__ */ jsx("th", {
                className: "border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold",
                children: "Applied"
              }), /* @__PURE__ */ jsx("th", {
                className: "border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold",
                children: "Status"
              }), /* @__PURE__ */ jsx("th", {
                className: "border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold",
                children: "Actions"
              })]
            })
          }), /* @__PURE__ */ jsx("tbody", {
            children: applications2.map((app) => /* @__PURE__ */ jsxs("tr", {
              children: [/* @__PURE__ */ jsx("td", {
                className: "border-2 border-neutral-900 px-4 py-2",
                children: /* @__PURE__ */ jsx("input", {
                  type: "checkbox",
                  checked: selectedApplications.includes(app.id),
                  onChange: (e) => {
                    if (e.target.checked) {
                      setSelectedApplications([...selectedApplications, app.id]);
                    } else {
                      setSelectedApplications(selectedApplications.filter((id) => id !== app.id));
                    }
                  }
                })
              }), /* @__PURE__ */ jsx("td", {
                className: "border-2 border-neutral-900 px-4 py-2 font-['Satoshi']",
                children: app.user_name || "N/A"
              }), /* @__PURE__ */ jsx("td", {
                className: "border-2 border-neutral-900 px-4 py-2 font-['Satoshi']",
                children: app.user_email || "N/A"
              }), /* @__PURE__ */ jsx("td", {
                className: "border-2 border-neutral-900 px-4 py-2 font-['Satoshi']",
                children: /* @__PURE__ */ jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [/* @__PURE__ */ jsx("span", {
                    children: app.resume_name || "N/A"
                  }), /* @__PURE__ */ jsx("button", {
                    onClick: () => handleDownloadResume(app.id, app.resume_name),
                    className: "rounded border border-neutral-900 bg-white px-2 py-1 text-sm font-['Satoshi'] hover:bg-gray-50 flex items-center gap-1",
                    title: "Download Resume",
                    children: /* @__PURE__ */ jsx(FiDownload, {
                      className: "w-4 h-4"
                    })
                  })]
                })
              }), /* @__PURE__ */ jsx("td", {
                className: "border-2 border-neutral-900 px-4 py-2 font-['Satoshi']",
                children: new Date(app.created_at).toLocaleDateString()
              }), /* @__PURE__ */ jsx("td", {
                className: "border-2 border-neutral-900 px-4 py-2 font-['Satoshi']",
                children: /* @__PURE__ */ jsx("span", {
                  className: `inline-block rounded-full px-3 py-1 text-xs font-medium ${app.status === "accepted" ? "bg-green-100 text-green-700" : app.status === "shortlisted" ? "bg-blue-100 text-blue-700" : app.status === "rejected" ? "bg-red-100 text-red-700" : app.status === "forwarded" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`,
                  children: app.status
                })
              }), /* @__PURE__ */ jsx("td", {
                className: "border-2 border-neutral-900 px-4 py-2 font-['Satoshi']",
                children: /* @__PURE__ */ jsxs("select", {
                  value: app.status,
                  onChange: (e) => handleStatusUpdate(app.id, e.target.value),
                  className: "rounded border border-neutral-900 px-2 py-1 text-sm font-['Satoshi']",
                  children: [/* @__PURE__ */ jsx("option", {
                    value: "pending",
                    children: "Pending"
                  }), /* @__PURE__ */ jsx("option", {
                    value: "shortlisted",
                    children: "Shortlist"
                  }), /* @__PURE__ */ jsx("option", {
                    value: "rejected",
                    children: "Reject"
                  }), /* @__PURE__ */ jsx("option", {
                    value: "forwarded",
                    children: "Forward"
                  }), /* @__PURE__ */ jsx("option", {
                    value: "accepted",
                    children: "Accept"
                  })]
                })
              })]
            }, app.id))
          })]
        })
      }), showForwardModal && /* @__PURE__ */ jsx(ForwardModal, {
        internshipId: internship.id,
        applicationIds: selectedApplications,
        onClose: () => {
          setShowForwardModal(false);
          setSelectedApplications([]);
        },
        onSuccess: () => {
          setShowForwardModal(false);
          setSelectedApplications([]);
          loadApplications();
        }
      })]
    })
  });
});
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: applications,
  loader: loader$4,
  meta
}, Symbol.toStringTag, { value: "Module" }));
async function loader$3({
  request
}) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const result = await db.execute(sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`);
  if (result.rows.length === 0) {
    return Response.json({
      error: "User not found"
    }, {
      status: 404
    });
  }
  const role = result.rows[0].role;
  if (role !== "ops" && role !== "admin") {
    return Response.json({
      error: "Forbidden - Ops or Admin access required"
    }, {
      status: 403
    });
  }
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const offset = (page - 1) * limit;
  let whereClause = sql`1=1`;
  if (status && status !== "all") {
    whereClause = sql`${whereClause} AND status = ${status}`;
  }
  if (search) {
    const searchPattern = `%${search}%`;
    whereClause = sql`${whereClause} AND (title ILIKE ${searchPattern} OR company_name ILIKE ${searchPattern})`;
  }
  const internships = await db.execute(sql`SELECT * FROM public.internships WHERE ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
  const countResult = await db.execute(sql`SELECT COUNT(*) as total FROM public.internships WHERE ${whereClause}`);
  const total = parseInt(countResult.rows[0].total, 10);
  return Response.json({
    internships: internships.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  });
}
async function action$3({
  request
}) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const roleResult = await db.execute(sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`);
  if (roleResult.rows.length === 0) {
    return Response.json({
      error: "User not found"
    }, {
      status: 404
    });
  }
  const role = roleResult.rows[0].role;
  if (role !== "ops" && role !== "admin") {
    return Response.json({
      error: "Forbidden - Ops or Admin access required"
    }, {
      status: 403
    });
  }
  const body = await request.json();
  const {
    title,
    company_name,
    description,
    requirements,
    location,
    duration,
    stipend,
    application_deadline,
    status
  } = body;
  if (!title || !company_name || !description || !requirements || !location || !duration || !stipend) {
    return Response.json({
      error: "Title, company name, description, requirements, location, duration, and stipend are required"
    }, {
      status: 400
    });
  }
  let slug = slugify(title, {
    lower: true,
    strict: true
  });
  let counter = 1;
  let originalSlug = slug;
  while (true) {
    const existing = await db.execute(sql`SELECT id FROM public.internships WHERE slug = ${slug} LIMIT 1`);
    if (existing.rows.length === 0) {
      break;
    }
    slug = `${originalSlug}-${counter}`;
    counter++;
  }
  const result = await db.execute(sql`
      INSERT INTO public.internships (
        title, company_name, description, requirements, location, duration, stipend,
        application_deadline, status, slug, created_by
      ) VALUES (
        ${title}, ${company_name}, ${description}, ${requirements},
        ${location}, ${duration}, ${stipend},
        ${application_deadline ? new Date(application_deadline) : null},
        ${status || "draft"}, ${slug}, ${user.id}
      ) RETURNING *
    `);
  const internship = result.rows[0];
  return Response.json({
    success: true,
    internship
  });
}
const route14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
async function loader$2({
  params,
  request
}) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const result = await db.execute(sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`);
  if (result.rows.length === 0) {
    return Response.json({
      error: "User not found"
    }, {
      status: 404
    });
  }
  const role = result.rows[0].role;
  if (role !== "ops" && role !== "admin") {
    return Response.json({
      error: "Forbidden - Ops or Admin access required"
    }, {
      status: 403
    });
  }
  const {
    id
  } = params;
  const internshipResult = await db.execute(sql`SELECT * FROM public.internships WHERE id = ${id} LIMIT 1`);
  if (internshipResult.rows.length === 0) {
    return Response.json({
      error: "Internship not found"
    }, {
      status: 404
    });
  }
  return Response.json({
    internship: internshipResult.rows[0]
  });
}
async function action$2({
  params,
  request
}) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const roleResult = await db.execute(sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`);
  if (roleResult.rows.length === 0) {
    return Response.json({
      error: "User not found"
    }, {
      status: 404
    });
  }
  const role = roleResult.rows[0].role;
  if (role !== "ops" && role !== "admin") {
    return Response.json({
      error: "Forbidden - Ops or Admin access required"
    }, {
      status: 403
    });
  }
  const {
    id
  } = params;
  if (request.method === "DELETE") {
    await db.execute(sql`DELETE FROM public.internships WHERE id = ${id}`);
    return Response.json({
      success: true
    });
  }
  const body = await request.json();
  const {
    title,
    company_name,
    description,
    requirements,
    location,
    duration,
    stipend,
    application_deadline,
    status
  } = body;
  const existingResult = await db.execute(sql`SELECT * FROM public.internships WHERE id = ${id} LIMIT 1`);
  if (existingResult.rows.length === 0) {
    return Response.json({
      error: "Internship not found"
    }, {
      status: 404
    });
  }
  const existing = existingResult.rows[0];
  let slug = existing.slug;
  if (title && title !== existing.title) {
    slug = slugify(title, {
      lower: true,
      strict: true
    });
    let counter = 1;
    let originalSlug = slug;
    while (true) {
      const slugCheck = await db.execute(sql`SELECT id FROM public.internships WHERE slug = ${slug} AND id != ${id} LIMIT 1`);
      if (slugCheck.rows.length === 0) {
        break;
      }
      slug = `${originalSlug}-${counter}`;
      counter++;
    }
  }
  const updateResult = await db.execute(sql`
      UPDATE public.internships SET
        title = COALESCE(${title || null}, title),
        company_name = COALESCE(${company_name || null}, company_name),
        description = COALESCE(${description || null}, description),
        requirements = COALESCE(${requirements || null}, requirements),
        location = COALESCE(${location || null}, location),
        duration = COALESCE(${duration || null}, duration),
        stipend = COALESCE(${stipend || null}, stipend),
        application_deadline = COALESCE(${application_deadline ? new Date(application_deadline) : null}, application_deadline),
        status = COALESCE(${status || null}, status),
        slug = ${slug},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `);
  return Response.json({
    success: true,
    internship: updateResult.rows[0]
  });
}
const route15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
async function loader$1({
  params,
  request
}) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const result = await db.execute(sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`);
  if (result.rows.length === 0) {
    return Response.json({
      error: "User not found"
    }, {
      status: 404
    });
  }
  const role = result.rows[0].role;
  if (role !== "ops" && role !== "admin") {
    return Response.json({
      error: "Forbidden - Ops or Admin access required"
    }, {
      status: 403
    });
  }
  const {
    id: internshipId
  } = params;
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  let query = sql`
    SELECT 
      ia.*,
      u.name as user_name,
      u.email as user_email,
      r.name as resume_name
    FROM public.internship_applications ia
    JOIN public."user" u ON ia.user_id = u.id
    JOIN public.resumes r ON ia.resume_id = r.id
    WHERE ia.internship_id = ${internshipId}
  `;
  if (status && status !== "all") {
    query = sql`${query} AND ia.status = ${status}`;
  }
  query = sql`${query} ORDER BY ia.created_at DESC`;
  const applications2 = await db.execute(query);
  return Response.json({
    applications: applications2.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      resume_id: row.resume_id,
      status: row.status,
      created_at: row.created_at,
      user_name: row.user_name,
      user_email: row.user_email,
      resume_name: row.resume_name
    }))
  });
}
const route16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
async function action$1({
  params,
  request
}) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const roleResult = await db.execute(sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`);
  if (roleResult.rows.length === 0) {
    return Response.json({
      error: "User not found"
    }, {
      status: 404
    });
  }
  const role = roleResult.rows[0].role;
  if (role !== "ops" && role !== "admin") {
    return Response.json({
      error: "Forbidden - Ops or Admin access required"
    }, {
      status: 403
    });
  }
  const {
    id
  } = params;
  const body = await request.json();
  const {
    status,
    admin_notes
  } = body;
  if (!status) {
    return Response.json({
      error: "Status is required"
    }, {
      status: 400
    });
  }
  const validStatuses = ["pending", "shortlisted", "rejected", "forwarded", "accepted", "interview_scheduled", "more_info_requested"];
  if (!validStatuses.includes(status)) {
    return Response.json({
      error: "Invalid status"
    }, {
      status: 400
    });
  }
  const updateResult = await db.execute(sql`
      UPDATE public.internship_applications SET
        status = ${status},
        admin_notes = COALESCE(${admin_notes || null}, admin_notes),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `);
  if (updateResult.rows.length === 0) {
    return Response.json({
      error: "Application not found"
    }, {
      status: 404
    });
  }
  return Response.json({
    success: true,
    application: updateResult.rows[0]
  });
}
const route17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1
}, Symbol.toStringTag, { value: "Module" }));
async function loader({
  params,
  request
}) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const roleResult = await db.execute(sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`);
  if (roleResult.rows.length === 0) {
    return Response.json({
      error: "User not found"
    }, {
      status: 404
    });
  }
  const role = roleResult.rows[0].role;
  if (role !== "ops" && role !== "admin") {
    return Response.json({
      error: "Forbidden - Ops or Admin access required"
    }, {
      status: 403
    });
  }
  const {
    id: applicationId
  } = params;
  const applicationResult = await db.execute(sql`
      SELECT 
        ia.resume_snapshot,
        ia.resume_id,
        r.name as resume_name,
        u.name as user_name
      FROM public.internship_applications ia
      JOIN public.resumes r ON ia.resume_id = r.id
      JOIN public."user" u ON ia.user_id = u.id
      WHERE ia.id = ${applicationId}
      LIMIT 1
    `);
  if (applicationResult.rows.length === 0) {
    return Response.json({
      error: "Application not found"
    }, {
      status: 404
    });
  }
  const app = applicationResult.rows[0];
  const resumeSnapshot = app.resume_snapshot;
  const resumeName = app.resume_name || "resume";
  const userName = app.user_name || "student";
  const jsonContent = JSON.stringify(resumeSnapshot, null, 2);
  const filename = `${userName}-${resumeName}-${applicationId}.json`;
  return new Response(jsonContent, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
const route18 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader
}, Symbol.toStringTag, { value: "Module" }));
async function action({
  request
}) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const roleResult = await db.execute(sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`);
  if (roleResult.rows.length === 0) {
    return Response.json({
      error: "User not found"
    }, {
      status: 404
    });
  }
  const role = roleResult.rows[0].role;
  if (role !== "ops" && role !== "admin") {
    return Response.json({
      error: "Forbidden - Ops or Admin access required"
    }, {
      status: 403
    });
  }
  const body = await request.json();
  const {
    application_ids,
    internship_id,
    expires_at
  } = body;
  if (!application_ids || !Array.isArray(application_ids) || application_ids.length === 0) {
    return Response.json({
      error: "application_ids array is required"
    }, {
      status: 400
    });
  }
  if (!internship_id) {
    return Response.json({
      error: "internship_id is required"
    }, {
      status: 400
    });
  }
  const applicationsCheck = await db.execute(sql`SELECT internship_id FROM public.internship_applications WHERE id = ANY(${application_ids})`);
  const uniqueInternshipIds = [...new Set(applicationsCheck.rows.map((r) => r.internship_id))];
  if (uniqueInternshipIds.length !== 1 || uniqueInternshipIds[0] !== internship_id) {
    return Response.json({
      error: "All applications must belong to the same internship"
    }, {
      status: 400
    });
  }
  const token = randomBytes(32).toString("hex");
  const tokenResult = await db.execute(sql`
      INSERT INTO public.company_tokens (
        token, internship_id, application_ids, created_by, expires_at
      ) VALUES (
        ${token}, ${internship_id}, ${JSON.stringify(application_ids)}::jsonb, ${user.id},
        ${expires_at ? new Date(expires_at) : null}
      ) RETURNING *
    `);
  await db.execute(sql`
      UPDATE public.internship_applications SET
        status = 'forwarded',
        company_token = ${token},
        forwarded_at = NOW(),
        updated_at = NOW()
      WHERE id = ANY(${application_ids})
    `);
  const baseUrl = typeof process !== "undefined" && process.env.VITE_FRONTEND_URL ? process.env.VITE_FRONTEND_URL : "http://localhost:3000";
  const url = `${baseUrl}/company/internships/${internship_id}?token=${token}`;
  return Response.json({
    success: true,
    token,
    url,
    company_token: tokenResult.rows[0]
  });
}
const route19 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-vCIVag4f.js", "imports": ["/assets/index-B1xwEu6H.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-DSncUvY1.js", "imports": ["/assets/index-B1xwEu6H.js", "/assets/index-DAdZMd0K.js"], "css": ["/assets/root-ChyIpqX6.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/index": { "id": "routes/index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-C75h6kbL.js", "imports": ["/assets/index-B1xwEu6H.js", "/assets/layout-QfacyZdK.js", "/assets/api-HzdKspp4.js", "/assets/index-DAdZMd0K.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/login": { "id": "routes/login", "parentId": "root", "path": "login", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/login-BTSpGz1k.js", "imports": ["/assets/index-B1xwEu6H.js", "/assets/api-HzdKspp4.js", "/assets/index-DAdZMd0K.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/blog/new": { "id": "routes/blog/new", "parentId": "root", "path": "blog/new", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/new-s89sK1Fo.js", "imports": ["/assets/index-B1xwEu6H.js", "/assets/layout-QfacyZdK.js", "/assets/api-HzdKspp4.js", "/assets/index-DAdZMd0K.js", "/assets/blog-form-B3ssdXJ7.js", "/assets/tiptap-editor-C6Eu22uK.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/blog/$id": { "id": "routes/blog/$id", "parentId": "root", "path": "blog/:id", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_id-BHJ_3RBy.js", "imports": ["/assets/index-B1xwEu6H.js", "/assets/layout-QfacyZdK.js", "/assets/api-HzdKspp4.js", "/assets/index-DAdZMd0K.js", "/assets/blog-form-B3ssdXJ7.js", "/assets/tiptap-editor-C6Eu22uK.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.auth.check-role": { "id": "routes/api.auth.check-role", "parentId": "root", "path": "api/auth/check-role", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.auth.check-role-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/blog/upload-image": { "id": "routes/api/blog/upload-image", "parentId": "root", "path": "api/blog/upload-image", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/upload-image-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/blog/$id": { "id": "routes/api/blog/$id", "parentId": "root", "path": "api/blog/:id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_id-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/blog/route": { "id": "routes/api/blog/route", "parentId": "root", "path": "api/blog", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/route-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/images/$": { "id": "routes/api/images/$", "parentId": "root", "path": "api/images/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/internships/index": { "id": "routes/internships/index", "parentId": "root", "path": "internships", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-B6sbgZAh.js", "imports": ["/assets/index-B1xwEu6H.js", "/assets/layout-QfacyZdK.js", "/assets/api-HzdKspp4.js", "/assets/index-DAdZMd0K.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/internships/new": { "id": "routes/internships/new", "parentId": "root", "path": "internships/new", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/new-C4GHp51b.js", "imports": ["/assets/index-B1xwEu6H.js", "/assets/layout-QfacyZdK.js", "/assets/api-HzdKspp4.js", "/assets/index-DAdZMd0K.js", "/assets/internship-form-B4xjKPCN.js", "/assets/tiptap-editor-C6Eu22uK.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/internships/$id": { "id": "routes/internships/$id", "parentId": "root", "path": "internships/:id", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_id-XCmK3k-u.js", "imports": ["/assets/index-B1xwEu6H.js", "/assets/layout-QfacyZdK.js", "/assets/api-HzdKspp4.js", "/assets/index-DAdZMd0K.js", "/assets/internship-form-B4xjKPCN.js", "/assets/tiptap-editor-C6Eu22uK.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/internships/$id/applications": { "id": "routes/internships/$id/applications", "parentId": "root", "path": "internships/:id/applications", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/applications-BKmAhIvy.js", "imports": ["/assets/index-B1xwEu6H.js", "/assets/layout-QfacyZdK.js", "/assets/api-HzdKspp4.js", "/assets/index-DAdZMd0K.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/internships/route": { "id": "routes/api/internships/route", "parentId": "root", "path": "api/internships", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/route-DP2rzg_V.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/internships/$id": { "id": "routes/api/internships/$id", "parentId": "root", "path": "api/internships/:id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_id-DP2rzg_V.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/internships/$id/applications": { "id": "routes/api/internships/$id/applications", "parentId": "root", "path": "api/internships/:id/applications", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/applications-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/internships/applications/$id": { "id": "routes/api/internships/applications/$id", "parentId": "root", "path": "api/internships/applications/:id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_id-K6Dvbx-E.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/internships/applications/$id/download": { "id": "routes/api/internships/applications/$id/download", "parentId": "root", "path": "api/internships/applications/:id/download", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/download-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/internships/applications/forward": { "id": "routes/api/internships/applications/forward", "parentId": "root", "path": "api/internships/applications/forward", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/forward-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-ef3eb04b.js", "version": "ef3eb04b", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "unstable_subResourceIntegrity": false, "unstable_trailingSlashAwareDataRequests": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/index": {
    id: "routes/index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/login": {
    id: "routes/login",
    parentId: "root",
    path: "login",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/blog/new": {
    id: "routes/blog/new",
    parentId: "root",
    path: "blog/new",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/blog/$id": {
    id: "routes/blog/$id",
    parentId: "root",
    path: "blog/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/api.auth.check-role": {
    id: "routes/api.auth.check-role",
    parentId: "root",
    path: "api/auth/check-role",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/api/blog/upload-image": {
    id: "routes/api/blog/upload-image",
    parentId: "root",
    path: "api/blog/upload-image",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/api/blog/$id": {
    id: "routes/api/blog/$id",
    parentId: "root",
    path: "api/blog/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/api/blog/route": {
    id: "routes/api/blog/route",
    parentId: "root",
    path: "api/blog",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/api/images/$": {
    id: "routes/api/images/$",
    parentId: "root",
    path: "api/images/*",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/internships/index": {
    id: "routes/internships/index",
    parentId: "root",
    path: "internships",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/internships/new": {
    id: "routes/internships/new",
    parentId: "root",
    path: "internships/new",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/internships/$id": {
    id: "routes/internships/$id",
    parentId: "root",
    path: "internships/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  },
  "routes/internships/$id/applications": {
    id: "routes/internships/$id/applications",
    parentId: "root",
    path: "internships/:id/applications",
    index: void 0,
    caseSensitive: void 0,
    module: route13
  },
  "routes/api/internships/route": {
    id: "routes/api/internships/route",
    parentId: "root",
    path: "api/internships",
    index: void 0,
    caseSensitive: void 0,
    module: route14
  },
  "routes/api/internships/$id": {
    id: "routes/api/internships/$id",
    parentId: "root",
    path: "api/internships/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route15
  },
  "routes/api/internships/$id/applications": {
    id: "routes/api/internships/$id/applications",
    parentId: "root",
    path: "api/internships/:id/applications",
    index: void 0,
    caseSensitive: void 0,
    module: route16
  },
  "routes/api/internships/applications/$id": {
    id: "routes/api/internships/applications/$id",
    parentId: "root",
    path: "api/internships/applications/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route17
  },
  "routes/api/internships/applications/$id/download": {
    id: "routes/api/internships/applications/$id/download",
    parentId: "root",
    path: "api/internships/applications/:id/download",
    index: void 0,
    caseSensitive: void 0,
    module: route18
  },
  "routes/api/internships/applications/forward": {
    id: "routes/api/internships/applications/forward",
    parentId: "root",
    path: "api/internships/applications/forward",
    index: void 0,
    caseSensitive: void 0,
    module: route19
  }
};
const allowedActionOrigins = false;
export {
  allowedActionOrigins,
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
