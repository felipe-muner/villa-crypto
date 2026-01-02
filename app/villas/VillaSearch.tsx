"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format, addDays } from "date-fns";
import { Search, Users, Home, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";

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
    searchParams.get("checkIn") ? new Date(searchParams.get("checkIn")!) : undefined
  );
  const [checkOut, setCheckOut] = useState<Date | undefined>(
    searchParams.get("checkOut") ? new Date(searchParams.get("checkOut")!) : undefined
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
      {/* Search Form */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Check-in</label>
              <DatePicker
                date={checkIn}
                onSelect={(date) => {
                  setCheckIn(date);
                  if (checkOut && date && date >= checkOut) {
                    setCheckOut(undefined);
                  }
                }}
                placeholder="Select date"
                fromDate={minDate}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Check-out</label>
              <DatePicker
                date={checkOut}
                onSelect={setCheckOut}
                placeholder="Select date"
                fromDate={checkIn || minDate}
                disabled={(date) => (checkIn ? date <= checkIn : false)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Guests</label>
              <Select value={guests} onValueChange={setGuests}>
                <SelectTrigger>
                  <SelectValue placeholder="Guests" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} {n === 1 ? "guest" : "guests"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={handleSearch}
                disabled={!checkIn || !checkOut}
                className="flex-1"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              {searched && (
                <Button variant="outline" onClick={clearSearch} size="icon">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {searched && checkIn && checkOut && (
            <p className="mt-4 text-sm text-muted-foreground">
              Showing villas available from{" "}
              <span className="font-medium">{format(checkIn, "MMM d, yyyy")}</span>{" "}
              to{" "}
              <span className="font-medium">{format(checkOut, "MMM d, yyyy")}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-64 w-full" />
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : villas.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Home className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">
              {searched ? "No villas available" : "No villas found"}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {searched
                ? "Try different dates or fewer guests"
                : "Check back later for new listings"}
            </p>
          </CardContent>
        </Card>
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
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="relative h-64">
                  {villa.images && villa.images.length > 0 ? (
                    <Image
                      src={villa.images[0]}
                      alt={villa.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Home className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-2">{villa.name}</h2>
                  {villa.location && (
                    <p className="text-muted-foreground text-sm mb-4 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {villa.location}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {villa.maxGuests}
                      </span>
                      <span className="flex items-center">
                        <Home className="h-4 w-4 mr-1" />
                        {villa.bedrooms} bed
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        ${Number(villa.pricePerNight).toFixed(0)}
                      </p>
                      <p className="text-sm text-muted-foreground">per night</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
