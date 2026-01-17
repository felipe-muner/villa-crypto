"use client";

import { useEffect, useState, use, useCallback } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Home, CheckCircle, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: invitation, isLoading: loading, error: queryError } = trpc.invitation.getByToken.useQuery(
    { token },
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const acceptMutation = trpc.invitation.accept.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        router.push("/host");
      }, 2000);
    },
    onError: (err) => {
      setError(err.message || "Failed to accept invitation");
    },
  });

  // Set error from query
  useEffect(() => {
    if (queryError) {
      setError(queryError.message || "Invalid invitation");
    }
  }, [queryError]);

  const acceptInvitation = useCallback(() => {
    setError(null);
    acceptMutation.mutate({ token });
  }, [acceptMutation, token]);

  // Auto-accept if logged in with matching email
  useEffect(() => {
    if (
      session?.user?.email &&
      invitation?.email &&
      session.user.email.toLowerCase() === invitation.email.toLowerCase() &&
      invitation.status === "pending" &&
      !acceptMutation.isPending &&
      !success
    ) {
      acceptInvitation();
    }
  }, [session, invitation, acceptInvitation, acceptMutation.isPending, success]);

  const handleSignIn = () => {
    signIn("google", { callbackUrl: `/invite/${token}` });
  };

  const accepting = acceptMutation.isPending;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push("/")}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Welcome, Host!</h2>
            <p className="text-muted-foreground mb-4">
              Your invitation has been accepted. Redirecting to your host dashboard...
            </p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation?.status === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invitation Already Accepted</h2>
            <p className="text-muted-foreground mb-6">
              This invitation has already been used.
            </p>
            <Button onClick={() => router.push("/host")}>Go to Host Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
            <Home className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Host Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            You&apos;ve been invited to become a host on Villa Crypto. List your
            villas and accept crypto payments from guests worldwide.
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Invitation for</p>
            <p className="font-medium">{invitation?.email}</p>
          </div>

          {status === "loading" ? (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : session?.user?.email ? (
            session.user.email.toLowerCase() === invitation?.email.toLowerCase() ? (
              <Button
                onClick={acceptInvitation}
                disabled={accepting}
                className="w-full"
                size="lg"
              >
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  "Accept Invitation"
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    You&apos;re signed in as <strong>{session.user.email}</strong>, but
                    this invitation is for <strong>{invitation?.email}</strong>.
                  </AlertDescription>
                </Alert>
                <Button
                  variant="outline"
                  onClick={() => signIn("google", { callbackUrl: `/invite/${token}` })}
                  className="w-full"
                >
                  Sign in with different account
                </Button>
              </div>
            )
          ) : (
            <Button onClick={handleSignIn} className="w-full" size="lg">
              Sign in with Google to Accept
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
