"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { importUrlSchema, type ImportUrlFormValues } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImportUrlForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ImportUrlFormValues>({
    resolver: zodResolver(importUrlSchema),
  });

  const mutation = useMutation({
    mutationFn: async (values: ImportUrlFormValues) => {
      const res = await fetch("/api/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error ?? "Failed to create import job");
      }
      return res.json();
    },
    onSuccess: () => {
      reset();
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">URL *</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://example.com/article"
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
          placeholder="e.g. technology, research, news"
          {...register("category")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          placeholder="comma-separated tags (e.g. ai, nlp, paper)"
          {...register("tags")}
        />
        <p className="text-xs text-muted-foreground">
          Separate multiple tags with commas
        </p>
      </div>

      {mutation.isSuccess && (
        <div className="p-3 rounded-md bg-green-50 text-green-800 text-sm">
          ✓ Import job created successfully. Check the Jobs page for status.
        </div>
      )}

      {mutation.isError && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {mutation.error?.message ?? "An error occurred"}
        </div>
      )}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Submitting…" : "Submit Import Job"}
      </Button>
    </form>
  );
}
