import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RESEND_API_KEY } from '$env/static/private';

// Rate limiting: max 3 requests per IP per 15 minutes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
	const now = Date.now();
	const record = rateLimitMap.get(ip);

	if (!record || now > record.resetTime) {
		rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
		return true;
	}

	if (record.count >= RATE_LIMIT_MAX) {
		return false;
	}

	record.count++;
	return true;
}

// Clean up old entries periodically
setInterval(
	() => {
		const now = Date.now();
		for (const [ip, record] of rateLimitMap.entries()) {
			if (now > record.resetTime) {
				rateLimitMap.delete(ip);
			}
		}
	},
	5 * 60 * 1000
); // Clean every 5 minutes

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		// Rate limit check
		const clientIp = getClientAddress();
		if (!checkRateLimit(clientIp)) {
			throw error(429, 'Too many requests. Please try again later.');
		}

		const { name, email, message, website } = await request.json();

		// Honeypot check - if filled, silently return success
		if (website) {
			return json({ success: true });
		}

		// Validate required fields
		if (!name?.trim()) {
			throw error(400, 'Name is required');
		}
		if (!email?.trim()) {
			throw error(400, 'Email is required');
		}
		if (!message?.trim()) {
			throw error(400, 'Message is required');
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw error(400, 'Please enter a valid email address');
		}

		if (!RESEND_API_KEY) {
			console.error('RESEND_API_KEY not configured');
			throw error(500, 'Email service not configured. Please try again later.');
		}

		// Send email via Resend
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${RESEND_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: 'Vane Contact <contact@vanerisk.com>',
				to: ['hello@vanerisk.com'],
				reply_to: email,
				subject: `Contact Form: ${name}`,
				html: `
					<h2>New Contact Form Submission</h2>
					<p><strong>Name:</strong> ${escapeHtml(name)}</p>
					<p><strong>Email:</strong> ${escapeHtml(email)}</p>
					<p><strong>Message:</strong></p>
					<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
				`
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error('Resend API error:', errorData);
			throw error(500, 'Failed to send message. Please try again.');
		}

		return json({ success: true });
	} catch (err) {
		console.error('Contact form error:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to send message. Please try again.');
	}
};

function escapeHtml(text: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	return text.replace(/[&<>"']/g, (char) => map[char]);
}
