var stream = process.stdin,
	buf = '';

stream.setEncoding('utf8');
stream.on('data', function(chunk) {
	buf += chunk;
});
stream.on('end', function() {
	var list = JSON.parse(buf);
	convertToHTML(list);
});

function convertToHTML(list) {
	console.log('<html><head><title>MejorEnVO</title><style>img{width:16px;height:16px}</style></head>');
	console.log('<body><h1>MejorEnVO</h1><ol>');

	var filtered = list.filter(likedMovie);
	sort(filtered).forEach(function(movie) {
		var subs = movie.subs + '?' + movie.torrentName.split(/_(20|19)\d\d_/).pop();
		var qname = encodeURIComponent(movie.name);

		console.log('<li><h2><a href="'+movie.url+'" target="_blank">'+icon('mejorenvo')+movie.name+'</a></h2><ul>');
		if (movie.score) console.log('<li>Puntaje: <b>'+movie.score.toFixed(1)+'</b></li>');
		if (movie.genres && movie.genres.length) console.log('<li>Generos: '+movie.genres.join(', ')+'</li>');
		if (movie.quality) console.log('<li>Calidad: '+movie.quality+'</li>');
		console.log('<li><a href="'+movie.torrent+'">'+icon('bitcomet')+'torrent</a></li>');
		console.log('<li><a href="'+subs+'" target="_blank">'+icon('subswiki')+'subs</a></li>');
		console.log('<li><a href="http://www.imdb.com/find?s=all&q='+qname+'" target="_blank">'+icon('imdb')+'imdb</a></li>');
		console.log('<li><a href="https://www.youtube.com/results?search_query='+qname+'+trailer" target="_blank">'+icon('youtube')+'trailer</a></li>');
		console.log('</ul></li>');
	});

	console.log('</ol>');
	console.log('<small>'+(list.length-filtered.length)+' peliculas fueron ignoradas por puntaje o genero</small>');
	console.log('</body></html>');
}

function sort(list) {
	return list.sort(function(a, b) {
		// Sort by score descending
		return b.score - a.score;
	});
}

const UNDESIRED_GENRES_RE = /Documental|Terror|Western/;

function likedMovie(movie) {
	if (movie.score < 6) return false;
	if (UNDESIRED_GENRES_RE.test(movie.genres.join(','))) return false;
	return true;
}

function icon(domain) {
	return '<img src="http://'+domain+'.com/favicon.ico" /> ';
}
