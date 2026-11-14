"use client";

import { useEffect, useState } from "react";

import { getWarehouseTransfers } from "@/lib/inventory-api";
import type { OperationsStockTransfer } from "@/utils/types/inventory";

import FulfillmentMetrics from "@/elements/fulfillments/FulfillmentMetrics";
import FulfillmentTable from "@/elements/fulfillments/FulfillmentTable";
import TransferDetailsDrawer from "@/elements/fulfillments/TransferDetailsDrawer";

interface Props {
  warehouseId: string;
  searchTerm: string;
  refreshKey: number;
  onLoadingChange: (loading: boolean) => void;
  onUpdated: (date: Date) => void;
}

export default function FulfillmentScreen({
  warehouseId,
  searchTerm,
  refreshKey,
  onLoadingChange,
  onUpdated,
}: Props) {
  const [transfers, setTransfers] =
    useState<OperationsStockTransfer[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError("");
      onLoadingChange(true);

      try {
        const records = new Map<string, OperationsStockTransfer>();
        let page = 1;
        let totalPages = 1;

        do {
          const result = await getWarehouseTransfers(
            warehouseId,
            { page, limit: 50 },
            { signal: controller.signal },
          );

          if (
            !Array.isArray(result?.data) ||
            !Number.isInteger(result.pagination?.totalPages) ||
            result.pagination.totalPages < 0
          ) {
            throw new Error("Invalid transfer response.");
          }

          for (const transfer of result.data) {
            if (!Array.isArray(transfer.items)) {
              throw new Error("Transfer response is missing stock items.");
            }

            records.set(transfer.id, {
              ...transfer,
              items: transfer.items,
            });
          }

          totalPages = result.pagination.totalPages;
          page++;
        } while (page <= totalPages);

        if (controller.signal.aborted) return;

        setTransfers([...records.values()]);
        onUpdated(new Date());
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load transfers.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          onLoadingChange(false);
        }
      }
    };

    void load();

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
      <FulfillmentMetrics
        transfers={transfers}
        loading={loading}
        failed={Boolean(error)}
      />

      <FulfillmentTable
        transfers={transfers}
        searchTerm={searchTerm}
        loading={loading}
        error={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        onView={setSelectedId}
      />

      {selectedId && (
        <TransferDetailsDrawer
          key={selectedId}
          transferId={selectedId}
          warehouseId={warehouseId}
          onClose={() => setSelectedId(null)}
          onChanged={() => setReloadKey((value) => value + 1)}
        />
      )}
    </div>
  );
}