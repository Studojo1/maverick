import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("login", "routes/login.tsx"),
  // Blog management
  route("blog", "routes/blog/index.tsx"),
  route("blog/new", "routes/blog/new.tsx"),
  route("blog/:id", "routes/blog/$id.tsx"),
  // Auth / role checks
  route("api/auth/check-role", "routes/api.auth.check-role.tsx"),
  // Blog API
  route("api/blog/upload-image", "routes/api/blog/upload-image.tsx"),
  route("api/blog/n8n", "routes/api/blog/n8n.tsx"),
  route("api/blog/:id", "routes/api/blog/$id.tsx"),
  route("api/blog", "routes/api/blog/route.tsx"),
  // Images API
  route("api/images/*", "routes/api/images/$.tsx"),
  // Internships UI
  route("internships", "routes/internships/index.tsx"),
  route("internships/new", "routes/internships/new.tsx"),
  route("internships/:id", "routes/internships/$id.tsx"),
  route("internships/:id/applications", "routes/internships/$id/applications.tsx"),
  // Internships API
  route("api/internships", "routes/api/internships/route.tsx"),
  route("api/internships/generate", "routes/api/internships/generate.tsx"),
  route("api/internships/:id", "routes/api/internships/$id.tsx"),
  route(
    "api/internships/:id/whatsapp",
    "routes/api/internships/$id/whatsapp.tsx"
  ),
  route(
    "api/internships/:id/applications",
    "routes/api/internships/$id/applications.tsx"
  ),
  route(
    "api/internships/applications/:id",
    "routes/api/internships/applications/$id.tsx"
  ),
  route(
    "api/internships/applications/:id/download",
    "routes/api/internships/applications/$id/download.tsx"
  ),
  route(
    "api/internships/applications/:id/view",
    "routes/api/internships/applications/$id/view.tsx"
  ),
  route(
    "api/internships/applications/forward",
    "routes/api/internships/applications/forward.tsx"
  ),
  // Companies API
  route("api/companies", "routes/api/companies/route.tsx"),
  route("api/companies/:id", "routes/api/companies/$id.tsx"),
  route("api/companies/:id/partner-users", "routes/api/companies/$id/partner-users.tsx"),
  // Companies UI
  route("companies", "routes/companies/index.tsx"),
  route("companies/new", "routes/companies/new.tsx"),
  route("companies/:id", "routes/companies/$id.tsx"),
] satisfies RouteConfig;

