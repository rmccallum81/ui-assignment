import './styles/styles.scss';

((window, document, undefined) => {
	const CommitsApi = require('./api');

	let commitsPerPage = 25,
		currentPage = 1;

	function formatDate(date) {
		let working = new Date(date);

		// Invalid date return blank
		if( isNaN(working) ) {
			return '';
		}

		return working.toLocaleDateString() + ' ' + working.toLocaleTimeString();
	}

	function sanitize(value) {
		// Change possibly dangerous content to HTML encoded
		let sanitized = String(value).replace(/[\u00A0-\u9999<>\&]/gim, function(c) {
			return '&#' + c.charCodeAt(0) + ';';
		});

		return sanitized;
	}

	function addHandler(selector, eventName, handler) {
		// Helper for adding event handlers to dynamic content
		let elem = this.querySelector(selector);

		if( elem )
		{
			elem.addEventListener(eventName, handler);
		}
	}

	function updateValue(selector, value) {
		let cell = this.querySelector(selector);

		if( cell )
		{
			cell.innerHTML = value;
		}
	}

	function updateFileList(fileList) {
		let ul = this.querySelector('.file-list > ul');

		// Clear the list
		ul.innerHTML = '';

		if( ul === null ) {
			return;
		}

		// Add each file item to the list
		fileList.forEach((item, index, arr) => {
			let li = document.createElement('li'),
				a = document.createElement('a');

			li.classList.add('status-' + sanitize(item.status));
			a.innerText = sanitize(item.filename);
			a.href = '#' + item.sha;
			li.appendChild(a);

			// Click to display the patch contents
			addHandler.call(li, 'a', 'click', (event) => {
				event.preventDefault();
				event.stopPropagation();
				let li = event.target.parentElement,
					patchText = patchDesc.querySelector('#patch-text');

				if( li.contains(patchDesc) ) {
					li.removeChild(patchDesc);
				} else {
					patchText.innerText = li.title;
					li.appendChild(patchDesc);
				}

			});

			// Add patch contents to the element
			li.title = sanitize(item.patch) || 'No patch contents available';

			ul.appendChild(li);
		});
	}

	function updateRow() {
		let data = this.data,
			messageSubStr = sanitize(data.commit.message.substring(0, 50));

		// Add an ellipsis if more content is available
		if( data.commit.message.length > 50 )
		{
			messageSubStr += '&hellip;';
		}

		// Update cell contents
		updateValue.call(this, '.author', sanitize(data.commit.author.name));
		updateValue.call(this, '.commit-time', formatDate(sanitize(data.commit.author.date)));
		updateValue.call(this, '.message p',  messageSubStr);
		updateValue.call(this, '.changes > .additions', '+' + sanitize(data.stats.additions));
		updateValue.call(this, '.changes > .deletions', '-' + sanitize(data.stats.deletions));
		updateFileList.call(this, data.files);
	}

	function createRow(data, template) {
		let row = template.cloneNode(true);

		row.id = sanitize(data.sha);
		row.data = data;

		updateRow.call(row);

		addHandler.call(row, '.message > p', 'click', editMessage);
		addHandler.call(row, '.file-list > ul.expandable', 'click', toggleList);

		return row;
	}

	function toggleList(event) {
		this.classList.toggle('expand');
	}

	function editMessage(event) {
		// Remove editor from any other row
		if( messageEditor.target )
		{
			cancelEdit(event);
		}

		messageEditor.target = this.parentElement;
		messageEditor.original = this.parentElement.replaceChild(messageEditor, this);
		messageEditor.data = messageEditor.target.parentElement.data;

		messageEditor.textarea.value = sanitize(messageEditor.data.commit.message);
	}

	function cancelEdit(event) {
		if( messageEditor.data.commit.message != messageEditor.textarea.value )
		{
			messageEditor.data.commit.message = messageEditor.textarea.value;
			messageEditor.target.parentElement.classList.add('edited');
		}

		messageEditor.target.replaceChild(messageEditor.original, messageEditor);
		messageEditor.target = undefined;
		messageEditor.original = undefined;
		messageEditor.data = undefined;
	}

	function saveEdit(event) {
		event.preventDefault();

		let row = messageEditor.target.parentElement,
			newMessage = messageEditor.textarea.value;

		CommitsApi.saveMessage(messageEditor.data.sha, newMessage).then((commit) => {
			row.data = commit;
			cancelEdit(event);
			row.classList.remove('edited');
			row.classList.add('saved');
			updateRow.call(row);
		});
	}

	function prevPage(event) {
		if( currentPage > 1 ) {
			loadCommits(commitsTable, rowTemplate, currentPage - 1);
		}
	}

	function nextPage(event) {
		loadCommits(commitsTable, rowTemplate, currentPage + 1);
	}

	function loadCommits(commitsTable, template, page) {
		page || (page = 1);
		let start = (page - 1) * commitsPerPage;

		console.log(page); // eslint-disable-line no-console

		CommitsApi.getList(start, commitsPerPage).then((commitList) => {
				if( commitList.length > 0 )
				{
					currentPage = page;

					commitsTable.innerHTML = '';

					for( let c of commitList ) {
						commitsTable.appendChild(createRow(c, template));
					}
				}
			},
			(error) => {
				alert(error);
			});
	}

	let commitsTable = document.getElementById('commits'),
		rowTemplate = commitsTable.removeChild(document.getElementById('row-template')),
		messageEditor = document.body.removeChild(document.getElementById('message-editor')),
		patchDesc = document.body.removeChild(document.getElementById('patch-desc'));

	messageEditor.textarea = messageEditor.querySelector('textarea');

	addHandler.call(messageEditor, '#cancel', 'click', cancelEdit);
	addHandler.call(messageEditor, 'form', 'submit', saveEdit);
	addHandler.call(document.querySelector('.pagination'), '#prev', 'click', prevPage);
	addHandler.call(document.querySelector('.pagination'), '#next', 'click', nextPage);

	document.body.addEventListener('click', () => {
		if( patchDesc.parentElement )
		{
			patchDesc.parentElement.removeChild(patchDesc);
		}
	});

	loadCommits(commitsTable, rowTemplate);
})(window, document);

// For webpack HMR
if (module.hot) {
  module.hot.accept();
}
