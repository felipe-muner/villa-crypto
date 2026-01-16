"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  LogOut,
  Settings,
  Menu,
  Globe,
  Home,
  CalendarDays,
} from "lucide-react";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border/40">
      <div className="luxury-container">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-villa-gold to-villa-coral rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-gold transition-shadow duration-300">
              <span className="text-white font-serif font-bold text-lg">V</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-serif text-xl font-semibold text-foreground">
                Villa
              </span>
              <span className="font-serif text-xl font-semibold text-villa-gold">
                Crypto
              </span>
            </div>
          </Link>

          {/* Center Navigation - Desktop */}
          <nav className="hidden lg:flex items-center">
            <div className="flex items-center bg-secondary/50 rounded-full p-1.5 shadow-sm border border-border/50">
              <Link
                href="/villas"
                className="px-5 py-2.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-background rounded-full transition-all duration-200"
              >
                Explore Villas
              </Link>
              <div className="w-px h-6 bg-border/50" />
              <Link
                href="/villas"
                className="px-5 py-2.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-background rounded-full transition-all duration-200"
              >
                How it Works
              </Link>
              <div className="w-px h-6 bg-border/50" />
              <Link
                href="/villas"
                className="px-5 py-2.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-background rounded-full transition-all duration-200"
              >
                Crypto Payments
              </Link>
            </div>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Become a Host Link */}
            {session?.user && !session.user.isHost && (
              <Link
                href="/host"
                className="hidden md:block text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-secondary/50 px-4 py-2 rounded-full transition-all duration-200"
              >
                Become a Host
              </Link>
            )}

            {/* Globe Icon */}
            <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary/50 transition-colors duration-200">
              <Globe className="w-5 h-5 text-foreground/70" />
            </button>

            {/* User Menu */}
            {status === "loading" ? (
              <div className="h-12 w-24 rounded-full bg-muted animate-pulse" />
            ) : session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 h-12 pl-3 pr-2 rounded-full border-border/50 hover:shadow-md transition-all duration-200"
                  >
                    <Menu className="w-4 h-4 text-foreground/70" />
                    <Avatar className="h-8 w-8 border-2 border-villa-gold/20">
                      <AvatarImage
                        src={session.user.image || undefined}
                        alt={session.user.name || "User"}
                      />
                      <AvatarFallback className="bg-villa-gold/10 text-villa-gold font-medium">
                        {session.user.name?.[0] ||
                          session.user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 p-2 rounded-2xl shadow-luxury"
                  align="end"
                  sideOffset={8}
                >
                  <div className="px-3 py-3 mb-2 bg-secondary/30 rounded-xl">
                    <p className="font-medium text-foreground">
                      {session.user.name || "Welcome"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {session.user.email}
                    </p>
                  </div>

                  <DropdownMenuItem asChild className="rounded-lg py-2.5 cursor-pointer">
                    <Link href="/bookings" className="flex items-center">
                      <CalendarDays className="mr-3 h-4 w-4 text-muted-foreground" />
                      <span>My Bookings</span>
                    </Link>
                  </DropdownMenuItem>

                  {session.user.isHost && (
                    <DropdownMenuItem asChild className="rounded-lg py-2.5 cursor-pointer">
                      <Link href="/host" className="flex items-center">
                        <Home className="mr-3 h-4 w-4 text-muted-foreground" />
                        <span>Host Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {session.user.role === "admin" && (
                    <DropdownMenuItem asChild className="rounded-lg py-2.5 cursor-pointer">
                      <Link href="/admin" className="flex items-center">
                        <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="my-2" />

                  <DropdownMenuItem asChild className="rounded-lg py-2.5 cursor-pointer">
                    <Link href="/account" className="flex items-center">
                      <User className="mr-3 h-4 w-4 text-muted-foreground" />
                      <span>Account Settings</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="rounded-lg py-2.5 cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="hidden sm:inline-flex rounded-full px-5 font-medium"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="rounded-full px-5 font-medium bg-villa-gold hover:bg-villa-gold/90 text-villa-navy shadow-sm hover:shadow-md transition-all duration-200">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
