"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Upload,
  Trash2,
  Loader2,
  Save,
  Check,
  X,
  Image as ImageIcon,
  Star,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  is_featured: boolean;
  uploaded_by: string;
}

export default function DashboardGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [dragOver, setDragOver] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      setIsAdmin(profile?.is_admin || false);

      const { data: galleryData } = await supabase
        .from("gallery_items")
        .select("*")
        .order("created_at", { ascending: false });

      setItems(galleryData || []);
      setLoading(false);
    };
    init();
  }, []);

  const uploadImage = useCallback(
    async (file: File) => {
      if (!userId) return;

      // File type validation
      const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!ALLOWED_TYPES.includes(file.type)) {
        setMessage({ type: "error", text: "Invalid file type. Please upload JPG, PNG, GIF, or WebP" });
        return;
      }

      // File size validation (10MB limit)
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        setMessage({ type: "error", text: "File too large. Maximum size is 10MB" });
        return;
      }

      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setMessage({ type: "error", text: uploadError.message });
        setUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("gallery").getPublicUrl(filePath);

      const { data: newItem, error: insertError } = await supabase
        .from("gallery_items")
        .insert({
          image_url: publicUrl,
          uploaded_by: userId,
          title: "",
          description: "",
          category: "general",
        })
        .select()
        .single();

      if (insertError) {
        setMessage({ type: "error", text: insertError.message });
      } else if (newItem) {
        setItems([newItem, ...items]);
        setMessage({ type: "success", text: "Image uploaded successfully!" });
      }

      setUploading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    },
    [userId, items, supabase]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      uploadImage(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadImage(file);
  };

  const updateItem = (id: string, updates: Partial<GalleryItem>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("gallery_items").delete().eq("id", id);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setItems(items.filter((item) => item.id !== id));
      setMessage({ type: "success", text: "Item deleted" });
      setTimeout(() => setMessage({ type: "", text: "" }), 2000);
    }
  };

  const saveAll = async () => {
    setSaving(true);
    for (const item of items) {
      await supabase
        .from("gallery_items")
        .update({
          title: item.title,
          description: item.description,
          category: item.category,
          is_featured: item.is_featured,
        })
        .eq("id", item.id);
    }
    setSaving(false);
    setMessage({ type: "success", text: "All changes saved!" });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-32">
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-1/2 top-24 z-50 -translate-x-1/2"
          >
            <div
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium shadow-lg ${
                message.type === "error"
                  ? "bg-red-500/90 text-white"
                  : "bg-green-500/90 text-white"
              }`}
            >
              {message.text}
              <button onClick={() => setMessage({ type: "", text: "" })}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/dashboard"
              className="font-medium text-muted transition-all duration-300 hover:text-accent"
            >
              Dashboard
            </Link>
            <span className="text-border">/</span>
            <span className="font-medium text-foreground">Gallery</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-muted transition-all hover:border-accent/30 hover:text-accent active:scale-95"
            >
              View Public Gallery
            </Link>
            <button
              onClick={saveAll}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3 text-sm font-semibold text-background transition-all hover:bg-accent/80 disabled:opacity-40 active:scale-95"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save All"}
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
            Shared Gallery
          </h1>
          <p className="text-muted">
            Upload images to the shared gallery. {isAdmin && "As an admin, you can edit all items."}
          </p>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`mb-10 cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/50 hover:bg-surface-light"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id="gallery-upload"
            disabled={uploading}
          />
          <label htmlFor="gallery-upload" className="cursor-pointer">
            {uploading ? (
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-accent" />
            ) : (
              <Upload className="mx-auto h-12 w-12 text-muted" />
            )}
            <p className="mt-4 text-sm font-medium text-foreground">
              {uploading ? "Uploading..." : "Click or drag image to upload"}
            </p>
            <p className="mt-1 text-xs text-muted">PNG, JPG, GIF up to 10MB</p>
          </label>
        </motion.div>

        {/* Gallery Items */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => {
              const canEdit = isAdmin || item.uploaded_by === userId;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="gradient-border rounded-2xl bg-surface p-4"
                >
                  <div className="relative mb-4 aspect-square overflow-hidden rounded-xl">
                    <img
                      src={item.image_url}
                      alt={item.title || "Gallery image"}
                      className="h-full w-full object-cover"
                    />
                    {isAdmin && (
                      <button
                        onClick={() =>
                          updateItem(item.id, { is_featured: !item.is_featured })
                        }
                        className={`absolute right-2 top-2 rounded-full p-2 transition-all ${
                          item.is_featured
                            ? "bg-accent text-background"
                            : "bg-background/80 text-muted hover:bg-background"
                        }`}
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {canEdit ? (
                    <>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItem(item.id, { title: e.target.value })}
                        placeholder="Title"
                        className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
                      />
                      <textarea
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.id, { description: e.target.value })
                        }
                        placeholder="Description"
                        rows={2}
                        className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
                      />
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      {item.title && (
                        <h3 className="mb-1 font-semibold text-foreground">
                          {item.title}
                        </h3>
                      )}
                      {item.description && (
                        <p className="text-sm text-muted">{item.description}</p>
                      )}
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="gradient-border mx-auto max-w-md rounded-2xl bg-surface p-16 text-center"
          >
            <ImageIcon className="mx-auto h-12 w-12 text-muted" />
            <p className="mt-4 text-lg text-muted">
              No images yet. Upload your first image above!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
