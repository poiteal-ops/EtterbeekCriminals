# Google Search Console Setup

Google Search Console reports how Google discovers, crawls, and indexes this site. It does not require Google Analytics or a tracking script on the website.

## Verify the domain

1. Sign in at https://search.google.com/search-console using the Google account that should own the property.
2. Choose **Add property** and select **Domain**.
3. Enter `thieffrycriminals.be` without `https://` or a path.
4. Copy the TXT record Google supplies into the DNS control panel for the domain.
5. Wait for DNS propagation, then select **Verify** in Search Console.

Do not send Google or DNS-provider passwords to a coding agent. Do not put account credentials or DNS values in this repository. Limit Search Console access to the people who maintain the site.

Official verification guidance: https://support.google.com/webmasters/answer/9008080

## Submit and inspect

Perform these steps after the SEO deployment is live:

1. Open **Sitemaps** and submit `https://thieffrycriminals.be/sitemap.xml`.
2. Confirm that the sitemap status becomes **Success**.
3. Open **URL Inspection** and inspect `https://thieffrycriminals.be/`.
4. Select **Test live URL** and confirm that page fetch and indexing are allowed.
5. Select **Request indexing** once for the homepage.
6. Inspect `https://thieffrycriminals.be/about/` and verify that Google sees HTTP `200`, the expected title, and the rendered page.

Official URL Inspection guidance: https://support.google.com/webmasters/answer/9012289

## Check results

- Allow at least one week after sitemap submission and the indexing request before treating non-appearance as a defect.
- Check **Page indexing** for excluded URLs and their stated reasons.
- Check **Performance** for the query `thieffry criminals` after impressions begin.
- Do not repeatedly request indexing; fix the reported cause when Search Console identifies one.
- Indexing and ranking are Google decisions and cannot be guaranteed by this project.
