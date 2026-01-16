"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format, startOfDay, differenceInDays } from "date-fns";
import {
  Search,
  Users,
  MapPin,
  X,
  Star,
  Sparkles,
  CalendarDays,
  Minus,
  Plus,
  Home,
  Bath,
  BedDouble,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const [guests, setGuests] = useState(Number(searchParams.get("guests")) || 1);
  const [villas, setVillas] = useState<Villa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  // Popover states
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);

  const minDate = startOfDay(new Date());

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
    params.set("guests", guests.toString());
    router.push(`/villas?${params.toString()}`);

    fetchVillas({ checkIn: checkInStr, checkOut: checkOutStr, guests: guests.toString() });
  };

  const clearSearch = () => {
    setCheckIn(undefined);
    setCheckOut(undefined);
    setGuests(1);
    setSearched(false);
    router.push("/villas");
    fetchVillas();
  };

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;

  return (
    <>
      {/* Search Bar - Airbnb Style */}
      <div className="bg-card rounded-full p-2 shadow-luxury border border-border/50 mb-10 max-w-4xl mx-auto">
        <div className="flex items-center">
          {/* Check-in */}
          <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex-1 text-left px-6 py-4 rounded-full transition-all duration-200",
                  "hover:bg-secondary/70",
                  checkInOpen && "bg-secondary shadow-sm"
                )}
              >
                <p className="text-xs font-semibold text-foreground mb-0.5">Check in</p>
                <p className={cn(
                  "text-sm",
                  checkIn ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {checkIn ? format(checkIn, "MMM d, yyyy") : "Add dates"}
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-luxury" align="start">
              <Calendar
                mode="single"
                selected={checkIn}
                onSelect={(date) => {
                  setCheckIn(date);
                  if (checkOut && date && date >= checkOut) {
                    setCheckOut(undefined);
                  }
                  setCheckInOpen(false);
                  if (date) setCheckOutOpen(true);
                }}
                disabled={(date) => date < minDate}
                initialFocus
                className="rounded-2xl"
              />
            </PopoverContent>
          </Popover>

          {/* Divider */}
          <div className="w-px h-8 bg-border" />

          {/* Check-out */}
          <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex-1 text-left px-6 py-4 rounded-full transition-all duration-200",
                  "hover:bg-secondary/70",
                  checkOutOpen && "bg-secondary shadow-sm"
                )}
              >
                <p className="text-xs font-semibold text-foreground mb-0.5">Check out</p>
                <p className={cn(
                  "text-sm",
                  checkOut ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {checkOut ? format(checkOut, "MMM d, yyyy") : "Add dates"}
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-luxury" align="start">
              <Calendar
                mode="single"
                selected={checkOut}
                onSelect={(date) => {
                  setCheckOut(date);
                  setCheckOutOpen(false);
                }}
                disabled={(date) => date < (checkIn || minDate) || (checkIn ? date <= checkIn : false)}
                initialFocus
                className="rounded-2xl"
              />
            </PopoverContent>
          </Popover>

          {/* Divider */}
          <div className="w-px h-8 bg-border" />

          {/* Guests */}
          <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex-1 text-left px-6 py-4 rounded-full transition-all duration-200",
                  "hover:bg-secondary/70",
                  guestsOpen && "bg-secondary shadow-sm"
                )}
              >
                <p className="text-xs font-semibold text-foreground mb-0.5">Guests</p>
                <p className={cn(
                  "text-sm",
                  guests > 1 ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {guests} {guests === 1 ? "guest" : "guests"}
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4 rounded-2xl shadow-luxury" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Guests</p>
                    <p className="text-sm text-muted-foreground">How many guests?</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      disabled={guests <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{guests}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() => setGuests(Math.min(16, guests + 1))}
                      disabled={guests >= 16}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Search Button */}
          <div className="pl-2">
            <Button
              onClick={handleSearch}
              disabled={!checkIn || !checkOut}
              size="lg"
              className={cn(
                "rounded-full h-14 transition-all duration-300",
                checkIn && checkOut
                  ? "px-6 bg-villa-gold hover:bg-villa-gold/90 text-villa-navy shadow-lg shadow-villa-gold/25"
                  : "w-14 bg-villa-gold/80 text-villa-navy"
              )}
            >
              <Search className="h-5 w-5" />
              {checkIn && checkOut && (
                <span className="ml-2 font-semibold">Search</span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Search Summary */}
      {searched && checkIn && checkOut && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 px-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-2 text-sm font-medium bg-villa-gold/10 text-villa-gold border-villa-gold/20"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              {format(checkIn, "MMM d")} → {format(checkOut, "MMM d")}
              <span className="ml-2 text-villa-gold/70">({nights} {nights === 1 ? "night" : "nights"})</span>
            </Badge>
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-2 text-sm font-medium"
            >
              <Users className="w-4 h-4 mr-2" />
              {guests} {guests === 1 ? "guest" : "guests"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="rounded-full text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
          <p className="text-muted-foreground">
            <span className="font-bold text-foreground text-lg">{villas.length}</span>{" "}
            {villas.length === 1 ? "villa" : "villas"} available
          </p>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="villa-card">
              <Skeleton className="aspect-[4/3]" />
              <div className="p-5 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : villas.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-villa-gold/20 to-villa-coral/20 flex items-center justify-center mx-auto mb-6">
            <Home className="w-12 h-12 text-villa-gold" />
          </div>
          <h3 className="font-serif text-2xl font-semibold mb-3">
            {searched ? "No villas available" : "Discover Your Perfect Villa"}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {searched
              ? "Try adjusting your dates or the number of guests to find available properties."
              : "Start by selecting your dates above to see available luxury villas."}
          </p>
          {searched && (
            <Button
              onClick={clearSearch}
              variant="outline"
              className="rounded-full px-6"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <article className="villa-card h-full flex flex-col">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {villa.images && villa.images.length > 0 ? (
                    <Image
                      src={villa.images[0]}
                      alt={villa.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  )}

                  {/* Rating */}
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-sm">
                      <Star className="w-3.5 h-3.5 text-villa-gold fill-villa-gold" />
                      <span className="text-sm font-semibold">4.9</span>
                    </div>
                  </div>

                  {/* Wishlist */}
                  <button
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white shadow-sm"
                    onClick={(e) => e.preventDefault()}
                  >
                    <svg className="w-4 h-4 text-villa-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  {/* Price overlay on mobile */}
                  <div className="absolute bottom-3 right-3 md:hidden">
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
                      <span className="font-bold">${Number(villa.pricePerNight).toFixed(0)}</span>
                      <span className="text-muted-foreground text-xs">/night</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-foreground group-hover:text-villa-gold transition-colors line-clamp-1">
                      {villa.name}
                    </h3>
                  </div>

                  {/* Location */}
                  {villa.location && (
                    <p className="text-muted-foreground text-sm flex items-center gap-1 mb-3">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="line-clamp-1">{villa.location}</span>
                    </p>
                  )}

                  {/* Amenities */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {villa.maxGuests}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4" />
                      {villa.bedrooms}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Bath className="w-4 h-4" />
                      {villa.bathrooms}
                    </span>
                  </div>

                  {/* Price - Desktop */}
                  <div className="mt-auto pt-3 border-t border-border/50 hidden md:block">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold">
                        ${Number(villa.pricePerNight).toFixed(0)}
                      </span>
                      <span className="text-muted-foreground text-sm">/ night</span>
                      {nights > 0 && (
                        <span className="text-muted-foreground text-sm ml-auto">
                          ${(Number(villa.pricePerNight) * nights).toFixed(0)} total
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
