"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  format,
  addDays,
  differenceInDays,
  isWithinInterval,
  parseISO,
  startOfDay,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Bitcoin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookedDate {
  checkIn: string;
  checkOut: string;
}

interface BookingFormProps {
  villaId: string;
  pricePerNight: number;
  maxGuests: number;
  bookedDates: BookedDate[];
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}

interface PriceConversion {
  amount: number;
  decimals: number;
  price: number;
}

const cryptoOptions = [
  { value: "btc", label: "Bitcoin", symbol: "BTC", icon: "₿" },
  { value: "eth", label: "Ethereum", symbol: "ETH", icon: "Ξ" },
  { value: "usdt_eth", label: "USDT (ETH)", symbol: "USDT", icon: "₮" },
  { value: "usdt_bsc", label: "USDT (BSC)", symbol: "USDT", icon: "₮" },
];

export function BookingForm({
  villaId,
  pricePerNight,
  maxGuests,
  bookedDates,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: BookingFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [checkIn, setCheckIn] = useState<Date | undefined>(
    initialCheckIn ? new Date(initialCheckIn) : undefined
  );
  const [checkOut, setCheckOut] = useState<Date | undefined>(
    initialCheckOut ? new Date(initialCheckOut) : undefined
  );
  const [guests, setGuests] = useState((initialGuests || 1).toString());
  const [cryptoCurrency, setCryptoCurrency] = useState("btc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversions, setConversions] = useState<Record<string, PriceConversion> | null>(null);

  const nights =
    checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const totalPrice = nights * pricePerNight;

  const minDate = addDays(new Date(), 1);

  useEffect(() => {
    if (totalPrice > 0) {
      fetch(`/api/prices?amount=${totalPrice}`)
        .then((res) => res.json())
        .then((data) => setConversions(data.conversions))
        .catch(console.error);
    }
  }, [totalPrice]);

  const isDateBooked = (date: Date): boolean => {
    const dayStart = startOfDay(date);
    return bookedDates.some((booking) => {
      const checkInDate = startOfDay(parseISO(booking.checkIn));
      const checkOutDate = startOfDay(parseISO(booking.checkOut));
      return isWithinInterval(dayStart, {
        start: checkInDate,
        end: addDays(checkOutDate, -1),
      });
    });
  };

  const hasOverlap = (): boolean => {
    if (!checkIn || !checkOut) return false;
    const start = startOfDay(checkIn);
    const end = startOfDay(checkOut);

    for (let d = start; d < end; d = addDays(d, 1)) {
      if (isDateBooked(d)) return true;
    }
    return false;
  };

  const handleSubmit = async () => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    if (!checkIn || !checkOut) {
      setError("Please select check-in and check-out dates");
      return;
    }

    if (nights <= 0) {
      setError("Check-out must be after check-in");
      return;
    }

    if (hasOverlap()) {
      setError("Selected dates overlap with existing bookings");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          villaId,
          checkIn: format(checkIn, "yyyy-MM-dd"),
          checkOut: format(checkOut, "yyyy-MM-dd"),
          guests: parseInt(guests),
          cryptoCurrency,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      router.push(`/bookings/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getCryptoAmount = () => {
    if (!conversions || totalPrice === 0) return null;

    switch (cryptoCurrency) {
      case "btc":
        return conversions.btc?.amount.toFixed(conversions.btc.decimals);
      case "eth":
        return conversions.eth?.amount.toFixed(conversions.eth.decimals);
      case "usdt_eth":
      case "usdt_bsc":
        return conversions.usdt?.amount.toFixed(conversions.usdt.decimals);
    }
  };

  const selectedCrypto = cryptoOptions.find((c) => c.value === cryptoCurrency);

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
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
            disabled={isDateBooked}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Check-out</label>
          <DatePicker
            date={checkOut}
            onSelect={setCheckOut}
            placeholder="Select date"
            fromDate={checkIn || minDate}
            disabled={(date) => (checkIn ? date <= checkIn : false) || isDateBooked(date)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Guests</label>
        <Select value={guests} onValueChange={setGuests}>
          <SelectTrigger>
            <SelectValue placeholder="Select guests" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <SelectItem key={n} value={n.toString()}>
                {n} {n === 1 ? "guest" : "guests"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Pay with</label>
        <div className="grid grid-cols-2 gap-2">
          {cryptoOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setCryptoCurrency(option.value)}
              className={cn(
                "p-3 rounded-lg border-2 text-center transition-all",
                cryptoCurrency === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <span className="text-xl">{option.icon}</span>
              <p className="text-xs text-muted-foreground mt-1">{option.label}</p>
            </button>
          ))}
        </div>
      </div>

      {nights > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>
                ${pricePerNight} × {nights} {nights === 1 ? "night" : "nights"}
              </span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <div className="text-right">
                <p>${totalPrice.toFixed(2)}</p>
                {getCryptoAmount() && (
                  <p className="text-sm font-normal text-muted-foreground">
                    ≈ {getCryptoAmount()} {selectedCrypto?.symbol}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading || nights <= 0}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : status !== "authenticated" ? (
          "Sign in to book"
        ) : (
          "Request Booking"
        )}
      </Button>

      {status !== "authenticated" && (
        <p className="text-center text-sm text-muted-foreground">
          You need to sign in with Google to book
        </p>
      )}
    </div>
  );
}
