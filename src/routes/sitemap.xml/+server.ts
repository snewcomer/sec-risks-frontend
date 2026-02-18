import type { RequestHandler } from '@sveltejs/kit';

const BASE_URL = 'https://vanerisk.com';

const pages = [
	{ path: '/', priority: '1.0', changefreq: 'weekly' },
	{ path: '/pricing', priority: '0.9', changefreq: 'monthly' },
	{ path: '/comparison', priority: '0.8', changefreq: 'monthly' },
	{ path: '/contact', priority: '0.6', changefreq: 'yearly' },
	{ path: '/sign-in', priority: '0.5', changefreq: 'yearly' },
	{ path: '/sign-up', priority: '0.5', changefreq: 'yearly' }
];

export const GET: RequestHandler = () => {
	const lastmod = new Date().toISOString().split('T')[0];

	const urls = pages
		.map(
			({ path, priority, changefreq }) => `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
		)
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`.trim();

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};
