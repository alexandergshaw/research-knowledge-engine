"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  savedQuerySchema,
  type SavedQueryFormValues,
} from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoryDropdown } from "@/components/taxonomy/CategoryDropdown";
import { SubcategoryDropdown } from "@/components/taxonomy/SubcategoryDropdown";
import { useCategories, isValidSubcategory } from "@/lib/hooks/useCategories";

interface QueryFormProps {
  defaultValues?: Partial<SavedQueryFormValues>;
  onSubmit: (values: SavedQueryFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

export function QueryForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitError = null,
}: QueryFormProps) {
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories ?? [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SavedQueryFormValues>({
    resolver: zodResolver(savedQuerySchema),
    defaultValues: {
      active: true,
      category: "",
      subcategory: "",
      ...defaultValues,
    },
  });

  const category = watch("category") ?? "";
  const subcategory = watch("subcategory") ?? "";

  // Clear a subcategory that no longer belongs to the selected category so an
  // invalid combination can never be submitted.
  useEffect(() => {
    if (subcategory && !isValidSubcategory(categories, category, subcategory)) {
      setValue("subcategory", "");
    }
  }, [category, subcategory, categories, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" placeholder="e.g. Weekly AI safety digest" {...register("title")} />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="query">Query *</Label>
        <Textarea
          id="query"
          rows={4}
          placeholder="Describe what to research, e.g. latest developments in RAG evaluation"
          {...register("query")}
        />
        {errors.query && (
          <p className="text-sm text-destructive">{errors.query.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <CategoryDropdown
              value={field.value ?? ""}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subcategory">Subcategory</Label>
        <Controller
          control={control}
          name="subcategory"
          render={({ field }) => (
            <SubcategoryDropdown
              category={category}
              value={field.value ?? ""}
              onChange={field.onChange}
            />
          )}
        />
        <p className="text-xs text-muted-foreground">
          Options update automatically based on the selected category.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="active"
          className="rounded"
          {...register("active")}
        />
        <Label htmlFor="active">Active</Label>
      </div>

      {submitError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {submitError}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save Query"}
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
