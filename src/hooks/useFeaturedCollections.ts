import { useEffect, useState } from "react";
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { safeConvexCall } from "@/lib/errorHandler";

export type FeaturedCollection = {
  id: string;
  title: string;
  subtitle: string;
  collectionHandle: string;
  productHandles: string[];
  collectionImage: string;
  linkUrl: string;
  order: number;
  isActive: boolean;
};

export function useFeaturedCollections(enabled: boolean = true): {
  featuredCollections: FeaturedCollection[] | undefined;
  isLoading: boolean;
  error: string | null;
} {
  const convex = useConvex();
  const [featuredCollections, setFeaturedCollections] = useState<
    FeaturedCollection[] | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    safeConvexCall(() => convex.query(api.homepage.getFeaturedCollections, {}))
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setFeaturedCollections(((res.data as unknown) ?? []) as FeaturedCollection[]);
          setError(null);
        } else {
          setFeaturedCollections([]);
          setError(res.error);
        }
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [convex, enabled]);

  return { featuredCollections, isLoading, error };
}

