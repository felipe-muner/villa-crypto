export interface Villa {
  id: string;
  name: string;
  platform: "airbnb" | "booking" | "both";
  airbnbCalendarUrl?: string;
  bookingCalendarUrl?: string;
  location?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookedPeriod {
  start: Date;
  end: Date;
  summary?: string;
}

export interface VillaAvailability {
  villaId: string;
  villaName: string;
  platform: string;
  bookedPeriods: BookedPeriod[];
  lastChecked: Date;
}

export interface AvailabilityCheck {
  date: Date;
  isAvailable: boolean;
}

export interface VillaWithAvailability extends Villa {
  availability?: {
    airbnb?: BookedPeriod[];
    booking?: BookedPeriod[];
    lastChecked?: string;
  };
}
