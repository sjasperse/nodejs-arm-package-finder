var http = require('http')
	Q = require('q')
	_ = require('underscore'),
	readline = require('readline');

var versionsDeferred = Q.defer();
var versions = versionsDeferred.promise;

http.get({
		host: 'nodejs.org',
		path: '/dist/'
	}, function (res) {
		var body = ''
		console.log('STATUS: ' + res.statusCode);
	  	res.on('data', function (chunk) {
	    	body += chunk;
	  	});

	  	res.on('end', function () {

	  		var versions = [];

	  		var versionRegex = /v0.\d+.\d+/g;
	  		
	  		do {
	  			m = versionRegex.exec(body);
	  			if (m) {
	  				versions.push(m[0]);
	  			}
	  		} while (m);

	  		versionsDeferred.resolve(versions);
	  	});
	
	});

var files = [];
var versionsPromisedDeferrer = Q.defer();

var currentIndex = 0;

function processNext(head, tail) {
	console.log('HEAD: ' + head);

	var path = '/dist/' + head + '/';

	http.get({ host: 'nodejs.org', path: path },
		function (res) {
			var body = ''
			console.log('STATUS: ' + res.statusCode);
		  	res.on('data', function (chunk) {
		    	body += chunk;
		  	});

			res.on('error', function (err) {
				console.log(err);
			});

			res.on('close', function (err) {
				console.log('CLOSED: ' + path);
			});

			res.on('end', function () {
				console.log('END: ' + path);

		  		var tarRegex = /href="([^"]+)"/g;
		  		
		  		do {
		  			m = tarRegex.exec(body);
		  			if (m) {
		  				var file = m[1];
		  				if (file.match(/\.tar\.gz/) && file.match(/arm/)) {
			  				files.push(path + file);  					
		  				}

		  			}
		  		} while (m);

				if (tail.length > 0) {
					var newHead = tail[0];
					var newTail = _.rest(tail, 1);
					processNext(newHead, newTail);
				}
				else {
					versionsPromisedDeferrer.resolve();
				}
			});
		});

	console.log('REQUESTED: ' + path);

};

versions.then(function (versions) {
	var versionsSorted = _.sortBy(versions, function (version) { return version; });

	var head = versionsSorted[0];
	var tail = _.rest(versionsSorted, 1);

	processNext(head, tail);

});

versionsPromisedDeferrer.promise.then(function () {

	console.log(files);


	process.exit();
});

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("(enter to exit)", function () {

	rl.close();

	
	console.log(files);	
	process.exit();
});











