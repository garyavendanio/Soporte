import globalAPI from './global';
import hooksAPI from './hooks';
import stateAPI from './state';
import instanceAPI from './instance';
import componentAPI from './component';
import * as util from 'utilities';

const TAGSX = function (options) {
    this._init(options);
};

TAGSX.util = util;
TAGSX.data = '__TAGSX__';
TAGSX.prefix = 'x-';
TAGSX.options = {};

globalAPI(TAGSX);
hooksAPI(TAGSX);
stateAPI(TAGSX);
componentAPI(TAGSX);
instanceAPI(TAGSX);

export default TAGSX;
