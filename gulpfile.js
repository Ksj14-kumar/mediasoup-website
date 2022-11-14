const path = require('path');
const fs = require('fs');
const del = require('del');
const gulp = require('gulp');
const rename = require('gulp-rename');
const shell = require('gulp-shell');
const replace = require('gulp-replace');
const sitemap = require('gulp-sitemap');
const browserify = require('browserify');
const stream = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const uglify = require('gulp-uglify-es').default;
const Octokit = require('@octokit/rest');
const rsync = require('rsyncwrapper');

const pkg = require('./package.json');
const octokit = Octokit();

/**
 * Filter tags with just X.Y.Z content.
 */
function getSemverVersions(tags)
{
	return tags.filter(tag => /^\d+\.\d+\.\d+$/.test(tag.name));
}

/**
 * Filter tags with just rust-X.Y.Z content.
 */
function getRustSemverVersions(tags)
{
	return tags.filter(tag => /^rust-\d+\.\d+\.\d+$/.test(tag.name));
}

gulp.task('clean', () =>
{
	return del([ '_site', '.sass-cache' ], { force: true });
});

gulp.task('browserify', () =>
{
	return browserify([path.join(__dirname, pkg.main)])
		.bundle()
		.pipe(stream(pkg.name + '.js'))
		.pipe(buffer())
		.pipe(uglify())
		.pipe(rename('site.js'))
		.pipe(gulp.dest('./js/'));
});

gulp.task('jekyll:build', shell.task(
	[ 'bundle exec jekyll build' ]
));

gulp.task('jekyll:watch', shell.task(
	[ 'bundle exec jekyll serve --host 0.0.0.0 -P 3001' ]
));

gulp.task('versions', async () =>
{
	let tags;

	tags = await octokit.repos.listTags({ owner:'versatica', repo:'mediasoup' });

	const mediasoupNodeVersion = getSemverVersions(tags.data)[0].name;
	console.log('"versions" task | mediasoup node:', mediasoupNodeVersion);

	const mediasoupRustVersion = getRustSemverVersions(tags.data)[0].name.replace(/^rust-/, '');
	console.log('"versions" task | mediasoup rust:', mediasoupRustVersion);

	tags = await octokit.repos.listTags({ owner:'versatica', repo:'mediasoup-client' });

	const mediasoupClientVersion = getSemverVersions(tags.data)[0].name;
	console.log('"versions" task | mediasoup-client:', mediasoupClientVersion);

	tags = await octokit.repos.listTags({ owner:'versatica', repo:'libmediasoupclient' });

	const libmediasoupclientVersion = getSemverVersions(tags.data)[0].name;
	console.log('"versions" task | libmediasoupclient:', libmediasoupclientVersion);

	tags = await octokit.repos.listTags({ owner:'versatica', repo:'mediasoup-client-aiortc' });

	const mediasoupClientAiortcVersion = getSemverVersions(tags.data)[0].name;
	console.log('"versions" task | mediasoup-client-aiortc:', mediasoupClientAiortcVersion);

	return gulp.src('_site/index.html')
		.pipe(replace(/__MEDIASOUP_NODE_VERSION__/g, `v${mediasoupNodeVersion}`))
		.pipe(replace(/__MEDIASOUP_RUST_VERSION__/g, `v${mediasoupRustVersion}`))
		.pipe(replace(/__MEDIASOUP_CLIENT_VERSION__/g, `v${mediasoupClientVersion}`))
		.pipe(replace(/__LIBMEDIASOUPCLIENT_VERSION__/g, `v${libmediasoupclientVersion}`))
		.pipe(replace(/__MEDIASOUP_CLIENT_AIORTC_VERSION__/g, `v${mediasoupClientAiortcVersion}`))
		.pipe(gulp.dest('./_site'));
});

gulp.task('sitemap', () =>
{
	return gulp.src('_site/**/*.html')
		.pipe(sitemap({ siteUrl: pkg.homepage }))
		.pipe(gulp.dest('./_site'));
});

gulp.task('rsync', (done) =>
{
	const options =
	{
		src	      : './_site/',
		dest      : 'vhost1-deploy:/var/www/mediasoup.org/',
		ssh       : true,
		recursive : true,
		deleteAll : true,
		args      : [ '--no-perms' ],
		onStdout  : (data) =>
		{
			console.log(String(data));
		},
		onStderr  : (data) =>
		{
			console.error(String(data));
		}
	};

	rsync(options, (error, stdout, stderr, cmd) =>
	{
		if (!error)
		{
			console.log(cmd + ' succeeded');
			done();
		}
		else
		{
			console.log(cmd + ' failed');
			done(error);
		}
	});
});

gulp.task('build', gulp.series('clean', 'browserify', 'jekyll:build', 'versions', 'sitemap'));

gulp.task('live', gulp.series('clean', 'browserify', 'jekyll:watch', 'versions'));

gulp.task('deploy', gulp.series('build', 'rsync'));

gulp.task('default', gulp.series('build'));
