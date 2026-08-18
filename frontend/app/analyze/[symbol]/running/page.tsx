"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

export default function RunningRedirect() {
  return (
    <Suspense fallback={<p className="text-mist">Opening job…</p>}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const params = useParams<{ symbol: string }>();
  const id = useSearchParams().get("id");
  useEffect(() => {
    if (id) router.replace(`/jobs/${id}`);
    else router.replace(`/analyze/${encodeURIComponent(params.symbol)}`);
  }, [id, params.symbol, router]);
  return <p className="text-mist">Opening job…</p>;
}
