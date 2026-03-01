/**
 * Backend API root. In production, Nginx proxies only /api to this app; this page is not served to users.
 */
export default function BackendRoot() {
  return (
    <main style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <p>d38shop Backend API</p>
      <p>Use /api/products, /api/promoted, /api/admin/*</p>
    </main>
  );
}
