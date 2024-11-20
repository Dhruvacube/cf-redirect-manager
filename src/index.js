// https://github.com/kristianfreeman/lilredirector

import redirector from 'lilredirector';
import redirects from './redirects';

export default {
	async fetch(event, env, ctx) {
		let url = new URL(event.url);
		const redirect_manager = '/redirector';
		if (url.pathname === '/') {
			if (url.pathname.endsWith('/')) {
				return Response.redirect(url.href.slice(0, -1) + redirect_manager, 301);
			}
			return Response.redirect(url.href + redirect_manager, 301);
		} //Base url to redirection manager url


		//redirection by the manager
		event.request = event;
		const { response, error } = await redirector(
			event,
			redirects, {
				baseUrl: redirect_manager,
				basicAuthentication: {
					username: env.USERNAME,
					password: env.PASSWORD
				}
			})
		if (response) return response

		// Optionally, return an error response
		if (error) return error
	},
};
