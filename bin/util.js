const fs = require('fs');
const SVGO = require('svgo');
const rollup = require('rollup');
const uglify = require('uglify-js');
const {promisify} = require('util');
const html = require('rollup-plugin-html');
const buble = require('@rollup/plugin-buble');
const replace = require('@rollup/plugin-replace');
const alias = require('@rollup/plugin-alias');
const {basename, resolve} = require('path');

exports.validClassName = /[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/;

exports.glob = promisify(require('glob'));

const readFile = promisify(fs.readFile);
exports.read = async function (file, cb) {

    const data = await readFile(file, 'utf8');
    cb && cb(data);
    return data;

};

const writeFile = promisify(fs.writeFile);
exports.write = async function (dest, data) {

    const err = await writeFile(dest, data);

    if (err) {
        console.log(err);
        throw err;
    }

    exports.logFile(dest);

    return dest;

};

exports.logFile = async function (file) {
    const data = await exports.read(file);
    console.log(`${cyan(file)} ${getSize(data)}`);
};

exports.compile = async function (file, dest, {external, globals, name, aliases, replaces, minify = true}) {

    name = (name || '').replace(/[^\w]/g, '_');

    const bundle = await rollup.rollup({
        external,
        input: resolve(file),
        plugins: [
            replace(Object.assign({
                AUTHOR: 'Garyavendanio'
            }, replaces)),
            alias({
                entries: Object.assign({
                    'utilities': './src/js/util/index.js'
                }, aliases)
            }),
            html({
                include: '**/*.svg',
                htmlMinifierOptions: {
                    collapseWhitespace: true
                }
            }),
            buble({namedFunctionExpressions: false})
        ]
    });

    let {output: [{code, map}]} = await bundle.generate({
        globals,
        format: 'umd',
        amd: {id: `mytags${name}`.toLowerCase()},
        name: `mytags${exports.ucfirst(name)}`,
        sourcemap: !minify ? 'inline' : false
    });

    code = code.replace(/(>)\\n\s+|\\n\s+(<)/g, '$1 $2');

    return Promise.all([
        exports.write(`${dest}.js`, code + (!minify ? '\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,' + Buffer.from(map.toString()).toString('base64') : '')),
        minify ? exports.write(`${dest}.min.js`, uglify.minify(code).code) : null
    ])[0];

};

exports.icons = async function (src) {

    const svgo = new SVGO({

        plugins: [
            {removeViewBox: false},
            {
                cleanupNumericValues: {
                    floatPrecision: 3
                }
            },
            {convertPathData: false},
            {convertShapeToPath: false},
            {mergePaths: false},
            {removeDimensions: false},
            {removeStyleElement: false},
            {removeScriptElement: false},
            {removeUnknownsAndDefaults: false},
            {removeUselessStrokeAndFill: false}
        ]

    });
    const files = await exports.glob(src, {nosort: true});
    const icons = await Promise.all(files.map(async file => {
        const data = await exports.read(file);
        const {data: svg} = await svgo.optimize(data);
        return svg;
    }));

    return JSON.stringify(files.reduce((result, file, i) => {
        result[basename(file, '.svg')] = icons[i];
        return result;
    }, {}), null, '    ');

};

exports.ucfirst = function (str) {
    return str.length ? str.charAt(0).toUpperCase() + str.slice(1) : '';
};

function cyan(str) {
    return `\x1b[1m\x1b[36m${str}\x1b[39m\x1b[22m`;
}

function getSize(data) {
    return `${(data.length / 1024).toFixed(2)}kb`;
}
