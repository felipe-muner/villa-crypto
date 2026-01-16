import { Suspense } from "react";
import { VillaSearch } from "./VillaSearch";
import { Header } from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

function VillaSearchSkeleton() {
  return (
    <div className="space-y-8">
      {/* Search bar skeleton */}
      <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Villa cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="villa-card">
            <Skeleton className="aspect-[4/3]" />
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between pt-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VillasPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-villa-navy/5 to-background pt-8 pb-16">
        <div className="luxury-container">
          <div className="text-center mb-12">
            <h1 className="mb-4">
              Find Your Perfect <span className="text-villa-gold">Villa</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover handpicked luxury properties around the world. Book with
              cryptocurrency for a seamless experience.
            </p>
          </div>

          <Suspense fallback={<VillaSearchSkeleton />}>
            <VillaSearch />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
