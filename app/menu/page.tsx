"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MenuPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to sushi by default
    router.replace("/menu/sushi");
  }, [router]);

  return null;
}
