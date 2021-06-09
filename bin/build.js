const path = require('path');
const glob = require('glob');
const util = require('./util');
const camelize = require('camelcase');
const argv = require('minimist')(process.argv.slice(2));

argv._.forEach(arg => {
    const tokens = arg.split('=');
    argv[tokens[0]] = tokens[1] || true;
});

const numArgs = Object.keys(argv).length;
argv.all = argv.all || numArgs <= 1; // no arguments passed, so compile all

const minify = !(argv.debug || argv.nominify || argv.d);

// -----

// map component build jobs
const components = glob.sync('src/js/components/!(index).js').reduce((components, file) => {

    const name = path.basename(file, '.js');

    components[name] = () =>
        util.compile(`${__dirname}/compile/component.js`, `dist/js/${name}`, {
            name,
            minify,
            external: ['mytags', 'utilities'],
            globals: {mytags: 'mytags', 'utilities': 'mytags.util'},
            aliases: {component: path.resolve(__dirname, '../src/js/components', name)},
            replaces: {NAME: `'${camelize(name)}'`}
        });

    return components;

}, {});

const steps = {

    core: () => util.compile('src/js/core.js', 'dist/js/core', {minify}),
    mytags: () => util.compile('src/js/app.js', 'dist/js/app', {minify}),
    icons: async () => util.compile('bin/compile/icons.js', 'dist/js/icons', {
        minify,
        name: 'icons',
        replaces: {ICONS: await util.icons('{src/images,custom}/icons/*.svg')}}
    )
};

if (argv.h || argv.help) {

    console.log(`build.js [componentA, componentB, ...] [-d | debug | nominify | development]
        available components:
            bundles: ${Object.keys(steps).join(', ')}
            components: ${Object.keys(components).join(', ')}
    `);

} else {

    let jobs = collectJobs();

    if (jobs.length === 0) {
        argv.all = true;
        jobs = collectJobs();
    }

}

function collectJobs() {

    // if parameter components is set or all or none(implicit all), add all components
    if (argv.components || argv.all) {
        Object.assign(argv, components);
    }

    // if parameter components is set or all or none(implicit all), add all steps
    if (argv.all) {
        Object.assign(argv, steps);
    }

    Object.assign(steps, components);

    // Object.keys(argv).forEach(step => components[step] && componentJobs.push(components[step]()));
    return Object.keys(argv)
        .filter(step => steps[step])
        .map(step =>
            steps[step]()
                .catch(({message}) => {
                    console.error(message);
                    process.exitCode = 1;
                })
    );
}
