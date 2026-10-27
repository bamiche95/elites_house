export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}) {
  return (
    <script
      type="application/ld+json"
      // Schema.org payloads are generated server-side from trusted store data.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
