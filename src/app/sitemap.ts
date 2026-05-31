import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://bcece-college-predictor.vercel.app";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/colleges`, lastModified: new Date() },
    { url: `${baseUrl}/cutoffs`, lastModified: new Date() },
    { url: `${baseUrl}/about`, lastModified: new Date() },
  ];

  try {
    const colleges = await prisma.institute.findMany({
      select: { id: true },
    });

    const collegeRoutes = colleges.map((college) => ({
      url: `${baseUrl}/colleges/${college.id}`,
      lastModified: new Date(),
    }));

    return [...staticRoutes, ...collegeRoutes];
  } catch (error) {
    console.warn(
      "Prisma: database not reachable during sitemap generation. Falling back to static routes.",
      error
    );
    return staticRoutes;
  }
}
