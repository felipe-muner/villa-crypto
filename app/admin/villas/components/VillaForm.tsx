"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Villa } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/ui/file-upload";
import { Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";
import { trpc } from "@/lib/trpc/client";

interface VillaFormProps {
  villa?: Villa;
  redirectPath?: string;
}

export function VillaForm({ villa, redirectPath = "/admin/villas" }: VillaFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: villa?.name || "",
    description: villa?.description || "",
    location: villa?.location || "",
    pricePerNight: villa?.pricePerNight ? String(villa.pricePerNight) : "",
    maxGuests: villa?.maxGuests || 1,
    bedrooms: villa?.bedrooms || 1,
    bathrooms: villa?.bathrooms || 1,
    amenities: villa?.amenities?.join(", ") || "",
    isActive: villa?.isActive ?? true,
  });

  const [images, setImages] = useState<string[]>(villa?.images || []);

  const createVilla = trpc.villa.create.useMutation({
    onSuccess: () => {
      showToast.success("Success", "Villa created successfully");
      router.push(redirectPath);
      router.refresh();
    },
    onError: (error) => {
      showToast.error(error.message);
    },
  });

  const updateVilla = trpc.villa.update.useMutation({
    onSuccess: () => {
      showToast.success("Success", "Villa updated successfully");
      router.push(redirectPath);
      router.refresh();
    },
    onError: (error) => {
      showToast.error(error.message);
    },
  });

  const isSubmitting = createVilla.isPending || updateVilla.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amenitiesArray = formData.amenities
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    const payload = {
      name: formData.name,
      description: formData.description || null,
      location: formData.location || null,
      pricePerNight: formData.pricePerNight,
      maxGuests: formData.maxGuests,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      amenities: amenitiesArray,
      images,
      isActive: formData.isActive,
    };

    if (villa) {
      updateVilla.mutate({ id: villa.id, data: payload });
    } else {
      createVilla.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="name">Villa Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerNight">Price per Night (USD) *</Label>
              <Input
                type="number"
                id="pricePerNight"
                required
                min="0"
                step="0.01"
                value={formData.pricePerNight}
                onChange={(e) =>
                  setFormData({ ...formData, pricePerNight: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Capacity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="maxGuests">Max Guests</Label>
              <Input
                type="number"
                id="maxGuests"
                min="1"
                value={formData.maxGuests}
                onChange={(e) =>
                  setFormData({ ...formData, maxGuests: parseInt(e.target.value) || 1 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                type="number"
                id="bedrooms"
                min="0"
                value={formData.bedrooms}
                onChange={(e) =>
                  setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                type="number"
                id="bathrooms"
                min="0"
                value={formData.bathrooms}
                onChange={(e) =>
                  setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Images</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            images={images}
            onChange={setImages}
          />
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Amenities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="amenities">Amenities (comma-separated)</Label>
          <Input
            id="amenities"
            value={formData.amenities}
            onChange={(e) =>
              setFormData({ ...formData, amenities: e.target.value })
            }
            placeholder="Pool, WiFi, Air conditioning, Kitchen..."
          />
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Active</Label>
              <p className="text-sm text-muted-foreground">
                Villa is active and available for booking
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : villa ? (
            "Update Villa"
          ) : (
            "Create Villa"
          )}
        </Button>
      </div>
    </form>
  );
}
