"use client";

import { useEffect, useState } from "react";
import type { CategoryDTO, MenuItemDTO } from "@/lib/api-types";

export function useMenuCategory(slug: string) {
  const [category, setCategory] = useState<CategoryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategory() {
      try {
        setLoading(true);
        const res = await fetch(`/api/menu/${slug}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch category");
        }

        const data = await res.json();
        setCategory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchCategory();
  }, [slug]);

  return { category, loading, error };
}

export function useMenu() {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMenu() {
      try {
        setLoading(true);
        const res = await fetch("/api/menu", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch menu");
        }

        const data = await res.json();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchMenu();
  }, []);

  return { categories, loading, error };
}
