"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { getWarehouseStockRequests } from "@/lib/inventory-api";

import type {
  OperationsStockRequest,
} from "@/utils/types/inventory";

import StockRequestMetrics from "@/elements/stockrequest/StockRequestMetrics";
import StockRequestTable from "@/elements/stockrequest/StockRequestTable";
import StockRequestDrawer from "@/elements/stockrequest/StockRequestDrawer";

interface StockRequestScreenProps {
  warehouseId: string;
  searchTerm: string;
  refreshKey: number;
  onLoadingChange: (loading: boolean) => void;
  onUpdated: (date: Date) => void;
}

export default function StockRequestScreen({
  warehouseId,
  searchTerm,
  refreshKey,
  onLoadingChange,
  onUpdated,
}: StockRequestScreenProps) {
  const [requests, setRequests] = useState<OperationsStockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedRequestId, setSelectedRequestId] =
    useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadRequests = async () => {
      setLoading(true);
      setError("");
      onLoadingChange(true);

      try {
        const records = new Map<string, OperationsStockRequest>();

        let page = 1;
        let totalPages = 1;

        do {
          const result = await getWarehouseStockRequests(
            warehouseId,
            { page, limit: 50 },
            { signal: controller.signal },
          );

          if (
            !Array.isArray(result?.data) ||
            !Number.isInteger(result.pagination?.totalPages) ||
            result.pagination.totalPages < 0
          ) {
            throw new Error("Invalid stock request response.");
          }

          for (const request of result.data) {
            if (!Array.isArray(request.items)) {
              throw new Error(
                "Stock request response is missing its stock items.",
              );
            }

            records.set(request.id, {
              ...request,
              items: request.items,
            });
          }

          totalPages = result.pagination.totalPages;
          page++;
        } while (page <= totalPages);

        if (controller.signal.aborted) return;

        setRequests([...records.values()]);
        onUpdated(new Date());
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load stock requests.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          onLoadingChange(false);
        }
      }
    };

    void loadRequests();

    return () => controller.abort();
  }, [
    warehouseId,
    refreshKey,
    reloadKey,
    onLoadingChange,
    onUpdated,
  ]);

  return (
    <div className="animate-fade-in space-y-6 p-6">
      <StockRequestMetrics
        requests={requests}
        loading={loading}
        failed={Boolean(error)}
      />

      {success && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300"
        >
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss notification"
            className="rounded p-1 hover:bg-emerald-500/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <StockRequestTable
        requests={requests}
        searchTerm={searchTerm}
        loading={loading}
        error={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        onView={(requestId) => {
          setSuccess("");
          setSelectedRequestId(requestId);
        }}
      />

      {selectedRequestId && (
        <StockRequestDrawer
          key={selectedRequestId}
          requestId={selectedRequestId}
          warehouseId={warehouseId}
          onClose={() => setSelectedRequestId(null)}
          onSaved={(message) => {
            setSelectedRequestId(null);
            setSuccess(message);
            setReloadKey((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}