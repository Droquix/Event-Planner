import { useState } from 'react';
import type { VendorQuote } from './types';
import { useAbortableRequest } from '../../hooks/useAbortableRequest';

export function useVendorDrafts() {
  const [draftingVendorId, setDraftingVendorId] = useState<string | null>(null);
  const [vendorDrafts, setVendorDrafts] = useState<Record<string, { message: string; demo: boolean }>>({});
  const [copiedVendorId, setCopiedVendorId] = useState<string | null>(null);

  const draftRequest = useAbortableRequest<
    { category: string; missingInfo: string[]; vendorName?: string; vendorId: string },
    { data?: { message: string }; demo?: boolean }
  >(async (payload, signal) => {
    const res = await fetch('/api/vendor-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: payload.category,
        missingInfo: payload.missingInfo,
        vendorName: payload.vendorName,
      }),
      signal,
    });
    return res.json();
  });

  async function handleDraftMessage(vendor: VendorQuote, missing: string[]) {
    setDraftingVendorId(vendor.id);
    const json = await draftRequest.execute({
      category: vendor.category,
      missingInfo: missing,
      vendorName: vendor.name,
      vendorId: vendor.id,
    });
    setDraftingVendorId(null);
    if (json?.data?.message) {
      setVendorDrafts((prev) => ({
        ...prev,
        [vendor.id]: { message: json.data?.message ?? '', demo: json.demo ?? false },
      }));
    }
  }

  function handleCopy(vendorId: string, text: string) {
    void navigator.clipboard?.writeText(text);
    setCopiedVendorId(vendorId);
    setTimeout(() => setCopiedVendorId(null), 2500);
  }

  return {
    draftingVendorId,
    vendorDrafts,
    copiedVendorId,
    handleDraftMessage,
    handleCopy,
  };
}
