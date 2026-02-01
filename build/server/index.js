import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, useNavigate, Link, useSearchParams, useParams } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { Toaster, toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { lastLoginMethodClient, jwtClient, adminClient, phoneNumberClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
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
import { FiBold, FiItalic, FiUnderline, FiMinus, FiCode, FiList, FiType, FiMessageSquare, FiAlignLeft, FiAlignCenter, FiAlignRight, FiLink, FiUpload, FiImage, FiEdit2, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import slugify from "slugify";
import readingTime from "reading-time";
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
function meta$3({}) {
  return [{
    title: "Maverick – Blog Editor"
  }, {
    name: "description",
    content: "Blog editor dashboard"
  }];
}
const index = UNSAFE_withComponentProps(function BlogList() {
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
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen bg-gray-50 p-8",
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
  default: index,
  meta: meta$3
}, Symbol.toStringTag, { value: "Module" }));
function meta$2({}) {
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
          children: "Sign in to access the blog editor"
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
  meta: meta$2
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
function meta$1({}) {
  return [{
    title: "New Blog Post – Maverick"
  }, {
    name: "description",
    content: "Create a new blog post"
  }];
}
const _new = UNSAFE_withComponentProps(function NewBlogPost() {
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
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen bg-gray-50 p-8",
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
  default: _new,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
function meta({}) {
  return [{
    title: "Edit Blog Post – Maverick"
  }, {
    name: "description",
    content: "Edit blog post"
  }];
}
const $id = UNSAFE_withComponentProps(function EditBlogPost() {
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
    return /* @__PURE__ */ jsx("div", {
      className: "min-h-screen bg-gray-50 p-8",
      children: /* @__PURE__ */ jsx("div", {
        className: "mx-auto max-w-4xl",
        children: /* @__PURE__ */ jsx("p", {
          className: "font-['Satoshi'] text-gray-600",
          children: "Post not found"
        })
      })
    });
  }
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen bg-gray-50 p-8",
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
  default: $id,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
const db = drizzle({ client: pool });
async function loader$3({
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
    const parts = token.split(".");
    if (parts.length !== 3) {
      return Response.json({
        error: "Invalid token format"
      }, {
        status: 401
      });
    }
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    const userId = payload.sub || payload.userId;
    if (!userId) {
      return Response.json({
        error: "Token missing user ID"
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
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
function getUserIdFromToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
    );
    return payload.sub || payload.userId || null;
  } catch {
    return null;
  }
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
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  const userId = getUserIdFromToken(token);
  if (!userId) {
    return null;
  }
  return getUserInfo(userId);
}
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
async function action$2({
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
  if (!allowedTypes.includes(file.type)) {
    return Response.json({
      error: "Invalid file type. Only JPEG, PNG, and WebP are allowed."
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
    const url = await uploadBlogImage(file, file.name);
    return Response.json({
      url,
      filename: file.name
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
  action: action$2
}, Symbol.toStringTag, { value: "Module" }));
async function loader$2({
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
async function action$1({
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
  action: action$1,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
async function loader$1({
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
  action,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || "";
const useLocalStack = process.env.USE_LOCALSTACK === "true";
const localStackEndpoint = process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566";
async function loader({
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
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-D4Wp8Cwj.js", "imports": ["/assets/index-BazM2RsE.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-D03cOgC0.js", "imports": ["/assets/index-BazM2RsE.js", "/assets/index-Bc1pEpVR.js"], "css": ["/assets/root-CsZlXKUM.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/index": { "id": "routes/index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-D8e8A8jD.js", "imports": ["/assets/index-BazM2RsE.js", "/assets/ops-guard-CZXP5ncn.js", "/assets/api-n_XQ3tqp.js", "/assets/index-Bc1pEpVR.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/login": { "id": "routes/login", "parentId": "root", "path": "login", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/login-D7mA3ebG.js", "imports": ["/assets/index-BazM2RsE.js", "/assets/api-n_XQ3tqp.js", "/assets/index-Bc1pEpVR.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/blog/new": { "id": "routes/blog/new", "parentId": "root", "path": "blog/new", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/new-DFxIzz41.js", "imports": ["/assets/index-BazM2RsE.js", "/assets/ops-guard-CZXP5ncn.js", "/assets/api-n_XQ3tqp.js", "/assets/index-Bc1pEpVR.js", "/assets/blog-form-B2yZTiZK.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/blog/$id": { "id": "routes/blog/$id", "parentId": "root", "path": "blog/:id", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_id-BkqipRGc.js", "imports": ["/assets/index-BazM2RsE.js", "/assets/ops-guard-CZXP5ncn.js", "/assets/api-n_XQ3tqp.js", "/assets/index-Bc1pEpVR.js", "/assets/blog-form-B2yZTiZK.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.auth.check-role": { "id": "routes/api.auth.check-role", "parentId": "root", "path": "api/auth/check-role", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.auth.check-role-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/blog/upload-image": { "id": "routes/api/blog/upload-image", "parentId": "root", "path": "api/blog/upload-image", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/upload-image-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/blog/$id": { "id": "routes/api/blog/$id", "parentId": "root", "path": "api/blog/:id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_id-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/blog/route": { "id": "routes/api/blog/route", "parentId": "root", "path": "api/blog", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/route-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/images/$": { "id": "routes/api/images/$", "parentId": "root", "path": "api/images/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-ef4427f1.js", "version": "ef4427f1", "sri": void 0 };
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
