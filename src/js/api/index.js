import globalAPI from './global';
import hooksAPI from './hooks';
import stateAPI from './state';
import instanceAPI from './instance';
import componentAPI from './component';
import * as util from 'utilities';

const mytags = function (options) {
    this._init(options);
};

mytags.util = util;
mytags.data = '__mytags__';
mytags.prefix = 'x-';
mytags.options = {};

globalAPI(mytags);
hooksAPI(mytags);
stateAPI(mytags);
componentAPI(mytags);
instanceAPI(mytags);

export default mytags;
