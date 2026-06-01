"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedForm } from "@/components/forms/FeedForm";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Feed } from "@/lib/types/database";
import type { FeedFormValues } from "@/lib/validation/schemas";

type FeedFormData = FeedFormValues & {
  tags?: string;
};

function tagsFromString(tags?: string): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function FeedsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingFeed, setEditingFeed] = useState<Feed | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { data: feeds = [], isLoading, isError } = useQuery<Feed[]>({
    queryKey: ["feeds", "list"],
    queryFn: async () => {
      const res = await fetch("/api/feeds");
      if (!res.ok) throw new Error("Failed to fetch feeds");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FeedFormData) => {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          tags: tagsFromString(values.tags),
        }),
      });
      if (!res.ok) throw new Error("Failed to create feed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds", "list"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: FeedFormData;
    }) => {
      const res = await fetch(`/api/feeds?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          tags: tagsFromString(values.tags),
        }),
      });
      if (!res.ok) throw new Error("Failed to update feed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds", "list"] });
      setEditingFeed(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/feeds?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete feed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds", "list"] });
    },
  });

  return (
    <DashboardLayout title="Feeds">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Feeds</h2>
            <p className="text-muted-foreground">{feeds.length} configured RSS feeds</p>
          </div>
          <Button onClick={() => setShowForm(true)} disabled={showForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Feed
          </Button>
        </div>

        {(showForm || editingFeed) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {editingFeed ? "Edit Feed" : "New Feed"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FeedForm
                defaultValues={
                  editingFeed
                    ? {
                        name: editingFeed.name,
                        url: editingFeed.url,
                        category: editingFeed.category ?? "",
                        tags: editingFeed.tags.join(", "),
                        enabled: editingFeed.enabled,
                      }
                    : undefined
                }
                onSubmit={async (values) => {
                  if (editingFeed) {
                    await updateMutation.mutateAsync({
                      id: editingFeed.id,
                      values: values as FeedFormData,
                    });
                  } else {
                    await createMutation.mutateAsync(values as FeedFormData);
                  }
                }}
                onCancel={() => {
                  setShowForm(false);
                  setEditingFeed(null);
                }}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
              />
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="text-muted-foreground text-sm py-8 text-center">
            Loading feeds…
          </div>
        )}

        {isError && (
          <div className="py-8 text-center text-destructive text-sm">
            Failed to load feeds.
          </div>
        )}

        {!isLoading && !isError && feeds.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-lg font-medium">No feeds configured</p>
            <p className="text-sm mt-1">Add a feed to start monitoring RSS sources.</p>
          </div>
        )}

        {!isLoading && !isError && feeds.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Last Fetched</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeds.map((feed) => (
                  <TableRow key={feed.id}>
                    <TableCell className="font-medium">{feed.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      <a
                        href={feed.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {feed.url}
                      </a>
                    </TableCell>
                    <TableCell>
                      {feed.category ? (
                        <Badge variant="secondary">{feed.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={feed.enabled ? "success" : "outline"}>
                        {feed.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(feed.last_fetched_at)}
                    </TableCell>
                    <TableCell>
                      <div className="relative flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingFeed(feed);
                            setShowForm(false);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setConfirmDeleteId(feed.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                        {confirmDeleteId === feed.id && (
                          <div className="absolute right-0 z-10 mt-1 rounded-md border bg-card shadow-lg p-3 flex flex-col gap-2 min-w-[180px]">
                            <p className="text-xs text-foreground">Delete &ldquo;{feed.name}&rdquo;?</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1 h-7 text-xs"
                                onClick={() => {
                                  deleteMutation.mutate(feed.id);
                                  setConfirmDeleteId(null);
                                }}
                              >
                                Delete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-7 text-xs"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
