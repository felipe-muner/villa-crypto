"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  UserPlus,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { trpc } from "@/lib/trpc/client";

export default function HostsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const utils = trpc.useUtils();

  const { data: invitations = [], isLoading: loading } = trpc.admin.invitations.list.useQuery();

  const createInvitation = trpc.admin.invitations.create.useMutation({
    onSuccess: () => {
      showToast.success("Invitation Sent", `Invitation sent to ${email}`);
      setEmail("");
      setName("");
      setDialogOpen(false);
      utils.admin.invitations.list.invalidate();
    },
    onError: (error) => {
      showToast.error(error.message);
    },
  });

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    createInvitation.mutate({ email, name: name || undefined });
  };

  const getStatusBadge = (status: string, expiresAt: Date) => {
    const isExpired = new Date() > expiresAt && status === "pending";

    if (status === "accepted") {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Accepted
        </Badge>
      );
    }

    if (isExpired || status === "expired") {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const stats = {
    total: invitations.length,
    pending: invitations.filter(
      (i) => i.status === "pending" && new Date() <= i.expiresAt
    ).length,
    accepted: invitations.filter((i) => i.status === "accepted").length,
    expired: invitations.filter(
      (i) =>
        i.status === "expired" ||
        (i.status === "pending" && new Date() > i.expiresAt)
    ).length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Host Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite and manage villa hosts
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Host
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSendInvitation}>
              <DialogHeader>
                <DialogTitle>Invite New Host</DialogTitle>
                <DialogDescription>
                  Send an invitation email to a new host. They&apos;ll receive a
                  link to accept and join the platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="host@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used to personalize the invitation email
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createInvitation.isPending}>
                  {createInvitation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Invitations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.accepted}
            </div>
            <p className="text-sm text-muted-foreground">Accepted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {stats.expired}
            </div>
            <p className="text-sm text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
      </div>

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invitations sent yet</p>
              <p className="text-sm mt-1">
                Click &quot;Invite Host&quot; to send your first invitation
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.email}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invitation.status, invitation.expiresAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invitation.invitedBy}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(invitation.createdAt, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invitation.status === "accepted"
                        ? format(invitation.acceptedAt!, "MMM d, yyyy")
                        : format(invitation.expiresAt, "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
