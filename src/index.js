// https://github.com/kristianfreeman/lilredirector
// https://github.com/Dhruvacube/lilredirector
import redirector from 'lilredirector';

export default {
	async fetch(event, env, _) {
		let url = new URL(event.url);
		let urlhref = url.href;
		const redirect_manager = '/redirector';
		if (url.pathname.endsWith('/')) {
			url.href = url.href.slice(0, -1);
			urlhref = url.href.slice(0, -1);
		}
		if (url.pathname === '/') {
			return Response.redirect(urlhref + redirect_manager, 301);
		} //Base url to redirection manager url
		if (event.method === 'POST' && url.pathname.startsWith(redirect_manager)) {
			let body = await event.json();
			let operation = body.operation;
			let path = body.path;
			let redirect = body.redirect;
			if (operation === 'ADD') {
				try {
					await env.DATASTORE.put(path, redirect);
					const value = await env.BINDING_NAME.get(path);
					if (value === null) {
						return new Response('Value not found', { status: 404 });
					}

					return Response.redirect(url.href + redirect_manager, 201);
				} catch (err) {
					// In a production application, you could instead choose to retry your KV
					// read or fall back to a default code path.
					return new Response(err, { status: 500 });
				}
			}
			if (operation === 'DELETE') {
				await env.DATASTORE.delete(path);
				return Response.redirect(url.href + redirect_manager, 201);
			}
		}

		//redirection by the manager
		event.request = event;
		let redirectsKeys = await env.DATASTORE.list();
		let redirects = await Promise.all(redirectsKeys.keys.map(async (a) => {
			let dictionary = {};
			dictionary['path'] = a.name;
			dictionary['redirect'] = await env.DATASTORE.get(a.name);
			return dictionary;
		}));
		const { response, error } = await redirector(
			event,
			redirects, {
				baseUrl: redirect_manager,
				basicAuthentication: {
					username: env.USERNAME,
					password: env.PASSWORD
				},
				htmlExtras: [
					`<button type="button" onClick="(function(){
							path=prompt('Enter the path','/users/:id/posts/:post_id');
							redirectpath=prompt('Enter the redirection path','/u/:id/p/:post_id');
							if (!confirm('Are you sure you want to enter the following details?\\nPath: '+path+'\\nRedirect: '+redirectpath)) {
								return false;
							}
							fetch('${url.href}', { //http://127.0.0.1:8787/redirector
							method: 'POST',
							body: JSON.stringify({
									operation: 'ADD',
									path: path,
									redirect: redirectpath
								}),
								headers: {
									'Content-type': 'application/json; charset=UTF-8'
								}
							}).then((response) => response.json()).then((json) => alert(path+' --> '+redirect+' added!'));
    					return false;
})();return false;" class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">Add new redirect path</button>`,

					`<button type="button" onClick="(function(){
							path=prompt('Enter the path','/users/:id/posts/:post_id');
							if (!confirm('Are you sure you want to delete the following path?\\n'+path)) {
								return false;
							}
							fetch('${url.href}', { //http://127.0.0.1:8787/redirector
							method: 'POST',
							body: JSON.stringify({
									operation: 'DELETE',
									path: path,
								}),
								headers: {
									'Content-type': 'application/json; charset=UTF-8'
								}
							}).then((response) => response.json()).then((json) => alert(path+' deleted!'));
    					return false;
})();return false;" class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">Delete a redirect</button>`
				]
			})
		if (response) return response

		// Optionally, return an error response
		if (error) return error
	},
};
