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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import { trpc } from "@/lib/trpc/client";

interface BookedDate {
  checkIn: string;
  checkOut: string;
}

interface BlockedDateRange {
  startDate: string;
  endDate: string;
}

interface BookingFormProps {
  villaId: string;
  pricePerNight: number;
  maxGuests: number;
  bookedDates: BookedDate[];
  blockedDates?: BlockedDateRange[];
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}

interface PriceConversion {
  amount: number;
  decimals: number;
  price: number;
}

type CryptoCurrencyOption = "btc" | "eth" | "usdt_eth" | "usdt_bsc";

const cryptoOptions: { value: CryptoCurrencyOption; label: string; symbol: string; icon: string }[] = [
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
  blockedDates = [],
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
  const [cryptoCurrency, setCryptoCurrency] = useState<"btc" | "eth" | "usdt_eth" | "usdt_bsc">("btc");
  const [conversions, setConversions] = useState<Record<string, PriceConversion> | null>(null);

  const createBooking = trpc.booking.create.useMutation({
    onSuccess: (data) => {
      showToast.created("Booking");
      router.push(`/bookings/${data.id}`);
    },
    onError: (error) => {
      showToast.error(error.message);
    },
  });

  const nights =
    checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const totalPrice = nights * pricePerNight;

  const minDate = addDays(new Date(), 1);

  const { data: pricesData } = trpc.prices.get.useQuery(
    { amount: totalPrice },
    {
      enabled: totalPrice > 0,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (pricesData?.conversions) {
      setConversions(pricesData.conversions);
    }
  }, [pricesData]);

  const isDateBooked = (date: Date): boolean => {
    const dayStart = startOfDay(date);

    // Check if date is in a booked range
    const isBooked = bookedDates.some((booking) => {
      const checkInDate = startOfDay(parseISO(booking.checkIn));
      const checkOutDate = startOfDay(parseISO(booking.checkOut));
      return isWithinInterval(dayStart, {
        start: checkInDate,
        end: addDays(checkOutDate, -1),
      });
    });

    if (isBooked) return true;

    // Check if date is in a blocked range
    const isBlocked = blockedDates.some((blocked) => {
      const startDate = startOfDay(parseISO(blocked.startDate));
      const endDate = startOfDay(parseISO(blocked.endDate));
      return isWithinInterval(dayStart, {
        start: startDate,
        end: endDate,
      });
    });

    return isBlocked;
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
      showToast.error("Please select check-in and check-out dates");
      return;
    }

    if (nights <= 0) {
      showToast.error("Check-out must be after check-in");
      return;
    }

    if (hasOverlap()) {
      showToast.error("Selected dates overlap with existing bookings");
      return;
    }

    createBooking.mutate({
      villaId,
      checkIn: format(checkIn, "yyyy-MM-dd"),
      checkOut: format(checkOut, "yyyy-MM-dd"),
      guests: parseInt(guests),
      cryptoCurrency,
    });
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
        disabled={createBooking.isPending || nights <= 0}
        className="w-full"
        size="lg"
      >
        {createBooking.isPending ? (
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
