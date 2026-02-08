import type { Route } from "./+types/api.images.$";

// GET /api/images/* - Proxy image requests to frontend app
export async function loader({ params, request }: Route.LoaderArgs) {
  let path = params["*"];

  if (!path) {
    return Response.json({ error: "Image path required" }, { status: 400 });
  }

  // Get frontend URL from environment or default
  const frontendUrl = process.env.VITE_FRONTEND_URL || 
                      process.env.FRONTEND_URL || 
                      "https://studojo.com";

  // Build the frontend URL for the image
  const imageUrl = `${frontendUrl}/api/images/${path}`;

  try {
    // Proxy the request to the frontend app
    const response = await fetch(imageUrl, {
      method: "GET",
      headers: {
        "User-Agent": request.headers.get("User-Agent") || "Maverick/1.0",
      },
    });

    if (!response.ok) {
      return Response.json(
        { error: "Image not found" },
        { status: response.status }
      );
    }

    // Get the image data
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get content type from the frontend response
    const contentType = response.headers.get("Content-Type") || "image/jpeg";

    // Return the proxied image with appropriate headers
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error proxying image:", error);
    return Response.json(
      { error: "Failed to proxy image", details: error.message },
      { status: 500 }
    );
  }
}

