/**
 * "Powered by CRM Dost" — pinned to the bottom of every page. Pages are a
 * column at least one screen tall (see `.cd-page` in globals.css) and this
 * footer takes `margin-top: auto`, so on a short page it sits at the bottom
 * of the screen instead of right under the content.
 */
export default function Footer() {
  return (
    <footer style={{ marginTop: 'auto', borderTop: '1px solid #F0EDE8', background: '#fff', padding: '18px 24px calc(18px + env(safe-area-inset-bottom))' }}>
      <a
        href="https://crmdost.com"
        target="_blank"
        rel="noopener"
        aria-label="Powered by CRM Dost"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, minHeight: 44, color: '#A8A29B', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
      >
        <span>Powered by</span>
        <img src="/crm-dost-logo.svg" alt="" style={{ display: 'block', height: 26 }} />
      </a>
    </footer>
  );
}
