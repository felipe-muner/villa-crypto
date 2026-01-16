"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format, addDays } from "date-fns";
import {
  Search,
  Users,
  MapPin,
  X,
  Star,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Villa {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  pricePerNight: string;
  images: string[] | null;
  maxGuests: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
}

export function VillaSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [checkIn, setCheckIn] = useState<Date | undefined>(
    searchParams.get("checkIn")
      ? new Date(searchParams.get("checkIn")!)
      : undefined
  );
  const [checkOut, setCheckOut] = useState<Date | undefined>(
    searchParams.get("checkOut")
      ? new Date(searchParams.get("checkOut")!)
      : undefined
  );
  const [guests, setGuests] = useState(searchParams.get("guests") || "1");
  const [villas, setVillas] = useState<Villa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  const minDate = addDays(new Date(), 1);

  useEffect(() => {
    fetchVillas();
  }, []);

  const fetchVillas = async (params?: {
    checkIn?: string;
    checkOut?: string;
    guests?: string;
  }) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (params?.checkIn) queryParams.set("checkIn", params.checkIn);
      if (params?.checkOut) queryParams.set("checkOut", params.checkOut);
      if (params?.guests) queryParams.set("guests", params.guests);

      const url = `/api/villas/available${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();
      setVillas(data);
    } catch (error) {
      console.error("Error fetching villas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!checkIn || !checkOut) return;

    setSearched(true);
    const checkInStr = format(checkIn, "yyyy-MM-dd");
    const checkOutStr = format(checkOut, "yyyy-MM-dd");

    const params = new URLSearchParams();
    params.set("checkIn", checkInStr);
    params.set("checkOut", checkOutStr);
    params.set("guests", guests);
    router.push(`/villas?${params.toString()}`);

    fetchVillas({ checkIn: checkInStr, checkOut: checkOutStr, guests });
  };

  const clearSearch = () => {
    setCheckIn(undefined);
    setCheckOut(undefined);
    setGuests("1");
    setSearched(false);
    router.push("/villas");
    fetchVillas();
  };

  return (
    <>
      {/* Search Form - Airbnb-style */}
      <div className="bg-card rounded-2xl p-2 shadow-luxury border border-border/50 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {/* Check-in */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="pl-12 pr-4 py-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer">
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Check in
              </label>
              <DatePicker
                date={checkIn}
                onSelect={(date) => {
                  setCheckIn(date);
                  if (checkOut && date && date >= checkOut) {
                    setCheckOut(undefined);
                  }
                }}
                placeholder="Add date"
                fromDate={minDate}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:flex items-center">
            <div className="w-px h-10 bg-border/50 mx-auto" />
          </div>

          {/* Check-out */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="pl-12 pr-4 py-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer">
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Check out
              </label>
              <DatePicker
                date={checkOut}
                onSelect={setCheckOut}
                placeholder="Add date"
                fromDate={checkIn || minDate}
                disabled={(date) => (checkIn ? date <= checkIn : false)}
              />
            </div>
          </div>

          {/* Guests + Search */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Users className="w-5 h-5" />
              </div>
              <div className="pl-12 pr-4 py-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Guests
                </label>
                <Select value={guests} onValueChange={setGuests}>
                  <SelectTrigger className="border-0 p-0 h-auto font-medium bg-transparent hover:bg-transparent focus:ring-0 shadow-none">
                    <SelectValue placeholder="Add guests" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} {n === 1 ? "guest" : "guests"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {searched && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  className="rounded-full h-12 w-12 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
              <Button
                onClick={handleSearch}
                disabled={!checkIn || !checkOut}
                className="rounded-full h-12 px-6 bg-villa-gold hover:bg-villa-gold/90 text-villa-navy font-medium shadow-lg shadow-villa-gold/20"
              >
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Info */}
      {searched && checkIn && checkOut && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-2 text-sm font-medium"
            >
              {format(checkIn, "MMM d")} - {format(checkOut, "MMM d, yyyy")}
            </Badge>
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-2 text-sm font-medium"
            >
              {guests} {Number(guests) === 1 ? "guest" : "guests"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">{villas.length}</span>{" "}
            villas available
          </p>
        </div>
      )}

      {/* Results */}
      {loading ? (
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
      ) : villas.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-villa-gold/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-villa-gold" />
          </div>
          <h3 className="font-sans text-xl font-semibold mb-3">
            {searched ? "No villas available" : "No villas found"}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {searched
              ? "Try adjusting your dates or reducing the number of guests"
              : "Check back later for new luxury listings"}
          </p>
          {searched && (
            <Button
              onClick={clearSearch}
              variant="outline"
              className="mt-6 rounded-full"
            >
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {villas.map((villa) => (
            <Link
              key={villa.id}
              href={`/villas/${villa.id}${
                checkIn && checkOut
                  ? `?checkIn=${format(checkIn, "yyyy-MM-dd")}&checkOut=${format(
                      checkOut,
                      "yyyy-MM-dd"
                    )}&guests=${guests}`
                  : ""
              }`}
              className="group"
            >
              <div className="villa-card h-full">
                <div className="relative aspect-[4/3] overflow-hidden">
                  {villa.images && villa.images.length > 0 ? (
                    <Image
                      src={villa.images[0]}
                      alt={villa.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Rating Badge */}
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
                      <Star className="w-4 h-4 text-villa-gold fill-villa-gold" />
                      <span className="text-sm font-semibold">4.9</span>
                    </div>
                  </div>
                  {/* Wishlist Button */}
                  <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:scale-110">
                    <svg
                      className="w-5 h-5 text-villa-navy"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-sans text-lg font-semibold text-foreground group-hover:text-villa-gold transition-colors line-clamp-1">
                      {villa.name}
                    </h4>
                  </div>
                  {villa.location && (
                    <p className="text-muted-foreground text-sm flex items-center gap-1 mb-4">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">{villa.location}</span>
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {villa.maxGuests}
                      </span>
                      <span className="text-border">•</span>
                      <span>{villa.bedrooms} beds</span>
                      <span className="text-border">•</span>
                      <span>{villa.bathrooms} baths</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">
                      ${Number(villa.pricePerNight).toFixed(0)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      / night
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
