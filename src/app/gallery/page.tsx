import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Upload } from "lucide-react";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const supabase = await createClient();

  const { data: galleryItems } = await supabase
    .from("gallery_items")
    .select(`
      *,
      uploaded_by_profile:uploaded_by (
        display_name
      )
    `)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 flex flex-col items-center text-center">
          <FadeIn>
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Shared Gallery
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Our Work
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-4 max-w-2xl text-lg text-muted">
              A collaborative showcase of our collective creativity
            </p>
          </FadeIn>
          {user && (
            <FadeIn delay={0.3}>
              <Link
                href="/dashboard/gallery"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-background transition-all duration-300 hover:bg-accent/80 hover:shadow-[0_0_30px_rgba(220,38,38,0.25)]"
              >
                <Upload className="h-4 w-4" />
                Upload to Gallery
              </Link>
            </FadeIn>
          )}
        </div>

        {/* Gallery Grid */}
        {galleryItems && galleryItems.length > 0 ? (
          <StaggerChildren className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {galleryItems.map((item) => (
              <StaggerItem key={item.id}>
                <div className="group relative overflow-hidden rounded-2xl bg-surface">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title || "Gallery image"}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {item.title && (
                        <h3 className="text-lg font-bold text-foreground">
                          {item.title}
                        </h3>
                      )}
                      {item.description && (
                        <p className="mt-1 text-sm text-muted">
                          {item.description}
                        </p>
                      )}
                      {item.uploaded_by_profile && (
                        <p className="mt-2 text-xs text-muted/60">
                          by {item.uploaded_by_profile.display_name}
                        </p>
                      )}
                    </div>
                  </div>
                  {item.is_featured && (
                    <div className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-background">
                      Featured
                    </div>
                  )}
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        ) : (
          <FadeIn className="text-center">
            <div className="gradient-border mx-auto max-w-md rounded-2xl bg-surface p-16">
              <p className="text-lg text-muted">
                The gallery is empty.
                <br />
                {user ? (
                  <Link href="/dashboard/gallery" className="text-accent hover:text-accent/80">
                    Be the first to upload!
                  </Link>
                ) : (
                  <span className="text-foreground/50">Check back soon.</span>
                )}
              </p>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
