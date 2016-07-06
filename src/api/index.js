const apiUrl = 'http://localhost:8080';

function formatParams(paramsObj) {
	let paramStr = '',
		paramArr = [];

	for( let key of Object.keys(paramsObj) ) {
		if( paramsObj[key] !== undefined )
		{
			paramArr.push(encodeURIComponent(key) + '=' + encodeURIComponent(paramsObj[key]));
		}
	}

	if( paramArr.length > 0 ) {
		paramStr = '?' + paramArr.join('&');
	}

	return paramStr;
}

class CommitsApi {
	static getList(start, limit) {
		if( !(parseInt(start, 10) > 0) ) {
			start = 0;
		}

		if( !(parseInt(limit, 10) > 0) ) {
			limit = 25;
		}

		return new Promise((resolve, reject) => {
			let xhr = new XMLHttpRequest(),
				params = {
					start: start,
					limit: limit
				};

			xhr.open('GET', apiUrl + '/commits' + formatParams(params));
			xhr.send();

			xhr.onload = function () {
				if (this.status >= 200 && this.status < 300) {
					try {
						let json = JSON.parse(this.response);
						resolve(json);
					}
					catch(ex) {
						reject('Invalid JSON');
					}
				}
				else
				{
					reject(this.statusText);
				}
			};
			xhr.onerror = function () {
				reject(this.statusText);
			};
		});
	}

	static saveMessage(sha, message) {
		return new Promise((resolve, reject) => {
			let xhr = new XMLHttpRequest();

			xhr.open('PATCH', apiUrl + '/commits/' + sha + '/commit');
			xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
			xhr.send(JSON.stringify({message:message}));

			xhr.onload = function () {
				if (this.status >= 200 && this.status < 300) {
					try {
						let json = JSON.parse(this.response);
						resolve(json);
					}
					catch(ex) {
						reject('Invalid JSON');
					}
				}
				else
				{
					reject(this.statusText);
				}
			};
			xhr.onerror = function () {
				reject(this.statusText);
			};
		});
	}
}

module.exports = CommitsApi;
