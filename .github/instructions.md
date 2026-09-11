# CodePackr Developer & Script Guidelines

## 📜 Mandatory Script Tag Documentation Directive

Whenever adding, updating, or embedding external scripts, analytics tags, tracking pixels, ad services, or third-party widgets to `index.html` or any page/component template:

### The Rule
> **Before adding any script tag, you MUST first create a comment line describing why it is used and details in plain English for layman understanding.**

### Requirements:
1. **Explain the Purpose**: State clearly what the service is and why it is included on CodePackr.
2. **Layman-Friendly Details**: Use plain English avoiding obscure technical jargon (e.g., explain what container IDs mean, why noscript fallbacks are needed, or how ads fund site infrastructure).
3. **Identifier / Configuration**: Include the relevant identifier (e.g., Container ID `GTM-NK24VGVG`, Publisher ID `ca-pub-7526363571565796`, or Project ID).
4. **Placement**: Only after the comment line, add the script or noscript block.
5. **Zero Unexplained Scripts**: Never insert bare, uncommented `<script>` or `<noscript>` tags.

### Example:
```html
<!-- Google Tag Manager (GTM): A centralized tag management platform from Google that allows managing, updating, and deploying website measurement, analytics, and marketing tags without modifying source code directly. Container ID: GTM-NK24VGVG -->
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NK24VGVG');</script>
<!-- End Google Tag Manager -->
```

```html
<!-- Google Tag Manager (noscript): A fallback tracking iframe that records basic page visits for users who have disabled JavaScript execution in their web browser. Container ID: GTM-NK24VGVG -->
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NK24VGVG"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

---

## 🔒 Client-Side Privacy Mandate
- All developer tools and utilities must run 100% in the user's browser.
- Never transmit user payloads, code, tokens, or EDI documents to external servers.
