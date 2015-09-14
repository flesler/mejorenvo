var Spider = require('node-spider'),
	lastPage = 0,
	continueCrawling = true,
	movies = [];

const MOVIE_PATH_RE = /descargar-.*?-(\d+)\.html$/;
const VALID_QUALITIES_RE = /HDRip|DVDRip/;
const DOMAIN = 'http://www.mejorenvo.com';
const MAX_PAGE = 15;
const END_ID = '12595';
const MAX_ITEMS = Infinity;

var spider = new Spider({
	headers: {
		'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36'
	},
	logs: process.stderr,
	done: output
});


function queueNextListing() {
	var page = ++lastPage;
	var url = DOMAIN+'/peliculas-p'+page+'.html';
	spider.queue(url, parseListing.bind(null, page));
}

function parseListing(page, doc) {
	doc.$('a').each(function() {
		var link = doc.$(this);

		var path = link.attr('href');
		var m = path && path.match(MOVIE_PATH_RE);
		// Invalid link
		if (!m) return;
		// Invalid quality
		if (ignoreMovieInListing(link)) return;

		if (m[1] === END_ID) {
			continueCrawling = false;
		}
		spider.queue(DOMAIN+path, parseMovie.bind(null, page));
	});

	if (continueCrawling && lastPage < MAX_PAGE) {
		queueNextListing();
	}
}

function ignoreMovieInListing(link) {
	var quality = link.siblings('span').first().html();
	return !VALID_QUALITIES_RE.test(quality);
}

function parseMovie(page, doc) {
	var $ = doc.$;
	var path = doc.url.replace(DOMAIN, '');
	var link = $('a[href="'+path+'"]');

	var movie = {name:link.text(), url:doc.url, page:page, time:new Date()};
	link.siblings('span').each(function() {
		var span = $(this);
		var text = span.text();
		if (~text.indexOf('IMDB')) {
			// IMDB Score
			movie.score = parseFloat(span.next().text());
		} else if (~text.indexOf('nero:')) {
			// Genres
			movie.genres = this.nextSibling.nodeValue.trim().split(' - ').map(fixEncoding);
		} else if (text === 'Formato:') {
			// Quality
			movie.quality = span.next().text();
		}
	});

	var torrent = $('a[href$="torrent=1"]');
	movie.torrent = doc.resolve(torrent.attr('href'));
	movie.torrentName = torrent.siblings('span').first().text().replace('.torrent', '');
	movie.subs = $('a[href*=subswiki]').attr('href');

	movies.push(movie);

	if (movies.length === MAX_ITEMS) {
		output();
	}
}

function fixEncoding(str) {
	// Poor man's code to fix wrong encoding without using iconv
	return str.replace(/Acci.+n/, 'Accion')
		.replace(/Ficci.+n/, 'Ficcion')
		.replace(/Animaci.+n/, 'Animacion')
		.replace(/Rom.+ntica/, 'Romantica')
		.replace(/Biogr.+fica/, 'Biografica')
		.replace(/Hist.+rico/, 'Historico')
		.replace(/Fantas.+a/, 'Fantasia');
}

process.on('exit', function() {
	console.log(JSON.stringify(movies, null, '\t'));
});

function output() {
	process.exit();
}

function interrupt() {
	console.error('Interrupted, flushing...');
	output();
}
// Interrupted flush what's buffered before exiting
process.on('SIGINT', interrupt);
process.on('SIGHUP', interrupt);
process.on('SIGTERM', interrupt);
// Fix CTRL+C on Windows (NOT working)
require('readline')
	.createInterface({input:process.stdin, output:process.stdout})
	.on('SIGINT', interrupt);

queueNextListing();