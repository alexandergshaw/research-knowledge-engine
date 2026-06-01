"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { feedSchema, type FeedFormValues } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FeedFormProps {
  defaultValues?: Partial<FeedFormValues>;
  onSubmit: (values: FeedFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function FeedForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: FeedFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FeedFormValues>({
    resolver: zodResolver(feedSchema),
    defaultValues: {
      enabled: true,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Feed Name *</Label>
        <Input id="name" placeholder="My RSS Feed" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">Feed URL *</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://example.com/feed.xml"
          {...register("url")}
        />
        {errors.url && (
          <p className="text-sm text-destructive">{errors.url.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          placeholder="e.g. technology"
          {...register("category")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          placeholder="comma-separated tags"
          {...register("tags")}
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="enabled" {...register("enabled")} className="rounded" />
        <Label htmlFor="enabled">Enabled</Label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save Feed"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
