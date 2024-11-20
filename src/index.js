// https://github.com/kristianfreeman/lilredirector

import redirector from 'lilredirector';
import redirects from './redirects';


export default {
	async fetch(event, env, ctx) {
		event.request = event;
		console.log(redirects);
		const { response, error } = await redirector(
			event,
			redirects, {
				baseUrl: `/redirector`,
				basicAuthentication: {
					username: env.USERNAME,
					password: env.PASSWORD
				}
			})
		console.log(response);
		if (response) return response

		// Optionally, return an error response
		if (error) return error
		// const base = "https://example.com";
		// const statusCode = 301;
		//
		// const source = new URL(request.url);
		// const destination = new URL(source.pathname, base);
		// return Response.redirect(destination.toString(), statusCode);
	},
};
