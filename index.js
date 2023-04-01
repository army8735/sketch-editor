(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('stream'), require('buffer'), require('util')) :
    typeof define === 'function' && define.amd ? define(['stream', 'buffer', 'util'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.editor = factory(global.require$$0, global.require$$0$1, global.require$$1));
})(this, (function (require$$0, require$$0$1, require$$1) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var require$$0__default = /*#__PURE__*/_interopDefaultLegacy(require$$0);
    var require$$0__default$1 = /*#__PURE__*/_interopDefaultLegacy(require$$0$1);
    var require$$1__default = /*#__PURE__*/_interopDefaultLegacy(require$$1);

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var utf8$5 = {};

    var utils$q = {};

    var support$4 = {};

    var readableExports = {};
    var readable = {
      get exports(){ return readableExports; },
      set exports(v){ readableExports = v; },
    };

    var _processNextickArgs_2_0_1_processNextickArgsExports = {};
    var _processNextickArgs_2_0_1_processNextickArgs = {
      get exports(){ return _processNextickArgs_2_0_1_processNextickArgsExports; },
      set exports(v){ _processNextickArgs_2_0_1_processNextickArgsExports = v; },
    };

    var hasRequired_processNextickArgs_2_0_1_processNextickArgs;

    function require_processNextickArgs_2_0_1_processNextickArgs () {
    	if (hasRequired_processNextickArgs_2_0_1_processNextickArgs) return _processNextickArgs_2_0_1_processNextickArgsExports;
    	hasRequired_processNextickArgs_2_0_1_processNextickArgs = 1;

    	if (typeof process === 'undefined' ||
    	    !process.version ||
    	    process.version.indexOf('v0.') === 0 ||
    	    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
    	  _processNextickArgs_2_0_1_processNextickArgs.exports = { nextTick: nextTick };
    	} else {
    	  _processNextickArgs_2_0_1_processNextickArgs.exports = process;
    	}

    	function nextTick(fn, arg1, arg2, arg3) {
    	  if (typeof fn !== 'function') {
    	    throw new TypeError('"callback" argument must be a function');
    	  }
    	  var len = arguments.length;
    	  var args, i;
    	  switch (len) {
    	  case 0:
    	  case 1:
    	    return process.nextTick(fn);
    	  case 2:
    	    return process.nextTick(function afterTickOne() {
    	      fn.call(null, arg1);
    	    });
    	  case 3:
    	    return process.nextTick(function afterTickTwo() {
    	      fn.call(null, arg1, arg2);
    	    });
    	  case 4:
    	    return process.nextTick(function afterTickThree() {
    	      fn.call(null, arg1, arg2, arg3);
    	    });
    	  default:
    	    args = new Array(len - 1);
    	    i = 0;
    	    while (i < args.length) {
    	      args[i++] = arguments[i];
    	    }
    	    return process.nextTick(function afterTick() {
    	      fn.apply(null, args);
    	    });
    	  }
    	}
    	return _processNextickArgs_2_0_1_processNextickArgsExports;
    }

    var _isarray_1_0_0_isarray;
    var hasRequired_isarray_1_0_0_isarray;

    function require_isarray_1_0_0_isarray () {
    	if (hasRequired_isarray_1_0_0_isarray) return _isarray_1_0_0_isarray;
    	hasRequired_isarray_1_0_0_isarray = 1;
    	var toString = {}.toString;

    	_isarray_1_0_0_isarray = Array.isArray || function (arr) {
    	  return toString.call(arr) == '[object Array]';
    	};
    	return _isarray_1_0_0_isarray;
    }

    var eventsExports = {};
    var events = {
      get exports(){ return eventsExports; },
      set exports(v){ eventsExports = v; },
    };

    var hasRequiredEvents;

    function requireEvents () {
    	if (hasRequiredEvents) return eventsExports;
    	hasRequiredEvents = 1;

    	var R = typeof Reflect === 'object' ? Reflect : null;
    	var ReflectApply = R && typeof R.apply === 'function'
    	  ? R.apply
    	  : function ReflectApply(target, receiver, args) {
    	    return Function.prototype.apply.call(target, receiver, args);
    	  };

    	var ReflectOwnKeys;
    	if (R && typeof R.ownKeys === 'function') {
    	  ReflectOwnKeys = R.ownKeys;
    	} else if (Object.getOwnPropertySymbols) {
    	  ReflectOwnKeys = function ReflectOwnKeys(target) {
    	    return Object.getOwnPropertyNames(target)
    	      .concat(Object.getOwnPropertySymbols(target));
    	  };
    	} else {
    	  ReflectOwnKeys = function ReflectOwnKeys(target) {
    	    return Object.getOwnPropertyNames(target);
    	  };
    	}

    	function ProcessEmitWarning(warning) {
    	  if (console && console.warn) console.warn(warning);
    	}

    	var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
    	  return value !== value;
    	};

    	function EventEmitter() {
    	  EventEmitter.init.call(this);
    	}
    	events.exports = EventEmitter;
    	eventsExports.once = once;

    	// Backwards-compat with node 0.10.x
    	EventEmitter.EventEmitter = EventEmitter;

    	EventEmitter.prototype._events = undefined;
    	EventEmitter.prototype._eventsCount = 0;
    	EventEmitter.prototype._maxListeners = undefined;

    	// By default EventEmitters will print a warning if more than 10 listeners are
    	// added to it. This is a useful default which helps finding memory leaks.
    	var defaultMaxListeners = 10;

    	function checkListener(listener) {
    	  if (typeof listener !== 'function') {
    	    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
    	  }
    	}

    	Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    	  enumerable: true,
    	  get: function() {
    	    return defaultMaxListeners;
    	  },
    	  set: function(arg) {
    	    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
    	      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    	    }
    	    defaultMaxListeners = arg;
    	  }
    	});

    	EventEmitter.init = function() {

    	  if (this._events === undefined ||
    	      this._events === Object.getPrototypeOf(this)._events) {
    	    this._events = Object.create(null);
    	    this._eventsCount = 0;
    	  }

    	  this._maxListeners = this._maxListeners || undefined;
    	};

    	// Obviously not all Emitters should be limited to 10. This function allows
    	// that to be increased. Set to zero for unlimited.
    	EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
    	  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    	    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
    	  }
    	  this._maxListeners = n;
    	  return this;
    	};

    	function _getMaxListeners(that) {
    	  if (that._maxListeners === undefined)
    	    return EventEmitter.defaultMaxListeners;
    	  return that._maxListeners;
    	}

    	EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
    	  return _getMaxListeners(this);
    	};

    	EventEmitter.prototype.emit = function emit(type) {
    	  var args = [];
    	  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
    	  var doError = (type === 'error');

    	  var events = this._events;
    	  if (events !== undefined)
    	    doError = (doError && events.error === undefined);
    	  else if (!doError)
    	    return false;

    	  // If there is no 'error' event listener then throw.
    	  if (doError) {
    	    var er;
    	    if (args.length > 0)
    	      er = args[0];
    	    if (er instanceof Error) {
    	      // Note: The comments on the `throw` lines are intentional, they show
    	      // up in Node's output if this results in an unhandled exception.
    	      throw er; // Unhandled 'error' event
    	    }
    	    // At least give some kind of context to the user
    	    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    	    err.context = er;
    	    throw err; // Unhandled 'error' event
    	  }

    	  var handler = events[type];

    	  if (handler === undefined)
    	    return false;

    	  if (typeof handler === 'function') {
    	    ReflectApply(handler, this, args);
    	  } else {
    	    var len = handler.length;
    	    var listeners = arrayClone(handler, len);
    	    for (var i = 0; i < len; ++i)
    	      ReflectApply(listeners[i], this, args);
    	  }

    	  return true;
    	};

    	function _addListener(target, type, listener, prepend) {
    	  var m;
    	  var events;
    	  var existing;

    	  checkListener(listener);

    	  events = target._events;
    	  if (events === undefined) {
    	    events = target._events = Object.create(null);
    	    target._eventsCount = 0;
    	  } else {
    	    // To avoid recursion in the case that type === "newListener"! Before
    	    // adding it to the listeners, first emit "newListener".
    	    if (events.newListener !== undefined) {
    	      target.emit('newListener', type,
    	                  listener.listener ? listener.listener : listener);

    	      // Re-assign `events` because a newListener handler could have caused the
    	      // this._events to be assigned to a new object
    	      events = target._events;
    	    }
    	    existing = events[type];
    	  }

    	  if (existing === undefined) {
    	    // Optimize the case of one listener. Don't need the extra array object.
    	    existing = events[type] = listener;
    	    ++target._eventsCount;
    	  } else {
    	    if (typeof existing === 'function') {
    	      // Adding the second element, need to change to array.
    	      existing = events[type] =
    	        prepend ? [listener, existing] : [existing, listener];
    	      // If we've already got an array, just append.
    	    } else if (prepend) {
    	      existing.unshift(listener);
    	    } else {
    	      existing.push(listener);
    	    }

    	    // Check for listener leak
    	    m = _getMaxListeners(target);
    	    if (m > 0 && existing.length > m && !existing.warned) {
    	      existing.warned = true;
    	      // No error code for this since it is a Warning
    	      // eslint-disable-next-line no-restricted-syntax
    	      var w = new Error('Possible EventEmitter memory leak detected. ' +
    	                          existing.length + ' ' + String(type) + ' listeners ' +
    	                          'added. Use emitter.setMaxListeners() to ' +
    	                          'increase limit');
    	      w.name = 'MaxListenersExceededWarning';
    	      w.emitter = target;
    	      w.type = type;
    	      w.count = existing.length;
    	      ProcessEmitWarning(w);
    	    }
    	  }

    	  return target;
    	}

    	EventEmitter.prototype.addListener = function addListener(type, listener) {
    	  return _addListener(this, type, listener, false);
    	};

    	EventEmitter.prototype.on = EventEmitter.prototype.addListener;

    	EventEmitter.prototype.prependListener =
    	    function prependListener(type, listener) {
    	      return _addListener(this, type, listener, true);
    	    };

    	function onceWrapper() {
    	  if (!this.fired) {
    	    this.target.removeListener(this.type, this.wrapFn);
    	    this.fired = true;
    	    if (arguments.length === 0)
    	      return this.listener.call(this.target);
    	    return this.listener.apply(this.target, arguments);
    	  }
    	}

    	function _onceWrap(target, type, listener) {
    	  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
    	  var wrapped = onceWrapper.bind(state);
    	  wrapped.listener = listener;
    	  state.wrapFn = wrapped;
    	  return wrapped;
    	}

    	EventEmitter.prototype.once = function once(type, listener) {
    	  checkListener(listener);
    	  this.on(type, _onceWrap(this, type, listener));
    	  return this;
    	};

    	EventEmitter.prototype.prependOnceListener =
    	    function prependOnceListener(type, listener) {
    	      checkListener(listener);
    	      this.prependListener(type, _onceWrap(this, type, listener));
    	      return this;
    	    };

    	// Emits a 'removeListener' event if and only if the listener was removed.
    	EventEmitter.prototype.removeListener =
    	    function removeListener(type, listener) {
    	      var list, events, position, i, originalListener;

    	      checkListener(listener);

    	      events = this._events;
    	      if (events === undefined)
    	        return this;

    	      list = events[type];
    	      if (list === undefined)
    	        return this;

    	      if (list === listener || list.listener === listener) {
    	        if (--this._eventsCount === 0)
    	          this._events = Object.create(null);
    	        else {
    	          delete events[type];
    	          if (events.removeListener)
    	            this.emit('removeListener', type, list.listener || listener);
    	        }
    	      } else if (typeof list !== 'function') {
    	        position = -1;

    	        for (i = list.length - 1; i >= 0; i--) {
    	          if (list[i] === listener || list[i].listener === listener) {
    	            originalListener = list[i].listener;
    	            position = i;
    	            break;
    	          }
    	        }

    	        if (position < 0)
    	          return this;

    	        if (position === 0)
    	          list.shift();
    	        else {
    	          spliceOne(list, position);
    	        }

    	        if (list.length === 1)
    	          events[type] = list[0];

    	        if (events.removeListener !== undefined)
    	          this.emit('removeListener', type, originalListener || listener);
    	      }

    	      return this;
    	    };

    	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

    	EventEmitter.prototype.removeAllListeners =
    	    function removeAllListeners(type) {
    	      var listeners, events, i;

    	      events = this._events;
    	      if (events === undefined)
    	        return this;

    	      // not listening for removeListener, no need to emit
    	      if (events.removeListener === undefined) {
    	        if (arguments.length === 0) {
    	          this._events = Object.create(null);
    	          this._eventsCount = 0;
    	        } else if (events[type] !== undefined) {
    	          if (--this._eventsCount === 0)
    	            this._events = Object.create(null);
    	          else
    	            delete events[type];
    	        }
    	        return this;
    	      }

    	      // emit removeListener for all listeners on all events
    	      if (arguments.length === 0) {
    	        var keys = Object.keys(events);
    	        var key;
    	        for (i = 0; i < keys.length; ++i) {
    	          key = keys[i];
    	          if (key === 'removeListener') continue;
    	          this.removeAllListeners(key);
    	        }
    	        this.removeAllListeners('removeListener');
    	        this._events = Object.create(null);
    	        this._eventsCount = 0;
    	        return this;
    	      }

    	      listeners = events[type];

    	      if (typeof listeners === 'function') {
    	        this.removeListener(type, listeners);
    	      } else if (listeners !== undefined) {
    	        // LIFO order
    	        for (i = listeners.length - 1; i >= 0; i--) {
    	          this.removeListener(type, listeners[i]);
    	        }
    	      }

    	      return this;
    	    };

    	function _listeners(target, type, unwrap) {
    	  var events = target._events;

    	  if (events === undefined)
    	    return [];

    	  var evlistener = events[type];
    	  if (evlistener === undefined)
    	    return [];

    	  if (typeof evlistener === 'function')
    	    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

    	  return unwrap ?
    	    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
    	}

    	EventEmitter.prototype.listeners = function listeners(type) {
    	  return _listeners(this, type, true);
    	};

    	EventEmitter.prototype.rawListeners = function rawListeners(type) {
    	  return _listeners(this, type, false);
    	};

    	EventEmitter.listenerCount = function(emitter, type) {
    	  if (typeof emitter.listenerCount === 'function') {
    	    return emitter.listenerCount(type);
    	  } else {
    	    return listenerCount.call(emitter, type);
    	  }
    	};

    	EventEmitter.prototype.listenerCount = listenerCount;
    	function listenerCount(type) {
    	  var events = this._events;

    	  if (events !== undefined) {
    	    var evlistener = events[type];

    	    if (typeof evlistener === 'function') {
    	      return 1;
    	    } else if (evlistener !== undefined) {
    	      return evlistener.length;
    	    }
    	  }

    	  return 0;
    	}

    	EventEmitter.prototype.eventNames = function eventNames() {
    	  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
    	};

    	function arrayClone(arr, n) {
    	  var copy = new Array(n);
    	  for (var i = 0; i < n; ++i)
    	    copy[i] = arr[i];
    	  return copy;
    	}

    	function spliceOne(list, index) {
    	  for (; index + 1 < list.length; index++)
    	    list[index] = list[index + 1];
    	  list.pop();
    	}

    	function unwrapListeners(arr) {
    	  var ret = new Array(arr.length);
    	  for (var i = 0; i < ret.length; ++i) {
    	    ret[i] = arr[i].listener || arr[i];
    	  }
    	  return ret;
    	}

    	function once(emitter, name) {
    	  return new Promise(function (resolve, reject) {
    	    function errorListener(err) {
    	      emitter.removeListener(name, resolver);
    	      reject(err);
    	    }

    	    function resolver() {
    	      if (typeof emitter.removeListener === 'function') {
    	        emitter.removeListener('error', errorListener);
    	      }
    	      resolve([].slice.call(arguments));
    	    }
    	    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    	    if (name !== 'error') {
    	      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    	    }
    	  });
    	}

    	function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
    	  if (typeof emitter.on === 'function') {
    	    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
    	  }
    	}

    	function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
    	  if (typeof emitter.on === 'function') {
    	    if (flags.once) {
    	      emitter.once(name, listener);
    	    } else {
    	      emitter.on(name, listener);
    	    }
    	  } else if (typeof emitter.addEventListener === 'function') {
    	    // EventTarget does not have `error` event semantics like Node
    	    // EventEmitters, we do not listen for `error` events here.
    	    emitter.addEventListener(name, function wrapListener(arg) {
    	      // IE does not have builtin `{ once: true }` support so we
    	      // have to do it manually.
    	      if (flags.once) {
    	        emitter.removeEventListener(name, wrapListener);
    	      }
    	      listener(arg);
    	    });
    	  } else {
    	    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
    	  }
    	}
    	return eventsExports;
    }

    var streamExports = {};
    var stream = {
      get exports(){ return streamExports; },
      set exports(v){ streamExports = v; },
    };

    var hasRequiredStream;

    function requireStream () {
    	if (hasRequiredStream) return streamExports;
    	hasRequiredStream = 1;
    	(function (module) {
    		module.exports = require$$0__default["default"];
    } (stream));
    	return streamExports;
    }

    var _safeBuffer_5_1_2_safeBufferExports = {};
    var _safeBuffer_5_1_2_safeBuffer = {
      get exports(){ return _safeBuffer_5_1_2_safeBufferExports; },
      set exports(v){ _safeBuffer_5_1_2_safeBufferExports = v; },
    };

    /* eslint-disable node/no-deprecated-api */

    var hasRequired_safeBuffer_5_1_2_safeBuffer;

    function require_safeBuffer_5_1_2_safeBuffer () {
    	if (hasRequired_safeBuffer_5_1_2_safeBuffer) return _safeBuffer_5_1_2_safeBufferExports;
    	hasRequired_safeBuffer_5_1_2_safeBuffer = 1;
    	(function (module, exports) {
    		var buffer = require$$0__default$1["default"];
    		var Buffer = buffer.Buffer;

    		// alternative to using Object.keys for old browsers
    		function copyProps (src, dst) {
    		  for (var key in src) {
    		    dst[key] = src[key];
    		  }
    		}
    		if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
    		  module.exports = buffer;
    		} else {
    		  // Copy properties from require('buffer')
    		  copyProps(buffer, exports);
    		  exports.Buffer = SafeBuffer;
    		}

    		function SafeBuffer (arg, encodingOrOffset, length) {
    		  return Buffer(arg, encodingOrOffset, length)
    		}

    		// Copy static methods from Buffer
    		copyProps(Buffer, SafeBuffer);

    		SafeBuffer.from = function (arg, encodingOrOffset, length) {
    		  if (typeof arg === 'number') {
    		    throw new TypeError('Argument must not be a number')
    		  }
    		  return Buffer(arg, encodingOrOffset, length)
    		};

    		SafeBuffer.alloc = function (size, fill, encoding) {
    		  if (typeof size !== 'number') {
    		    throw new TypeError('Argument must be a number')
    		  }
    		  var buf = Buffer(size);
    		  if (fill !== undefined) {
    		    if (typeof encoding === 'string') {
    		      buf.fill(fill, encoding);
    		    } else {
    		      buf.fill(fill);
    		    }
    		  } else {
    		    buf.fill(0);
    		  }
    		  return buf
    		};

    		SafeBuffer.allocUnsafe = function (size) {
    		  if (typeof size !== 'number') {
    		    throw new TypeError('Argument must be a number')
    		  }
    		  return Buffer(size)
    		};

    		SafeBuffer.allocUnsafeSlow = function (size) {
    		  if (typeof size !== 'number') {
    		    throw new TypeError('Argument must be a number')
    		  }
    		  return buffer.SlowBuffer(size)
    		};
    } (_safeBuffer_5_1_2_safeBuffer, _safeBuffer_5_1_2_safeBufferExports));
    	return _safeBuffer_5_1_2_safeBufferExports;
    }

    var util$1 = {};

    var hasRequiredUtil;

    function requireUtil () {
    	if (hasRequiredUtil) return util$1;
    	hasRequiredUtil = 1;
    	// Copyright Joyent, Inc. and other Node contributors.
    	//
    	// Permission is hereby granted, free of charge, to any person obtaining a
    	// copy of this software and associated documentation files (the
    	// "Software"), to deal in the Software without restriction, including
    	// without limitation the rights to use, copy, modify, merge, publish,
    	// distribute, sublicense, and/or sell copies of the Software, and to permit
    	// persons to whom the Software is furnished to do so, subject to the
    	// following conditions:
    	//
    	// The above copyright notice and this permission notice shall be included
    	// in all copies or substantial portions of the Software.
    	//
    	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    	// USE OR OTHER DEALINGS IN THE SOFTWARE.

    	// NOTE: These type checking functions intentionally don't use `instanceof`
    	// because it is fragile and can be easily faked with `Object.create()`.

    	function isArray(arg) {
    	  if (Array.isArray) {
    	    return Array.isArray(arg);
    	  }
    	  return objectToString(arg) === '[object Array]';
    	}
    	util$1.isArray = isArray;

    	function isBoolean(arg) {
    	  return typeof arg === 'boolean';
    	}
    	util$1.isBoolean = isBoolean;

    	function isNull(arg) {
    	  return arg === null;
    	}
    	util$1.isNull = isNull;

    	function isNullOrUndefined(arg) {
    	  return arg == null;
    	}
    	util$1.isNullOrUndefined = isNullOrUndefined;

    	function isNumber(arg) {
    	  return typeof arg === 'number';
    	}
    	util$1.isNumber = isNumber;

    	function isString(arg) {
    	  return typeof arg === 'string';
    	}
    	util$1.isString = isString;

    	function isSymbol(arg) {
    	  return typeof arg === 'symbol';
    	}
    	util$1.isSymbol = isSymbol;

    	function isUndefined(arg) {
    	  return arg === void 0;
    	}
    	util$1.isUndefined = isUndefined;

    	function isRegExp(re) {
    	  return objectToString(re) === '[object RegExp]';
    	}
    	util$1.isRegExp = isRegExp;

    	function isObject(arg) {
    	  return typeof arg === 'object' && arg !== null;
    	}
    	util$1.isObject = isObject;

    	function isDate(d) {
    	  return objectToString(d) === '[object Date]';
    	}
    	util$1.isDate = isDate;

    	function isError(e) {
    	  return (objectToString(e) === '[object Error]' || e instanceof Error);
    	}
    	util$1.isError = isError;

    	function isFunction(arg) {
    	  return typeof arg === 'function';
    	}
    	util$1.isFunction = isFunction;

    	function isPrimitive(arg) {
    	  return arg === null ||
    	         typeof arg === 'boolean' ||
    	         typeof arg === 'number' ||
    	         typeof arg === 'string' ||
    	         typeof arg === 'symbol' ||  // ES6 symbol
    	         typeof arg === 'undefined';
    	}
    	util$1.isPrimitive = isPrimitive;

    	util$1.isBuffer = require$$0__default$1["default"].Buffer.isBuffer;

    	function objectToString(o) {
    	  return Object.prototype.toString.call(o);
    	}
    	return util$1;
    }

    var inheritsExports = {};
    var inherits = {
      get exports(){ return inheritsExports; },
      set exports(v){ inheritsExports = v; },
    };

    var inherits_browserExports = {};
    var inherits_browser = {
      get exports(){ return inherits_browserExports; },
      set exports(v){ inherits_browserExports = v; },
    };

    var hasRequiredInherits_browser;

    function requireInherits_browser () {
    	if (hasRequiredInherits_browser) return inherits_browserExports;
    	hasRequiredInherits_browser = 1;
    	if (typeof Object.create === 'function') {
    	  // implementation from standard node.js 'util' module
    	  inherits_browser.exports = function inherits(ctor, superCtor) {
    	    if (superCtor) {
    	      ctor.super_ = superCtor;
    	      ctor.prototype = Object.create(superCtor.prototype, {
    	        constructor: {
    	          value: ctor,
    	          enumerable: false,
    	          writable: true,
    	          configurable: true
    	        }
    	      });
    	    }
    	  };
    	} else {
    	  // old school shim for old browsers
    	  inherits_browser.exports = function inherits(ctor, superCtor) {
    	    if (superCtor) {
    	      ctor.super_ = superCtor;
    	      var TempCtor = function () {};
    	      TempCtor.prototype = superCtor.prototype;
    	      ctor.prototype = new TempCtor();
    	      ctor.prototype.constructor = ctor;
    	    }
    	  };
    	}
    	return inherits_browserExports;
    }

    var hasRequiredInherits;

    function requireInherits () {
    	if (hasRequiredInherits) return inheritsExports;
    	hasRequiredInherits = 1;
    	(function (module) {
    		try {
    		  var util = require('util');
    		  /* istanbul ignore next */
    		  if (typeof util.inherits !== 'function') throw '';
    		  module.exports = util.inherits;
    		} catch (e) {
    		  /* istanbul ignore next */
    		  module.exports = requireInherits_browser();
    		}
    } (inherits));
    	return inheritsExports;
    }

    var BufferListExports = {};
    var BufferList = {
      get exports(){ return BufferListExports; },
      set exports(v){ BufferListExports = v; },
    };

    var hasRequiredBufferList;

    function requireBufferList () {
    	if (hasRequiredBufferList) return BufferListExports;
    	hasRequiredBufferList = 1;
    	(function (module) {

    		function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    		var Buffer = require_safeBuffer_5_1_2_safeBuffer().Buffer;
    		var util = require$$1__default["default"];

    		function copyBuffer(src, target, offset) {
    		  src.copy(target, offset);
    		}

    		module.exports = function () {
    		  function BufferList() {
    		    _classCallCheck(this, BufferList);

    		    this.head = null;
    		    this.tail = null;
    		    this.length = 0;
    		  }

    		  BufferList.prototype.push = function push(v) {
    		    var entry = { data: v, next: null };
    		    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    		    this.tail = entry;
    		    ++this.length;
    		  };

    		  BufferList.prototype.unshift = function unshift(v) {
    		    var entry = { data: v, next: this.head };
    		    if (this.length === 0) this.tail = entry;
    		    this.head = entry;
    		    ++this.length;
    		  };

    		  BufferList.prototype.shift = function shift() {
    		    if (this.length === 0) return;
    		    var ret = this.head.data;
    		    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    		    --this.length;
    		    return ret;
    		  };

    		  BufferList.prototype.clear = function clear() {
    		    this.head = this.tail = null;
    		    this.length = 0;
    		  };

    		  BufferList.prototype.join = function join(s) {
    		    if (this.length === 0) return '';
    		    var p = this.head;
    		    var ret = '' + p.data;
    		    while (p = p.next) {
    		      ret += s + p.data;
    		    }return ret;
    		  };

    		  BufferList.prototype.concat = function concat(n) {
    		    if (this.length === 0) return Buffer.alloc(0);
    		    var ret = Buffer.allocUnsafe(n >>> 0);
    		    var p = this.head;
    		    var i = 0;
    		    while (p) {
    		      copyBuffer(p.data, ret, i);
    		      i += p.data.length;
    		      p = p.next;
    		    }
    		    return ret;
    		  };

    		  return BufferList;
    		}();

    		if (util && util.inspect && util.inspect.custom) {
    		  module.exports.prototype[util.inspect.custom] = function () {
    		    var obj = util.inspect({ length: this.length });
    		    return this.constructor.name + ' ' + obj;
    		  };
    		}
    } (BufferList));
    	return BufferListExports;
    }

    var destroy_1;
    var hasRequiredDestroy;

    function requireDestroy () {
    	if (hasRequiredDestroy) return destroy_1;
    	hasRequiredDestroy = 1;

    	/*<replacement>*/

    	var pna = require_processNextickArgs_2_0_1_processNextickArgs();
    	/*</replacement>*/

    	// undocumented cb() API, needed for core, not for public API
    	function destroy(err, cb) {
    	  var _this = this;

    	  var readableDestroyed = this._readableState && this._readableState.destroyed;
    	  var writableDestroyed = this._writableState && this._writableState.destroyed;

    	  if (readableDestroyed || writableDestroyed) {
    	    if (cb) {
    	      cb(err);
    	    } else if (err) {
    	      if (!this._writableState) {
    	        pna.nextTick(emitErrorNT, this, err);
    	      } else if (!this._writableState.errorEmitted) {
    	        this._writableState.errorEmitted = true;
    	        pna.nextTick(emitErrorNT, this, err);
    	      }
    	    }

    	    return this;
    	  }

    	  // we set destroyed to true before firing error callbacks in order
    	  // to make it re-entrance safe in case destroy() is called within callbacks

    	  if (this._readableState) {
    	    this._readableState.destroyed = true;
    	  }

    	  // if this is a duplex stream mark the writable part as destroyed as well
    	  if (this._writableState) {
    	    this._writableState.destroyed = true;
    	  }

    	  this._destroy(err || null, function (err) {
    	    if (!cb && err) {
    	      if (!_this._writableState) {
    	        pna.nextTick(emitErrorNT, _this, err);
    	      } else if (!_this._writableState.errorEmitted) {
    	        _this._writableState.errorEmitted = true;
    	        pna.nextTick(emitErrorNT, _this, err);
    	      }
    	    } else if (cb) {
    	      cb(err);
    	    }
    	  });

    	  return this;
    	}

    	function undestroy() {
    	  if (this._readableState) {
    	    this._readableState.destroyed = false;
    	    this._readableState.reading = false;
    	    this._readableState.ended = false;
    	    this._readableState.endEmitted = false;
    	  }

    	  if (this._writableState) {
    	    this._writableState.destroyed = false;
    	    this._writableState.ended = false;
    	    this._writableState.ending = false;
    	    this._writableState.finalCalled = false;
    	    this._writableState.prefinished = false;
    	    this._writableState.finished = false;
    	    this._writableState.errorEmitted = false;
    	  }
    	}

    	function emitErrorNT(self, err) {
    	  self.emit('error', err);
    	}

    	destroy_1 = {
    	  destroy: destroy,
    	  undestroy: undestroy
    	};
    	return destroy_1;
    }

    var node$1;
    var hasRequiredNode;

    function requireNode () {
    	if (hasRequiredNode) return node$1;
    	hasRequiredNode = 1;
    	/**
    	 * For Node.js, simply re-export the core `util.deprecate` function.
    	 */

    	node$1 = require$$1__default["default"].deprecate;
    	return node$1;
    }

    var _stream_writable;
    var hasRequired_stream_writable;

    function require_stream_writable () {
    	if (hasRequired_stream_writable) return _stream_writable;
    	hasRequired_stream_writable = 1;

    	/*<replacement>*/

    	var pna = require_processNextickArgs_2_0_1_processNextickArgs();
    	/*</replacement>*/

    	_stream_writable = Writable;

    	// It seems a linked list but it is not
    	// there will be only 2 of these for each stream
    	function CorkedRequest(state) {
    	  var _this = this;

    	  this.next = null;
    	  this.entry = null;
    	  this.finish = function () {
    	    onCorkedFinish(_this, state);
    	  };
    	}
    	/* </replacement> */

    	/*<replacement>*/
    	var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
    	/*</replacement>*/

    	/*<replacement>*/
    	var Duplex;
    	/*</replacement>*/

    	Writable.WritableState = WritableState;

    	/*<replacement>*/
    	var util = Object.create(requireUtil());
    	util.inherits = requireInherits();
    	/*</replacement>*/

    	/*<replacement>*/
    	var internalUtil = {
    	  deprecate: requireNode()
    	};
    	/*</replacement>*/

    	/*<replacement>*/
    	var Stream = requireStream();
    	/*</replacement>*/

    	/*<replacement>*/

    	var Buffer = require_safeBuffer_5_1_2_safeBuffer().Buffer;
    	var OurUint8Array = (typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {}).Uint8Array || function () {};
    	function _uint8ArrayToBuffer(chunk) {
    	  return Buffer.from(chunk);
    	}
    	function _isUint8Array(obj) {
    	  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
    	}

    	/*</replacement>*/

    	var destroyImpl = requireDestroy();

    	util.inherits(Writable, Stream);

    	function nop() {}

    	function WritableState(options, stream) {
    	  Duplex = Duplex || require_stream_duplex();

    	  options = options || {};

    	  // Duplex streams are both readable and writable, but share
    	  // the same options object.
    	  // However, some cases require setting options to different
    	  // values for the readable and the writable sides of the duplex stream.
    	  // These options can be provided separately as readableXXX and writableXXX.
    	  var isDuplex = stream instanceof Duplex;

    	  // object stream flag to indicate whether or not this stream
    	  // contains buffers or objects.
    	  this.objectMode = !!options.objectMode;

    	  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

    	  // the point at which write() starts returning false
    	  // Note: 0 is a valid value, means that we always return false if
    	  // the entire buffer is not flushed immediately on write()
    	  var hwm = options.highWaterMark;
    	  var writableHwm = options.writableHighWaterMark;
    	  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

    	  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

    	  // cast to ints.
    	  this.highWaterMark = Math.floor(this.highWaterMark);

    	  // if _final has been called
    	  this.finalCalled = false;

    	  // drain event flag.
    	  this.needDrain = false;
    	  // at the start of calling end()
    	  this.ending = false;
    	  // when end() has been called, and returned
    	  this.ended = false;
    	  // when 'finish' is emitted
    	  this.finished = false;

    	  // has it been destroyed
    	  this.destroyed = false;

    	  // should we decode strings into buffers before passing to _write?
    	  // this is here so that some node-core streams can optimize string
    	  // handling at a lower level.
    	  var noDecode = options.decodeStrings === false;
    	  this.decodeStrings = !noDecode;

    	  // Crypto is kind of old and crusty.  Historically, its default string
    	  // encoding is 'binary' so we have to make this configurable.
    	  // Everything else in the universe uses 'utf8', though.
    	  this.defaultEncoding = options.defaultEncoding || 'utf8';

    	  // not an actual buffer we keep track of, but a measurement
    	  // of how much we're waiting to get pushed to some underlying
    	  // socket or file.
    	  this.length = 0;

    	  // a flag to see when we're in the middle of a write.
    	  this.writing = false;

    	  // when true all writes will be buffered until .uncork() call
    	  this.corked = 0;

    	  // a flag to be able to tell if the onwrite cb is called immediately,
    	  // or on a later tick.  We set this to true at first, because any
    	  // actions that shouldn't happen until "later" should generally also
    	  // not happen before the first write call.
    	  this.sync = true;

    	  // a flag to know if we're processing previously buffered items, which
    	  // may call the _write() callback in the same tick, so that we don't
    	  // end up in an overlapped onwrite situation.
    	  this.bufferProcessing = false;

    	  // the callback that's passed to _write(chunk,cb)
    	  this.onwrite = function (er) {
    	    onwrite(stream, er);
    	  };

    	  // the callback that the user supplies to write(chunk,encoding,cb)
    	  this.writecb = null;

    	  // the amount that is being written when _write is called.
    	  this.writelen = 0;

    	  this.bufferedRequest = null;
    	  this.lastBufferedRequest = null;

    	  // number of pending user-supplied write callbacks
    	  // this must be 0 before 'finish' can be emitted
    	  this.pendingcb = 0;

    	  // emit prefinish if the only thing we're waiting for is _write cbs
    	  // This is relevant for synchronous Transform streams
    	  this.prefinished = false;

    	  // True if the error was already emitted and should not be thrown again
    	  this.errorEmitted = false;

    	  // count buffered requests
    	  this.bufferedRequestCount = 0;

    	  // allocate the first CorkedRequest, there is always
    	  // one allocated and free to use, and we maintain at most two
    	  this.corkedRequestsFree = new CorkedRequest(this);
    	}

    	WritableState.prototype.getBuffer = function getBuffer() {
    	  var current = this.bufferedRequest;
    	  var out = [];
    	  while (current) {
    	    out.push(current);
    	    current = current.next;
    	  }
    	  return out;
    	};

    	(function () {
    	  try {
    	    Object.defineProperty(WritableState.prototype, 'buffer', {
    	      get: internalUtil.deprecate(function () {
    	        return this.getBuffer();
    	      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    	    });
    	  } catch (_) {}
    	})();

    	// Test _writableState for inheritance to account for Duplex streams,
    	// whose prototype chain only points to Readable.
    	var realHasInstance;
    	if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
    	  realHasInstance = Function.prototype[Symbol.hasInstance];
    	  Object.defineProperty(Writable, Symbol.hasInstance, {
    	    value: function (object) {
    	      if (realHasInstance.call(this, object)) return true;
    	      if (this !== Writable) return false;

    	      return object && object._writableState instanceof WritableState;
    	    }
    	  });
    	} else {
    	  realHasInstance = function (object) {
    	    return object instanceof this;
    	  };
    	}

    	function Writable(options) {
    	  Duplex = Duplex || require_stream_duplex();

    	  // Writable ctor is applied to Duplexes, too.
    	  // `realHasInstance` is necessary because using plain `instanceof`
    	  // would return false, as no `_writableState` property is attached.

    	  // Trying to use the custom `instanceof` for Writable here will also break the
    	  // Node.js LazyTransform implementation, which has a non-trivial getter for
    	  // `_writableState` that would lead to infinite recursion.
    	  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    	    return new Writable(options);
    	  }

    	  this._writableState = new WritableState(options, this);

    	  // legacy.
    	  this.writable = true;

    	  if (options) {
    	    if (typeof options.write === 'function') this._write = options.write;

    	    if (typeof options.writev === 'function') this._writev = options.writev;

    	    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    	    if (typeof options.final === 'function') this._final = options.final;
    	  }

    	  Stream.call(this);
    	}

    	// Otherwise people can pipe Writable streams, which is just wrong.
    	Writable.prototype.pipe = function () {
    	  this.emit('error', new Error('Cannot pipe, not readable'));
    	};

    	function writeAfterEnd(stream, cb) {
    	  var er = new Error('write after end');
    	  // TODO: defer error events consistently everywhere, not just the cb
    	  stream.emit('error', er);
    	  pna.nextTick(cb, er);
    	}

    	// Checks that a user-supplied chunk is valid, especially for the particular
    	// mode the stream is in. Currently this means that `null` is never accepted
    	// and undefined/non-string values are only allowed in object mode.
    	function validChunk(stream, state, chunk, cb) {
    	  var valid = true;
    	  var er = false;

    	  if (chunk === null) {
    	    er = new TypeError('May not write null values to stream');
    	  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    	    er = new TypeError('Invalid non-string/buffer chunk');
    	  }
    	  if (er) {
    	    stream.emit('error', er);
    	    pna.nextTick(cb, er);
    	    valid = false;
    	  }
    	  return valid;
    	}

    	Writable.prototype.write = function (chunk, encoding, cb) {
    	  var state = this._writableState;
    	  var ret = false;
    	  var isBuf = !state.objectMode && _isUint8Array(chunk);

    	  if (isBuf && !Buffer.isBuffer(chunk)) {
    	    chunk = _uint8ArrayToBuffer(chunk);
    	  }

    	  if (typeof encoding === 'function') {
    	    cb = encoding;
    	    encoding = null;
    	  }

    	  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

    	  if (typeof cb !== 'function') cb = nop;

    	  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    	    state.pendingcb++;
    	    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
    	  }

    	  return ret;
    	};

    	Writable.prototype.cork = function () {
    	  var state = this._writableState;

    	  state.corked++;
    	};

    	Writable.prototype.uncork = function () {
    	  var state = this._writableState;

    	  if (state.corked) {
    	    state.corked--;

    	    if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
    	  }
    	};

    	Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
    	  // node::ParseEncoding() requires lower case.
    	  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
    	  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
    	  this._writableState.defaultEncoding = encoding;
    	  return this;
    	};

    	function decodeChunk(state, chunk, encoding) {
    	  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    	    chunk = Buffer.from(chunk, encoding);
    	  }
    	  return chunk;
    	}

    	Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
    	  // making it explicit this property is not enumerable
    	  // because otherwise some prototype manipulation in
    	  // userland will fail
    	  enumerable: false,
    	  get: function () {
    	    return this._writableState.highWaterMark;
    	  }
    	});

    	// if we're already writing something, then just put this
    	// in the queue, and wait our turn.  Otherwise, call _write
    	// If we return false, then we need a drain event, so set that flag.
    	function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
    	  if (!isBuf) {
    	    var newChunk = decodeChunk(state, chunk, encoding);
    	    if (chunk !== newChunk) {
    	      isBuf = true;
    	      encoding = 'buffer';
    	      chunk = newChunk;
    	    }
    	  }
    	  var len = state.objectMode ? 1 : chunk.length;

    	  state.length += len;

    	  var ret = state.length < state.highWaterMark;
    	  // we must ensure that previous needDrain will not be reset to false.
    	  if (!ret) state.needDrain = true;

    	  if (state.writing || state.corked) {
    	    var last = state.lastBufferedRequest;
    	    state.lastBufferedRequest = {
    	      chunk: chunk,
    	      encoding: encoding,
    	      isBuf: isBuf,
    	      callback: cb,
    	      next: null
    	    };
    	    if (last) {
    	      last.next = state.lastBufferedRequest;
    	    } else {
    	      state.bufferedRequest = state.lastBufferedRequest;
    	    }
    	    state.bufferedRequestCount += 1;
    	  } else {
    	    doWrite(stream, state, false, len, chunk, encoding, cb);
    	  }

    	  return ret;
    	}

    	function doWrite(stream, state, writev, len, chunk, encoding, cb) {
    	  state.writelen = len;
    	  state.writecb = cb;
    	  state.writing = true;
    	  state.sync = true;
    	  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
    	  state.sync = false;
    	}

    	function onwriteError(stream, state, sync, er, cb) {
    	  --state.pendingcb;

    	  if (sync) {
    	    // defer the callback if we are being called synchronously
    	    // to avoid piling up things on the stack
    	    pna.nextTick(cb, er);
    	    // this can emit finish, and it will always happen
    	    // after error
    	    pna.nextTick(finishMaybe, stream, state);
    	    stream._writableState.errorEmitted = true;
    	    stream.emit('error', er);
    	  } else {
    	    // the caller expect this to happen before if
    	    // it is async
    	    cb(er);
    	    stream._writableState.errorEmitted = true;
    	    stream.emit('error', er);
    	    // this can emit finish, but finish must
    	    // always follow error
    	    finishMaybe(stream, state);
    	  }
    	}

    	function onwriteStateUpdate(state) {
    	  state.writing = false;
    	  state.writecb = null;
    	  state.length -= state.writelen;
    	  state.writelen = 0;
    	}

    	function onwrite(stream, er) {
    	  var state = stream._writableState;
    	  var sync = state.sync;
    	  var cb = state.writecb;

    	  onwriteStateUpdate(state);

    	  if (er) onwriteError(stream, state, sync, er, cb);else {
    	    // Check if we're actually ready to finish, but don't emit yet
    	    var finished = needFinish(state);

    	    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
    	      clearBuffer(stream, state);
    	    }

    	    if (sync) {
    	      /*<replacement>*/
    	      asyncWrite(afterWrite, stream, state, finished, cb);
    	      /*</replacement>*/
    	    } else {
    	      afterWrite(stream, state, finished, cb);
    	    }
    	  }
    	}

    	function afterWrite(stream, state, finished, cb) {
    	  if (!finished) onwriteDrain(stream, state);
    	  state.pendingcb--;
    	  cb();
    	  finishMaybe(stream, state);
    	}

    	// Must force callback to be called on nextTick, so that we don't
    	// emit 'drain' before the write() consumer gets the 'false' return
    	// value, and has a chance to attach a 'drain' listener.
    	function onwriteDrain(stream, state) {
    	  if (state.length === 0 && state.needDrain) {
    	    state.needDrain = false;
    	    stream.emit('drain');
    	  }
    	}

    	// if there's something in the buffer waiting, then process it
    	function clearBuffer(stream, state) {
    	  state.bufferProcessing = true;
    	  var entry = state.bufferedRequest;

    	  if (stream._writev && entry && entry.next) {
    	    // Fast case, write everything using _writev()
    	    var l = state.bufferedRequestCount;
    	    var buffer = new Array(l);
    	    var holder = state.corkedRequestsFree;
    	    holder.entry = entry;

    	    var count = 0;
    	    var allBuffers = true;
    	    while (entry) {
    	      buffer[count] = entry;
    	      if (!entry.isBuf) allBuffers = false;
    	      entry = entry.next;
    	      count += 1;
    	    }
    	    buffer.allBuffers = allBuffers;

    	    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    	    // doWrite is almost always async, defer these to save a bit of time
    	    // as the hot path ends with doWrite
    	    state.pendingcb++;
    	    state.lastBufferedRequest = null;
    	    if (holder.next) {
    	      state.corkedRequestsFree = holder.next;
    	      holder.next = null;
    	    } else {
    	      state.corkedRequestsFree = new CorkedRequest(state);
    	    }
    	    state.bufferedRequestCount = 0;
    	  } else {
    	    // Slow case, write chunks one-by-one
    	    while (entry) {
    	      var chunk = entry.chunk;
    	      var encoding = entry.encoding;
    	      var cb = entry.callback;
    	      var len = state.objectMode ? 1 : chunk.length;

    	      doWrite(stream, state, false, len, chunk, encoding, cb);
    	      entry = entry.next;
    	      state.bufferedRequestCount--;
    	      // if we didn't call the onwrite immediately, then
    	      // it means that we need to wait until it does.
    	      // also, that means that the chunk and cb are currently
    	      // being processed, so move the buffer counter past them.
    	      if (state.writing) {
    	        break;
    	      }
    	    }

    	    if (entry === null) state.lastBufferedRequest = null;
    	  }

    	  state.bufferedRequest = entry;
    	  state.bufferProcessing = false;
    	}

    	Writable.prototype._write = function (chunk, encoding, cb) {
    	  cb(new Error('_write() is not implemented'));
    	};

    	Writable.prototype._writev = null;

    	Writable.prototype.end = function (chunk, encoding, cb) {
    	  var state = this._writableState;

    	  if (typeof chunk === 'function') {
    	    cb = chunk;
    	    chunk = null;
    	    encoding = null;
    	  } else if (typeof encoding === 'function') {
    	    cb = encoding;
    	    encoding = null;
    	  }

    	  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

    	  // .end() fully uncorks
    	  if (state.corked) {
    	    state.corked = 1;
    	    this.uncork();
    	  }

    	  // ignore unnecessary end() calls.
    	  if (!state.ending) endWritable(this, state, cb);
    	};

    	function needFinish(state) {
    	  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
    	}
    	function callFinal(stream, state) {
    	  stream._final(function (err) {
    	    state.pendingcb--;
    	    if (err) {
    	      stream.emit('error', err);
    	    }
    	    state.prefinished = true;
    	    stream.emit('prefinish');
    	    finishMaybe(stream, state);
    	  });
    	}
    	function prefinish(stream, state) {
    	  if (!state.prefinished && !state.finalCalled) {
    	    if (typeof stream._final === 'function') {
    	      state.pendingcb++;
    	      state.finalCalled = true;
    	      pna.nextTick(callFinal, stream, state);
    	    } else {
    	      state.prefinished = true;
    	      stream.emit('prefinish');
    	    }
    	  }
    	}

    	function finishMaybe(stream, state) {
    	  var need = needFinish(state);
    	  if (need) {
    	    prefinish(stream, state);
    	    if (state.pendingcb === 0) {
    	      state.finished = true;
    	      stream.emit('finish');
    	    }
    	  }
    	  return need;
    	}

    	function endWritable(stream, state, cb) {
    	  state.ending = true;
    	  finishMaybe(stream, state);
    	  if (cb) {
    	    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
    	  }
    	  state.ended = true;
    	  stream.writable = false;
    	}

    	function onCorkedFinish(corkReq, state, err) {
    	  var entry = corkReq.entry;
    	  corkReq.entry = null;
    	  while (entry) {
    	    var cb = entry.callback;
    	    state.pendingcb--;
    	    cb(err);
    	    entry = entry.next;
    	  }

    	  // reuse the free corkReq.
    	  state.corkedRequestsFree.next = corkReq;
    	}

    	Object.defineProperty(Writable.prototype, 'destroyed', {
    	  get: function () {
    	    if (this._writableState === undefined) {
    	      return false;
    	    }
    	    return this._writableState.destroyed;
    	  },
    	  set: function (value) {
    	    // we ignore the value if the stream
    	    // has not been initialized yet
    	    if (!this._writableState) {
    	      return;
    	    }

    	    // backward compatibility, the user is explicitly
    	    // managing destroyed
    	    this._writableState.destroyed = value;
    	  }
    	});

    	Writable.prototype.destroy = destroyImpl.destroy;
    	Writable.prototype._undestroy = destroyImpl.undestroy;
    	Writable.prototype._destroy = function (err, cb) {
    	  this.end();
    	  cb(err);
    	};
    	return _stream_writable;
    }

    var _stream_duplex;
    var hasRequired_stream_duplex;

    function require_stream_duplex () {
    	if (hasRequired_stream_duplex) return _stream_duplex;
    	hasRequired_stream_duplex = 1;

    	/*<replacement>*/

    	var pna = require_processNextickArgs_2_0_1_processNextickArgs();
    	/*</replacement>*/

    	/*<replacement>*/
    	var objectKeys = Object.keys || function (obj) {
    	  var keys = [];
    	  for (var key in obj) {
    	    keys.push(key);
    	  }return keys;
    	};
    	/*</replacement>*/

    	_stream_duplex = Duplex;

    	/*<replacement>*/
    	var util = Object.create(requireUtil());
    	util.inherits = requireInherits();
    	/*</replacement>*/

    	var Readable = require_stream_readable();
    	var Writable = require_stream_writable();

    	util.inherits(Duplex, Readable);

    	{
    	  // avoid scope creep, the keys array can then be collected
    	  var keys = objectKeys(Writable.prototype);
    	  for (var v = 0; v < keys.length; v++) {
    	    var method = keys[v];
    	    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
    	  }
    	}

    	function Duplex(options) {
    	  if (!(this instanceof Duplex)) return new Duplex(options);

    	  Readable.call(this, options);
    	  Writable.call(this, options);

    	  if (options && options.readable === false) this.readable = false;

    	  if (options && options.writable === false) this.writable = false;

    	  this.allowHalfOpen = true;
    	  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

    	  this.once('end', onend);
    	}

    	Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
    	  // making it explicit this property is not enumerable
    	  // because otherwise some prototype manipulation in
    	  // userland will fail
    	  enumerable: false,
    	  get: function () {
    	    return this._writableState.highWaterMark;
    	  }
    	});

    	// the no-half-open enforcer
    	function onend() {
    	  // if we allow half-open state, or if the writable side ended,
    	  // then we're ok.
    	  if (this.allowHalfOpen || this._writableState.ended) return;

    	  // no more data can be written.
    	  // But allow more writes to happen in this tick.
    	  pna.nextTick(onEndNT, this);
    	}

    	function onEndNT(self) {
    	  self.end();
    	}

    	Object.defineProperty(Duplex.prototype, 'destroyed', {
    	  get: function () {
    	    if (this._readableState === undefined || this._writableState === undefined) {
    	      return false;
    	    }
    	    return this._readableState.destroyed && this._writableState.destroyed;
    	  },
    	  set: function (value) {
    	    // we ignore the value if the stream
    	    // has not been initialized yet
    	    if (this._readableState === undefined || this._writableState === undefined) {
    	      return;
    	    }

    	    // backward compatibility, the user is explicitly
    	    // managing destroyed
    	    this._readableState.destroyed = value;
    	    this._writableState.destroyed = value;
    	  }
    	});

    	Duplex.prototype._destroy = function (err, cb) {
    	  this.push(null);
    	  this.end();

    	  pna.nextTick(cb, err);
    	};
    	return _stream_duplex;
    }

    var string_decoder = {};

    var hasRequiredString_decoder;

    function requireString_decoder () {
    	if (hasRequiredString_decoder) return string_decoder;
    	hasRequiredString_decoder = 1;

    	/*<replacement>*/

    	var Buffer = require_safeBuffer_5_1_2_safeBuffer().Buffer;
    	/*</replacement>*/

    	var isEncoding = Buffer.isEncoding || function (encoding) {
    	  encoding = '' + encoding;
    	  switch (encoding && encoding.toLowerCase()) {
    	    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
    	      return true;
    	    default:
    	      return false;
    	  }
    	};

    	function _normalizeEncoding(enc) {
    	  if (!enc) return 'utf8';
    	  var retried;
    	  while (true) {
    	    switch (enc) {
    	      case 'utf8':
    	      case 'utf-8':
    	        return 'utf8';
    	      case 'ucs2':
    	      case 'ucs-2':
    	      case 'utf16le':
    	      case 'utf-16le':
    	        return 'utf16le';
    	      case 'latin1':
    	      case 'binary':
    	        return 'latin1';
    	      case 'base64':
    	      case 'ascii':
    	      case 'hex':
    	        return enc;
    	      default:
    	        if (retried) return; // undefined
    	        enc = ('' + enc).toLowerCase();
    	        retried = true;
    	    }
    	  }
    	}
    	// Do not cache `Buffer.isEncoding` when checking encoding names as some
    	// modules monkey-patch it to support additional encodings
    	function normalizeEncoding(enc) {
    	  var nenc = _normalizeEncoding(enc);
    	  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
    	  return nenc || enc;
    	}

    	// StringDecoder provides an interface for efficiently splitting a series of
    	// buffers into a series of JS strings without breaking apart multi-byte
    	// characters.
    	string_decoder.StringDecoder = StringDecoder;
    	function StringDecoder(encoding) {
    	  this.encoding = normalizeEncoding(encoding);
    	  var nb;
    	  switch (this.encoding) {
    	    case 'utf16le':
    	      this.text = utf16Text;
    	      this.end = utf16End;
    	      nb = 4;
    	      break;
    	    case 'utf8':
    	      this.fillLast = utf8FillLast;
    	      nb = 4;
    	      break;
    	    case 'base64':
    	      this.text = base64Text;
    	      this.end = base64End;
    	      nb = 3;
    	      break;
    	    default:
    	      this.write = simpleWrite;
    	      this.end = simpleEnd;
    	      return;
    	  }
    	  this.lastNeed = 0;
    	  this.lastTotal = 0;
    	  this.lastChar = Buffer.allocUnsafe(nb);
    	}

    	StringDecoder.prototype.write = function (buf) {
    	  if (buf.length === 0) return '';
    	  var r;
    	  var i;
    	  if (this.lastNeed) {
    	    r = this.fillLast(buf);
    	    if (r === undefined) return '';
    	    i = this.lastNeed;
    	    this.lastNeed = 0;
    	  } else {
    	    i = 0;
    	  }
    	  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
    	  return r || '';
    	};

    	StringDecoder.prototype.end = utf8End;

    	// Returns only complete characters in a Buffer
    	StringDecoder.prototype.text = utf8Text;

    	// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
    	StringDecoder.prototype.fillLast = function (buf) {
    	  if (this.lastNeed <= buf.length) {
    	    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    	    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
    	  }
    	  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
    	  this.lastNeed -= buf.length;
    	};

    	// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
    	// continuation byte. If an invalid byte is detected, -2 is returned.
    	function utf8CheckByte(byte) {
    	  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
    	  return byte >> 6 === 0x02 ? -1 : -2;
    	}

    	// Checks at most 3 bytes at the end of a Buffer in order to detect an
    	// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
    	// needed to complete the UTF-8 character (if applicable) are returned.
    	function utf8CheckIncomplete(self, buf, i) {
    	  var j = buf.length - 1;
    	  if (j < i) return 0;
    	  var nb = utf8CheckByte(buf[j]);
    	  if (nb >= 0) {
    	    if (nb > 0) self.lastNeed = nb - 1;
    	    return nb;
    	  }
    	  if (--j < i || nb === -2) return 0;
    	  nb = utf8CheckByte(buf[j]);
    	  if (nb >= 0) {
    	    if (nb > 0) self.lastNeed = nb - 2;
    	    return nb;
    	  }
    	  if (--j < i || nb === -2) return 0;
    	  nb = utf8CheckByte(buf[j]);
    	  if (nb >= 0) {
    	    if (nb > 0) {
    	      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    	    }
    	    return nb;
    	  }
    	  return 0;
    	}

    	// Validates as many continuation bytes for a multi-byte UTF-8 character as
    	// needed or are available. If we see a non-continuation byte where we expect
    	// one, we "replace" the validated continuation bytes we've seen so far with
    	// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
    	// behavior. The continuation byte check is included three times in the case
    	// where all of the continuation bytes for a character exist in the same buffer.
    	// It is also done this way as a slight performance increase instead of using a
    	// loop.
    	function utf8CheckExtraBytes(self, buf, p) {
    	  if ((buf[0] & 0xC0) !== 0x80) {
    	    self.lastNeed = 0;
    	    return '\ufffd';
    	  }
    	  if (self.lastNeed > 1 && buf.length > 1) {
    	    if ((buf[1] & 0xC0) !== 0x80) {
    	      self.lastNeed = 1;
    	      return '\ufffd';
    	    }
    	    if (self.lastNeed > 2 && buf.length > 2) {
    	      if ((buf[2] & 0xC0) !== 0x80) {
    	        self.lastNeed = 2;
    	        return '\ufffd';
    	      }
    	    }
    	  }
    	}

    	// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
    	function utf8FillLast(buf) {
    	  var p = this.lastTotal - this.lastNeed;
    	  var r = utf8CheckExtraBytes(this, buf);
    	  if (r !== undefined) return r;
    	  if (this.lastNeed <= buf.length) {
    	    buf.copy(this.lastChar, p, 0, this.lastNeed);
    	    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
    	  }
    	  buf.copy(this.lastChar, p, 0, buf.length);
    	  this.lastNeed -= buf.length;
    	}

    	// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
    	// partial character, the character's bytes are buffered until the required
    	// number of bytes are available.
    	function utf8Text(buf, i) {
    	  var total = utf8CheckIncomplete(this, buf, i);
    	  if (!this.lastNeed) return buf.toString('utf8', i);
    	  this.lastTotal = total;
    	  var end = buf.length - (total - this.lastNeed);
    	  buf.copy(this.lastChar, 0, end);
    	  return buf.toString('utf8', i, end);
    	}

    	// For UTF-8, a replacement character is added when ending on a partial
    	// character.
    	function utf8End(buf) {
    	  var r = buf && buf.length ? this.write(buf) : '';
    	  if (this.lastNeed) return r + '\ufffd';
    	  return r;
    	}

    	// UTF-16LE typically needs two bytes per character, but even if we have an even
    	// number of bytes available, we need to check if we end on a leading/high
    	// surrogate. In that case, we need to wait for the next two bytes in order to
    	// decode the last character properly.
    	function utf16Text(buf, i) {
    	  if ((buf.length - i) % 2 === 0) {
    	    var r = buf.toString('utf16le', i);
    	    if (r) {
    	      var c = r.charCodeAt(r.length - 1);
    	      if (c >= 0xD800 && c <= 0xDBFF) {
    	        this.lastNeed = 2;
    	        this.lastTotal = 4;
    	        this.lastChar[0] = buf[buf.length - 2];
    	        this.lastChar[1] = buf[buf.length - 1];
    	        return r.slice(0, -1);
    	      }
    	    }
    	    return r;
    	  }
    	  this.lastNeed = 1;
    	  this.lastTotal = 2;
    	  this.lastChar[0] = buf[buf.length - 1];
    	  return buf.toString('utf16le', i, buf.length - 1);
    	}

    	// For UTF-16LE we do not explicitly append special replacement characters if we
    	// end on a partial character, we simply let v8 handle that.
    	function utf16End(buf) {
    	  var r = buf && buf.length ? this.write(buf) : '';
    	  if (this.lastNeed) {
    	    var end = this.lastTotal - this.lastNeed;
    	    return r + this.lastChar.toString('utf16le', 0, end);
    	  }
    	  return r;
    	}

    	function base64Text(buf, i) {
    	  var n = (buf.length - i) % 3;
    	  if (n === 0) return buf.toString('base64', i);
    	  this.lastNeed = 3 - n;
    	  this.lastTotal = 3;
    	  if (n === 1) {
    	    this.lastChar[0] = buf[buf.length - 1];
    	  } else {
    	    this.lastChar[0] = buf[buf.length - 2];
    	    this.lastChar[1] = buf[buf.length - 1];
    	  }
    	  return buf.toString('base64', i, buf.length - n);
    	}

    	function base64End(buf) {
    	  var r = buf && buf.length ? this.write(buf) : '';
    	  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
    	  return r;
    	}

    	// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
    	function simpleWrite(buf) {
    	  return buf.toString(this.encoding);
    	}

    	function simpleEnd(buf) {
    	  return buf && buf.length ? this.write(buf) : '';
    	}
    	return string_decoder;
    }

    var _stream_readable;
    var hasRequired_stream_readable;

    function require_stream_readable () {
    	if (hasRequired_stream_readable) return _stream_readable;
    	hasRequired_stream_readable = 1;

    	/*<replacement>*/

    	var pna = require_processNextickArgs_2_0_1_processNextickArgs();
    	/*</replacement>*/

    	_stream_readable = Readable;

    	/*<replacement>*/
    	var isArray = require_isarray_1_0_0_isarray();
    	/*</replacement>*/

    	/*<replacement>*/
    	var Duplex;
    	/*</replacement>*/

    	Readable.ReadableState = ReadableState;

    	/*<replacement>*/
    	requireEvents().EventEmitter;

    	var EElistenerCount = function (emitter, type) {
    	  return emitter.listeners(type).length;
    	};
    	/*</replacement>*/

    	/*<replacement>*/
    	var Stream = requireStream();
    	/*</replacement>*/

    	/*<replacement>*/

    	var Buffer = require_safeBuffer_5_1_2_safeBuffer().Buffer;
    	var OurUint8Array = (typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {}).Uint8Array || function () {};
    	function _uint8ArrayToBuffer(chunk) {
    	  return Buffer.from(chunk);
    	}
    	function _isUint8Array(obj) {
    	  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
    	}

    	/*</replacement>*/

    	/*<replacement>*/
    	var util = Object.create(requireUtil());
    	util.inherits = requireInherits();
    	/*</replacement>*/

    	/*<replacement>*/
    	var debugUtil = require$$1__default["default"];
    	var debug = void 0;
    	if (debugUtil && debugUtil.debuglog) {
    	  debug = debugUtil.debuglog('stream');
    	} else {
    	  debug = function () {};
    	}
    	/*</replacement>*/

    	var BufferList = requireBufferList();
    	var destroyImpl = requireDestroy();
    	var StringDecoder;

    	util.inherits(Readable, Stream);

    	var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

    	function prependListener(emitter, event, fn) {
    	  // Sadly this is not cacheable as some libraries bundle their own
    	  // event emitter implementation with them.
    	  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

    	  // This is a hack to make sure that our error handler is attached before any
    	  // userland ones.  NEVER DO THIS. This is here only because this code needs
    	  // to continue to work with older versions of Node.js that do not include
    	  // the prependListener() method. The goal is to eventually remove this hack.
    	  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
    	}

    	function ReadableState(options, stream) {
    	  Duplex = Duplex || require_stream_duplex();

    	  options = options || {};

    	  // Duplex streams are both readable and writable, but share
    	  // the same options object.
    	  // However, some cases require setting options to different
    	  // values for the readable and the writable sides of the duplex stream.
    	  // These options can be provided separately as readableXXX and writableXXX.
    	  var isDuplex = stream instanceof Duplex;

    	  // object stream flag. Used to make read(n) ignore n and to
    	  // make all the buffer merging and length checks go away
    	  this.objectMode = !!options.objectMode;

    	  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

    	  // the point at which it stops calling _read() to fill the buffer
    	  // Note: 0 is a valid value, means "don't call _read preemptively ever"
    	  var hwm = options.highWaterMark;
    	  var readableHwm = options.readableHighWaterMark;
    	  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

    	  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

    	  // cast to ints.
    	  this.highWaterMark = Math.floor(this.highWaterMark);

    	  // A linked list is used to store data chunks instead of an array because the
    	  // linked list can remove elements from the beginning faster than
    	  // array.shift()
    	  this.buffer = new BufferList();
    	  this.length = 0;
    	  this.pipes = null;
    	  this.pipesCount = 0;
    	  this.flowing = null;
    	  this.ended = false;
    	  this.endEmitted = false;
    	  this.reading = false;

    	  // a flag to be able to tell if the event 'readable'/'data' is emitted
    	  // immediately, or on a later tick.  We set this to true at first, because
    	  // any actions that shouldn't happen until "later" should generally also
    	  // not happen before the first read call.
    	  this.sync = true;

    	  // whenever we return null, then we set a flag to say
    	  // that we're awaiting a 'readable' event emission.
    	  this.needReadable = false;
    	  this.emittedReadable = false;
    	  this.readableListening = false;
    	  this.resumeScheduled = false;

    	  // has it been destroyed
    	  this.destroyed = false;

    	  // Crypto is kind of old and crusty.  Historically, its default string
    	  // encoding is 'binary' so we have to make this configurable.
    	  // Everything else in the universe uses 'utf8', though.
    	  this.defaultEncoding = options.defaultEncoding || 'utf8';

    	  // the number of writers that are awaiting a drain event in .pipe()s
    	  this.awaitDrain = 0;

    	  // if true, a maybeReadMore has been scheduled
    	  this.readingMore = false;

    	  this.decoder = null;
    	  this.encoding = null;
    	  if (options.encoding) {
    	    if (!StringDecoder) StringDecoder = requireString_decoder().StringDecoder;
    	    this.decoder = new StringDecoder(options.encoding);
    	    this.encoding = options.encoding;
    	  }
    	}

    	function Readable(options) {
    	  Duplex = Duplex || require_stream_duplex();

    	  if (!(this instanceof Readable)) return new Readable(options);

    	  this._readableState = new ReadableState(options, this);

    	  // legacy
    	  this.readable = true;

    	  if (options) {
    	    if (typeof options.read === 'function') this._read = options.read;

    	    if (typeof options.destroy === 'function') this._destroy = options.destroy;
    	  }

    	  Stream.call(this);
    	}

    	Object.defineProperty(Readable.prototype, 'destroyed', {
    	  get: function () {
    	    if (this._readableState === undefined) {
    	      return false;
    	    }
    	    return this._readableState.destroyed;
    	  },
    	  set: function (value) {
    	    // we ignore the value if the stream
    	    // has not been initialized yet
    	    if (!this._readableState) {
    	      return;
    	    }

    	    // backward compatibility, the user is explicitly
    	    // managing destroyed
    	    this._readableState.destroyed = value;
    	  }
    	});

    	Readable.prototype.destroy = destroyImpl.destroy;
    	Readable.prototype._undestroy = destroyImpl.undestroy;
    	Readable.prototype._destroy = function (err, cb) {
    	  this.push(null);
    	  cb(err);
    	};

    	// Manually shove something into the read() buffer.
    	// This returns true if the highWaterMark has not been hit yet,
    	// similar to how Writable.write() returns true if you should
    	// write() some more.
    	Readable.prototype.push = function (chunk, encoding) {
    	  var state = this._readableState;
    	  var skipChunkCheck;

    	  if (!state.objectMode) {
    	    if (typeof chunk === 'string') {
    	      encoding = encoding || state.defaultEncoding;
    	      if (encoding !== state.encoding) {
    	        chunk = Buffer.from(chunk, encoding);
    	        encoding = '';
    	      }
    	      skipChunkCheck = true;
    	    }
    	  } else {
    	    skipChunkCheck = true;
    	  }

    	  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
    	};

    	// Unshift should *always* be something directly out of read()
    	Readable.prototype.unshift = function (chunk) {
    	  return readableAddChunk(this, chunk, null, true, false);
    	};

    	function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
    	  var state = stream._readableState;
    	  if (chunk === null) {
    	    state.reading = false;
    	    onEofChunk(stream, state);
    	  } else {
    	    var er;
    	    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    	    if (er) {
    	      stream.emit('error', er);
    	    } else if (state.objectMode || chunk && chunk.length > 0) {
    	      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
    	        chunk = _uint8ArrayToBuffer(chunk);
    	      }

    	      if (addToFront) {
    	        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
    	      } else if (state.ended) {
    	        stream.emit('error', new Error('stream.push() after EOF'));
    	      } else {
    	        state.reading = false;
    	        if (state.decoder && !encoding) {
    	          chunk = state.decoder.write(chunk);
    	          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
    	        } else {
    	          addChunk(stream, state, chunk, false);
    	        }
    	      }
    	    } else if (!addToFront) {
    	      state.reading = false;
    	    }
    	  }

    	  return needMoreData(state);
    	}

    	function addChunk(stream, state, chunk, addToFront) {
    	  if (state.flowing && state.length === 0 && !state.sync) {
    	    stream.emit('data', chunk);
    	    stream.read(0);
    	  } else {
    	    // update the buffer info.
    	    state.length += state.objectMode ? 1 : chunk.length;
    	    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    	    if (state.needReadable) emitReadable(stream);
    	  }
    	  maybeReadMore(stream, state);
    	}

    	function chunkInvalid(state, chunk) {
    	  var er;
    	  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    	    er = new TypeError('Invalid non-string/buffer chunk');
    	  }
    	  return er;
    	}

    	// if it's past the high water mark, we can push in some more.
    	// Also, if we have no data yet, we can stand some
    	// more bytes.  This is to work around cases where hwm=0,
    	// such as the repl.  Also, if the push() triggered a
    	// readable event, and the user called read(largeNumber) such that
    	// needReadable was set, then we ought to push more, so that another
    	// 'readable' event will be triggered.
    	function needMoreData(state) {
    	  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
    	}

    	Readable.prototype.isPaused = function () {
    	  return this._readableState.flowing === false;
    	};

    	// backwards compatibility.
    	Readable.prototype.setEncoding = function (enc) {
    	  if (!StringDecoder) StringDecoder = requireString_decoder().StringDecoder;
    	  this._readableState.decoder = new StringDecoder(enc);
    	  this._readableState.encoding = enc;
    	  return this;
    	};

    	// Don't raise the hwm > 8MB
    	var MAX_HWM = 0x800000;
    	function computeNewHighWaterMark(n) {
    	  if (n >= MAX_HWM) {
    	    n = MAX_HWM;
    	  } else {
    	    // Get the next highest power of 2 to prevent increasing hwm excessively in
    	    // tiny amounts
    	    n--;
    	    n |= n >>> 1;
    	    n |= n >>> 2;
    	    n |= n >>> 4;
    	    n |= n >>> 8;
    	    n |= n >>> 16;
    	    n++;
    	  }
    	  return n;
    	}

    	// This function is designed to be inlinable, so please take care when making
    	// changes to the function body.
    	function howMuchToRead(n, state) {
    	  if (n <= 0 || state.length === 0 && state.ended) return 0;
    	  if (state.objectMode) return 1;
    	  if (n !== n) {
    	    // Only flow one buffer at a time
    	    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
    	  }
    	  // If we're asking for more than the current hwm, then raise the hwm.
    	  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
    	  if (n <= state.length) return n;
    	  // Don't have enough
    	  if (!state.ended) {
    	    state.needReadable = true;
    	    return 0;
    	  }
    	  return state.length;
    	}

    	// you can override either this method, or the async _read(n) below.
    	Readable.prototype.read = function (n) {
    	  debug('read', n);
    	  n = parseInt(n, 10);
    	  var state = this._readableState;
    	  var nOrig = n;

    	  if (n !== 0) state.emittedReadable = false;

    	  // if we're doing read(0) to trigger a readable event, but we
    	  // already have a bunch of data in the buffer, then just trigger
    	  // the 'readable' event and move on.
    	  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    	    debug('read: emitReadable', state.length, state.ended);
    	    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    	    return null;
    	  }

    	  n = howMuchToRead(n, state);

    	  // if we've ended, and we're now clear, then finish it up.
    	  if (n === 0 && state.ended) {
    	    if (state.length === 0) endReadable(this);
    	    return null;
    	  }

    	  // All the actual chunk generation logic needs to be
    	  // *below* the call to _read.  The reason is that in certain
    	  // synthetic stream cases, such as passthrough streams, _read
    	  // may be a completely synchronous operation which may change
    	  // the state of the read buffer, providing enough data when
    	  // before there was *not* enough.
    	  //
    	  // So, the steps are:
    	  // 1. Figure out what the state of things will be after we do
    	  // a read from the buffer.
    	  //
    	  // 2. If that resulting state will trigger a _read, then call _read.
    	  // Note that this may be asynchronous, or synchronous.  Yes, it is
    	  // deeply ugly to write APIs this way, but that still doesn't mean
    	  // that the Readable class should behave improperly, as streams are
    	  // designed to be sync/async agnostic.
    	  // Take note if the _read call is sync or async (ie, if the read call
    	  // has returned yet), so that we know whether or not it's safe to emit
    	  // 'readable' etc.
    	  //
    	  // 3. Actually pull the requested chunks out of the buffer and return.

    	  // if we need a readable event, then we need to do some reading.
    	  var doRead = state.needReadable;
    	  debug('need readable', doRead);

    	  // if we currently have less than the highWaterMark, then also read some
    	  if (state.length === 0 || state.length - n < state.highWaterMark) {
    	    doRead = true;
    	    debug('length less than watermark', doRead);
    	  }

    	  // however, if we've ended, then there's no point, and if we're already
    	  // reading, then it's unnecessary.
    	  if (state.ended || state.reading) {
    	    doRead = false;
    	    debug('reading or ended', doRead);
    	  } else if (doRead) {
    	    debug('do read');
    	    state.reading = true;
    	    state.sync = true;
    	    // if the length is currently zero, then we *need* a readable event.
    	    if (state.length === 0) state.needReadable = true;
    	    // call internal read method
    	    this._read(state.highWaterMark);
    	    state.sync = false;
    	    // If _read pushed data synchronously, then `reading` will be false,
    	    // and we need to re-evaluate how much data we can return to the user.
    	    if (!state.reading) n = howMuchToRead(nOrig, state);
    	  }

    	  var ret;
    	  if (n > 0) ret = fromList(n, state);else ret = null;

    	  if (ret === null) {
    	    state.needReadable = true;
    	    n = 0;
    	  } else {
    	    state.length -= n;
    	  }

    	  if (state.length === 0) {
    	    // If we have nothing in the buffer, then we want to know
    	    // as soon as we *do* get something into the buffer.
    	    if (!state.ended) state.needReadable = true;

    	    // If we tried to read() past the EOF, then emit end on the next tick.
    	    if (nOrig !== n && state.ended) endReadable(this);
    	  }

    	  if (ret !== null) this.emit('data', ret);

    	  return ret;
    	};

    	function onEofChunk(stream, state) {
    	  if (state.ended) return;
    	  if (state.decoder) {
    	    var chunk = state.decoder.end();
    	    if (chunk && chunk.length) {
    	      state.buffer.push(chunk);
    	      state.length += state.objectMode ? 1 : chunk.length;
    	    }
    	  }
    	  state.ended = true;

    	  // emit 'readable' now to make sure it gets picked up.
    	  emitReadable(stream);
    	}

    	// Don't emit readable right away in sync mode, because this can trigger
    	// another read() call => stack overflow.  This way, it might trigger
    	// a nextTick recursion warning, but that's not so bad.
    	function emitReadable(stream) {
    	  var state = stream._readableState;
    	  state.needReadable = false;
    	  if (!state.emittedReadable) {
    	    debug('emitReadable', state.flowing);
    	    state.emittedReadable = true;
    	    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
    	  }
    	}

    	function emitReadable_(stream) {
    	  debug('emit readable');
    	  stream.emit('readable');
    	  flow(stream);
    	}

    	// at this point, the user has presumably seen the 'readable' event,
    	// and called read() to consume some data.  that may have triggered
    	// in turn another _read(n) call, in which case reading = true if
    	// it's in progress.
    	// However, if we're not ended, or reading, and the length < hwm,
    	// then go ahead and try to read some more preemptively.
    	function maybeReadMore(stream, state) {
    	  if (!state.readingMore) {
    	    state.readingMore = true;
    	    pna.nextTick(maybeReadMore_, stream, state);
    	  }
    	}

    	function maybeReadMore_(stream, state) {
    	  var len = state.length;
    	  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    	    debug('maybeReadMore read 0');
    	    stream.read(0);
    	    if (len === state.length)
    	      // didn't get any data, stop spinning.
    	      break;else len = state.length;
    	  }
    	  state.readingMore = false;
    	}

    	// abstract method.  to be overridden in specific implementation classes.
    	// call cb(er, data) where data is <= n in length.
    	// for virtual (non-string, non-buffer) streams, "length" is somewhat
    	// arbitrary, and perhaps not very meaningful.
    	Readable.prototype._read = function (n) {
    	  this.emit('error', new Error('_read() is not implemented'));
    	};

    	Readable.prototype.pipe = function (dest, pipeOpts) {
    	  var src = this;
    	  var state = this._readableState;

    	  switch (state.pipesCount) {
    	    case 0:
    	      state.pipes = dest;
    	      break;
    	    case 1:
    	      state.pipes = [state.pipes, dest];
    	      break;
    	    default:
    	      state.pipes.push(dest);
    	      break;
    	  }
    	  state.pipesCount += 1;
    	  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

    	  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

    	  var endFn = doEnd ? onend : unpipe;
    	  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

    	  dest.on('unpipe', onunpipe);
    	  function onunpipe(readable, unpipeInfo) {
    	    debug('onunpipe');
    	    if (readable === src) {
    	      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
    	        unpipeInfo.hasUnpiped = true;
    	        cleanup();
    	      }
    	    }
    	  }

    	  function onend() {
    	    debug('onend');
    	    dest.end();
    	  }

    	  // when the dest drains, it reduces the awaitDrain counter
    	  // on the source.  This would be more elegant with a .once()
    	  // handler in flow(), but adding and removing repeatedly is
    	  // too slow.
    	  var ondrain = pipeOnDrain(src);
    	  dest.on('drain', ondrain);

    	  var cleanedUp = false;
    	  function cleanup() {
    	    debug('cleanup');
    	    // cleanup event handlers once the pipe is broken
    	    dest.removeListener('close', onclose);
    	    dest.removeListener('finish', onfinish);
    	    dest.removeListener('drain', ondrain);
    	    dest.removeListener('error', onerror);
    	    dest.removeListener('unpipe', onunpipe);
    	    src.removeListener('end', onend);
    	    src.removeListener('end', unpipe);
    	    src.removeListener('data', ondata);

    	    cleanedUp = true;

    	    // if the reader is waiting for a drain event from this
    	    // specific writer, then it would cause it to never start
    	    // flowing again.
    	    // So, if this is awaiting a drain, then we just call it now.
    	    // If we don't know, then assume that we are waiting for one.
    	    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
    	  }

    	  // If the user pushes more data while we're writing to dest then we'll end up
    	  // in ondata again. However, we only want to increase awaitDrain once because
    	  // dest will only emit one 'drain' event for the multiple writes.
    	  // => Introduce a guard on increasing awaitDrain.
    	  var increasedAwaitDrain = false;
    	  src.on('data', ondata);
    	  function ondata(chunk) {
    	    debug('ondata');
    	    increasedAwaitDrain = false;
    	    var ret = dest.write(chunk);
    	    if (false === ret && !increasedAwaitDrain) {
    	      // If the user unpiped during `dest.write()`, it is possible
    	      // to get stuck in a permanently paused state if that write
    	      // also returned false.
    	      // => Check whether `dest` is still a piping destination.
    	      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
    	        debug('false write response, pause', state.awaitDrain);
    	        state.awaitDrain++;
    	        increasedAwaitDrain = true;
    	      }
    	      src.pause();
    	    }
    	  }

    	  // if the dest has an error, then stop piping into it.
    	  // however, don't suppress the throwing behavior for this.
    	  function onerror(er) {
    	    debug('onerror', er);
    	    unpipe();
    	    dest.removeListener('error', onerror);
    	    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
    	  }

    	  // Make sure our error handler is attached before userland ones.
    	  prependListener(dest, 'error', onerror);

    	  // Both close and finish should trigger unpipe, but only once.
    	  function onclose() {
    	    dest.removeListener('finish', onfinish);
    	    unpipe();
    	  }
    	  dest.once('close', onclose);
    	  function onfinish() {
    	    debug('onfinish');
    	    dest.removeListener('close', onclose);
    	    unpipe();
    	  }
    	  dest.once('finish', onfinish);

    	  function unpipe() {
    	    debug('unpipe');
    	    src.unpipe(dest);
    	  }

    	  // tell the dest that it's being piped to
    	  dest.emit('pipe', src);

    	  // start the flow if it hasn't been started already.
    	  if (!state.flowing) {
    	    debug('pipe resume');
    	    src.resume();
    	  }

    	  return dest;
    	};

    	function pipeOnDrain(src) {
    	  return function () {
    	    var state = src._readableState;
    	    debug('pipeOnDrain', state.awaitDrain);
    	    if (state.awaitDrain) state.awaitDrain--;
    	    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
    	      state.flowing = true;
    	      flow(src);
    	    }
    	  };
    	}

    	Readable.prototype.unpipe = function (dest) {
    	  var state = this._readableState;
    	  var unpipeInfo = { hasUnpiped: false };

    	  // if we're not piping anywhere, then do nothing.
    	  if (state.pipesCount === 0) return this;

    	  // just one destination.  most common case.
    	  if (state.pipesCount === 1) {
    	    // passed in one, but it's not the right one.
    	    if (dest && dest !== state.pipes) return this;

    	    if (!dest) dest = state.pipes;

    	    // got a match.
    	    state.pipes = null;
    	    state.pipesCount = 0;
    	    state.flowing = false;
    	    if (dest) dest.emit('unpipe', this, unpipeInfo);
    	    return this;
    	  }

    	  // slow case. multiple pipe destinations.

    	  if (!dest) {
    	    // remove all.
    	    var dests = state.pipes;
    	    var len = state.pipesCount;
    	    state.pipes = null;
    	    state.pipesCount = 0;
    	    state.flowing = false;

    	    for (var i = 0; i < len; i++) {
    	      dests[i].emit('unpipe', this, { hasUnpiped: false });
    	    }return this;
    	  }

    	  // try to find the right one.
    	  var index = indexOf(state.pipes, dest);
    	  if (index === -1) return this;

    	  state.pipes.splice(index, 1);
    	  state.pipesCount -= 1;
    	  if (state.pipesCount === 1) state.pipes = state.pipes[0];

    	  dest.emit('unpipe', this, unpipeInfo);

    	  return this;
    	};

    	// set up data events if they are asked for
    	// Ensure readable listeners eventually get something
    	Readable.prototype.on = function (ev, fn) {
    	  var res = Stream.prototype.on.call(this, ev, fn);

    	  if (ev === 'data') {
    	    // Start flowing on next tick if stream isn't explicitly paused
    	    if (this._readableState.flowing !== false) this.resume();
    	  } else if (ev === 'readable') {
    	    var state = this._readableState;
    	    if (!state.endEmitted && !state.readableListening) {
    	      state.readableListening = state.needReadable = true;
    	      state.emittedReadable = false;
    	      if (!state.reading) {
    	        pna.nextTick(nReadingNextTick, this);
    	      } else if (state.length) {
    	        emitReadable(this);
    	      }
    	    }
    	  }

    	  return res;
    	};
    	Readable.prototype.addListener = Readable.prototype.on;

    	function nReadingNextTick(self) {
    	  debug('readable nexttick read 0');
    	  self.read(0);
    	}

    	// pause() and resume() are remnants of the legacy readable stream API
    	// If the user uses them, then switch into old mode.
    	Readable.prototype.resume = function () {
    	  var state = this._readableState;
    	  if (!state.flowing) {
    	    debug('resume');
    	    state.flowing = true;
    	    resume(this, state);
    	  }
    	  return this;
    	};

    	function resume(stream, state) {
    	  if (!state.resumeScheduled) {
    	    state.resumeScheduled = true;
    	    pna.nextTick(resume_, stream, state);
    	  }
    	}

    	function resume_(stream, state) {
    	  if (!state.reading) {
    	    debug('resume read 0');
    	    stream.read(0);
    	  }

    	  state.resumeScheduled = false;
    	  state.awaitDrain = 0;
    	  stream.emit('resume');
    	  flow(stream);
    	  if (state.flowing && !state.reading) stream.read(0);
    	}

    	Readable.prototype.pause = function () {
    	  debug('call pause flowing=%j', this._readableState.flowing);
    	  if (false !== this._readableState.flowing) {
    	    debug('pause');
    	    this._readableState.flowing = false;
    	    this.emit('pause');
    	  }
    	  return this;
    	};

    	function flow(stream) {
    	  var state = stream._readableState;
    	  debug('flow', state.flowing);
    	  while (state.flowing && stream.read() !== null) {}
    	}

    	// wrap an old-style stream as the async data source.
    	// This is *not* part of the readable stream interface.
    	// It is an ugly unfortunate mess of history.
    	Readable.prototype.wrap = function (stream) {
    	  var _this = this;

    	  var state = this._readableState;
    	  var paused = false;

    	  stream.on('end', function () {
    	    debug('wrapped end');
    	    if (state.decoder && !state.ended) {
    	      var chunk = state.decoder.end();
    	      if (chunk && chunk.length) _this.push(chunk);
    	    }

    	    _this.push(null);
    	  });

    	  stream.on('data', function (chunk) {
    	    debug('wrapped data');
    	    if (state.decoder) chunk = state.decoder.write(chunk);

    	    // don't skip over falsy values in objectMode
    	    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    	    var ret = _this.push(chunk);
    	    if (!ret) {
    	      paused = true;
    	      stream.pause();
    	    }
    	  });

    	  // proxy all the other methods.
    	  // important when wrapping filters and duplexes.
    	  for (var i in stream) {
    	    if (this[i] === undefined && typeof stream[i] === 'function') {
    	      this[i] = function (method) {
    	        return function () {
    	          return stream[method].apply(stream, arguments);
    	        };
    	      }(i);
    	    }
    	  }

    	  // proxy certain important events.
    	  for (var n = 0; n < kProxyEvents.length; n++) {
    	    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
    	  }

    	  // when we try to consume some more bytes, simply unpause the
    	  // underlying stream.
    	  this._read = function (n) {
    	    debug('wrapped _read', n);
    	    if (paused) {
    	      paused = false;
    	      stream.resume();
    	    }
    	  };

    	  return this;
    	};

    	Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
    	  // making it explicit this property is not enumerable
    	  // because otherwise some prototype manipulation in
    	  // userland will fail
    	  enumerable: false,
    	  get: function () {
    	    return this._readableState.highWaterMark;
    	  }
    	});

    	// exposed for testing purposes only.
    	Readable._fromList = fromList;

    	// Pluck off n bytes from an array of buffers.
    	// Length is the combined lengths of all the buffers in the list.
    	// This function is designed to be inlinable, so please take care when making
    	// changes to the function body.
    	function fromList(n, state) {
    	  // nothing buffered
    	  if (state.length === 0) return null;

    	  var ret;
    	  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    	    // read it all, truncate the list
    	    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    	    state.buffer.clear();
    	  } else {
    	    // read part of list
    	    ret = fromListPartial(n, state.buffer, state.decoder);
    	  }

    	  return ret;
    	}

    	// Extracts only enough buffered data to satisfy the amount requested.
    	// This function is designed to be inlinable, so please take care when making
    	// changes to the function body.
    	function fromListPartial(n, list, hasStrings) {
    	  var ret;
    	  if (n < list.head.data.length) {
    	    // slice is the same for buffers and strings
    	    ret = list.head.data.slice(0, n);
    	    list.head.data = list.head.data.slice(n);
    	  } else if (n === list.head.data.length) {
    	    // first chunk is a perfect match
    	    ret = list.shift();
    	  } else {
    	    // result spans more than one buffer
    	    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
    	  }
    	  return ret;
    	}

    	// Copies a specified amount of characters from the list of buffered data
    	// chunks.
    	// This function is designed to be inlinable, so please take care when making
    	// changes to the function body.
    	function copyFromBufferString(n, list) {
    	  var p = list.head;
    	  var c = 1;
    	  var ret = p.data;
    	  n -= ret.length;
    	  while (p = p.next) {
    	    var str = p.data;
    	    var nb = n > str.length ? str.length : n;
    	    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    	    n -= nb;
    	    if (n === 0) {
    	      if (nb === str.length) {
    	        ++c;
    	        if (p.next) list.head = p.next;else list.head = list.tail = null;
    	      } else {
    	        list.head = p;
    	        p.data = str.slice(nb);
    	      }
    	      break;
    	    }
    	    ++c;
    	  }
    	  list.length -= c;
    	  return ret;
    	}

    	// Copies a specified amount of bytes from the list of buffered data chunks.
    	// This function is designed to be inlinable, so please take care when making
    	// changes to the function body.
    	function copyFromBuffer(n, list) {
    	  var ret = Buffer.allocUnsafe(n);
    	  var p = list.head;
    	  var c = 1;
    	  p.data.copy(ret);
    	  n -= p.data.length;
    	  while (p = p.next) {
    	    var buf = p.data;
    	    var nb = n > buf.length ? buf.length : n;
    	    buf.copy(ret, ret.length - n, 0, nb);
    	    n -= nb;
    	    if (n === 0) {
    	      if (nb === buf.length) {
    	        ++c;
    	        if (p.next) list.head = p.next;else list.head = list.tail = null;
    	      } else {
    	        list.head = p;
    	        p.data = buf.slice(nb);
    	      }
    	      break;
    	    }
    	    ++c;
    	  }
    	  list.length -= c;
    	  return ret;
    	}

    	function endReadable(stream) {
    	  var state = stream._readableState;

    	  // If we get here before consuming all the bytes, then that is a
    	  // bug in node.  Should never happen.
    	  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

    	  if (!state.endEmitted) {
    	    state.ended = true;
    	    pna.nextTick(endReadableNT, state, stream);
    	  }
    	}

    	function endReadableNT(state, stream) {
    	  // Check that we didn't get one last unshift.
    	  if (!state.endEmitted && state.length === 0) {
    	    state.endEmitted = true;
    	    stream.readable = false;
    	    stream.emit('end');
    	  }
    	}

    	function indexOf(xs, x) {
    	  for (var i = 0, l = xs.length; i < l; i++) {
    	    if (xs[i] === x) return i;
    	  }
    	  return -1;
    	}
    	return _stream_readable;
    }

    var _stream_transform;
    var hasRequired_stream_transform;

    function require_stream_transform () {
    	if (hasRequired_stream_transform) return _stream_transform;
    	hasRequired_stream_transform = 1;

    	_stream_transform = Transform;

    	var Duplex = require_stream_duplex();

    	/*<replacement>*/
    	var util = Object.create(requireUtil());
    	util.inherits = requireInherits();
    	/*</replacement>*/

    	util.inherits(Transform, Duplex);

    	function afterTransform(er, data) {
    	  var ts = this._transformState;
    	  ts.transforming = false;

    	  var cb = ts.writecb;

    	  if (!cb) {
    	    return this.emit('error', new Error('write callback called multiple times'));
    	  }

    	  ts.writechunk = null;
    	  ts.writecb = null;

    	  if (data != null) // single equals check for both `null` and `undefined`
    	    this.push(data);

    	  cb(er);

    	  var rs = this._readableState;
    	  rs.reading = false;
    	  if (rs.needReadable || rs.length < rs.highWaterMark) {
    	    this._read(rs.highWaterMark);
    	  }
    	}

    	function Transform(options) {
    	  if (!(this instanceof Transform)) return new Transform(options);

    	  Duplex.call(this, options);

    	  this._transformState = {
    	    afterTransform: afterTransform.bind(this),
    	    needTransform: false,
    	    transforming: false,
    	    writecb: null,
    	    writechunk: null,
    	    writeencoding: null
    	  };

    	  // start out asking for a readable event once data is transformed.
    	  this._readableState.needReadable = true;

    	  // we have implemented the _read method, and done the other things
    	  // that Readable wants before the first _read call, so unset the
    	  // sync guard flag.
    	  this._readableState.sync = false;

    	  if (options) {
    	    if (typeof options.transform === 'function') this._transform = options.transform;

    	    if (typeof options.flush === 'function') this._flush = options.flush;
    	  }

    	  // When the writable side finishes, then flush out anything remaining.
    	  this.on('prefinish', prefinish);
    	}

    	function prefinish() {
    	  var _this = this;

    	  if (typeof this._flush === 'function') {
    	    this._flush(function (er, data) {
    	      done(_this, er, data);
    	    });
    	  } else {
    	    done(this, null, null);
    	  }
    	}

    	Transform.prototype.push = function (chunk, encoding) {
    	  this._transformState.needTransform = false;
    	  return Duplex.prototype.push.call(this, chunk, encoding);
    	};

    	// This is the part where you do stuff!
    	// override this function in implementation classes.
    	// 'chunk' is an input chunk.
    	//
    	// Call `push(newChunk)` to pass along transformed output
    	// to the readable side.  You may call 'push' zero or more times.
    	//
    	// Call `cb(err)` when you are done with this chunk.  If you pass
    	// an error, then that'll put the hurt on the whole operation.  If you
    	// never call cb(), then you'll never get another chunk.
    	Transform.prototype._transform = function (chunk, encoding, cb) {
    	  throw new Error('_transform() is not implemented');
    	};

    	Transform.prototype._write = function (chunk, encoding, cb) {
    	  var ts = this._transformState;
    	  ts.writecb = cb;
    	  ts.writechunk = chunk;
    	  ts.writeencoding = encoding;
    	  if (!ts.transforming) {
    	    var rs = this._readableState;
    	    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
    	  }
    	};

    	// Doesn't matter what the args are here.
    	// _transform does all the work.
    	// That we got here means that the readable side wants more data.
    	Transform.prototype._read = function (n) {
    	  var ts = this._transformState;

    	  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    	    ts.transforming = true;
    	    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
    	  } else {
    	    // mark that we need a transform, so that any data that comes in
    	    // will get processed, now that we've asked for it.
    	    ts.needTransform = true;
    	  }
    	};

    	Transform.prototype._destroy = function (err, cb) {
    	  var _this2 = this;

    	  Duplex.prototype._destroy.call(this, err, function (err2) {
    	    cb(err2);
    	    _this2.emit('close');
    	  });
    	};

    	function done(stream, er, data) {
    	  if (er) return stream.emit('error', er);

    	  if (data != null) // single equals check for both `null` and `undefined`
    	    stream.push(data);

    	  // if there's nothing in the write buffer, then that means
    	  // that nothing more will ever be provided
    	  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

    	  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

    	  return stream.push(null);
    	}
    	return _stream_transform;
    }

    var _stream_passthrough;
    var hasRequired_stream_passthrough;

    function require_stream_passthrough () {
    	if (hasRequired_stream_passthrough) return _stream_passthrough;
    	hasRequired_stream_passthrough = 1;

    	_stream_passthrough = PassThrough;

    	var Transform = require_stream_transform();

    	/*<replacement>*/
    	var util = Object.create(requireUtil());
    	util.inherits = requireInherits();
    	/*</replacement>*/

    	util.inherits(PassThrough, Transform);

    	function PassThrough(options) {
    	  if (!(this instanceof PassThrough)) return new PassThrough(options);

    	  Transform.call(this, options);
    	}

    	PassThrough.prototype._transform = function (chunk, encoding, cb) {
    	  cb(null, chunk);
    	};
    	return _stream_passthrough;
    }

    var hasRequiredReadable;

    function requireReadable () {
    	if (hasRequiredReadable) return readableExports;
    	hasRequiredReadable = 1;
    	(function (module, exports) {
    		var Stream = require$$0__default["default"];
    		if (process.env.READABLE_STREAM === 'disable' && Stream) {
    		  module.exports = Stream;
    		  exports = module.exports = Stream.Readable;
    		  exports.Readable = Stream.Readable;
    		  exports.Writable = Stream.Writable;
    		  exports.Duplex = Stream.Duplex;
    		  exports.Transform = Stream.Transform;
    		  exports.PassThrough = Stream.PassThrough;
    		  exports.Stream = Stream;
    		} else {
    		  exports = module.exports = require_stream_readable();
    		  exports.Stream = Stream || exports;
    		  exports.Readable = exports;
    		  exports.Writable = require_stream_writable();
    		  exports.Duplex = require_stream_duplex();
    		  exports.Transform = require_stream_transform();
    		  exports.PassThrough = require_stream_passthrough();
    		}
    } (readable, readableExports));
    	return readableExports;
    }

    var nodestream;
    var blob;

    support$4.base64 = true;
    support$4.array = true;
    support$4.string = true;
    support$4.arraybuffer = typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
    support$4.nodebuffer = typeof Buffer !== "undefined";
    // contains true if JSZip can read/generate Uint8Array, false otherwise.
    support$4.uint8array = typeof Uint8Array !== "undefined";

    if (typeof ArrayBuffer === "undefined") {
        blob = support$4.blob = false;
    }
    else {
        var buffer = new ArrayBuffer(0);
        try {
            blob = support$4.blob = new Blob([buffer], {
                type: "application/zip"
            }).size === 0;
        }
        catch (e) {
            try {
                var Builder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder;
                var builder = new Builder();
                builder.append(buffer);
                blob = support$4.blob = builder.getBlob("application/zip").size === 0;
            }
            catch (e) {
                blob = support$4.blob = false;
            }
        }
    }

    try {
        nodestream = support$4.nodestream = !!requireReadable().Readable;
    } catch(e) {
        nodestream = support$4.nodestream = false;
    }

    var base64$1 = {};

    var hasRequiredBase64;

    function requireBase64 () {
    	if (hasRequiredBase64) return base64$1;
    	hasRequiredBase64 = 1;
    	var utils = requireUtils();
    	var support = support$4;
    	// private property
    	var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";


    	// public method for encoding
    	base64$1.encode = function(input) {
    	    var output = [];
    	    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    	    var i = 0, len = input.length, remainingBytes = len;

    	    var isArray = utils.getTypeOf(input) !== "string";
    	    while (i < input.length) {
    	        remainingBytes = len - i;

    	        if (!isArray) {
    	            chr1 = input.charCodeAt(i++);
    	            chr2 = i < len ? input.charCodeAt(i++) : 0;
    	            chr3 = i < len ? input.charCodeAt(i++) : 0;
    	        } else {
    	            chr1 = input[i++];
    	            chr2 = i < len ? input[i++] : 0;
    	            chr3 = i < len ? input[i++] : 0;
    	        }

    	        enc1 = chr1 >> 2;
    	        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    	        enc3 = remainingBytes > 1 ? (((chr2 & 15) << 2) | (chr3 >> 6)) : 64;
    	        enc4 = remainingBytes > 2 ? (chr3 & 63) : 64;

    	        output.push(_keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4));

    	    }

    	    return output.join("");
    	};

    	// public method for decoding
    	base64$1.decode = function(input) {
    	    var chr1, chr2, chr3;
    	    var enc1, enc2, enc3, enc4;
    	    var i = 0, resultIndex = 0;

    	    var dataUrlPrefix = "data:";

    	    if (input.substr(0, dataUrlPrefix.length) === dataUrlPrefix) {
    	        // This is a common error: people give a data url
    	        // (data:image/png;base64,iVBOR...) with a {base64: true} and
    	        // wonders why things don't work.
    	        // We can detect that the string input looks like a data url but we
    	        // *can't* be sure it is one: removing everything up to the comma would
    	        // be too dangerous.
    	        throw new Error("Invalid base64 input, it looks like a data url.");
    	    }

    	    input = input.replace(/[^A-Za-z0-9+/=]/g, "");

    	    var totalLength = input.length * 3 / 4;
    	    if(input.charAt(input.length - 1) === _keyStr.charAt(64)) {
    	        totalLength--;
    	    }
    	    if(input.charAt(input.length - 2) === _keyStr.charAt(64)) {
    	        totalLength--;
    	    }
    	    if (totalLength % 1 !== 0) {
    	        // totalLength is not an integer, the length does not match a valid
    	        // base64 content. That can happen if:
    	        // - the input is not a base64 content
    	        // - the input is *almost* a base64 content, with a extra chars at the
    	        //   beginning or at the end
    	        // - the input uses a base64 variant (base64url for example)
    	        throw new Error("Invalid base64 input, bad content length.");
    	    }
    	    var output;
    	    if (support.uint8array) {
    	        output = new Uint8Array(totalLength|0);
    	    } else {
    	        output = new Array(totalLength|0);
    	    }

    	    while (i < input.length) {

    	        enc1 = _keyStr.indexOf(input.charAt(i++));
    	        enc2 = _keyStr.indexOf(input.charAt(i++));
    	        enc3 = _keyStr.indexOf(input.charAt(i++));
    	        enc4 = _keyStr.indexOf(input.charAt(i++));

    	        chr1 = (enc1 << 2) | (enc2 >> 4);
    	        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    	        chr3 = ((enc3 & 3) << 6) | enc4;

    	        output[resultIndex++] = chr1;

    	        if (enc3 !== 64) {
    	            output[resultIndex++] = chr2;
    	        }
    	        if (enc4 !== 64) {
    	            output[resultIndex++] = chr3;
    	        }

    	    }

    	    return output;
    	};
    	return base64$1;
    }

    var nodejsUtils$2 = {
        /**
         * True if this is running in Nodejs, will be undefined in a browser.
         * In a browser, browserify won't include this file and the whole module
         * will be resolved an empty object.
         */
        isNode : typeof Buffer !== "undefined",
        /**
         * Create a new nodejs Buffer from an existing content.
         * @param {Object} data the data to pass to the constructor.
         * @param {String} encoding the encoding to use.
         * @return {Buffer} a new Buffer.
         */
        newBufferFrom: function(data, encoding) {
            if (Buffer.from && Buffer.from !== Uint8Array.from) {
                return Buffer.from(data, encoding);
            } else {
                if (typeof data === "number") {
                    // Safeguard for old Node.js versions. On newer versions,
                    // Buffer.from(number) / Buffer(number, encoding) already throw.
                    throw new Error("The \"data\" argument must not be a number");
                }
                return new Buffer(data, encoding);
            }
        },
        /**
         * Create a new nodejs Buffer with the specified size.
         * @param {Integer} size the size of the buffer.
         * @return {Buffer} a new Buffer.
         */
        allocBuffer: function (size) {
            if (Buffer.alloc) {
                return Buffer.alloc(size);
            } else {
                var buf = new Buffer(size);
                buf.fill(0);
                return buf;
            }
        },
        /**
         * Find out if an object is a Buffer.
         * @param {Object} b the object to test.
         * @return {Boolean} true if the object is a Buffer, false otherwise.
         */
        isBuffer : function(b){
            return Buffer.isBuffer(b);
        },

        isStream : function (obj) {
            return obj &&
                typeof obj.on === "function" &&
                typeof obj.pause === "function" &&
                typeof obj.resume === "function";
        }
    };

    var lib$2;
    var hasRequiredLib$1;

    function requireLib$1 () {
    	if (hasRequiredLib$1) return lib$2;
    	hasRequiredLib$1 = 1;
    	var Mutation = commonjsGlobal.MutationObserver || commonjsGlobal.WebKitMutationObserver;

    	var scheduleDrain;

    	if (process.browser) {
    	  if (Mutation) {
    	    var called = 0;
    	    var observer = new Mutation(nextTick);
    	    var element = commonjsGlobal.document.createTextNode('');
    	    observer.observe(element, {
    	      characterData: true
    	    });
    	    scheduleDrain = function () {
    	      element.data = (called = ++called % 2);
    	    };
    	  } else if (!commonjsGlobal.setImmediate && typeof commonjsGlobal.MessageChannel !== 'undefined') {
    	    var channel = new commonjsGlobal.MessageChannel();
    	    channel.port1.onmessage = nextTick;
    	    scheduleDrain = function () {
    	      channel.port2.postMessage(0);
    	    };
    	  } else if ('document' in commonjsGlobal && 'onreadystatechange' in commonjsGlobal.document.createElement('script')) {
    	    scheduleDrain = function () {

    	      // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
    	      // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
    	      var scriptEl = commonjsGlobal.document.createElement('script');
    	      scriptEl.onreadystatechange = function () {
    	        nextTick();

    	        scriptEl.onreadystatechange = null;
    	        scriptEl.parentNode.removeChild(scriptEl);
    	        scriptEl = null;
    	      };
    	      commonjsGlobal.document.documentElement.appendChild(scriptEl);
    	    };
    	  } else {
    	    scheduleDrain = function () {
    	      setTimeout(nextTick, 0);
    	    };
    	  }
    	} else {
    	  scheduleDrain = function () {
    	    process.nextTick(nextTick);
    	  };
    	}

    	var draining;
    	var queue = [];
    	//named nextTick for less confusing stack traces
    	function nextTick() {
    	  draining = true;
    	  var i, oldQueue;
    	  var len = queue.length;
    	  while (len) {
    	    oldQueue = queue;
    	    queue = [];
    	    i = -1;
    	    while (++i < len) {
    	      oldQueue[i]();
    	    }
    	    len = queue.length;
    	  }
    	  draining = false;
    	}

    	lib$2 = immediate;
    	function immediate(task) {
    	  if (queue.push(task) === 1 && !draining) {
    	    scheduleDrain();
    	  }
    	}
    	return lib$2;
    }

    var lib$1;
    var hasRequiredLib;

    function requireLib () {
    	if (hasRequiredLib) return lib$1;
    	hasRequiredLib = 1;
    	var immediate = requireLib$1();

    	/* istanbul ignore next */
    	function INTERNAL() {}

    	var handlers = {};

    	var REJECTED = ['REJECTED'];
    	var FULFILLED = ['FULFILLED'];
    	var PENDING = ['PENDING'];
    	/* istanbul ignore else */
    	if (!process.browser) {
    	  // in which we actually take advantage of JS scoping
    	  var UNHANDLED = ['UNHANDLED'];
    	}

    	lib$1 = Promise;

    	function Promise(resolver) {
    	  if (typeof resolver !== 'function') {
    	    throw new TypeError('resolver must be a function');
    	  }
    	  this.state = PENDING;
    	  this.queue = [];
    	  this.outcome = void 0;
    	  /* istanbul ignore else */
    	  if (!process.browser) {
    	    this.handled = UNHANDLED;
    	  }
    	  if (resolver !== INTERNAL) {
    	    safelyResolveThenable(this, resolver);
    	  }
    	}

    	Promise.prototype.finally = function (callback) {
    	  if (typeof callback !== 'function') {
    	    return this;
    	  }
    	  var p = this.constructor;
    	  return this.then(resolve, reject);

    	  function resolve(value) {
    	    function yes () {
    	      return value;
    	    }
    	    return p.resolve(callback()).then(yes);
    	  }
    	  function reject(reason) {
    	    function no () {
    	      throw reason;
    	    }
    	    return p.resolve(callback()).then(no);
    	  }
    	};
    	Promise.prototype.catch = function (onRejected) {
    	  return this.then(null, onRejected);
    	};
    	Promise.prototype.then = function (onFulfilled, onRejected) {
    	  if (typeof onFulfilled !== 'function' && this.state === FULFILLED ||
    	    typeof onRejected !== 'function' && this.state === REJECTED) {
    	    return this;
    	  }
    	  var promise = new this.constructor(INTERNAL);
    	  /* istanbul ignore else */
    	  if (!process.browser) {
    	    if (this.handled === UNHANDLED) {
    	      this.handled = null;
    	    }
    	  }
    	  if (this.state !== PENDING) {
    	    var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
    	    unwrap(promise, resolver, this.outcome);
    	  } else {
    	    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
    	  }

    	  return promise;
    	};
    	function QueueItem(promise, onFulfilled, onRejected) {
    	  this.promise = promise;
    	  if (typeof onFulfilled === 'function') {
    	    this.onFulfilled = onFulfilled;
    	    this.callFulfilled = this.otherCallFulfilled;
    	  }
    	  if (typeof onRejected === 'function') {
    	    this.onRejected = onRejected;
    	    this.callRejected = this.otherCallRejected;
    	  }
    	}
    	QueueItem.prototype.callFulfilled = function (value) {
    	  handlers.resolve(this.promise, value);
    	};
    	QueueItem.prototype.otherCallFulfilled = function (value) {
    	  unwrap(this.promise, this.onFulfilled, value);
    	};
    	QueueItem.prototype.callRejected = function (value) {
    	  handlers.reject(this.promise, value);
    	};
    	QueueItem.prototype.otherCallRejected = function (value) {
    	  unwrap(this.promise, this.onRejected, value);
    	};

    	function unwrap(promise, func, value) {
    	  immediate(function () {
    	    var returnValue;
    	    try {
    	      returnValue = func(value);
    	    } catch (e) {
    	      return handlers.reject(promise, e);
    	    }
    	    if (returnValue === promise) {
    	      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
    	    } else {
    	      handlers.resolve(promise, returnValue);
    	    }
    	  });
    	}

    	handlers.resolve = function (self, value) {
    	  var result = tryCatch(getThen, value);
    	  if (result.status === 'error') {
    	    return handlers.reject(self, result.value);
    	  }
    	  var thenable = result.value;

    	  if (thenable) {
    	    safelyResolveThenable(self, thenable);
    	  } else {
    	    self.state = FULFILLED;
    	    self.outcome = value;
    	    var i = -1;
    	    var len = self.queue.length;
    	    while (++i < len) {
    	      self.queue[i].callFulfilled(value);
    	    }
    	  }
    	  return self;
    	};
    	handlers.reject = function (self, error) {
    	  self.state = REJECTED;
    	  self.outcome = error;
    	  /* istanbul ignore else */
    	  if (!process.browser) {
    	    if (self.handled === UNHANDLED) {
    	      immediate(function () {
    	        if (self.handled === UNHANDLED) {
    	          process.emit('unhandledRejection', error, self);
    	        }
    	      });
    	    }
    	  }
    	  var i = -1;
    	  var len = self.queue.length;
    	  while (++i < len) {
    	    self.queue[i].callRejected(error);
    	  }
    	  return self;
    	};

    	function getThen(obj) {
    	  // Make sure we only access the accessor once as required by the spec
    	  var then = obj && obj.then;
    	  if (obj && (typeof obj === 'object' || typeof obj === 'function') && typeof then === 'function') {
    	    return function appyThen() {
    	      then.apply(obj, arguments);
    	    };
    	  }
    	}

    	function safelyResolveThenable(self, thenable) {
    	  // Either fulfill, reject or reject with error
    	  var called = false;
    	  function onError(value) {
    	    if (called) {
    	      return;
    	    }
    	    called = true;
    	    handlers.reject(self, value);
    	  }

    	  function onSuccess(value) {
    	    if (called) {
    	      return;
    	    }
    	    called = true;
    	    handlers.resolve(self, value);
    	  }

    	  function tryToUnwrap() {
    	    thenable(onSuccess, onError);
    	  }

    	  var result = tryCatch(tryToUnwrap);
    	  if (result.status === 'error') {
    	    onError(result.value);
    	  }
    	}

    	function tryCatch(func, value) {
    	  var out = {};
    	  try {
    	    out.value = func(value);
    	    out.status = 'success';
    	  } catch (e) {
    	    out.status = 'error';
    	    out.value = e;
    	  }
    	  return out;
    	}

    	Promise.resolve = resolve;
    	function resolve(value) {
    	  if (value instanceof this) {
    	    return value;
    	  }
    	  return handlers.resolve(new this(INTERNAL), value);
    	}

    	Promise.reject = reject;
    	function reject(reason) {
    	  var promise = new this(INTERNAL);
    	  return handlers.reject(promise, reason);
    	}

    	Promise.all = all;
    	function all(iterable) {
    	  var self = this;
    	  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    	    return this.reject(new TypeError('must be an array'));
    	  }

    	  var len = iterable.length;
    	  var called = false;
    	  if (!len) {
    	    return this.resolve([]);
    	  }

    	  var values = new Array(len);
    	  var resolved = 0;
    	  var i = -1;
    	  var promise = new this(INTERNAL);

    	  while (++i < len) {
    	    allResolver(iterable[i], i);
    	  }
    	  return promise;
    	  function allResolver(value, i) {
    	    self.resolve(value).then(resolveFromAll, function (error) {
    	      if (!called) {
    	        called = true;
    	        handlers.reject(promise, error);
    	      }
    	    });
    	    function resolveFromAll(outValue) {
    	      values[i] = outValue;
    	      if (++resolved === len && !called) {
    	        called = true;
    	        handlers.resolve(promise, values);
    	      }
    	    }
    	  }
    	}

    	Promise.race = race;
    	function race(iterable) {
    	  var self = this;
    	  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    	    return this.reject(new TypeError('must be an array'));
    	  }

    	  var len = iterable.length;
    	  var called = false;
    	  if (!len) {
    	    return this.resolve([]);
    	  }

    	  var i = -1;
    	  var promise = new this(INTERNAL);

    	  while (++i < len) {
    	    resolver(iterable[i]);
    	  }
    	  return promise;
    	  function resolver(value) {
    	    self.resolve(value).then(function (response) {
    	      if (!called) {
    	        called = true;
    	        handlers.resolve(promise, response);
    	      }
    	    }, function (error) {
    	      if (!called) {
    	        called = true;
    	        handlers.reject(promise, error);
    	      }
    	    });
    	  }
    	}
    	return lib$1;
    }

    // load the global object first:
    // - it should be better integrated in the system (unhandledRejection in node)
    // - the environment may have a custom Promise implementation (see zone.js)
    var ES6Promise = null;
    if (typeof Promise !== "undefined") {
        ES6Promise = Promise;
    } else {
        ES6Promise = requireLib();
    }

    /**
     * Let the user use/change some implementations.
     */
    var external$3 = {
        Promise: ES6Promise
    };

    (function (global, undefined$1) {

        if (global.setImmediate) {
            return;
        }

        var nextHandle = 1; // Spec says greater than zero
        var tasksByHandle = {};
        var currentlyRunningATask = false;
        var doc = global.document;
        var registerImmediate;

        function setImmediate(callback) {
          // Callback can either be a function or a string
          if (typeof callback !== "function") {
            callback = new Function("" + callback);
          }
          // Copy function arguments
          var args = new Array(arguments.length - 1);
          for (var i = 0; i < args.length; i++) {
              args[i] = arguments[i + 1];
          }
          // Store and register the task
          var task = { callback: callback, args: args };
          tasksByHandle[nextHandle] = task;
          registerImmediate(nextHandle);
          return nextHandle++;
        }

        function clearImmediate(handle) {
            delete tasksByHandle[handle];
        }

        function run(task) {
            var callback = task.callback;
            var args = task.args;
            switch (args.length) {
            case 0:
                callback();
                break;
            case 1:
                callback(args[0]);
                break;
            case 2:
                callback(args[0], args[1]);
                break;
            case 3:
                callback(args[0], args[1], args[2]);
                break;
            default:
                callback.apply(undefined$1, args);
                break;
            }
        }

        function runIfPresent(handle) {
            // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
            // So if we're currently running a task, we'll need to delay this invocation.
            if (currentlyRunningATask) {
                // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
                // "too much recursion" error.
                setTimeout(runIfPresent, 0, handle);
            } else {
                var task = tasksByHandle[handle];
                if (task) {
                    currentlyRunningATask = true;
                    try {
                        run(task);
                    } finally {
                        clearImmediate(handle);
                        currentlyRunningATask = false;
                    }
                }
            }
        }

        function installNextTickImplementation() {
            registerImmediate = function(handle) {
                process.nextTick(function () { runIfPresent(handle); });
            };
        }

        function canUsePostMessage() {
            // The test against `importScripts` prevents this implementation from being installed inside a web worker,
            // where `global.postMessage` means something completely different and can't be used for this purpose.
            if (global.postMessage && !global.importScripts) {
                var postMessageIsAsynchronous = true;
                var oldOnMessage = global.onmessage;
                global.onmessage = function() {
                    postMessageIsAsynchronous = false;
                };
                global.postMessage("", "*");
                global.onmessage = oldOnMessage;
                return postMessageIsAsynchronous;
            }
        }

        function installPostMessageImplementation() {
            // Installs an event handler on `global` for the `message` event: see
            // * https://developer.mozilla.org/en/DOM/window.postMessage
            // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

            var messagePrefix = "setImmediate$" + Math.random() + "$";
            var onGlobalMessage = function(event) {
                if (event.source === global &&
                    typeof event.data === "string" &&
                    event.data.indexOf(messagePrefix) === 0) {
                    runIfPresent(+event.data.slice(messagePrefix.length));
                }
            };

            if (global.addEventListener) {
                global.addEventListener("message", onGlobalMessage, false);
            } else {
                global.attachEvent("onmessage", onGlobalMessage);
            }

            registerImmediate = function(handle) {
                global.postMessage(messagePrefix + handle, "*");
            };
        }

        function installMessageChannelImplementation() {
            var channel = new MessageChannel();
            channel.port1.onmessage = function(event) {
                var handle = event.data;
                runIfPresent(handle);
            };

            registerImmediate = function(handle) {
                channel.port2.postMessage(handle);
            };
        }

        function installReadyStateChangeImplementation() {
            var html = doc.documentElement;
            registerImmediate = function(handle) {
                // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
                // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
                var script = doc.createElement("script");
                script.onreadystatechange = function () {
                    runIfPresent(handle);
                    script.onreadystatechange = null;
                    html.removeChild(script);
                    script = null;
                };
                html.appendChild(script);
            };
        }

        function installSetTimeoutImplementation() {
            registerImmediate = function(handle) {
                setTimeout(runIfPresent, 0, handle);
            };
        }

        // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
        var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
        attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

        // Don't get fooled by e.g. browserify environments.
        if ({}.toString.call(global.process) === "[object process]") {
            // For Node.js before 0.9
            installNextTickImplementation();

        } else if (canUsePostMessage()) {
            // For non-IE10 modern browsers
            installPostMessageImplementation();

        } else if (global.MessageChannel) {
            // For web workers, where supported
            installMessageChannelImplementation();

        } else if (doc && "onreadystatechange" in doc.createElement("script")) {
            // For IE 6–8
            installReadyStateChangeImplementation();

        } else {
            // For older browsers
            installSetTimeoutImplementation();
        }

        attachTo.setImmediate = setImmediate;
        attachTo.clearImmediate = clearImmediate;
    }(typeof self === "undefined" ? typeof commonjsGlobal === "undefined" ? commonjsGlobal : commonjsGlobal : self));

    var hasRequiredUtils;

    function requireUtils () {
    	if (hasRequiredUtils) return utils$q;
    	hasRequiredUtils = 1;
    	(function (exports) {

    		var support = support$4;
    		var base64 = requireBase64();
    		var nodejsUtils = nodejsUtils$2;
    		var external = external$3;



    		/**
    		 * Convert a string that pass as a "binary string": it should represent a byte
    		 * array but may have > 255 char codes. Be sure to take only the first byte
    		 * and returns the byte array.
    		 * @param {String} str the string to transform.
    		 * @return {Array|Uint8Array} the string in a binary format.
    		 */
    		function string2binary(str) {
    		    var result = null;
    		    if (support.uint8array) {
    		        result = new Uint8Array(str.length);
    		    } else {
    		        result = new Array(str.length);
    		    }
    		    return stringToArrayLike(str, result);
    		}

    		/**
    		 * Create a new blob with the given content and the given type.
    		 * @param {String|ArrayBuffer} part the content to put in the blob. DO NOT use
    		 * an Uint8Array because the stock browser of android 4 won't accept it (it
    		 * will be silently converted to a string, "[object Uint8Array]").
    		 *
    		 * Use only ONE part to build the blob to avoid a memory leak in IE11 / Edge:
    		 * when a large amount of Array is used to create the Blob, the amount of
    		 * memory consumed is nearly 100 times the original data amount.
    		 *
    		 * @param {String} type the mime type of the blob.
    		 * @return {Blob} the created blob.
    		 */
    		exports.newBlob = function(part, type) {
    		    exports.checkSupport("blob");

    		    try {
    		        // Blob constructor
    		        return new Blob([part], {
    		            type: type
    		        });
    		    }
    		    catch (e) {

    		        try {
    		            // deprecated, browser only, old way
    		            var Builder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder;
    		            var builder = new Builder();
    		            builder.append(part);
    		            return builder.getBlob(type);
    		        }
    		        catch (e) {

    		            // well, fuck ?!
    		            throw new Error("Bug : can't construct the Blob.");
    		        }
    		    }


    		};
    		/**
    		 * The identity function.
    		 * @param {Object} input the input.
    		 * @return {Object} the same input.
    		 */
    		function identity(input) {
    		    return input;
    		}

    		/**
    		 * Fill in an array with a string.
    		 * @param {String} str the string to use.
    		 * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to fill in (will be mutated).
    		 * @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated array.
    		 */
    		function stringToArrayLike(str, array) {
    		    for (var i = 0; i < str.length; ++i) {
    		        array[i] = str.charCodeAt(i) & 0xFF;
    		    }
    		    return array;
    		}

    		/**
    		 * An helper for the function arrayLikeToString.
    		 * This contains static information and functions that
    		 * can be optimized by the browser JIT compiler.
    		 */
    		var arrayToStringHelper = {
    		    /**
    		     * Transform an array of int into a string, chunk by chunk.
    		     * See the performances notes on arrayLikeToString.
    		     * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
    		     * @param {String} type the type of the array.
    		     * @param {Integer} chunk the chunk size.
    		     * @return {String} the resulting string.
    		     * @throws Error if the chunk is too big for the stack.
    		     */
    		    stringifyByChunk: function(array, type, chunk) {
    		        var result = [], k = 0, len = array.length;
    		        // shortcut
    		        if (len <= chunk) {
    		            return String.fromCharCode.apply(null, array);
    		        }
    		        while (k < len) {
    		            if (type === "array" || type === "nodebuffer") {
    		                result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
    		            }
    		            else {
    		                result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
    		            }
    		            k += chunk;
    		        }
    		        return result.join("");
    		    },
    		    /**
    		     * Call String.fromCharCode on every item in the array.
    		     * This is the naive implementation, which generate A LOT of intermediate string.
    		     * This should be used when everything else fail.
    		     * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
    		     * @return {String} the result.
    		     */
    		    stringifyByChar: function(array){
    		        var resultStr = "";
    		        for(var i = 0; i < array.length; i++) {
    		            resultStr += String.fromCharCode(array[i]);
    		        }
    		        return resultStr;
    		    },
    		    applyCanBeUsed : {
    		        /**
    		         * true if the browser accepts to use String.fromCharCode on Uint8Array
    		         */
    		        uint8array : (function () {
    		            try {
    		                return support.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
    		            } catch (e) {
    		                return false;
    		            }
    		        })(),
    		        /**
    		         * true if the browser accepts to use String.fromCharCode on nodejs Buffer.
    		         */
    		        nodebuffer : (function () {
    		            try {
    		                return support.nodebuffer && String.fromCharCode.apply(null, nodejsUtils.allocBuffer(1)).length === 1;
    		            } catch (e) {
    		                return false;
    		            }
    		        })()
    		    }
    		};

    		/**
    		 * Transform an array-like object to a string.
    		 * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
    		 * @return {String} the result.
    		 */
    		function arrayLikeToString(array) {
    		    // Performances notes :
    		    // --------------------
    		    // String.fromCharCode.apply(null, array) is the fastest, see
    		    // see http://jsperf.com/converting-a-uint8array-to-a-string/2
    		    // but the stack is limited (and we can get huge arrays !).
    		    //
    		    // result += String.fromCharCode(array[i]); generate too many strings !
    		    //
    		    // This code is inspired by http://jsperf.com/arraybuffer-to-string-apply-performance/2
    		    // TODO : we now have workers that split the work. Do we still need that ?
    		    var chunk = 65536,
    		        type = exports.getTypeOf(array),
    		        canUseApply = true;
    		    if (type === "uint8array") {
    		        canUseApply = arrayToStringHelper.applyCanBeUsed.uint8array;
    		    } else if (type === "nodebuffer") {
    		        canUseApply = arrayToStringHelper.applyCanBeUsed.nodebuffer;
    		    }

    		    if (canUseApply) {
    		        while (chunk > 1) {
    		            try {
    		                return arrayToStringHelper.stringifyByChunk(array, type, chunk);
    		            } catch (e) {
    		                chunk = Math.floor(chunk / 2);
    		            }
    		        }
    		    }

    		    // no apply or chunk error : slow and painful algorithm
    		    // default browser on android 4.*
    		    return arrayToStringHelper.stringifyByChar(array);
    		}

    		exports.applyFromCharCode = arrayLikeToString;


    		/**
    		 * Copy the data from an array-like to an other array-like.
    		 * @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayFrom the origin array.
    		 * @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayTo the destination array which will be mutated.
    		 * @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated destination array.
    		 */
    		function arrayLikeToArrayLike(arrayFrom, arrayTo) {
    		    for (var i = 0; i < arrayFrom.length; i++) {
    		        arrayTo[i] = arrayFrom[i];
    		    }
    		    return arrayTo;
    		}

    		// a matrix containing functions to transform everything into everything.
    		var transform = {};

    		// string to ?
    		transform["string"] = {
    		    "string": identity,
    		    "array": function(input) {
    		        return stringToArrayLike(input, new Array(input.length));
    		    },
    		    "arraybuffer": function(input) {
    		        return transform["string"]["uint8array"](input).buffer;
    		    },
    		    "uint8array": function(input) {
    		        return stringToArrayLike(input, new Uint8Array(input.length));
    		    },
    		    "nodebuffer": function(input) {
    		        return stringToArrayLike(input, nodejsUtils.allocBuffer(input.length));
    		    }
    		};

    		// array to ?
    		transform["array"] = {
    		    "string": arrayLikeToString,
    		    "array": identity,
    		    "arraybuffer": function(input) {
    		        return (new Uint8Array(input)).buffer;
    		    },
    		    "uint8array": function(input) {
    		        return new Uint8Array(input);
    		    },
    		    "nodebuffer": function(input) {
    		        return nodejsUtils.newBufferFrom(input);
    		    }
    		};

    		// arraybuffer to ?
    		transform["arraybuffer"] = {
    		    "string": function(input) {
    		        return arrayLikeToString(new Uint8Array(input));
    		    },
    		    "array": function(input) {
    		        return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
    		    },
    		    "arraybuffer": identity,
    		    "uint8array": function(input) {
    		        return new Uint8Array(input);
    		    },
    		    "nodebuffer": function(input) {
    		        return nodejsUtils.newBufferFrom(new Uint8Array(input));
    		    }
    		};

    		// uint8array to ?
    		transform["uint8array"] = {
    		    "string": arrayLikeToString,
    		    "array": function(input) {
    		        return arrayLikeToArrayLike(input, new Array(input.length));
    		    },
    		    "arraybuffer": function(input) {
    		        return input.buffer;
    		    },
    		    "uint8array": identity,
    		    "nodebuffer": function(input) {
    		        return nodejsUtils.newBufferFrom(input);
    		    }
    		};

    		// nodebuffer to ?
    		transform["nodebuffer"] = {
    		    "string": arrayLikeToString,
    		    "array": function(input) {
    		        return arrayLikeToArrayLike(input, new Array(input.length));
    		    },
    		    "arraybuffer": function(input) {
    		        return transform["nodebuffer"]["uint8array"](input).buffer;
    		    },
    		    "uint8array": function(input) {
    		        return arrayLikeToArrayLike(input, new Uint8Array(input.length));
    		    },
    		    "nodebuffer": identity
    		};

    		/**
    		 * Transform an input into any type.
    		 * The supported output type are : string, array, uint8array, arraybuffer, nodebuffer.
    		 * If no output type is specified, the unmodified input will be returned.
    		 * @param {String} outputType the output type.
    		 * @param {String|Array|ArrayBuffer|Uint8Array|Buffer} input the input to convert.
    		 * @throws {Error} an Error if the browser doesn't support the requested output type.
    		 */
    		exports.transformTo = function(outputType, input) {
    		    if (!input) {
    		        // undefined, null, etc
    		        // an empty string won't harm.
    		        input = "";
    		    }
    		    if (!outputType) {
    		        return input;
    		    }
    		    exports.checkSupport(outputType);
    		    var inputType = exports.getTypeOf(input);
    		    var result = transform[inputType][outputType](input);
    		    return result;
    		};

    		/**
    		 * Resolve all relative path components, "." and "..", in a path. If these relative components
    		 * traverse above the root then the resulting path will only contain the final path component.
    		 *
    		 * All empty components, e.g. "//", are removed.
    		 * @param {string} path A path with / or \ separators
    		 * @returns {string} The path with all relative path components resolved.
    		 */
    		exports.resolve = function(path) {
    		    var parts = path.split("/");
    		    var result = [];
    		    for (var index = 0; index < parts.length; index++) {
    		        var part = parts[index];
    		        // Allow the first and last component to be empty for trailing slashes.
    		        if (part === "." || (part === "" && index !== 0 && index !== parts.length - 1)) {
    		            continue;
    		        } else if (part === "..") {
    		            result.pop();
    		        } else {
    		            result.push(part);
    		        }
    		    }
    		    return result.join("/");
    		};

    		/**
    		 * Return the type of the input.
    		 * The type will be in a format valid for JSZip.utils.transformTo : string, array, uint8array, arraybuffer.
    		 * @param {Object} input the input to identify.
    		 * @return {String} the (lowercase) type of the input.
    		 */
    		exports.getTypeOf = function(input) {
    		    if (typeof input === "string") {
    		        return "string";
    		    }
    		    if (Object.prototype.toString.call(input) === "[object Array]") {
    		        return "array";
    		    }
    		    if (support.nodebuffer && nodejsUtils.isBuffer(input)) {
    		        return "nodebuffer";
    		    }
    		    if (support.uint8array && input instanceof Uint8Array) {
    		        return "uint8array";
    		    }
    		    if (support.arraybuffer && input instanceof ArrayBuffer) {
    		        return "arraybuffer";
    		    }
    		};

    		/**
    		 * Throw an exception if the type is not supported.
    		 * @param {String} type the type to check.
    		 * @throws {Error} an Error if the browser doesn't support the requested type.
    		 */
    		exports.checkSupport = function(type) {
    		    var supported = support[type.toLowerCase()];
    		    if (!supported) {
    		        throw new Error(type + " is not supported by this platform");
    		    }
    		};

    		exports.MAX_VALUE_16BITS = 65535;
    		exports.MAX_VALUE_32BITS = -1; // well, "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF" is parsed as -1

    		/**
    		 * Prettify a string read as binary.
    		 * @param {string} str the string to prettify.
    		 * @return {string} a pretty string.
    		 */
    		exports.pretty = function(str) {
    		    var res = "",
    		        code, i;
    		    for (i = 0; i < (str || "").length; i++) {
    		        code = str.charCodeAt(i);
    		        res += "\\x" + (code < 16 ? "0" : "") + code.toString(16).toUpperCase();
    		    }
    		    return res;
    		};

    		/**
    		 * Defer the call of a function.
    		 * @param {Function} callback the function to call asynchronously.
    		 * @param {Array} args the arguments to give to the callback.
    		 */
    		exports.delay = function(callback, args, self) {
    		    setImmediate(function () {
    		        callback.apply(self || null, args || []);
    		    });
    		};

    		/**
    		 * Extends a prototype with an other, without calling a constructor with
    		 * side effects. Inspired by nodejs' `utils.inherits`
    		 * @param {Function} ctor the constructor to augment
    		 * @param {Function} superCtor the parent constructor to use
    		 */
    		exports.inherits = function (ctor, superCtor) {
    		    var Obj = function() {};
    		    Obj.prototype = superCtor.prototype;
    		    ctor.prototype = new Obj();
    		};

    		/**
    		 * Merge the objects passed as parameters into a new one.
    		 * @private
    		 * @param {...Object} var_args All objects to merge.
    		 * @return {Object} a new object with the data of the others.
    		 */
    		exports.extend = function() {
    		    var result = {}, i, attr;
    		    for (i = 0; i < arguments.length; i++) { // arguments is not enumerable in some browsers
    		        for (attr in arguments[i]) {
    		            if (Object.prototype.hasOwnProperty.call(arguments[i], attr) && typeof result[attr] === "undefined") {
    		                result[attr] = arguments[i][attr];
    		            }
    		        }
    		    }
    		    return result;
    		};

    		/**
    		 * Transform arbitrary content into a Promise.
    		 * @param {String} name a name for the content being processed.
    		 * @param {Object} inputData the content to process.
    		 * @param {Boolean} isBinary true if the content is not an unicode string
    		 * @param {Boolean} isOptimizedBinaryString true if the string content only has one byte per character.
    		 * @param {Boolean} isBase64 true if the string content is encoded with base64.
    		 * @return {Promise} a promise in a format usable by JSZip.
    		 */
    		exports.prepareContent = function(name, inputData, isBinary, isOptimizedBinaryString, isBase64) {

    		    // if inputData is already a promise, this flatten it.
    		    var promise = external.Promise.resolve(inputData).then(function(data) {


    		        var isBlob = support.blob && (data instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(data)) !== -1);

    		        if (isBlob && typeof FileReader !== "undefined") {
    		            return new external.Promise(function (resolve, reject) {
    		                var reader = new FileReader();

    		                reader.onload = function(e) {
    		                    resolve(e.target.result);
    		                };
    		                reader.onerror = function(e) {
    		                    reject(e.target.error);
    		                };
    		                reader.readAsArrayBuffer(data);
    		            });
    		        } else {
    		            return data;
    		        }
    		    });

    		    return promise.then(function(data) {
    		        var dataType = exports.getTypeOf(data);

    		        if (!dataType) {
    		            return external.Promise.reject(
    		                new Error("Can't read the data of '" + name + "'. Is it " +
    		                          "in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?")
    		            );
    		        }
    		        // special case : it's way easier to work with Uint8Array than with ArrayBuffer
    		        if (dataType === "arraybuffer") {
    		            data = exports.transformTo("uint8array", data);
    		        } else if (dataType === "string") {
    		            if (isBase64) {
    		                data = base64.decode(data);
    		            }
    		            else if (isBinary) {
    		                // optimizedBinaryString === true means that the file has already been filtered with a 0xFF mask
    		                if (isOptimizedBinaryString !== true) {
    		                    // this is a string, not in a base64 format.
    		                    // Be sure that this is a correct "binary string"
    		                    data = string2binary(data);
    		                }
    		            }
    		        }
    		        return data;
    		    });
    		};
    } (utils$q));
    	return utils$q;
    }

    /**
     * A worker that does nothing but passing chunks to the next one. This is like
     * a nodejs stream but with some differences. On the good side :
     * - it works on IE 6-9 without any issue / polyfill
     * - it weights less than the full dependencies bundled with browserify
     * - it forwards errors (no need to declare an error handler EVERYWHERE)
     *
     * A chunk is an object with 2 attributes : `meta` and `data`. The former is an
     * object containing anything (`percent` for example), see each worker for more
     * details. The latter is the real data (String, Uint8Array, etc).
     *
     * @constructor
     * @param {String} name the name of the stream (mainly used for debugging purposes)
     */
    function GenericWorker$b(name) {
        // the name of the worker
        this.name = name || "default";
        // an object containing metadata about the workers chain
        this.streamInfo = {};
        // an error which happened when the worker was paused
        this.generatedError = null;
        // an object containing metadata to be merged by this worker into the general metadata
        this.extraStreamInfo = {};
        // true if the stream is paused (and should not do anything), false otherwise
        this.isPaused = true;
        // true if the stream is finished (and should not do anything), false otherwise
        this.isFinished = false;
        // true if the stream is locked to prevent further structure updates (pipe), false otherwise
        this.isLocked = false;
        // the event listeners
        this._listeners = {
            "data":[],
            "end":[],
            "error":[]
        };
        // the previous worker, if any
        this.previous = null;
    }

    GenericWorker$b.prototype = {
        /**
         * Push a chunk to the next workers.
         * @param {Object} chunk the chunk to push
         */
        push : function (chunk) {
            this.emit("data", chunk);
        },
        /**
         * End the stream.
         * @return {Boolean} true if this call ended the worker, false otherwise.
         */
        end : function () {
            if (this.isFinished) {
                return false;
            }

            this.flush();
            try {
                this.emit("end");
                this.cleanUp();
                this.isFinished = true;
            } catch (e) {
                this.emit("error", e);
            }
            return true;
        },
        /**
         * End the stream with an error.
         * @param {Error} e the error which caused the premature end.
         * @return {Boolean} true if this call ended the worker with an error, false otherwise.
         */
        error : function (e) {
            if (this.isFinished) {
                return false;
            }

            if(this.isPaused) {
                this.generatedError = e;
            } else {
                this.isFinished = true;

                this.emit("error", e);

                // in the workers chain exploded in the middle of the chain,
                // the error event will go downward but we also need to notify
                // workers upward that there has been an error.
                if(this.previous) {
                    this.previous.error(e);
                }

                this.cleanUp();
            }
            return true;
        },
        /**
         * Add a callback on an event.
         * @param {String} name the name of the event (data, end, error)
         * @param {Function} listener the function to call when the event is triggered
         * @return {GenericWorker} the current object for chainability
         */
        on : function (name, listener) {
            this._listeners[name].push(listener);
            return this;
        },
        /**
         * Clean any references when a worker is ending.
         */
        cleanUp : function () {
            this.streamInfo = this.generatedError = this.extraStreamInfo = null;
            this._listeners = [];
        },
        /**
         * Trigger an event. This will call registered callback with the provided arg.
         * @param {String} name the name of the event (data, end, error)
         * @param {Object} arg the argument to call the callback with.
         */
        emit : function (name, arg) {
            if (this._listeners[name]) {
                for(var i = 0; i < this._listeners[name].length; i++) {
                    this._listeners[name][i].call(this, arg);
                }
            }
        },
        /**
         * Chain a worker with an other.
         * @param {Worker} next the worker receiving events from the current one.
         * @return {worker} the next worker for chainability
         */
        pipe : function (next) {
            return next.registerPrevious(this);
        },
        /**
         * Same as `pipe` in the other direction.
         * Using an API with `pipe(next)` is very easy.
         * Implementing the API with the point of view of the next one registering
         * a source is easier, see the ZipFileWorker.
         * @param {Worker} previous the previous worker, sending events to this one
         * @return {Worker} the current worker for chainability
         */
        registerPrevious : function (previous) {
            if (this.isLocked) {
                throw new Error("The stream '" + this + "' has already been used.");
            }

            // sharing the streamInfo...
            this.streamInfo = previous.streamInfo;
            // ... and adding our own bits
            this.mergeStreamInfo();
            this.previous =  previous;
            var self = this;
            previous.on("data", function (chunk) {
                self.processChunk(chunk);
            });
            previous.on("end", function () {
                self.end();
            });
            previous.on("error", function (e) {
                self.error(e);
            });
            return this;
        },
        /**
         * Pause the stream so it doesn't send events anymore.
         * @return {Boolean} true if this call paused the worker, false otherwise.
         */
        pause : function () {
            if(this.isPaused || this.isFinished) {
                return false;
            }
            this.isPaused = true;

            if(this.previous) {
                this.previous.pause();
            }
            return true;
        },
        /**
         * Resume a paused stream.
         * @return {Boolean} true if this call resumed the worker, false otherwise.
         */
        resume : function () {
            if(!this.isPaused || this.isFinished) {
                return false;
            }
            this.isPaused = false;

            // if true, the worker tried to resume but failed
            var withError = false;
            if(this.generatedError) {
                this.error(this.generatedError);
                withError = true;
            }
            if(this.previous) {
                this.previous.resume();
            }

            return !withError;
        },
        /**
         * Flush any remaining bytes as the stream is ending.
         */
        flush : function () {},
        /**
         * Process a chunk. This is usually the method overridden.
         * @param {Object} chunk the chunk to process.
         */
        processChunk : function(chunk) {
            this.push(chunk);
        },
        /**
         * Add a key/value to be added in the workers chain streamInfo once activated.
         * @param {String} key the key to use
         * @param {Object} value the associated value
         * @return {Worker} the current worker for chainability
         */
        withStreamInfo : function (key, value) {
            this.extraStreamInfo[key] = value;
            this.mergeStreamInfo();
            return this;
        },
        /**
         * Merge this worker's streamInfo into the chain's streamInfo.
         */
        mergeStreamInfo : function () {
            for(var key in this.extraStreamInfo) {
                if (!Object.prototype.hasOwnProperty.call(this.extraStreamInfo, key)) {
                    continue;
                }
                this.streamInfo[key] = this.extraStreamInfo[key];
            }
        },

        /**
         * Lock the stream to prevent further updates on the workers chain.
         * After calling this method, all calls to pipe will fail.
         */
        lock: function () {
            if (this.isLocked) {
                throw new Error("The stream '" + this + "' has already been used.");
            }
            this.isLocked = true;
            if (this.previous) {
                this.previous.lock();
            }
        },

        /**
         *
         * Pretty print the workers chain.
         */
        toString : function () {
            var me = "Worker " + this.name;
            if (this.previous) {
                return this.previous + " -> " + me;
            } else {
                return me;
            }
        }
    };

    var GenericWorker_1 = GenericWorker$b;

    (function (exports) {

    	var utils = requireUtils();
    	var support = support$4;
    	var nodejsUtils = nodejsUtils$2;
    	var GenericWorker = GenericWorker_1;

    	/**
    	 * The following functions come from pako, from pako/lib/utils/strings
    	 * released under the MIT license, see pako https://github.com/nodeca/pako/
    	 */

    	// Table with utf8 lengths (calculated by first byte of sequence)
    	// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
    	// because max possible codepoint is 0x10ffff
    	var _utf8len = new Array(256);
    	for (var i=0; i<256; i++) {
    	    _utf8len[i] = (i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1);
    	}
    	_utf8len[254]=_utf8len[254]=1; // Invalid sequence start

    	// convert string to array (typed, when possible)
    	var string2buf = function (str) {
    	    var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

    	    // count binary size
    	    for (m_pos = 0; m_pos < str_len; m_pos++) {
    	        c = str.charCodeAt(m_pos);
    	        if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
    	            c2 = str.charCodeAt(m_pos+1);
    	            if ((c2 & 0xfc00) === 0xdc00) {
    	                c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
    	                m_pos++;
    	            }
    	        }
    	        buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
    	    }

    	    // allocate buffer
    	    if (support.uint8array) {
    	        buf = new Uint8Array(buf_len);
    	    } else {
    	        buf = new Array(buf_len);
    	    }

    	    // convert
    	    for (i=0, m_pos = 0; i < buf_len; m_pos++) {
    	        c = str.charCodeAt(m_pos);
    	        if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
    	            c2 = str.charCodeAt(m_pos+1);
    	            if ((c2 & 0xfc00) === 0xdc00) {
    	                c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
    	                m_pos++;
    	            }
    	        }
    	        if (c < 0x80) {
    	            /* one byte */
    	            buf[i++] = c;
    	        } else if (c < 0x800) {
    	            /* two bytes */
    	            buf[i++] = 0xC0 | (c >>> 6);
    	            buf[i++] = 0x80 | (c & 0x3f);
    	        } else if (c < 0x10000) {
    	            /* three bytes */
    	            buf[i++] = 0xE0 | (c >>> 12);
    	            buf[i++] = 0x80 | (c >>> 6 & 0x3f);
    	            buf[i++] = 0x80 | (c & 0x3f);
    	        } else {
    	            /* four bytes */
    	            buf[i++] = 0xf0 | (c >>> 18);
    	            buf[i++] = 0x80 | (c >>> 12 & 0x3f);
    	            buf[i++] = 0x80 | (c >>> 6 & 0x3f);
    	            buf[i++] = 0x80 | (c & 0x3f);
    	        }
    	    }

    	    return buf;
    	};

    	// Calculate max possible position in utf8 buffer,
    	// that will not break sequence. If that's not possible
    	// - (very small limits) return max size as is.
    	//
    	// buf[] - utf8 bytes array
    	// max   - length limit (mandatory);
    	var utf8border = function(buf, max) {
    	    var pos;

    	    max = max || buf.length;
    	    if (max > buf.length) { max = buf.length; }

    	    // go back from last position, until start of sequence found
    	    pos = max-1;
    	    while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

    	    // Fuckup - very small and broken sequence,
    	    // return max, because we should return something anyway.
    	    if (pos < 0) { return max; }

    	    // If we came to start of buffer - that means vuffer is too small,
    	    // return max too.
    	    if (pos === 0) { return max; }

    	    return (pos + _utf8len[buf[pos]] > max) ? pos : max;
    	};

    	// convert array to string
    	var buf2string = function (buf) {
    	    var i, out, c, c_len;
    	    var len = buf.length;

    	    // Reserve max possible length (2 words per char)
    	    // NB: by unknown reasons, Array is significantly faster for
    	    //     String.fromCharCode.apply than Uint16Array.
    	    var utf16buf = new Array(len*2);

    	    for (out=0, i=0; i<len;) {
    	        c = buf[i++];
    	        // quick process ascii
    	        if (c < 0x80) { utf16buf[out++] = c; continue; }

    	        c_len = _utf8len[c];
    	        // skip 5 & 6 byte codes
    	        if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len-1; continue; }

    	        // apply mask on first byte
    	        c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
    	        // join the rest
    	        while (c_len > 1 && i < len) {
    	            c = (c << 6) | (buf[i++] & 0x3f);
    	            c_len--;
    	        }

    	        // terminated by end of string?
    	        if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

    	        if (c < 0x10000) {
    	            utf16buf[out++] = c;
    	        } else {
    	            c -= 0x10000;
    	            utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
    	            utf16buf[out++] = 0xdc00 | (c & 0x3ff);
    	        }
    	    }

    	    // shrinkBuf(utf16buf, out)
    	    if (utf16buf.length !== out) {
    	        if(utf16buf.subarray) {
    	            utf16buf = utf16buf.subarray(0, out);
    	        } else {
    	            utf16buf.length = out;
    	        }
    	    }

    	    // return String.fromCharCode.apply(null, utf16buf);
    	    return utils.applyFromCharCode(utf16buf);
    	};


    	// That's all for the pako functions.


    	/**
    	 * Transform a javascript string into an array (typed if possible) of bytes,
    	 * UTF-8 encoded.
    	 * @param {String} str the string to encode
    	 * @return {Array|Uint8Array|Buffer} the UTF-8 encoded string.
    	 */
    	exports.utf8encode = function utf8encode(str) {
    	    if (support.nodebuffer) {
    	        return nodejsUtils.newBufferFrom(str, "utf-8");
    	    }

    	    return string2buf(str);
    	};


    	/**
    	 * Transform a bytes array (or a representation) representing an UTF-8 encoded
    	 * string into a javascript string.
    	 * @param {Array|Uint8Array|Buffer} buf the data de decode
    	 * @return {String} the decoded string.
    	 */
    	exports.utf8decode = function utf8decode(buf) {
    	    if (support.nodebuffer) {
    	        return utils.transformTo("nodebuffer", buf).toString("utf-8");
    	    }

    	    buf = utils.transformTo(support.uint8array ? "uint8array" : "array", buf);

    	    return buf2string(buf);
    	};

    	/**
    	 * A worker to decode utf8 encoded binary chunks into string chunks.
    	 * @constructor
    	 */
    	function Utf8DecodeWorker() {
    	    GenericWorker.call(this, "utf-8 decode");
    	    // the last bytes if a chunk didn't end with a complete codepoint.
    	    this.leftOver = null;
    	}
    	utils.inherits(Utf8DecodeWorker, GenericWorker);

    	/**
    	 * @see GenericWorker.processChunk
    	 */
    	Utf8DecodeWorker.prototype.processChunk = function (chunk) {

    	    var data = utils.transformTo(support.uint8array ? "uint8array" : "array", chunk.data);

    	    // 1st step, re-use what's left of the previous chunk
    	    if (this.leftOver && this.leftOver.length) {
    	        if(support.uint8array) {
    	            var previousData = data;
    	            data = new Uint8Array(previousData.length + this.leftOver.length);
    	            data.set(this.leftOver, 0);
    	            data.set(previousData, this.leftOver.length);
    	        } else {
    	            data = this.leftOver.concat(data);
    	        }
    	        this.leftOver = null;
    	    }

    	    var nextBoundary = utf8border(data);
    	    var usableData = data;
    	    if (nextBoundary !== data.length) {
    	        if (support.uint8array) {
    	            usableData = data.subarray(0, nextBoundary);
    	            this.leftOver = data.subarray(nextBoundary, data.length);
    	        } else {
    	            usableData = data.slice(0, nextBoundary);
    	            this.leftOver = data.slice(nextBoundary, data.length);
    	        }
    	    }

    	    this.push({
    	        data : exports.utf8decode(usableData),
    	        meta : chunk.meta
    	    });
    	};

    	/**
    	 * @see GenericWorker.flush
    	 */
    	Utf8DecodeWorker.prototype.flush = function () {
    	    if(this.leftOver && this.leftOver.length) {
    	        this.push({
    	            data : exports.utf8decode(this.leftOver),
    	            meta : {}
    	        });
    	        this.leftOver = null;
    	    }
    	};
    	exports.Utf8DecodeWorker = Utf8DecodeWorker;

    	/**
    	 * A worker to endcode string chunks into utf8 encoded binary chunks.
    	 * @constructor
    	 */
    	function Utf8EncodeWorker() {
    	    GenericWorker.call(this, "utf-8 encode");
    	}
    	utils.inherits(Utf8EncodeWorker, GenericWorker);

    	/**
    	 * @see GenericWorker.processChunk
    	 */
    	Utf8EncodeWorker.prototype.processChunk = function (chunk) {
    	    this.push({
    	        data : exports.utf8encode(chunk.data),
    	        meta : chunk.meta
    	    });
    	};
    	exports.Utf8EncodeWorker = Utf8EncodeWorker;
    } (utf8$5));

    var GenericWorker$a = GenericWorker_1;
    var utils$p = requireUtils();

    /**
     * A worker which convert chunks to a specified type.
     * @constructor
     * @param {String} destType the destination type.
     */
    function ConvertWorker$1(destType) {
        GenericWorker$a.call(this, "ConvertWorker to " + destType);
        this.destType = destType;
    }
    utils$p.inherits(ConvertWorker$1, GenericWorker$a);

    /**
     * @see GenericWorker.processChunk
     */
    ConvertWorker$1.prototype.processChunk = function (chunk) {
        this.push({
            data : utils$p.transformTo(this.destType, chunk.data),
            meta : chunk.meta
        });
    };
    var ConvertWorker_1 = ConvertWorker$1;

    var NodejsStreamOutputAdapter_1;
    var hasRequiredNodejsStreamOutputAdapter;

    function requireNodejsStreamOutputAdapter () {
    	if (hasRequiredNodejsStreamOutputAdapter) return NodejsStreamOutputAdapter_1;
    	hasRequiredNodejsStreamOutputAdapter = 1;

    	var Readable = requireReadable().Readable;

    	var utils = requireUtils();
    	utils.inherits(NodejsStreamOutputAdapter, Readable);

    	/**
    	* A nodejs stream using a worker as source.
    	* @see the SourceWrapper in http://nodejs.org/api/stream.html
    	* @constructor
    	* @param {StreamHelper} helper the helper wrapping the worker
    	* @param {Object} options the nodejs stream options
    	* @param {Function} updateCb the update callback.
    	*/
    	function NodejsStreamOutputAdapter(helper, options, updateCb) {
    	    Readable.call(this, options);
    	    this._helper = helper;

    	    var self = this;
    	    helper.on("data", function (data, meta) {
    	        if (!self.push(data)) {
    	            self._helper.pause();
    	        }
    	        if(updateCb) {
    	            updateCb(meta);
    	        }
    	    })
    	        .on("error", function(e) {
    	            self.emit("error", e);
    	        })
    	        .on("end", function () {
    	            self.push(null);
    	        });
    	}


    	NodejsStreamOutputAdapter.prototype._read = function() {
    	    this._helper.resume();
    	};

    	NodejsStreamOutputAdapter_1 = NodejsStreamOutputAdapter;
    	return NodejsStreamOutputAdapter_1;
    }

    var utils$o = requireUtils();
    var ConvertWorker = ConvertWorker_1;
    var GenericWorker$9 = GenericWorker_1;
    var base64 = requireBase64();
    var support$3 = support$4;
    var external$2 = external$3;

    var NodejsStreamOutputAdapter = null;
    if (support$3.nodestream) {
        try {
            NodejsStreamOutputAdapter = requireNodejsStreamOutputAdapter();
        } catch(e) {
            // ignore
        }
    }

    /**
     * Apply the final transformation of the data. If the user wants a Blob for
     * example, it's easier to work with an U8intArray and finally do the
     * ArrayBuffer/Blob conversion.
     * @param {String} type the name of the final type
     * @param {String|Uint8Array|Buffer} content the content to transform
     * @param {String} mimeType the mime type of the content, if applicable.
     * @return {String|Uint8Array|ArrayBuffer|Buffer|Blob} the content in the right format.
     */
    function transformZipOutput(type, content, mimeType) {
        switch(type) {
        case "blob" :
            return utils$o.newBlob(utils$o.transformTo("arraybuffer", content), mimeType);
        case "base64" :
            return base64.encode(content);
        default :
            return utils$o.transformTo(type, content);
        }
    }

    /**
     * Concatenate an array of data of the given type.
     * @param {String} type the type of the data in the given array.
     * @param {Array} dataArray the array containing the data chunks to concatenate
     * @return {String|Uint8Array|Buffer} the concatenated data
     * @throws Error if the asked type is unsupported
     */
    function concat (type, dataArray) {
        var i, index = 0, res = null, totalLength = 0;
        for(i = 0; i < dataArray.length; i++) {
            totalLength += dataArray[i].length;
        }
        switch(type) {
        case "string":
            return dataArray.join("");
        case "array":
            return Array.prototype.concat.apply([], dataArray);
        case "uint8array":
            res = new Uint8Array(totalLength);
            for(i = 0; i < dataArray.length; i++) {
                res.set(dataArray[i], index);
                index += dataArray[i].length;
            }
            return res;
        case "nodebuffer":
            return Buffer.concat(dataArray);
        default:
            throw new Error("concat : unsupported type '"  + type + "'");
        }
    }

    /**
     * Listen a StreamHelper, accumulate its content and concatenate it into a
     * complete block.
     * @param {StreamHelper} helper the helper to use.
     * @param {Function} updateCallback a callback called on each update. Called
     * with one arg :
     * - the metadata linked to the update received.
     * @return Promise the promise for the accumulation.
     */
    function accumulate(helper, updateCallback) {
        return new external$2.Promise(function (resolve, reject){
            var dataArray = [];
            var chunkType = helper._internalType,
                resultType = helper._outputType,
                mimeType = helper._mimeType;
            helper
                .on("data", function (data, meta) {
                    dataArray.push(data);
                    if(updateCallback) {
                        updateCallback(meta);
                    }
                })
                .on("error", function(err) {
                    dataArray = [];
                    reject(err);
                })
                .on("end", function (){
                    try {
                        var result = transformZipOutput(resultType, concat(chunkType, dataArray), mimeType);
                        resolve(result);
                    } catch (e) {
                        reject(e);
                    }
                    dataArray = [];
                })
                .resume();
        });
    }

    /**
     * An helper to easily use workers outside of JSZip.
     * @constructor
     * @param {Worker} worker the worker to wrap
     * @param {String} outputType the type of data expected by the use
     * @param {String} mimeType the mime type of the content, if applicable.
     */
    function StreamHelper$2(worker, outputType, mimeType) {
        var internalType = outputType;
        switch(outputType) {
        case "blob":
        case "arraybuffer":
            internalType = "uint8array";
            break;
        case "base64":
            internalType = "string";
            break;
        }

        try {
            // the type used internally
            this._internalType = internalType;
            // the type used to output results
            this._outputType = outputType;
            // the mime type
            this._mimeType = mimeType;
            utils$o.checkSupport(internalType);
            this._worker = worker.pipe(new ConvertWorker(internalType));
            // the last workers can be rewired without issues but we need to
            // prevent any updates on previous workers.
            worker.lock();
        } catch(e) {
            this._worker = new GenericWorker$9("error");
            this._worker.error(e);
        }
    }

    StreamHelper$2.prototype = {
        /**
         * Listen a StreamHelper, accumulate its content and concatenate it into a
         * complete block.
         * @param {Function} updateCb the update callback.
         * @return Promise the promise for the accumulation.
         */
        accumulate : function (updateCb) {
            return accumulate(this, updateCb);
        },
        /**
         * Add a listener on an event triggered on a stream.
         * @param {String} evt the name of the event
         * @param {Function} fn the listener
         * @return {StreamHelper} the current helper.
         */
        on : function (evt, fn) {
            var self = this;

            if(evt === "data") {
                this._worker.on(evt, function (chunk) {
                    fn.call(self, chunk.data, chunk.meta);
                });
            } else {
                this._worker.on(evt, function () {
                    utils$o.delay(fn, arguments, self);
                });
            }
            return this;
        },
        /**
         * Resume the flow of chunks.
         * @return {StreamHelper} the current helper.
         */
        resume : function () {
            utils$o.delay(this._worker.resume, [], this._worker);
            return this;
        },
        /**
         * Pause the flow of chunks.
         * @return {StreamHelper} the current helper.
         */
        pause : function () {
            this._worker.pause();
            return this;
        },
        /**
         * Return a nodejs stream for this helper.
         * @param {Function} updateCb the update callback.
         * @return {NodejsStreamOutputAdapter} the nodejs stream.
         */
        toNodejsStream : function (updateCb) {
            utils$o.checkSupport("nodestream");
            if (this._outputType !== "nodebuffer") {
                // an object stream containing blob/arraybuffer/uint8array/string
                // is strange and I don't know if it would be useful.
                // I you find this comment and have a good usecase, please open a
                // bug report !
                throw new Error(this._outputType + " is not supported by this method");
            }

            return new NodejsStreamOutputAdapter(this, {
                objectMode : this._outputType !== "nodebuffer"
            }, updateCb);
        }
    };


    var StreamHelper_1 = StreamHelper$2;

    var defaults$1 = {};

    defaults$1.base64 = false;
    defaults$1.binary = false;
    defaults$1.dir = false;
    defaults$1.createFolders = true;
    defaults$1.date = null;
    defaults$1.compression = null;
    defaults$1.compressionOptions = null;
    defaults$1.comment = null;
    defaults$1.unixPermissions = null;
    defaults$1.dosPermissions = null;

    var utils$n = requireUtils();
    var GenericWorker$8 = GenericWorker_1;

    // the size of the generated chunks
    // TODO expose this as a public variable
    var DEFAULT_BLOCK_SIZE = 16 * 1024;

    /**
     * A worker that reads a content and emits chunks.
     * @constructor
     * @param {Promise} dataP the promise of the data to split
     */
    function DataWorker$2(dataP) {
        GenericWorker$8.call(this, "DataWorker");
        var self = this;
        this.dataIsReady = false;
        this.index = 0;
        this.max = 0;
        this.data = null;
        this.type = "";

        this._tickScheduled = false;

        dataP.then(function (data) {
            self.dataIsReady = true;
            self.data = data;
            self.max = data && data.length || 0;
            self.type = utils$n.getTypeOf(data);
            if(!self.isPaused) {
                self._tickAndRepeat();
            }
        }, function (e) {
            self.error(e);
        });
    }

    utils$n.inherits(DataWorker$2, GenericWorker$8);

    /**
     * @see GenericWorker.cleanUp
     */
    DataWorker$2.prototype.cleanUp = function () {
        GenericWorker$8.prototype.cleanUp.call(this);
        this.data = null;
    };

    /**
     * @see GenericWorker.resume
     */
    DataWorker$2.prototype.resume = function () {
        if(!GenericWorker$8.prototype.resume.call(this)) {
            return false;
        }

        if (!this._tickScheduled && this.dataIsReady) {
            this._tickScheduled = true;
            utils$n.delay(this._tickAndRepeat, [], this);
        }
        return true;
    };

    /**
     * Trigger a tick a schedule an other call to this function.
     */
    DataWorker$2.prototype._tickAndRepeat = function() {
        this._tickScheduled = false;
        if(this.isPaused || this.isFinished) {
            return;
        }
        this._tick();
        if(!this.isFinished) {
            utils$n.delay(this._tickAndRepeat, [], this);
            this._tickScheduled = true;
        }
    };

    /**
     * Read and push a chunk.
     */
    DataWorker$2.prototype._tick = function() {

        if(this.isPaused || this.isFinished) {
            return false;
        }

        var size = DEFAULT_BLOCK_SIZE;
        var data = null, nextIndex = Math.min(this.max, this.index + size);
        if (this.index >= this.max) {
            // EOF
            return this.end();
        } else {
            switch(this.type) {
            case "string":
                data = this.data.substring(this.index, nextIndex);
                break;
            case "uint8array":
                data = this.data.subarray(this.index, nextIndex);
                break;
            case "array":
            case "nodebuffer":
                data = this.data.slice(this.index, nextIndex);
                break;
            }
            this.index = nextIndex;
            return this.push({
                data : data,
                meta : {
                    percent : this.max ? this.index / this.max * 100 : 0
                }
            });
        }
    };

    var DataWorker_1 = DataWorker$2;

    var utils$m = requireUtils();

    /**
     * The following functions come from pako, from pako/lib/zlib/crc32.js
     * released under the MIT license, see pako https://github.com/nodeca/pako/
     */

    // Use ordinary array, since untyped makes no boost here
    function makeTable$1() {
        var c, table = [];

        for(var n =0; n < 256; n++){
            c = n;
            for(var k =0; k < 8; k++){
                c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            table[n] = c;
        }

        return table;
    }

    // Create table on load. Just 255 signed longs. Not a problem.
    var crcTable$1 = makeTable$1();


    function crc32$5(crc, buf, len, pos) {
        var t = crcTable$1, end = pos + len;

        crc = crc ^ (-1);

        for (var i = pos; i < end; i++ ) {
            crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
        }

        return (crc ^ (-1)); // >>> 0;
    }

    // That's all for the pako functions.

    /**
     * Compute the crc32 of a string.
     * This is almost the same as the function crc32, but for strings. Using the
     * same function for the two use cases leads to horrible performances.
     * @param {Number} crc the starting value of the crc.
     * @param {String} str the string to use.
     * @param {Number} len the length of the string.
     * @param {Number} pos the starting position for the crc32 computation.
     * @return {Number} the computed crc32.
     */
    function crc32str(crc, str, len, pos) {
        var t = crcTable$1, end = pos + len;

        crc = crc ^ (-1);

        for (var i = pos; i < end; i++ ) {
            crc = (crc >>> 8) ^ t[(crc ^ str.charCodeAt(i)) & 0xFF];
        }

        return (crc ^ (-1)); // >>> 0;
    }

    var crc32_1$1 = function crc32wrapper(input, crc) {
        if (typeof input === "undefined" || !input.length) {
            return 0;
        }

        var isArray = utils$m.getTypeOf(input) !== "string";

        if(isArray) {
            return crc32$5(crc|0, input, input.length, 0);
        } else {
            return crc32str(crc|0, input, input.length, 0);
        }
    };

    var GenericWorker$7 = GenericWorker_1;
    var crc32$4 = crc32_1$1;
    var utils$l = requireUtils();

    /**
     * A worker which calculate the crc32 of the data flowing through.
     * @constructor
     */
    function Crc32Probe$2() {
        GenericWorker$7.call(this, "Crc32Probe");
        this.withStreamInfo("crc32", 0);
    }
    utils$l.inherits(Crc32Probe$2, GenericWorker$7);

    /**
     * @see GenericWorker.processChunk
     */
    Crc32Probe$2.prototype.processChunk = function (chunk) {
        this.streamInfo.crc32 = crc32$4(chunk.data, this.streamInfo.crc32 || 0);
        this.push(chunk);
    };
    var Crc32Probe_1 = Crc32Probe$2;

    var utils$k = requireUtils();
    var GenericWorker$6 = GenericWorker_1;

    /**
     * A worker which calculate the total length of the data flowing through.
     * @constructor
     * @param {String} propName the name used to expose the length
     */
    function DataLengthProbe$1(propName) {
        GenericWorker$6.call(this, "DataLengthProbe for " + propName);
        this.propName = propName;
        this.withStreamInfo(propName, 0);
    }
    utils$k.inherits(DataLengthProbe$1, GenericWorker$6);

    /**
     * @see GenericWorker.processChunk
     */
    DataLengthProbe$1.prototype.processChunk = function (chunk) {
        if(chunk) {
            var length = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = length + chunk.data.length;
        }
        GenericWorker$6.prototype.processChunk.call(this, chunk);
    };
    var DataLengthProbe_1 = DataLengthProbe$1;

    var external$1 = external$3;
    var DataWorker$1 = DataWorker_1;
    var Crc32Probe$1 = Crc32Probe_1;
    var DataLengthProbe = DataLengthProbe_1;

    /**
     * Represent a compressed object, with everything needed to decompress it.
     * @constructor
     * @param {number} compressedSize the size of the data compressed.
     * @param {number} uncompressedSize the size of the data after decompression.
     * @param {number} crc32 the crc32 of the decompressed file.
     * @param {object} compression the type of compression, see lib/compressions.js.
     * @param {String|ArrayBuffer|Uint8Array|Buffer} data the compressed data.
     */
    function CompressedObject$3(compressedSize, uncompressedSize, crc32, compression, data) {
        this.compressedSize = compressedSize;
        this.uncompressedSize = uncompressedSize;
        this.crc32 = crc32;
        this.compression = compression;
        this.compressedContent = data;
    }

    CompressedObject$3.prototype = {
        /**
         * Create a worker to get the uncompressed content.
         * @return {GenericWorker} the worker.
         */
        getContentWorker: function () {
            var worker = new DataWorker$1(external$1.Promise.resolve(this.compressedContent))
                .pipe(this.compression.uncompressWorker())
                .pipe(new DataLengthProbe("data_length"));

            var that = this;
            worker.on("end", function () {
                if (this.streamInfo["data_length"] !== that.uncompressedSize) {
                    throw new Error("Bug : uncompressed data size mismatch");
                }
            });
            return worker;
        },
        /**
         * Create a worker to get the compressed content.
         * @return {GenericWorker} the worker.
         */
        getCompressedWorker: function () {
            return new DataWorker$1(external$1.Promise.resolve(this.compressedContent))
                .withStreamInfo("compressedSize", this.compressedSize)
                .withStreamInfo("uncompressedSize", this.uncompressedSize)
                .withStreamInfo("crc32", this.crc32)
                .withStreamInfo("compression", this.compression)
            ;
        }
    };

    /**
     * Chain the given worker with other workers to compress the content with the
     * given compression.
     * @param {GenericWorker} uncompressedWorker the worker to pipe.
     * @param {Object} compression the compression object.
     * @param {Object} compressionOptions the options to use when compressing.
     * @return {GenericWorker} the new worker compressing the content.
     */
    CompressedObject$3.createWorkerFrom = function (uncompressedWorker, compression, compressionOptions) {
        return uncompressedWorker
            .pipe(new Crc32Probe$1())
            .pipe(new DataLengthProbe("uncompressedSize"))
            .pipe(compression.compressWorker(compressionOptions))
            .pipe(new DataLengthProbe("compressedSize"))
            .withStreamInfo("compression", compression);
    };

    var compressedObject = CompressedObject$3;

    var StreamHelper$1 = StreamHelper_1;
    var DataWorker = DataWorker_1;
    var utf8$4 = utf8$5;
    var CompressedObject$2 = compressedObject;
    var GenericWorker$5 = GenericWorker_1;

    /**
     * A simple object representing a file in the zip file.
     * @constructor
     * @param {string} name the name of the file
     * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data
     * @param {Object} options the options of the file
     */
    var ZipObject$1 = function(name, data, options) {
        this.name = name;
        this.dir = options.dir;
        this.date = options.date;
        this.comment = options.comment;
        this.unixPermissions = options.unixPermissions;
        this.dosPermissions = options.dosPermissions;

        this._data = data;
        this._dataBinary = options.binary;
        // keep only the compression
        this.options = {
            compression : options.compression,
            compressionOptions : options.compressionOptions
        };
    };

    ZipObject$1.prototype = {
        /**
         * Create an internal stream for the content of this object.
         * @param {String} type the type of each chunk.
         * @return StreamHelper the stream.
         */
        internalStream: function (type) {
            var result = null, outputType = "string";
            try {
                if (!type) {
                    throw new Error("No output type specified.");
                }
                outputType = type.toLowerCase();
                var askUnicodeString = outputType === "string" || outputType === "text";
                if (outputType === "binarystring" || outputType === "text") {
                    outputType = "string";
                }
                result = this._decompressWorker();

                var isUnicodeString = !this._dataBinary;

                if (isUnicodeString && !askUnicodeString) {
                    result = result.pipe(new utf8$4.Utf8EncodeWorker());
                }
                if (!isUnicodeString && askUnicodeString) {
                    result = result.pipe(new utf8$4.Utf8DecodeWorker());
                }
            } catch (e) {
                result = new GenericWorker$5("error");
                result.error(e);
            }

            return new StreamHelper$1(result, outputType, "");
        },

        /**
         * Prepare the content in the asked type.
         * @param {String} type the type of the result.
         * @param {Function} onUpdate a function to call on each internal update.
         * @return Promise the promise of the result.
         */
        async: function (type, onUpdate) {
            return this.internalStream(type).accumulate(onUpdate);
        },

        /**
         * Prepare the content as a nodejs stream.
         * @param {String} type the type of each chunk.
         * @param {Function} onUpdate a function to call on each internal update.
         * @return Stream the stream.
         */
        nodeStream: function (type, onUpdate) {
            return this.internalStream(type || "nodebuffer").toNodejsStream(onUpdate);
        },

        /**
         * Return a worker for the compressed content.
         * @private
         * @param {Object} compression the compression object to use.
         * @param {Object} compressionOptions the options to use when compressing.
         * @return Worker the worker.
         */
        _compressWorker: function (compression, compressionOptions) {
            if (
                this._data instanceof CompressedObject$2 &&
                this._data.compression.magic === compression.magic
            ) {
                return this._data.getCompressedWorker();
            } else {
                var result = this._decompressWorker();
                if(!this._dataBinary) {
                    result = result.pipe(new utf8$4.Utf8EncodeWorker());
                }
                return CompressedObject$2.createWorkerFrom(result, compression, compressionOptions);
            }
        },
        /**
         * Return a worker for the decompressed content.
         * @private
         * @return Worker the worker.
         */
        _decompressWorker : function () {
            if (this._data instanceof CompressedObject$2) {
                return this._data.getContentWorker();
            } else if (this._data instanceof GenericWorker$5) {
                return this._data;
            } else {
                return new DataWorker(this._data);
            }
        }
    };

    var removedMethods = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"];
    var removedFn = function () {
        throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
    };

    for(var i = 0; i < removedMethods.length; i++) {
        ZipObject$1.prototype[removedMethods[i]] = removedFn;
    }
    var zipObject = ZipObject$1;

    var generate$1 = {};

    var compressions$2 = {};

    var flate = {};

    var common = {};

    (function (exports) {


    	var TYPED_OK =  (typeof Uint8Array !== 'undefined') &&
    	                (typeof Uint16Array !== 'undefined') &&
    	                (typeof Int32Array !== 'undefined');

    	function _has(obj, key) {
    	  return Object.prototype.hasOwnProperty.call(obj, key);
    	}

    	exports.assign = function (obj /*from1, from2, from3, ...*/) {
    	  var sources = Array.prototype.slice.call(arguments, 1);
    	  while (sources.length) {
    	    var source = sources.shift();
    	    if (!source) { continue; }

    	    if (typeof source !== 'object') {
    	      throw new TypeError(source + 'must be non-object');
    	    }

    	    for (var p in source) {
    	      if (_has(source, p)) {
    	        obj[p] = source[p];
    	      }
    	    }
    	  }

    	  return obj;
    	};


    	// reduce buffer size, avoiding mem copy
    	exports.shrinkBuf = function (buf, size) {
    	  if (buf.length === size) { return buf; }
    	  if (buf.subarray) { return buf.subarray(0, size); }
    	  buf.length = size;
    	  return buf;
    	};


    	var fnTyped = {
    	  arraySet: function (dest, src, src_offs, len, dest_offs) {
    	    if (src.subarray && dest.subarray) {
    	      dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
    	      return;
    	    }
    	    // Fallback to ordinary array
    	    for (var i = 0; i < len; i++) {
    	      dest[dest_offs + i] = src[src_offs + i];
    	    }
    	  },
    	  // Join array of chunks to single array.
    	  flattenChunks: function (chunks) {
    	    var i, l, len, pos, chunk, result;

    	    // calculate data length
    	    len = 0;
    	    for (i = 0, l = chunks.length; i < l; i++) {
    	      len += chunks[i].length;
    	    }

    	    // join chunks
    	    result = new Uint8Array(len);
    	    pos = 0;
    	    for (i = 0, l = chunks.length; i < l; i++) {
    	      chunk = chunks[i];
    	      result.set(chunk, pos);
    	      pos += chunk.length;
    	    }

    	    return result;
    	  }
    	};

    	var fnUntyped = {
    	  arraySet: function (dest, src, src_offs, len, dest_offs) {
    	    for (var i = 0; i < len; i++) {
    	      dest[dest_offs + i] = src[src_offs + i];
    	    }
    	  },
    	  // Join array of chunks to single array.
    	  flattenChunks: function (chunks) {
    	    return [].concat.apply([], chunks);
    	  }
    	};


    	// Enable/Disable typed arrays use, for testing
    	//
    	exports.setTyped = function (on) {
    	  if (on) {
    	    exports.Buf8  = Uint8Array;
    	    exports.Buf16 = Uint16Array;
    	    exports.Buf32 = Int32Array;
    	    exports.assign(exports, fnTyped);
    	  } else {
    	    exports.Buf8  = Array;
    	    exports.Buf16 = Array;
    	    exports.Buf32 = Array;
    	    exports.assign(exports, fnUntyped);
    	  }
    	};

    	exports.setTyped(TYPED_OK);
    } (common));

    var deflate$4 = {};

    var deflate$3 = {};

    var trees$1 = {};

    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    /* eslint-disable space-unary-ops */

    var utils$j = common;

    /* Public constants ==========================================================*/
    /* ===========================================================================*/


    //var Z_FILTERED          = 1;
    //var Z_HUFFMAN_ONLY      = 2;
    //var Z_RLE               = 3;
    var Z_FIXED$1               = 4;
    //var Z_DEFAULT_STRATEGY  = 0;

    /* Possible values of the data_type field (though see inflate()) */
    var Z_BINARY              = 0;
    var Z_TEXT                = 1;
    //var Z_ASCII             = 1; // = Z_TEXT
    var Z_UNKNOWN$1             = 2;

    /*============================================================================*/


    function zero$1(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }

    // From zutil.h

    var STORED_BLOCK = 0;
    var STATIC_TREES = 1;
    var DYN_TREES    = 2;
    /* The three kinds of block type */

    var MIN_MATCH$1    = 3;
    var MAX_MATCH$1    = 258;
    /* The minimum and maximum match lengths */

    // From deflate.h
    /* ===========================================================================
     * Internal compression state.
     */

    var LENGTH_CODES$1  = 29;
    /* number of length codes, not counting the special END_BLOCK code */

    var LITERALS$1      = 256;
    /* number of literal bytes 0..255 */

    var L_CODES$1       = LITERALS$1 + 1 + LENGTH_CODES$1;
    /* number of Literal or Length codes, including the END_BLOCK code */

    var D_CODES$1       = 30;
    /* number of distance codes */

    var BL_CODES$1      = 19;
    /* number of codes used to transfer the bit lengths */

    var HEAP_SIZE$1     = 2 * L_CODES$1 + 1;
    /* maximum heap size */

    var MAX_BITS$1      = 15;
    /* All codes must not exceed MAX_BITS bits */

    var Buf_size      = 16;
    /* size of bit buffer in bi_buf */


    /* ===========================================================================
     * Constants
     */

    var MAX_BL_BITS = 7;
    /* Bit length codes must not exceed MAX_BL_BITS bits */

    var END_BLOCK   = 256;
    /* end of block literal code */

    var REP_3_6     = 16;
    /* repeat previous bit length 3-6 times (2 bits of repeat count) */

    var REPZ_3_10   = 17;
    /* repeat a zero length 3-10 times  (3 bits of repeat count) */

    var REPZ_11_138 = 18;
    /* repeat a zero length 11-138 times  (7 bits of repeat count) */

    /* eslint-disable comma-spacing,array-bracket-spacing */
    var extra_lbits =   /* extra bits for each length code */
      [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];

    var extra_dbits =   /* extra bits for each distance code */
      [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

    var extra_blbits =  /* extra bits for each bit length code */
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7];

    var bl_order =
      [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
    /* eslint-enable comma-spacing,array-bracket-spacing */

    /* The lengths of the bit length codes are sent in order of decreasing
     * probability, to avoid transmitting the lengths for unused bit length codes.
     */

    /* ===========================================================================
     * Local data. These are initialized only once.
     */

    // We pre-fill arrays with 0 to avoid uninitialized gaps

    var DIST_CODE_LEN = 512; /* see definition of array dist_code below */

    // !!!! Use flat array instead of structure, Freq = i*2, Len = i*2+1
    var static_ltree  = new Array((L_CODES$1 + 2) * 2);
    zero$1(static_ltree);
    /* The static literal tree. Since the bit lengths are imposed, there is no
     * need for the L_CODES extra codes used during heap construction. However
     * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
     * below).
     */

    var static_dtree  = new Array(D_CODES$1 * 2);
    zero$1(static_dtree);
    /* The static distance tree. (Actually a trivial tree since all codes use
     * 5 bits.)
     */

    var _dist_code    = new Array(DIST_CODE_LEN);
    zero$1(_dist_code);
    /* Distance codes. The first 256 values correspond to the distances
     * 3 .. 258, the last 256 values correspond to the top 8 bits of
     * the 15 bit distances.
     */

    var _length_code  = new Array(MAX_MATCH$1 - MIN_MATCH$1 + 1);
    zero$1(_length_code);
    /* length code for each normalized match length (0 == MIN_MATCH) */

    var base_length   = new Array(LENGTH_CODES$1);
    zero$1(base_length);
    /* First normalized length for each code (0 = MIN_MATCH) */

    var base_dist     = new Array(D_CODES$1);
    zero$1(base_dist);
    /* First normalized distance for each code (0 = distance of 1) */


    function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {

      this.static_tree  = static_tree;  /* static tree or NULL */
      this.extra_bits   = extra_bits;   /* extra bits for each code or NULL */
      this.extra_base   = extra_base;   /* base index for extra_bits */
      this.elems        = elems;        /* max number of elements in the tree */
      this.max_length   = max_length;   /* max bit length for the codes */

      // show if `static_tree` has data or dummy - needed for monomorphic objects
      this.has_stree    = static_tree && static_tree.length;
    }


    var static_l_desc;
    var static_d_desc;
    var static_bl_desc;


    function TreeDesc(dyn_tree, stat_desc) {
      this.dyn_tree = dyn_tree;     /* the dynamic tree */
      this.max_code = 0;            /* largest code with non zero frequency */
      this.stat_desc = stat_desc;   /* the corresponding static tree */
    }



    function d_code(dist) {
      return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
    }


    /* ===========================================================================
     * Output a short LSB first on the stream.
     * IN assertion: there is enough room in pendingBuf.
     */
    function put_short(s, w) {
    //    put_byte(s, (uch)((w) & 0xff));
    //    put_byte(s, (uch)((ush)(w) >> 8));
      s.pending_buf[s.pending++] = (w) & 0xff;
      s.pending_buf[s.pending++] = (w >>> 8) & 0xff;
    }


    /* ===========================================================================
     * Send a value on a given number of bits.
     * IN assertion: length <= 16 and value fits in length bits.
     */
    function send_bits(s, value, length) {
      if (s.bi_valid > (Buf_size - length)) {
        s.bi_buf |= (value << s.bi_valid) & 0xffff;
        put_short(s, s.bi_buf);
        s.bi_buf = value >> (Buf_size - s.bi_valid);
        s.bi_valid += length - Buf_size;
      } else {
        s.bi_buf |= (value << s.bi_valid) & 0xffff;
        s.bi_valid += length;
      }
    }


    function send_code(s, c, tree) {
      send_bits(s, tree[c * 2]/*.Code*/, tree[c * 2 + 1]/*.Len*/);
    }


    /* ===========================================================================
     * Reverse the first len bits of a code, using straightforward code (a faster
     * method would use a table)
     * IN assertion: 1 <= len <= 15
     */
    function bi_reverse(code, len) {
      var res = 0;
      do {
        res |= code & 1;
        code >>>= 1;
        res <<= 1;
      } while (--len > 0);
      return res >>> 1;
    }


    /* ===========================================================================
     * Flush the bit buffer, keeping at most 7 bits in it.
     */
    function bi_flush(s) {
      if (s.bi_valid === 16) {
        put_short(s, s.bi_buf);
        s.bi_buf = 0;
        s.bi_valid = 0;

      } else if (s.bi_valid >= 8) {
        s.pending_buf[s.pending++] = s.bi_buf & 0xff;
        s.bi_buf >>= 8;
        s.bi_valid -= 8;
      }
    }


    /* ===========================================================================
     * Compute the optimal bit lengths for a tree and update the total bit length
     * for the current block.
     * IN assertion: the fields freq and dad are set, heap[heap_max] and
     *    above are the tree nodes sorted by increasing frequency.
     * OUT assertions: the field len is set to the optimal bit length, the
     *     array bl_count contains the frequencies for each bit length.
     *     The length opt_len is updated; static_len is also updated if stree is
     *     not null.
     */
    function gen_bitlen(s, desc)
    //    deflate_state *s;
    //    tree_desc *desc;    /* the tree descriptor */
    {
      var tree            = desc.dyn_tree;
      var max_code        = desc.max_code;
      var stree           = desc.stat_desc.static_tree;
      var has_stree       = desc.stat_desc.has_stree;
      var extra           = desc.stat_desc.extra_bits;
      var base            = desc.stat_desc.extra_base;
      var max_length      = desc.stat_desc.max_length;
      var h;              /* heap index */
      var n, m;           /* iterate over the tree elements */
      var bits;           /* bit length */
      var xbits;          /* extra bits */
      var f;              /* frequency */
      var overflow = 0;   /* number of elements with bit length too large */

      for (bits = 0; bits <= MAX_BITS$1; bits++) {
        s.bl_count[bits] = 0;
      }

      /* In a first pass, compute the optimal bit lengths (which may
       * overflow in the case of the bit length tree).
       */
      tree[s.heap[s.heap_max] * 2 + 1]/*.Len*/ = 0; /* root of the heap */

      for (h = s.heap_max + 1; h < HEAP_SIZE$1; h++) {
        n = s.heap[h];
        bits = tree[tree[n * 2 + 1]/*.Dad*/ * 2 + 1]/*.Len*/ + 1;
        if (bits > max_length) {
          bits = max_length;
          overflow++;
        }
        tree[n * 2 + 1]/*.Len*/ = bits;
        /* We overwrite tree[n].Dad which is no longer needed */

        if (n > max_code) { continue; } /* not a leaf node */

        s.bl_count[bits]++;
        xbits = 0;
        if (n >= base) {
          xbits = extra[n - base];
        }
        f = tree[n * 2]/*.Freq*/;
        s.opt_len += f * (bits + xbits);
        if (has_stree) {
          s.static_len += f * (stree[n * 2 + 1]/*.Len*/ + xbits);
        }
      }
      if (overflow === 0) { return; }

      // Trace((stderr,"\nbit length overflow\n"));
      /* This happens for example on obj2 and pic of the Calgary corpus */

      /* Find the first bit length which could increase: */
      do {
        bits = max_length - 1;
        while (s.bl_count[bits] === 0) { bits--; }
        s.bl_count[bits]--;      /* move one leaf down the tree */
        s.bl_count[bits + 1] += 2; /* move one overflow item as its brother */
        s.bl_count[max_length]--;
        /* The brother of the overflow item also moves one step up,
         * but this does not affect bl_count[max_length]
         */
        overflow -= 2;
      } while (overflow > 0);

      /* Now recompute all bit lengths, scanning in increasing frequency.
       * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
       * lengths instead of fixing only the wrong ones. This idea is taken
       * from 'ar' written by Haruhiko Okumura.)
       */
      for (bits = max_length; bits !== 0; bits--) {
        n = s.bl_count[bits];
        while (n !== 0) {
          m = s.heap[--h];
          if (m > max_code) { continue; }
          if (tree[m * 2 + 1]/*.Len*/ !== bits) {
            // Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
            s.opt_len += (bits - tree[m * 2 + 1]/*.Len*/) * tree[m * 2]/*.Freq*/;
            tree[m * 2 + 1]/*.Len*/ = bits;
          }
          n--;
        }
      }
    }


    /* ===========================================================================
     * Generate the codes for a given tree and bit counts (which need not be
     * optimal).
     * IN assertion: the array bl_count contains the bit length statistics for
     * the given tree and the field len is set for all tree elements.
     * OUT assertion: the field code is set for all tree elements of non
     *     zero code length.
     */
    function gen_codes(tree, max_code, bl_count)
    //    ct_data *tree;             /* the tree to decorate */
    //    int max_code;              /* largest code with non zero frequency */
    //    ushf *bl_count;            /* number of codes at each bit length */
    {
      var next_code = new Array(MAX_BITS$1 + 1); /* next code value for each bit length */
      var code = 0;              /* running code value */
      var bits;                  /* bit index */
      var n;                     /* code index */

      /* The distribution counts are first used to generate the code values
       * without bit reversal.
       */
      for (bits = 1; bits <= MAX_BITS$1; bits++) {
        next_code[bits] = code = (code + bl_count[bits - 1]) << 1;
      }
      /* Check that the bit counts in bl_count are consistent. The last code
       * must be all ones.
       */
      //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
      //        "inconsistent bit counts");
      //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

      for (n = 0;  n <= max_code; n++) {
        var len = tree[n * 2 + 1]/*.Len*/;
        if (len === 0) { continue; }
        /* Now reverse the bits */
        tree[n * 2]/*.Code*/ = bi_reverse(next_code[len]++, len);

        //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
        //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
      }
    }


    /* ===========================================================================
     * Initialize the various 'constant' tables.
     */
    function tr_static_init() {
      var n;        /* iterates over tree elements */
      var bits;     /* bit counter */
      var length;   /* length value */
      var code;     /* code value */
      var dist;     /* distance index */
      var bl_count = new Array(MAX_BITS$1 + 1);
      /* number of codes at each bit length for an optimal tree */

      // do check in _tr_init()
      //if (static_init_done) return;

      /* For some embedded targets, global variables are not initialized: */
    /*#ifdef NO_INIT_GLOBAL_POINTERS
      static_l_desc.static_tree = static_ltree;
      static_l_desc.extra_bits = extra_lbits;
      static_d_desc.static_tree = static_dtree;
      static_d_desc.extra_bits = extra_dbits;
      static_bl_desc.extra_bits = extra_blbits;
    #endif*/

      /* Initialize the mapping length (0..255) -> length code (0..28) */
      length = 0;
      for (code = 0; code < LENGTH_CODES$1 - 1; code++) {
        base_length[code] = length;
        for (n = 0; n < (1 << extra_lbits[code]); n++) {
          _length_code[length++] = code;
        }
      }
      //Assert (length == 256, "tr_static_init: length != 256");
      /* Note that the length 255 (match length 258) can be represented
       * in two different ways: code 284 + 5 bits or code 285, so we
       * overwrite length_code[255] to use the best encoding:
       */
      _length_code[length - 1] = code;

      /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
      dist = 0;
      for (code = 0; code < 16; code++) {
        base_dist[code] = dist;
        for (n = 0; n < (1 << extra_dbits[code]); n++) {
          _dist_code[dist++] = code;
        }
      }
      //Assert (dist == 256, "tr_static_init: dist != 256");
      dist >>= 7; /* from now on, all distances are divided by 128 */
      for (; code < D_CODES$1; code++) {
        base_dist[code] = dist << 7;
        for (n = 0; n < (1 << (extra_dbits[code] - 7)); n++) {
          _dist_code[256 + dist++] = code;
        }
      }
      //Assert (dist == 256, "tr_static_init: 256+dist != 512");

      /* Construct the codes of the static literal tree */
      for (bits = 0; bits <= MAX_BITS$1; bits++) {
        bl_count[bits] = 0;
      }

      n = 0;
      while (n <= 143) {
        static_ltree[n * 2 + 1]/*.Len*/ = 8;
        n++;
        bl_count[8]++;
      }
      while (n <= 255) {
        static_ltree[n * 2 + 1]/*.Len*/ = 9;
        n++;
        bl_count[9]++;
      }
      while (n <= 279) {
        static_ltree[n * 2 + 1]/*.Len*/ = 7;
        n++;
        bl_count[7]++;
      }
      while (n <= 287) {
        static_ltree[n * 2 + 1]/*.Len*/ = 8;
        n++;
        bl_count[8]++;
      }
      /* Codes 286 and 287 do not exist, but we must include them in the
       * tree construction to get a canonical Huffman tree (longest code
       * all ones)
       */
      gen_codes(static_ltree, L_CODES$1 + 1, bl_count);

      /* The static distance tree is trivial: */
      for (n = 0; n < D_CODES$1; n++) {
        static_dtree[n * 2 + 1]/*.Len*/ = 5;
        static_dtree[n * 2]/*.Code*/ = bi_reverse(n, 5);
      }

      // Now data ready and we can init static trees
      static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS$1 + 1, L_CODES$1, MAX_BITS$1);
      static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0,          D_CODES$1, MAX_BITS$1);
      static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0,         BL_CODES$1, MAX_BL_BITS);

      //static_init_done = true;
    }


    /* ===========================================================================
     * Initialize a new block.
     */
    function init_block(s) {
      var n; /* iterates over tree elements */

      /* Initialize the trees. */
      for (n = 0; n < L_CODES$1;  n++) { s.dyn_ltree[n * 2]/*.Freq*/ = 0; }
      for (n = 0; n < D_CODES$1;  n++) { s.dyn_dtree[n * 2]/*.Freq*/ = 0; }
      for (n = 0; n < BL_CODES$1; n++) { s.bl_tree[n * 2]/*.Freq*/ = 0; }

      s.dyn_ltree[END_BLOCK * 2]/*.Freq*/ = 1;
      s.opt_len = s.static_len = 0;
      s.last_lit = s.matches = 0;
    }


    /* ===========================================================================
     * Flush the bit buffer and align the output on a byte boundary
     */
    function bi_windup(s)
    {
      if (s.bi_valid > 8) {
        put_short(s, s.bi_buf);
      } else if (s.bi_valid > 0) {
        //put_byte(s, (Byte)s->bi_buf);
        s.pending_buf[s.pending++] = s.bi_buf;
      }
      s.bi_buf = 0;
      s.bi_valid = 0;
    }

    /* ===========================================================================
     * Copy a stored block, storing first the length and its
     * one's complement if requested.
     */
    function copy_block(s, buf, len, header)
    //DeflateState *s;
    //charf    *buf;    /* the input data */
    //unsigned len;     /* its length */
    //int      header;  /* true if block header must be written */
    {
      bi_windup(s);        /* align on byte boundary */

      if (header) {
        put_short(s, len);
        put_short(s, ~len);
      }
    //  while (len--) {
    //    put_byte(s, *buf++);
    //  }
      utils$j.arraySet(s.pending_buf, s.window, buf, len, s.pending);
      s.pending += len;
    }

    /* ===========================================================================
     * Compares to subtrees, using the tree depth as tie breaker when
     * the subtrees have equal frequency. This minimizes the worst case length.
     */
    function smaller(tree, n, m, depth) {
      var _n2 = n * 2;
      var _m2 = m * 2;
      return (tree[_n2]/*.Freq*/ < tree[_m2]/*.Freq*/ ||
             (tree[_n2]/*.Freq*/ === tree[_m2]/*.Freq*/ && depth[n] <= depth[m]));
    }

    /* ===========================================================================
     * Restore the heap property by moving down the tree starting at node k,
     * exchanging a node with the smallest of its two sons if necessary, stopping
     * when the heap property is re-established (each father smaller than its
     * two sons).
     */
    function pqdownheap(s, tree, k)
    //    deflate_state *s;
    //    ct_data *tree;  /* the tree to restore */
    //    int k;               /* node to move down */
    {
      var v = s.heap[k];
      var j = k << 1;  /* left son of k */
      while (j <= s.heap_len) {
        /* Set j to the smallest of the two sons: */
        if (j < s.heap_len &&
          smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
          j++;
        }
        /* Exit if v is smaller than both sons */
        if (smaller(tree, v, s.heap[j], s.depth)) { break; }

        /* Exchange v with the smallest son */
        s.heap[k] = s.heap[j];
        k = j;

        /* And continue down the tree, setting j to the left son of k */
        j <<= 1;
      }
      s.heap[k] = v;
    }


    // inlined manually
    // var SMALLEST = 1;

    /* ===========================================================================
     * Send the block data compressed using the given Huffman trees
     */
    function compress_block(s, ltree, dtree)
    //    deflate_state *s;
    //    const ct_data *ltree; /* literal tree */
    //    const ct_data *dtree; /* distance tree */
    {
      var dist;           /* distance of matched string */
      var lc;             /* match length or unmatched char (if dist == 0) */
      var lx = 0;         /* running index in l_buf */
      var code;           /* the code to send */
      var extra;          /* number of extra bits to send */

      if (s.last_lit !== 0) {
        do {
          dist = (s.pending_buf[s.d_buf + lx * 2] << 8) | (s.pending_buf[s.d_buf + lx * 2 + 1]);
          lc = s.pending_buf[s.l_buf + lx];
          lx++;

          if (dist === 0) {
            send_code(s, lc, ltree); /* send a literal byte */
            //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
          } else {
            /* Here, lc is the match length - MIN_MATCH */
            code = _length_code[lc];
            send_code(s, code + LITERALS$1 + 1, ltree); /* send the length code */
            extra = extra_lbits[code];
            if (extra !== 0) {
              lc -= base_length[code];
              send_bits(s, lc, extra);       /* send the extra length bits */
            }
            dist--; /* dist is now the match distance - 1 */
            code = d_code(dist);
            //Assert (code < D_CODES, "bad d_code");

            send_code(s, code, dtree);       /* send the distance code */
            extra = extra_dbits[code];
            if (extra !== 0) {
              dist -= base_dist[code];
              send_bits(s, dist, extra);   /* send the extra distance bits */
            }
          } /* literal or match pair ? */

          /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
          //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
          //       "pendingBuf overflow");

        } while (lx < s.last_lit);
      }

      send_code(s, END_BLOCK, ltree);
    }


    /* ===========================================================================
     * Construct one Huffman tree and assigns the code bit strings and lengths.
     * Update the total bit length for the current block.
     * IN assertion: the field freq is set for all tree elements.
     * OUT assertions: the fields len and code are set to the optimal bit length
     *     and corresponding code. The length opt_len is updated; static_len is
     *     also updated if stree is not null. The field max_code is set.
     */
    function build_tree(s, desc)
    //    deflate_state *s;
    //    tree_desc *desc; /* the tree descriptor */
    {
      var tree     = desc.dyn_tree;
      var stree    = desc.stat_desc.static_tree;
      var has_stree = desc.stat_desc.has_stree;
      var elems    = desc.stat_desc.elems;
      var n, m;          /* iterate over heap elements */
      var max_code = -1; /* largest code with non zero frequency */
      var node;          /* new node being created */

      /* Construct the initial heap, with least frequent element in
       * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
       * heap[0] is not used.
       */
      s.heap_len = 0;
      s.heap_max = HEAP_SIZE$1;

      for (n = 0; n < elems; n++) {
        if (tree[n * 2]/*.Freq*/ !== 0) {
          s.heap[++s.heap_len] = max_code = n;
          s.depth[n] = 0;

        } else {
          tree[n * 2 + 1]/*.Len*/ = 0;
        }
      }

      /* The pkzip format requires that at least one distance code exists,
       * and that at least one bit should be sent even if there is only one
       * possible code. So to avoid special checks later on we force at least
       * two codes of non zero frequency.
       */
      while (s.heap_len < 2) {
        node = s.heap[++s.heap_len] = (max_code < 2 ? ++max_code : 0);
        tree[node * 2]/*.Freq*/ = 1;
        s.depth[node] = 0;
        s.opt_len--;

        if (has_stree) {
          s.static_len -= stree[node * 2 + 1]/*.Len*/;
        }
        /* node is 0 or 1 so it does not have extra bits */
      }
      desc.max_code = max_code;

      /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
       * establish sub-heaps of increasing lengths:
       */
      for (n = (s.heap_len >> 1/*int /2*/); n >= 1; n--) { pqdownheap(s, tree, n); }

      /* Construct the Huffman tree by repeatedly combining the least two
       * frequent nodes.
       */
      node = elems;              /* next internal node of the tree */
      do {
        //pqremove(s, tree, n);  /* n = node of least frequency */
        /*** pqremove ***/
        n = s.heap[1/*SMALLEST*/];
        s.heap[1/*SMALLEST*/] = s.heap[s.heap_len--];
        pqdownheap(s, tree, 1/*SMALLEST*/);
        /***/

        m = s.heap[1/*SMALLEST*/]; /* m = node of next least frequency */

        s.heap[--s.heap_max] = n; /* keep the nodes sorted by frequency */
        s.heap[--s.heap_max] = m;

        /* Create a new node father of n and m */
        tree[node * 2]/*.Freq*/ = tree[n * 2]/*.Freq*/ + tree[m * 2]/*.Freq*/;
        s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
        tree[n * 2 + 1]/*.Dad*/ = tree[m * 2 + 1]/*.Dad*/ = node;

        /* and insert the new node in the heap */
        s.heap[1/*SMALLEST*/] = node++;
        pqdownheap(s, tree, 1/*SMALLEST*/);

      } while (s.heap_len >= 2);

      s.heap[--s.heap_max] = s.heap[1/*SMALLEST*/];

      /* At this point, the fields freq and dad are set. We can now
       * generate the bit lengths.
       */
      gen_bitlen(s, desc);

      /* The field len is now set, we can generate the bit codes */
      gen_codes(tree, max_code, s.bl_count);
    }


    /* ===========================================================================
     * Scan a literal or distance tree to determine the frequencies of the codes
     * in the bit length tree.
     */
    function scan_tree(s, tree, max_code)
    //    deflate_state *s;
    //    ct_data *tree;   /* the tree to be scanned */
    //    int max_code;    /* and its largest code of non zero frequency */
    {
      var n;                     /* iterates over all tree elements */
      var prevlen = -1;          /* last emitted length */
      var curlen;                /* length of current code */

      var nextlen = tree[0 * 2 + 1]/*.Len*/; /* length of next code */

      var count = 0;             /* repeat count of the current code */
      var max_count = 7;         /* max repeat count */
      var min_count = 4;         /* min repeat count */

      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }
      tree[(max_code + 1) * 2 + 1]/*.Len*/ = 0xffff; /* guard */

      for (n = 0; n <= max_code; n++) {
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1]/*.Len*/;

        if (++count < max_count && curlen === nextlen) {
          continue;

        } else if (count < min_count) {
          s.bl_tree[curlen * 2]/*.Freq*/ += count;

        } else if (curlen !== 0) {

          if (curlen !== prevlen) { s.bl_tree[curlen * 2]/*.Freq*/++; }
          s.bl_tree[REP_3_6 * 2]/*.Freq*/++;

        } else if (count <= 10) {
          s.bl_tree[REPZ_3_10 * 2]/*.Freq*/++;

        } else {
          s.bl_tree[REPZ_11_138 * 2]/*.Freq*/++;
        }

        count = 0;
        prevlen = curlen;

        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;

        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;

        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    }


    /* ===========================================================================
     * Send a literal or distance tree in compressed form, using the codes in
     * bl_tree.
     */
    function send_tree(s, tree, max_code)
    //    deflate_state *s;
    //    ct_data *tree; /* the tree to be scanned */
    //    int max_code;       /* and its largest code of non zero frequency */
    {
      var n;                     /* iterates over all tree elements */
      var prevlen = -1;          /* last emitted length */
      var curlen;                /* length of current code */

      var nextlen = tree[0 * 2 + 1]/*.Len*/; /* length of next code */

      var count = 0;             /* repeat count of the current code */
      var max_count = 7;         /* max repeat count */
      var min_count = 4;         /* min repeat count */

      /* tree[max_code+1].Len = -1; */  /* guard already set */
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }

      for (n = 0; n <= max_code; n++) {
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1]/*.Len*/;

        if (++count < max_count && curlen === nextlen) {
          continue;

        } else if (count < min_count) {
          do { send_code(s, curlen, s.bl_tree); } while (--count !== 0);

        } else if (curlen !== 0) {
          if (curlen !== prevlen) {
            send_code(s, curlen, s.bl_tree);
            count--;
          }
          //Assert(count >= 3 && count <= 6, " 3_6?");
          send_code(s, REP_3_6, s.bl_tree);
          send_bits(s, count - 3, 2);

        } else if (count <= 10) {
          send_code(s, REPZ_3_10, s.bl_tree);
          send_bits(s, count - 3, 3);

        } else {
          send_code(s, REPZ_11_138, s.bl_tree);
          send_bits(s, count - 11, 7);
        }

        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;

        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;

        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    }


    /* ===========================================================================
     * Construct the Huffman tree for the bit lengths and return the index in
     * bl_order of the last bit length code to send.
     */
    function build_bl_tree(s) {
      var max_blindex;  /* index of last bit length code of non zero freq */

      /* Determine the bit length frequencies for literal and distance trees */
      scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
      scan_tree(s, s.dyn_dtree, s.d_desc.max_code);

      /* Build the bit length tree: */
      build_tree(s, s.bl_desc);
      /* opt_len now includes the length of the tree representations, except
       * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
       */

      /* Determine the number of bit length codes to send. The pkzip format
       * requires that at least 4 bit length codes be sent. (appnote.txt says
       * 3 but the actual value used is 4.)
       */
      for (max_blindex = BL_CODES$1 - 1; max_blindex >= 3; max_blindex--) {
        if (s.bl_tree[bl_order[max_blindex] * 2 + 1]/*.Len*/ !== 0) {
          break;
        }
      }
      /* Update opt_len to include the bit length tree and counts */
      s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
      //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
      //        s->opt_len, s->static_len));

      return max_blindex;
    }


    /* ===========================================================================
     * Send the header for a block using dynamic Huffman trees: the counts, the
     * lengths of the bit length codes, the literal tree and the distance tree.
     * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
     */
    function send_all_trees(s, lcodes, dcodes, blcodes)
    //    deflate_state *s;
    //    int lcodes, dcodes, blcodes; /* number of codes for each tree */
    {
      var rank;                    /* index in bl_order */

      //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
      //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
      //        "too many codes");
      //Tracev((stderr, "\nbl counts: "));
      send_bits(s, lcodes - 257, 5); /* not +255 as stated in appnote.txt */
      send_bits(s, dcodes - 1,   5);
      send_bits(s, blcodes - 4,  4); /* not -3 as stated in appnote.txt */
      for (rank = 0; rank < blcodes; rank++) {
        //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
        send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1]/*.Len*/, 3);
      }
      //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));

      send_tree(s, s.dyn_ltree, lcodes - 1); /* literal tree */
      //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

      send_tree(s, s.dyn_dtree, dcodes - 1); /* distance tree */
      //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
    }


    /* ===========================================================================
     * Check if the data type is TEXT or BINARY, using the following algorithm:
     * - TEXT if the two conditions below are satisfied:
     *    a) There are no non-portable control characters belonging to the
     *       "black list" (0..6, 14..25, 28..31).
     *    b) There is at least one printable character belonging to the
     *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
     * - BINARY otherwise.
     * - The following partially-portable control characters form a
     *   "gray list" that is ignored in this detection algorithm:
     *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
     * IN assertion: the fields Freq of dyn_ltree are set.
     */
    function detect_data_type(s) {
      /* black_mask is the bit mask of black-listed bytes
       * set bits 0..6, 14..25, and 28..31
       * 0xf3ffc07f = binary 11110011111111111100000001111111
       */
      var black_mask = 0xf3ffc07f;
      var n;

      /* Check for non-textual ("black-listed") bytes. */
      for (n = 0; n <= 31; n++, black_mask >>>= 1) {
        if ((black_mask & 1) && (s.dyn_ltree[n * 2]/*.Freq*/ !== 0)) {
          return Z_BINARY;
        }
      }

      /* Check for textual ("white-listed") bytes. */
      if (s.dyn_ltree[9 * 2]/*.Freq*/ !== 0 || s.dyn_ltree[10 * 2]/*.Freq*/ !== 0 ||
          s.dyn_ltree[13 * 2]/*.Freq*/ !== 0) {
        return Z_TEXT;
      }
      for (n = 32; n < LITERALS$1; n++) {
        if (s.dyn_ltree[n * 2]/*.Freq*/ !== 0) {
          return Z_TEXT;
        }
      }

      /* There are no "black-listed" or "white-listed" bytes:
       * this stream either is empty or has tolerated ("gray-listed") bytes only.
       */
      return Z_BINARY;
    }


    var static_init_done = false;

    /* ===========================================================================
     * Initialize the tree data structures for a new zlib stream.
     */
    function _tr_init(s)
    {

      if (!static_init_done) {
        tr_static_init();
        static_init_done = true;
      }

      s.l_desc  = new TreeDesc(s.dyn_ltree, static_l_desc);
      s.d_desc  = new TreeDesc(s.dyn_dtree, static_d_desc);
      s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);

      s.bi_buf = 0;
      s.bi_valid = 0;

      /* Initialize the first block of the first file: */
      init_block(s);
    }


    /* ===========================================================================
     * Send a stored block
     */
    function _tr_stored_block(s, buf, stored_len, last)
    //DeflateState *s;
    //charf *buf;       /* input block */
    //ulg stored_len;   /* length of input block */
    //int last;         /* one if this is the last block for a file */
    {
      send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);    /* send block type */
      copy_block(s, buf, stored_len, true); /* with header */
    }


    /* ===========================================================================
     * Send one empty static block to give enough lookahead for inflate.
     * This takes 10 bits, of which 7 may remain in the bit buffer.
     */
    function _tr_align(s) {
      send_bits(s, STATIC_TREES << 1, 3);
      send_code(s, END_BLOCK, static_ltree);
      bi_flush(s);
    }


    /* ===========================================================================
     * Determine the best encoding for the current block: dynamic trees, static
     * trees or store, and output the encoded block to the zip file.
     */
    function _tr_flush_block(s, buf, stored_len, last)
    //DeflateState *s;
    //charf *buf;       /* input block, or NULL if too old */
    //ulg stored_len;   /* length of input block */
    //int last;         /* one if this is the last block for a file */
    {
      var opt_lenb, static_lenb;  /* opt_len and static_len in bytes */
      var max_blindex = 0;        /* index of last bit length code of non zero freq */

      /* Build the Huffman trees unless a stored block is forced */
      if (s.level > 0) {

        /* Check if the file is binary or text */
        if (s.strm.data_type === Z_UNKNOWN$1) {
          s.strm.data_type = detect_data_type(s);
        }

        /* Construct the literal and distance trees */
        build_tree(s, s.l_desc);
        // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
        //        s->static_len));

        build_tree(s, s.d_desc);
        // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
        //        s->static_len));
        /* At this point, opt_len and static_len are the total bit lengths of
         * the compressed block data, excluding the tree representations.
         */

        /* Build the bit length tree for the above two trees, and get the index
         * in bl_order of the last bit length code to send.
         */
        max_blindex = build_bl_tree(s);

        /* Determine the best encoding. Compute the block lengths in bytes. */
        opt_lenb = (s.opt_len + 3 + 7) >>> 3;
        static_lenb = (s.static_len + 3 + 7) >>> 3;

        // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
        //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
        //        s->last_lit));

        if (static_lenb <= opt_lenb) { opt_lenb = static_lenb; }

      } else {
        // Assert(buf != (char*)0, "lost buf");
        opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
      }

      if ((stored_len + 4 <= opt_lenb) && (buf !== -1)) {
        /* 4: two words for the lengths */

        /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
         * Otherwise we can't have processed more than WSIZE input bytes since
         * the last block flush, because compression would have been
         * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
         * transform a block into a stored block.
         */
        _tr_stored_block(s, buf, stored_len, last);

      } else if (s.strategy === Z_FIXED$1 || static_lenb === opt_lenb) {

        send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
        compress_block(s, static_ltree, static_dtree);

      } else {
        send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
        send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
        compress_block(s, s.dyn_ltree, s.dyn_dtree);
      }
      // Assert (s->compressed_len == s->bits_sent, "bad compressed size");
      /* The above check is made mod 2^32, for files larger than 512 MB
       * and uLong implemented on 32 bits.
       */
      init_block(s);

      if (last) {
        bi_windup(s);
      }
      // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
      //       s->compressed_len-7*last));
    }

    /* ===========================================================================
     * Save the match info and tally the frequency counts. Return true if
     * the current block must be flushed.
     */
    function _tr_tally(s, dist, lc)
    //    deflate_state *s;
    //    unsigned dist;  /* distance of matched string */
    //    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */
    {
      //var out_length, in_length, dcode;

      s.pending_buf[s.d_buf + s.last_lit * 2]     = (dist >>> 8) & 0xff;
      s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;

      s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
      s.last_lit++;

      if (dist === 0) {
        /* lc is the unmatched char */
        s.dyn_ltree[lc * 2]/*.Freq*/++;
      } else {
        s.matches++;
        /* Here, lc is the match length - MIN_MATCH */
        dist--;             /* dist = match distance - 1 */
        //Assert((ush)dist < (ush)MAX_DIST(s) &&
        //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
        //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

        s.dyn_ltree[(_length_code[lc] + LITERALS$1 + 1) * 2]/*.Freq*/++;
        s.dyn_dtree[d_code(dist) * 2]/*.Freq*/++;
      }

    // (!) This block is disabled in zlib defaults,
    // don't enable it for binary compatibility

    //#ifdef TRUNCATE_BLOCK
    //  /* Try to guess if it is profitable to stop the current block here */
    //  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
    //    /* Compute an upper bound for the compressed length */
    //    out_length = s.last_lit*8;
    //    in_length = s.strstart - s.block_start;
    //
    //    for (dcode = 0; dcode < D_CODES; dcode++) {
    //      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
    //    }
    //    out_length >>>= 3;
    //    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
    //    //       s->last_lit, in_length, out_length,
    //    //       100L - out_length*100L/in_length));
    //    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
    //      return true;
    //    }
    //  }
    //#endif

      return (s.last_lit === s.lit_bufsize - 1);
      /* We avoid equality with lit_bufsize because of wraparound at 64K
       * on 16 bit machines and because stored blocks are restricted to
       * 64K-1 bytes.
       */
    }

    trees$1._tr_init  = _tr_init;
    trees$1._tr_stored_block = _tr_stored_block;
    trees$1._tr_flush_block  = _tr_flush_block;
    trees$1._tr_tally = _tr_tally;
    trees$1._tr_align = _tr_align;

    // Note: adler32 takes 12% for level 0 and 2% for level 6.
    // It isn't worth it to make additional optimizations as in original.
    // Small size is preferable.

    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    function adler32$2(adler, buf, len, pos) {
      var s1 = (adler & 0xffff) |0,
          s2 = ((adler >>> 16) & 0xffff) |0,
          n = 0;

      while (len !== 0) {
        // Set limit ~ twice less than 5552, to keep
        // s2 in 31-bits, because we force signed ints.
        // in other case %= will fail.
        n = len > 2000 ? 2000 : len;
        len -= n;

        do {
          s1 = (s1 + buf[pos++]) |0;
          s2 = (s2 + s1) |0;
        } while (--n);

        s1 %= 65521;
        s2 %= 65521;
      }

      return (s1 | (s2 << 16)) |0;
    }


    var adler32_1 = adler32$2;

    // Note: we can't get significant speed boost here.
    // So write code to minimize size - no pregenerated tables
    // and array tools dependencies.

    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    // Use ordinary array, since untyped makes no boost here
    function makeTable() {
      var c, table = [];

      for (var n = 0; n < 256; n++) {
        c = n;
        for (var k = 0; k < 8; k++) {
          c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        table[n] = c;
      }

      return table;
    }

    // Create table on load. Just 255 signed longs. Not a problem.
    var crcTable = makeTable();


    function crc32$3(crc, buf, len, pos) {
      var t = crcTable,
          end = pos + len;

      crc ^= -1;

      for (var i = pos; i < end; i++) {
        crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
      }

      return (crc ^ (-1)); // >>> 0;
    }


    var crc32_1 = crc32$3;

    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    var messages = {
      2:      'need dictionary',     /* Z_NEED_DICT       2  */
      1:      'stream end',          /* Z_STREAM_END      1  */
      0:      '',                    /* Z_OK              0  */
      '-1':   'file error',          /* Z_ERRNO         (-1) */
      '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
      '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
      '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
      '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
      '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
    };

    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    var utils$i   = common;
    var trees   = trees$1;
    var adler32$1 = adler32_1;
    var crc32$2   = crc32_1;
    var msg$2     = messages;

    /* Public constants ==========================================================*/
    /* ===========================================================================*/


    /* Allowed flush values; see deflate() and inflate() below for details */
    var Z_NO_FLUSH$1      = 0;
    var Z_PARTIAL_FLUSH = 1;
    //var Z_SYNC_FLUSH    = 2;
    var Z_FULL_FLUSH    = 3;
    var Z_FINISH$2        = 4;
    var Z_BLOCK$1         = 5;
    //var Z_TREES         = 6;


    /* Return codes for the compression/decompression functions. Negative values
     * are errors, positive values are used for special but normal events.
     */
    var Z_OK$2            = 0;
    var Z_STREAM_END$2    = 1;
    //var Z_NEED_DICT     = 2;
    //var Z_ERRNO         = -1;
    var Z_STREAM_ERROR$1  = -2;
    var Z_DATA_ERROR$1    = -3;
    //var Z_MEM_ERROR     = -4;
    var Z_BUF_ERROR$1     = -5;
    //var Z_VERSION_ERROR = -6;


    /* compression levels */
    //var Z_NO_COMPRESSION      = 0;
    //var Z_BEST_SPEED          = 1;
    //var Z_BEST_COMPRESSION    = 9;
    var Z_DEFAULT_COMPRESSION$1 = -1;


    var Z_FILTERED            = 1;
    var Z_HUFFMAN_ONLY        = 2;
    var Z_RLE                 = 3;
    var Z_FIXED               = 4;
    var Z_DEFAULT_STRATEGY$1    = 0;

    /* Possible values of the data_type field (though see inflate()) */
    //var Z_BINARY              = 0;
    //var Z_TEXT                = 1;
    //var Z_ASCII               = 1; // = Z_TEXT
    var Z_UNKNOWN             = 2;


    /* The deflate compression method */
    var Z_DEFLATED$2  = 8;

    /*============================================================================*/


    var MAX_MEM_LEVEL = 9;
    /* Maximum value for memLevel in deflateInit2 */
    var MAX_WBITS$1 = 15;
    /* 32K LZ77 window */
    var DEF_MEM_LEVEL = 8;


    var LENGTH_CODES  = 29;
    /* number of length codes, not counting the special END_BLOCK code */
    var LITERALS      = 256;
    /* number of literal bytes 0..255 */
    var L_CODES       = LITERALS + 1 + LENGTH_CODES;
    /* number of Literal or Length codes, including the END_BLOCK code */
    var D_CODES       = 30;
    /* number of distance codes */
    var BL_CODES      = 19;
    /* number of codes used to transfer the bit lengths */
    var HEAP_SIZE     = 2 * L_CODES + 1;
    /* maximum heap size */
    var MAX_BITS  = 15;
    /* All codes must not exceed MAX_BITS bits */

    var MIN_MATCH = 3;
    var MAX_MATCH = 258;
    var MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);

    var PRESET_DICT = 0x20;

    var INIT_STATE = 42;
    var EXTRA_STATE = 69;
    var NAME_STATE = 73;
    var COMMENT_STATE = 91;
    var HCRC_STATE = 103;
    var BUSY_STATE = 113;
    var FINISH_STATE = 666;

    var BS_NEED_MORE      = 1; /* block not completed, need more input or more output */
    var BS_BLOCK_DONE     = 2; /* block flush performed */
    var BS_FINISH_STARTED = 3; /* finish started, need only more output at next deflate */
    var BS_FINISH_DONE    = 4; /* finish done, accept no more input or output */

    var OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

    function err(strm, errorCode) {
      strm.msg = msg$2[errorCode];
      return errorCode;
    }

    function rank(f) {
      return ((f) << 1) - ((f) > 4 ? 9 : 0);
    }

    function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }


    /* =========================================================================
     * Flush as much pending output as possible. All deflate() output goes
     * through this function so some applications may wish to modify it
     * to avoid allocating a large strm->output buffer and copying into it.
     * (See also read_buf()).
     */
    function flush_pending(strm) {
      var s = strm.state;

      //_tr_flush_bits(s);
      var len = s.pending;
      if (len > strm.avail_out) {
        len = strm.avail_out;
      }
      if (len === 0) { return; }

      utils$i.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
      strm.next_out += len;
      s.pending_out += len;
      strm.total_out += len;
      strm.avail_out -= len;
      s.pending -= len;
      if (s.pending === 0) {
        s.pending_out = 0;
      }
    }


    function flush_block_only(s, last) {
      trees._tr_flush_block(s, (s.block_start >= 0 ? s.block_start : -1), s.strstart - s.block_start, last);
      s.block_start = s.strstart;
      flush_pending(s.strm);
    }


    function put_byte(s, b) {
      s.pending_buf[s.pending++] = b;
    }


    /* =========================================================================
     * Put a short in the pending buffer. The 16-bit value is put in MSB order.
     * IN assertion: the stream state is correct and there is enough room in
     * pending_buf.
     */
    function putShortMSB(s, b) {
    //  put_byte(s, (Byte)(b >> 8));
    //  put_byte(s, (Byte)(b & 0xff));
      s.pending_buf[s.pending++] = (b >>> 8) & 0xff;
      s.pending_buf[s.pending++] = b & 0xff;
    }


    /* ===========================================================================
     * Read a new buffer from the current input stream, update the adler32
     * and total number of bytes read.  All deflate() input goes through
     * this function so some applications may wish to modify it to avoid
     * allocating a large strm->input buffer and copying from it.
     * (See also flush_pending()).
     */
    function read_buf(strm, buf, start, size) {
      var len = strm.avail_in;

      if (len > size) { len = size; }
      if (len === 0) { return 0; }

      strm.avail_in -= len;

      // zmemcpy(buf, strm->next_in, len);
      utils$i.arraySet(buf, strm.input, strm.next_in, len, start);
      if (strm.state.wrap === 1) {
        strm.adler = adler32$1(strm.adler, buf, len, start);
      }

      else if (strm.state.wrap === 2) {
        strm.adler = crc32$2(strm.adler, buf, len, start);
      }

      strm.next_in += len;
      strm.total_in += len;

      return len;
    }


    /* ===========================================================================
     * Set match_start to the longest match starting at the given string and
     * return its length. Matches shorter or equal to prev_length are discarded,
     * in which case the result is equal to prev_length and match_start is
     * garbage.
     * IN assertions: cur_match is the head of the hash chain for the current
     *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
     * OUT assertion: the match length is not greater than s->lookahead.
     */
    function longest_match(s, cur_match) {
      var chain_length = s.max_chain_length;      /* max hash chain length */
      var scan = s.strstart; /* current string */
      var match;                       /* matched string */
      var len;                           /* length of current match */
      var best_len = s.prev_length;              /* best match length so far */
      var nice_match = s.nice_match;             /* stop if match long enough */
      var limit = (s.strstart > (s.w_size - MIN_LOOKAHEAD)) ?
          s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0/*NIL*/;

      var _win = s.window; // shortcut

      var wmask = s.w_mask;
      var prev  = s.prev;

      /* Stop when cur_match becomes <= limit. To simplify the code,
       * we prevent matches with the string of window index 0.
       */

      var strend = s.strstart + MAX_MATCH;
      var scan_end1  = _win[scan + best_len - 1];
      var scan_end   = _win[scan + best_len];

      /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
       * It is easy to get rid of this optimization if necessary.
       */
      // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

      /* Do not waste too much time if we already have a good match: */
      if (s.prev_length >= s.good_match) {
        chain_length >>= 2;
      }
      /* Do not look for matches beyond the end of the input. This is necessary
       * to make deflate deterministic.
       */
      if (nice_match > s.lookahead) { nice_match = s.lookahead; }

      // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");

      do {
        // Assert(cur_match < s->strstart, "no future");
        match = cur_match;

        /* Skip to next match if the match length cannot increase
         * or if the match length is less than 2.  Note that the checks below
         * for insufficient lookahead only occur occasionally for performance
         * reasons.  Therefore uninitialized memory will be accessed, and
         * conditional jumps will be made that depend on those values.
         * However the length of the match is limited to the lookahead, so
         * the output of deflate is not affected by the uninitialized values.
         */

        if (_win[match + best_len]     !== scan_end  ||
            _win[match + best_len - 1] !== scan_end1 ||
            _win[match]                !== _win[scan] ||
            _win[++match]              !== _win[scan + 1]) {
          continue;
        }

        /* The check at best_len-1 can be removed because it will be made
         * again later. (This heuristic is not always a win.)
         * It is not necessary to compare scan[2] and match[2] since they
         * are always equal when the other bytes match, given that
         * the hash keys are equal and that HASH_BITS >= 8.
         */
        scan += 2;
        match++;
        // Assert(*scan == *match, "match[2]?");

        /* We check for insufficient lookahead only every 8th comparison;
         * the 256th check will be made at strstart+258.
         */
        do {
          /*jshint noempty:false*/
        } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
                 _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
                 _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
                 _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
                 scan < strend);

        // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");

        len = MAX_MATCH - (strend - scan);
        scan = strend - MAX_MATCH;

        if (len > best_len) {
          s.match_start = cur_match;
          best_len = len;
          if (len >= nice_match) {
            break;
          }
          scan_end1  = _win[scan + best_len - 1];
          scan_end   = _win[scan + best_len];
        }
      } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

      if (best_len <= s.lookahead) {
        return best_len;
      }
      return s.lookahead;
    }


    /* ===========================================================================
     * Fill the window when the lookahead becomes insufficient.
     * Updates strstart and lookahead.
     *
     * IN assertion: lookahead < MIN_LOOKAHEAD
     * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
     *    At least one byte has been read, or avail_in == 0; reads are
     *    performed for at least two bytes (required for the zip translate_eol
     *    option -- not supported here).
     */
    function fill_window(s) {
      var _w_size = s.w_size;
      var p, n, m, more, str;

      //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

      do {
        more = s.window_size - s.lookahead - s.strstart;

        // JS ints have 32 bit, block below not needed
        /* Deal with !@#$% 64K limit: */
        //if (sizeof(int) <= 2) {
        //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
        //        more = wsize;
        //
        //  } else if (more == (unsigned)(-1)) {
        //        /* Very unlikely, but possible on 16 bit machine if
        //         * strstart == 0 && lookahead == 1 (input done a byte at time)
        //         */
        //        more--;
        //    }
        //}


        /* If the window is almost full and there is insufficient lookahead,
         * move the upper half to the lower one to make room in the upper half.
         */
        if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {

          utils$i.arraySet(s.window, s.window, _w_size, _w_size, 0);
          s.match_start -= _w_size;
          s.strstart -= _w_size;
          /* we now have strstart >= MAX_DIST */
          s.block_start -= _w_size;

          /* Slide the hash table (could be avoided with 32 bit values
           at the expense of memory usage). We slide even when level == 0
           to keep the hash table consistent if we switch back to level > 0
           later. (Using level 0 permanently is not an optimal usage of
           zlib, so we don't care about this pathological case.)
           */

          n = s.hash_size;
          p = n;
          do {
            m = s.head[--p];
            s.head[p] = (m >= _w_size ? m - _w_size : 0);
          } while (--n);

          n = _w_size;
          p = n;
          do {
            m = s.prev[--p];
            s.prev[p] = (m >= _w_size ? m - _w_size : 0);
            /* If n is not on any hash chain, prev[n] is garbage but
             * its value will never be used.
             */
          } while (--n);

          more += _w_size;
        }
        if (s.strm.avail_in === 0) {
          break;
        }

        /* If there was no sliding:
         *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
         *    more == window_size - lookahead - strstart
         * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
         * => more >= window_size - 2*WSIZE + 2
         * In the BIG_MEM or MMAP case (not yet supported),
         *   window_size == input_size + MIN_LOOKAHEAD  &&
         *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
         * Otherwise, window_size == 2*WSIZE so more >= 2.
         * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
         */
        //Assert(more >= 2, "more < 2");
        n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
        s.lookahead += n;

        /* Initialize the hash value now that we have some input: */
        if (s.lookahead + s.insert >= MIN_MATCH) {
          str = s.strstart - s.insert;
          s.ins_h = s.window[str];

          /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + 1]) & s.hash_mask;
    //#if MIN_MATCH != 3
    //        Call update_hash() MIN_MATCH-3 more times
    //#endif
          while (s.insert) {
            /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
            s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;

            s.prev[str & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = str;
            str++;
            s.insert--;
            if (s.lookahead + s.insert < MIN_MATCH) {
              break;
            }
          }
        }
        /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
         * but this is not important since only literal bytes will be emitted.
         */

      } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);

      /* If the WIN_INIT bytes after the end of the current data have never been
       * written, then zero those bytes in order to avoid memory check reports of
       * the use of uninitialized (or uninitialised as Julian writes) bytes by
       * the longest match routines.  Update the high water mark for the next
       * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
       * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
       */
    //  if (s.high_water < s.window_size) {
    //    var curr = s.strstart + s.lookahead;
    //    var init = 0;
    //
    //    if (s.high_water < curr) {
    //      /* Previous high water mark below current data -- zero WIN_INIT
    //       * bytes or up to end of window, whichever is less.
    //       */
    //      init = s.window_size - curr;
    //      if (init > WIN_INIT)
    //        init = WIN_INIT;
    //      zmemzero(s->window + curr, (unsigned)init);
    //      s->high_water = curr + init;
    //    }
    //    else if (s->high_water < (ulg)curr + WIN_INIT) {
    //      /* High water mark at or above current data, but below current data
    //       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
    //       * to end of window, whichever is less.
    //       */
    //      init = (ulg)curr + WIN_INIT - s->high_water;
    //      if (init > s->window_size - s->high_water)
    //        init = s->window_size - s->high_water;
    //      zmemzero(s->window + s->high_water, (unsigned)init);
    //      s->high_water += init;
    //    }
    //  }
    //
    //  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
    //    "not enough room for search");
    }

    /* ===========================================================================
     * Copy without compression as much as possible from the input stream, return
     * the current block state.
     * This function does not insert new strings in the dictionary since
     * uncompressible data is probably not useful. This function is used
     * only for the level=0 compression option.
     * NOTE: this function should be optimized to avoid extra copying from
     * window to pending_buf.
     */
    function deflate_stored(s, flush) {
      /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
       * to pending_buf_size, and each stored block has a 5 byte header:
       */
      var max_block_size = 0xffff;

      if (max_block_size > s.pending_buf_size - 5) {
        max_block_size = s.pending_buf_size - 5;
      }

      /* Copy as much as possible from input to output: */
      for (;;) {
        /* Fill the window as much as possible: */
        if (s.lookahead <= 1) {

          //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
          //  s->block_start >= (long)s->w_size, "slide too late");
    //      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
    //        s.block_start >= s.w_size)) {
    //        throw  new Error("slide too late");
    //      }

          fill_window(s);
          if (s.lookahead === 0 && flush === Z_NO_FLUSH$1) {
            return BS_NEED_MORE;
          }

          if (s.lookahead === 0) {
            break;
          }
          /* flush the current block */
        }
        //Assert(s->block_start >= 0L, "block gone");
    //    if (s.block_start < 0) throw new Error("block gone");

        s.strstart += s.lookahead;
        s.lookahead = 0;

        /* Emit a stored block if pending_buf will be full: */
        var max_start = s.block_start + max_block_size;

        if (s.strstart === 0 || s.strstart >= max_start) {
          /* strstart == 0 is possible when wraparound on 16-bit machine */
          s.lookahead = s.strstart - max_start;
          s.strstart = max_start;
          /*** FLUSH_BLOCK(s, 0); ***/
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
          /***/


        }
        /* Flush if we may have to slide, otherwise block_start may become
         * negative and the data will be gone:
         */
        if (s.strstart - s.block_start >= (s.w_size - MIN_LOOKAHEAD)) {
          /*** FLUSH_BLOCK(s, 0); ***/
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
          /***/
        }
      }

      s.insert = 0;

      if (flush === Z_FINISH$2) {
        /*** FLUSH_BLOCK(s, 1); ***/
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        /***/
        return BS_FINISH_DONE;
      }

      if (s.strstart > s.block_start) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }

      return BS_NEED_MORE;
    }

    /* ===========================================================================
     * Compress as much as possible from the input stream, return the current
     * block state.
     * This function does not perform lazy evaluation of matches and inserts
     * new strings in the dictionary only for unmatched strings or for short
     * matches. It is used only for the fast compression options.
     */
    function deflate_fast(s, flush) {
      var hash_head;        /* head of the hash chain */
      var bflush;           /* set if current block must be flushed */

      for (;;) {
        /* Make sure that we always have enough lookahead, except
         * at the end of the input file. We need MAX_MATCH bytes
         * for the next match, plus MIN_MATCH bytes to insert the
         * string following the next match.
         */
        if (s.lookahead < MIN_LOOKAHEAD) {
          fill_window(s);
          if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$1) {
            return BS_NEED_MORE;
          }
          if (s.lookahead === 0) {
            break; /* flush the current block */
          }
        }

        /* Insert the string window[strstart .. strstart+2] in the
         * dictionary, and set hash_head to the head of the hash chain:
         */
        hash_head = 0/*NIL*/;
        if (s.lookahead >= MIN_MATCH) {
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
        }

        /* Find the longest match, discarding those <= prev_length.
         * At this point we have always match_length < MIN_MATCH
         */
        if (hash_head !== 0/*NIL*/ && ((s.strstart - hash_head) <= (s.w_size - MIN_LOOKAHEAD))) {
          /* To simplify the code, we prevent matches with the string
           * of window index 0 (in particular we have to avoid a match
           * of the string with itself at the start of the input file).
           */
          s.match_length = longest_match(s, hash_head);
          /* longest_match() sets match_start */
        }
        if (s.match_length >= MIN_MATCH) {
          // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

          /*** _tr_tally_dist(s, s.strstart - s.match_start,
                         s.match_length - MIN_MATCH, bflush); ***/
          bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);

          s.lookahead -= s.match_length;

          /* Insert new strings in the hash table only if the match length
           * is not too large. This saves time but degrades compression.
           */
          if (s.match_length <= s.max_lazy_match/*max_insert_length*/ && s.lookahead >= MIN_MATCH) {
            s.match_length--; /* string at strstart already in table */
            do {
              s.strstart++;
              /*** INSERT_STRING(s, s.strstart, hash_head); ***/
              s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
              hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = s.strstart;
              /***/
              /* strstart never exceeds WSIZE-MAX_MATCH, so there are
               * always MIN_MATCH bytes ahead.
               */
            } while (--s.match_length !== 0);
            s.strstart++;
          } else
          {
            s.strstart += s.match_length;
            s.match_length = 0;
            s.ins_h = s.window[s.strstart];
            /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */
            s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 1]) & s.hash_mask;

    //#if MIN_MATCH != 3
    //                Call UPDATE_HASH() MIN_MATCH-3 more times
    //#endif
            /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
             * matter since it will be recomputed at next deflate call.
             */
          }
        } else {
          /* No match, output a literal byte */
          //Tracevv((stderr,"%c", s.window[s.strstart]));
          /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
          bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

          s.lookahead--;
          s.strstart++;
        }
        if (bflush) {
          /*** FLUSH_BLOCK(s, 0); ***/
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
          /***/
        }
      }
      s.insert = ((s.strstart < (MIN_MATCH - 1)) ? s.strstart : MIN_MATCH - 1);
      if (flush === Z_FINISH$2) {
        /*** FLUSH_BLOCK(s, 1); ***/
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        /***/
        return BS_FINISH_DONE;
      }
      if (s.last_lit) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }
      return BS_BLOCK_DONE;
    }

    /* ===========================================================================
     * Same as above, but achieves better compression. We use a lazy
     * evaluation for matches: a match is finally adopted only if there is
     * no better match at the next window position.
     */
    function deflate_slow(s, flush) {
      var hash_head;          /* head of hash chain */
      var bflush;              /* set if current block must be flushed */

      var max_insert;

      /* Process the input block. */
      for (;;) {
        /* Make sure that we always have enough lookahead, except
         * at the end of the input file. We need MAX_MATCH bytes
         * for the next match, plus MIN_MATCH bytes to insert the
         * string following the next match.
         */
        if (s.lookahead < MIN_LOOKAHEAD) {
          fill_window(s);
          if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$1) {
            return BS_NEED_MORE;
          }
          if (s.lookahead === 0) { break; } /* flush the current block */
        }

        /* Insert the string window[strstart .. strstart+2] in the
         * dictionary, and set hash_head to the head of the hash chain:
         */
        hash_head = 0/*NIL*/;
        if (s.lookahead >= MIN_MATCH) {
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
        }

        /* Find the longest match, discarding those <= prev_length.
         */
        s.prev_length = s.match_length;
        s.prev_match = s.match_start;
        s.match_length = MIN_MATCH - 1;

        if (hash_head !== 0/*NIL*/ && s.prev_length < s.max_lazy_match &&
            s.strstart - hash_head <= (s.w_size - MIN_LOOKAHEAD)/*MAX_DIST(s)*/) {
          /* To simplify the code, we prevent matches with the string
           * of window index 0 (in particular we have to avoid a match
           * of the string with itself at the start of the input file).
           */
          s.match_length = longest_match(s, hash_head);
          /* longest_match() sets match_start */

          if (s.match_length <= 5 &&
             (s.strategy === Z_FILTERED || (s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096/*TOO_FAR*/))) {

            /* If prev_match is also MIN_MATCH, match_start is garbage
             * but we will ignore the current match anyway.
             */
            s.match_length = MIN_MATCH - 1;
          }
        }
        /* If there was a match at the previous step and the current
         * match is not better, output the previous match:
         */
        if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
          max_insert = s.strstart + s.lookahead - MIN_MATCH;
          /* Do not insert strings in hash table beyond this. */

          //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

          /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
                         s.prev_length - MIN_MATCH, bflush);***/
          bflush = trees._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
          /* Insert in hash table all strings up to the end of the match.
           * strstart-1 and strstart are already inserted. If there is not
           * enough lookahead, the last two strings are not inserted in
           * the hash table.
           */
          s.lookahead -= s.prev_length - 1;
          s.prev_length -= 2;
          do {
            if (++s.strstart <= max_insert) {
              /*** INSERT_STRING(s, s.strstart, hash_head); ***/
              s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
              hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = s.strstart;
              /***/
            }
          } while (--s.prev_length !== 0);
          s.match_available = 0;
          s.match_length = MIN_MATCH - 1;
          s.strstart++;

          if (bflush) {
            /*** FLUSH_BLOCK(s, 0); ***/
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
            /***/
          }

        } else if (s.match_available) {
          /* If there was no match at the previous position, output a
           * single literal. If there was a match but the current match
           * is longer, truncate the previous match to a single literal.
           */
          //Tracevv((stderr,"%c", s->window[s->strstart-1]));
          /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
          bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);

          if (bflush) {
            /*** FLUSH_BLOCK_ONLY(s, 0) ***/
            flush_block_only(s, false);
            /***/
          }
          s.strstart++;
          s.lookahead--;
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        } else {
          /* There is no previous match to compare with, wait for
           * the next step to decide.
           */
          s.match_available = 1;
          s.strstart++;
          s.lookahead--;
        }
      }
      //Assert (flush != Z_NO_FLUSH, "no flush?");
      if (s.match_available) {
        //Tracevv((stderr,"%c", s->window[s->strstart-1]));
        /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
        bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);

        s.match_available = 0;
      }
      s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
      if (flush === Z_FINISH$2) {
        /*** FLUSH_BLOCK(s, 1); ***/
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        /***/
        return BS_FINISH_DONE;
      }
      if (s.last_lit) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }

      return BS_BLOCK_DONE;
    }


    /* ===========================================================================
     * For Z_RLE, simply look for runs of bytes, generate matches only of distance
     * one.  Do not maintain a hash table.  (It will be regenerated if this run of
     * deflate switches away from Z_RLE.)
     */
    function deflate_rle(s, flush) {
      var bflush;            /* set if current block must be flushed */
      var prev;              /* byte at distance one to match */
      var scan, strend;      /* scan goes up to strend for length of run */

      var _win = s.window;

      for (;;) {
        /* Make sure that we always have enough lookahead, except
         * at the end of the input file. We need MAX_MATCH bytes
         * for the longest run, plus one for the unrolled loop.
         */
        if (s.lookahead <= MAX_MATCH) {
          fill_window(s);
          if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH$1) {
            return BS_NEED_MORE;
          }
          if (s.lookahead === 0) { break; } /* flush the current block */
        }

        /* See how many times the previous byte repeats */
        s.match_length = 0;
        if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
          scan = s.strstart - 1;
          prev = _win[scan];
          if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
            strend = s.strstart + MAX_MATCH;
            do {
              /*jshint noempty:false*/
            } while (prev === _win[++scan] && prev === _win[++scan] &&
                     prev === _win[++scan] && prev === _win[++scan] &&
                     prev === _win[++scan] && prev === _win[++scan] &&
                     prev === _win[++scan] && prev === _win[++scan] &&
                     scan < strend);
            s.match_length = MAX_MATCH - (strend - scan);
            if (s.match_length > s.lookahead) {
              s.match_length = s.lookahead;
            }
          }
          //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");
        }

        /* Emit match if have run of MIN_MATCH or longer, else emit literal */
        if (s.match_length >= MIN_MATCH) {
          //check_match(s, s.strstart, s.strstart - 1, s.match_length);

          /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
          bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);

          s.lookahead -= s.match_length;
          s.strstart += s.match_length;
          s.match_length = 0;
        } else {
          /* No match, output a literal byte */
          //Tracevv((stderr,"%c", s->window[s->strstart]));
          /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
          bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

          s.lookahead--;
          s.strstart++;
        }
        if (bflush) {
          /*** FLUSH_BLOCK(s, 0); ***/
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
          /***/
        }
      }
      s.insert = 0;
      if (flush === Z_FINISH$2) {
        /*** FLUSH_BLOCK(s, 1); ***/
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        /***/
        return BS_FINISH_DONE;
      }
      if (s.last_lit) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }
      return BS_BLOCK_DONE;
    }

    /* ===========================================================================
     * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
     * (It will be regenerated if this run of deflate switches away from Huffman.)
     */
    function deflate_huff(s, flush) {
      var bflush;             /* set if current block must be flushed */

      for (;;) {
        /* Make sure that we have a literal to write. */
        if (s.lookahead === 0) {
          fill_window(s);
          if (s.lookahead === 0) {
            if (flush === Z_NO_FLUSH$1) {
              return BS_NEED_MORE;
            }
            break;      /* flush the current block */
          }
        }

        /* Output a literal byte */
        s.match_length = 0;
        //Tracevv((stderr,"%c", s->window[s->strstart]));
        /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
        bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;
        if (bflush) {
          /*** FLUSH_BLOCK(s, 0); ***/
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
          /***/
        }
      }
      s.insert = 0;
      if (flush === Z_FINISH$2) {
        /*** FLUSH_BLOCK(s, 1); ***/
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        /***/
        return BS_FINISH_DONE;
      }
      if (s.last_lit) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }
      return BS_BLOCK_DONE;
    }

    /* Values for max_lazy_match, good_match and max_chain_length, depending on
     * the desired pack level (0..9). The values given below have been tuned to
     * exclude worst case performance for pathological files. Better values may be
     * found for specific files.
     */
    function Config(good_length, max_lazy, nice_length, max_chain, func) {
      this.good_length = good_length;
      this.max_lazy = max_lazy;
      this.nice_length = nice_length;
      this.max_chain = max_chain;
      this.func = func;
    }

    var configuration_table;

    configuration_table = [
      /*      good lazy nice chain */
      new Config(0, 0, 0, 0, deflate_stored),          /* 0 store only */
      new Config(4, 4, 8, 4, deflate_fast),            /* 1 max speed, no lazy matches */
      new Config(4, 5, 16, 8, deflate_fast),           /* 2 */
      new Config(4, 6, 32, 32, deflate_fast),          /* 3 */

      new Config(4, 4, 16, 16, deflate_slow),          /* 4 lazy matches */
      new Config(8, 16, 32, 32, deflate_slow),         /* 5 */
      new Config(8, 16, 128, 128, deflate_slow),       /* 6 */
      new Config(8, 32, 128, 256, deflate_slow),       /* 7 */
      new Config(32, 128, 258, 1024, deflate_slow),    /* 8 */
      new Config(32, 258, 258, 4096, deflate_slow)     /* 9 max compression */
    ];


    /* ===========================================================================
     * Initialize the "longest match" routines for a new zlib stream
     */
    function lm_init(s) {
      s.window_size = 2 * s.w_size;

      /*** CLEAR_HASH(s); ***/
      zero(s.head); // Fill with NIL (= 0);

      /* Set the default configuration parameters:
       */
      s.max_lazy_match = configuration_table[s.level].max_lazy;
      s.good_match = configuration_table[s.level].good_length;
      s.nice_match = configuration_table[s.level].nice_length;
      s.max_chain_length = configuration_table[s.level].max_chain;

      s.strstart = 0;
      s.block_start = 0;
      s.lookahead = 0;
      s.insert = 0;
      s.match_length = s.prev_length = MIN_MATCH - 1;
      s.match_available = 0;
      s.ins_h = 0;
    }


    function DeflateState() {
      this.strm = null;            /* pointer back to this zlib stream */
      this.status = 0;            /* as the name implies */
      this.pending_buf = null;      /* output still pending */
      this.pending_buf_size = 0;  /* size of pending_buf */
      this.pending_out = 0;       /* next pending byte to output to the stream */
      this.pending = 0;           /* nb of bytes in the pending buffer */
      this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
      this.gzhead = null;         /* gzip header information to write */
      this.gzindex = 0;           /* where in extra, name, or comment */
      this.method = Z_DEFLATED$2; /* can only be DEFLATED */
      this.last_flush = -1;   /* value of flush param for previous deflate call */

      this.w_size = 0;  /* LZ77 window size (32K by default) */
      this.w_bits = 0;  /* log2(w_size)  (8..16) */
      this.w_mask = 0;  /* w_size - 1 */

      this.window = null;
      /* Sliding window. Input bytes are read into the second half of the window,
       * and move to the first half later to keep a dictionary of at least wSize
       * bytes. With this organization, matches are limited to a distance of
       * wSize-MAX_MATCH bytes, but this ensures that IO is always
       * performed with a length multiple of the block size.
       */

      this.window_size = 0;
      /* Actual size of window: 2*wSize, except when the user input buffer
       * is directly used as sliding window.
       */

      this.prev = null;
      /* Link to older string with same hash index. To limit the size of this
       * array to 64K, this link is maintained only for the last 32K strings.
       * An index in this array is thus a window index modulo 32K.
       */

      this.head = null;   /* Heads of the hash chains or NIL. */

      this.ins_h = 0;       /* hash index of string to be inserted */
      this.hash_size = 0;   /* number of elements in hash table */
      this.hash_bits = 0;   /* log2(hash_size) */
      this.hash_mask = 0;   /* hash_size-1 */

      this.hash_shift = 0;
      /* Number of bits by which ins_h must be shifted at each input
       * step. It must be such that after MIN_MATCH steps, the oldest
       * byte no longer takes part in the hash key, that is:
       *   hash_shift * MIN_MATCH >= hash_bits
       */

      this.block_start = 0;
      /* Window position at the beginning of the current output block. Gets
       * negative when the window is moved backwards.
       */

      this.match_length = 0;      /* length of best match */
      this.prev_match = 0;        /* previous match */
      this.match_available = 0;   /* set if previous match exists */
      this.strstart = 0;          /* start of string to insert */
      this.match_start = 0;       /* start of matching string */
      this.lookahead = 0;         /* number of valid bytes ahead in window */

      this.prev_length = 0;
      /* Length of the best match at previous step. Matches not greater than this
       * are discarded. This is used in the lazy match evaluation.
       */

      this.max_chain_length = 0;
      /* To speed up deflation, hash chains are never searched beyond this
       * length.  A higher limit improves compression ratio but degrades the
       * speed.
       */

      this.max_lazy_match = 0;
      /* Attempt to find a better match only when the current match is strictly
       * smaller than this value. This mechanism is used only for compression
       * levels >= 4.
       */
      // That's alias to max_lazy_match, don't use directly
      //this.max_insert_length = 0;
      /* Insert new strings in the hash table only if the match length is not
       * greater than this length. This saves time but degrades compression.
       * max_insert_length is used only for compression levels <= 3.
       */

      this.level = 0;     /* compression level (1..9) */
      this.strategy = 0;  /* favor or force Huffman coding*/

      this.good_match = 0;
      /* Use a faster search when the previous match is longer than this */

      this.nice_match = 0; /* Stop searching when current match exceeds this */

                  /* used by trees.c: */

      /* Didn't use ct_data typedef below to suppress compiler warning */

      // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
      // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
      // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */

      // Use flat array of DOUBLE size, with interleaved fata,
      // because JS does not support effective
      this.dyn_ltree  = new utils$i.Buf16(HEAP_SIZE * 2);
      this.dyn_dtree  = new utils$i.Buf16((2 * D_CODES + 1) * 2);
      this.bl_tree    = new utils$i.Buf16((2 * BL_CODES + 1) * 2);
      zero(this.dyn_ltree);
      zero(this.dyn_dtree);
      zero(this.bl_tree);

      this.l_desc   = null;         /* desc. for literal tree */
      this.d_desc   = null;         /* desc. for distance tree */
      this.bl_desc  = null;         /* desc. for bit length tree */

      //ush bl_count[MAX_BITS+1];
      this.bl_count = new utils$i.Buf16(MAX_BITS + 1);
      /* number of codes at each bit length for an optimal tree */

      //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
      this.heap = new utils$i.Buf16(2 * L_CODES + 1);  /* heap used to build the Huffman trees */
      zero(this.heap);

      this.heap_len = 0;               /* number of elements in the heap */
      this.heap_max = 0;               /* element of largest frequency */
      /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
       * The same heap array is used to build all trees.
       */

      this.depth = new utils$i.Buf16(2 * L_CODES + 1); //uch depth[2*L_CODES+1];
      zero(this.depth);
      /* Depth of each subtree used as tie breaker for trees of equal frequency
       */

      this.l_buf = 0;          /* buffer index for literals or lengths */

      this.lit_bufsize = 0;
      /* Size of match buffer for literals/lengths.  There are 4 reasons for
       * limiting lit_bufsize to 64K:
       *   - frequencies can be kept in 16 bit counters
       *   - if compression is not successful for the first block, all input
       *     data is still in the window so we can still emit a stored block even
       *     when input comes from standard input.  (This can also be done for
       *     all blocks if lit_bufsize is not greater than 32K.)
       *   - if compression is not successful for a file smaller than 64K, we can
       *     even emit a stored file instead of a stored block (saving 5 bytes).
       *     This is applicable only for zip (not gzip or zlib).
       *   - creating new Huffman trees less frequently may not provide fast
       *     adaptation to changes in the input data statistics. (Take for
       *     example a binary file with poorly compressible code followed by
       *     a highly compressible string table.) Smaller buffer sizes give
       *     fast adaptation but have of course the overhead of transmitting
       *     trees more frequently.
       *   - I can't count above 4
       */

      this.last_lit = 0;      /* running index in l_buf */

      this.d_buf = 0;
      /* Buffer index for distances. To simplify the code, d_buf and l_buf have
       * the same number of elements. To use different lengths, an extra flag
       * array would be necessary.
       */

      this.opt_len = 0;       /* bit length of current block with optimal trees */
      this.static_len = 0;    /* bit length of current block with static trees */
      this.matches = 0;       /* number of string matches in current block */
      this.insert = 0;        /* bytes at end of window left to insert */


      this.bi_buf = 0;
      /* Output buffer. bits are inserted starting at the bottom (least
       * significant bits).
       */
      this.bi_valid = 0;
      /* Number of valid bits in bi_buf.  All bits above the last valid bit
       * are always zero.
       */

      // Used for window memory init. We safely ignore it for JS. That makes
      // sense only for pointers and memory check tools.
      //this.high_water = 0;
      /* High water mark offset in window for initialized bytes -- bytes above
       * this are set to zero in order to avoid memory check warnings when
       * longest match routines access bytes past the input.  This is then
       * updated to the new high water mark.
       */
    }


    function deflateResetKeep(strm) {
      var s;

      if (!strm || !strm.state) {
        return err(strm, Z_STREAM_ERROR$1);
      }

      strm.total_in = strm.total_out = 0;
      strm.data_type = Z_UNKNOWN;

      s = strm.state;
      s.pending = 0;
      s.pending_out = 0;

      if (s.wrap < 0) {
        s.wrap = -s.wrap;
        /* was made negative by deflate(..., Z_FINISH); */
      }
      s.status = (s.wrap ? INIT_STATE : BUSY_STATE);
      strm.adler = (s.wrap === 2) ?
        0  // crc32(0, Z_NULL, 0)
      :
        1; // adler32(0, Z_NULL, 0)
      s.last_flush = Z_NO_FLUSH$1;
      trees._tr_init(s);
      return Z_OK$2;
    }


    function deflateReset(strm) {
      var ret = deflateResetKeep(strm);
      if (ret === Z_OK$2) {
        lm_init(strm.state);
      }
      return ret;
    }


    function deflateSetHeader(strm, head) {
      if (!strm || !strm.state) { return Z_STREAM_ERROR$1; }
      if (strm.state.wrap !== 2) { return Z_STREAM_ERROR$1; }
      strm.state.gzhead = head;
      return Z_OK$2;
    }


    function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
      if (!strm) { // === Z_NULL
        return Z_STREAM_ERROR$1;
      }
      var wrap = 1;

      if (level === Z_DEFAULT_COMPRESSION$1) {
        level = 6;
      }

      if (windowBits < 0) { /* suppress zlib wrapper */
        wrap = 0;
        windowBits = -windowBits;
      }

      else if (windowBits > 15) {
        wrap = 2;           /* write gzip wrapper instead */
        windowBits -= 16;
      }


      if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED$2 ||
        windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
        strategy < 0 || strategy > Z_FIXED) {
        return err(strm, Z_STREAM_ERROR$1);
      }


      if (windowBits === 8) {
        windowBits = 9;
      }
      /* until 256-byte window bug fixed */

      var s = new DeflateState();

      strm.state = s;
      s.strm = strm;

      s.wrap = wrap;
      s.gzhead = null;
      s.w_bits = windowBits;
      s.w_size = 1 << s.w_bits;
      s.w_mask = s.w_size - 1;

      s.hash_bits = memLevel + 7;
      s.hash_size = 1 << s.hash_bits;
      s.hash_mask = s.hash_size - 1;
      s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);

      s.window = new utils$i.Buf8(s.w_size * 2);
      s.head = new utils$i.Buf16(s.hash_size);
      s.prev = new utils$i.Buf16(s.w_size);

      // Don't need mem init magic for JS.
      //s.high_water = 0;  /* nothing written to s->window yet */

      s.lit_bufsize = 1 << (memLevel + 6); /* 16K elements by default */

      s.pending_buf_size = s.lit_bufsize * 4;

      //overlay = (ushf *) ZALLOC(strm, s->lit_bufsize, sizeof(ush)+2);
      //s->pending_buf = (uchf *) overlay;
      s.pending_buf = new utils$i.Buf8(s.pending_buf_size);

      // It is offset from `s.pending_buf` (size is `s.lit_bufsize * 2`)
      //s->d_buf = overlay + s->lit_bufsize/sizeof(ush);
      s.d_buf = 1 * s.lit_bufsize;

      //s->l_buf = s->pending_buf + (1+sizeof(ush))*s->lit_bufsize;
      s.l_buf = (1 + 2) * s.lit_bufsize;

      s.level = level;
      s.strategy = strategy;
      s.method = method;

      return deflateReset(strm);
    }

    function deflateInit(strm, level) {
      return deflateInit2(strm, level, Z_DEFLATED$2, MAX_WBITS$1, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY$1);
    }


    function deflate$2(strm, flush) {
      var old_flush, s;
      var beg, val; // for gzip header write only

      if (!strm || !strm.state ||
        flush > Z_BLOCK$1 || flush < 0) {
        return strm ? err(strm, Z_STREAM_ERROR$1) : Z_STREAM_ERROR$1;
      }

      s = strm.state;

      if (!strm.output ||
          (!strm.input && strm.avail_in !== 0) ||
          (s.status === FINISH_STATE && flush !== Z_FINISH$2)) {
        return err(strm, (strm.avail_out === 0) ? Z_BUF_ERROR$1 : Z_STREAM_ERROR$1);
      }

      s.strm = strm; /* just in case */
      old_flush = s.last_flush;
      s.last_flush = flush;

      /* Write the header */
      if (s.status === INIT_STATE) {

        if (s.wrap === 2) { // GZIP header
          strm.adler = 0;  //crc32(0L, Z_NULL, 0);
          put_byte(s, 31);
          put_byte(s, 139);
          put_byte(s, 8);
          if (!s.gzhead) { // s->gzhead == Z_NULL
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, s.level === 9 ? 2 :
                        (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                         4 : 0));
            put_byte(s, OS_CODE);
            s.status = BUSY_STATE;
          }
          else {
            put_byte(s, (s.gzhead.text ? 1 : 0) +
                        (s.gzhead.hcrc ? 2 : 0) +
                        (!s.gzhead.extra ? 0 : 4) +
                        (!s.gzhead.name ? 0 : 8) +
                        (!s.gzhead.comment ? 0 : 16)
            );
            put_byte(s, s.gzhead.time & 0xff);
            put_byte(s, (s.gzhead.time >> 8) & 0xff);
            put_byte(s, (s.gzhead.time >> 16) & 0xff);
            put_byte(s, (s.gzhead.time >> 24) & 0xff);
            put_byte(s, s.level === 9 ? 2 :
                        (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                         4 : 0));
            put_byte(s, s.gzhead.os & 0xff);
            if (s.gzhead.extra && s.gzhead.extra.length) {
              put_byte(s, s.gzhead.extra.length & 0xff);
              put_byte(s, (s.gzhead.extra.length >> 8) & 0xff);
            }
            if (s.gzhead.hcrc) {
              strm.adler = crc32$2(strm.adler, s.pending_buf, s.pending, 0);
            }
            s.gzindex = 0;
            s.status = EXTRA_STATE;
          }
        }
        else // DEFLATE header
        {
          var header = (Z_DEFLATED$2 + ((s.w_bits - 8) << 4)) << 8;
          var level_flags = -1;

          if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
            level_flags = 0;
          } else if (s.level < 6) {
            level_flags = 1;
          } else if (s.level === 6) {
            level_flags = 2;
          } else {
            level_flags = 3;
          }
          header |= (level_flags << 6);
          if (s.strstart !== 0) { header |= PRESET_DICT; }
          header += 31 - (header % 31);

          s.status = BUSY_STATE;
          putShortMSB(s, header);

          /* Save the adler32 of the preset dictionary: */
          if (s.strstart !== 0) {
            putShortMSB(s, strm.adler >>> 16);
            putShortMSB(s, strm.adler & 0xffff);
          }
          strm.adler = 1; // adler32(0L, Z_NULL, 0);
        }
      }

    //#ifdef GZIP
      if (s.status === EXTRA_STATE) {
        if (s.gzhead.extra/* != Z_NULL*/) {
          beg = s.pending;  /* start of bytes to update crc */

          while (s.gzindex < (s.gzhead.extra.length & 0xffff)) {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32$2(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              flush_pending(strm);
              beg = s.pending;
              if (s.pending === s.pending_buf_size) {
                break;
              }
            }
            put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
            s.gzindex++;
          }
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32$2(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          if (s.gzindex === s.gzhead.extra.length) {
            s.gzindex = 0;
            s.status = NAME_STATE;
          }
        }
        else {
          s.status = NAME_STATE;
        }
      }
      if (s.status === NAME_STATE) {
        if (s.gzhead.name/* != Z_NULL*/) {
          beg = s.pending;  /* start of bytes to update crc */
          //int val;

          do {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32$2(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              flush_pending(strm);
              beg = s.pending;
              if (s.pending === s.pending_buf_size) {
                val = 1;
                break;
              }
            }
            // JS specific: little magic to add zero terminator to end of string
            if (s.gzindex < s.gzhead.name.length) {
              val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
            } else {
              val = 0;
            }
            put_byte(s, val);
          } while (val !== 0);

          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32$2(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          if (val === 0) {
            s.gzindex = 0;
            s.status = COMMENT_STATE;
          }
        }
        else {
          s.status = COMMENT_STATE;
        }
      }
      if (s.status === COMMENT_STATE) {
        if (s.gzhead.comment/* != Z_NULL*/) {
          beg = s.pending;  /* start of bytes to update crc */
          //int val;

          do {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32$2(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              flush_pending(strm);
              beg = s.pending;
              if (s.pending === s.pending_buf_size) {
                val = 1;
                break;
              }
            }
            // JS specific: little magic to add zero terminator to end of string
            if (s.gzindex < s.gzhead.comment.length) {
              val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
            } else {
              val = 0;
            }
            put_byte(s, val);
          } while (val !== 0);

          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32$2(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          if (val === 0) {
            s.status = HCRC_STATE;
          }
        }
        else {
          s.status = HCRC_STATE;
        }
      }
      if (s.status === HCRC_STATE) {
        if (s.gzhead.hcrc) {
          if (s.pending + 2 > s.pending_buf_size) {
            flush_pending(strm);
          }
          if (s.pending + 2 <= s.pending_buf_size) {
            put_byte(s, strm.adler & 0xff);
            put_byte(s, (strm.adler >> 8) & 0xff);
            strm.adler = 0; //crc32(0L, Z_NULL, 0);
            s.status = BUSY_STATE;
          }
        }
        else {
          s.status = BUSY_STATE;
        }
      }
    //#endif

      /* Flush as much pending output as possible */
      if (s.pending !== 0) {
        flush_pending(strm);
        if (strm.avail_out === 0) {
          /* Since avail_out is 0, deflate will be called again with
           * more output space, but possibly with both pending and
           * avail_in equal to zero. There won't be anything to do,
           * but this is not an error situation so make sure we
           * return OK instead of BUF_ERROR at next call of deflate:
           */
          s.last_flush = -1;
          return Z_OK$2;
        }

        /* Make sure there is something to do and avoid duplicate consecutive
         * flushes. For repeated and useless calls with Z_FINISH, we keep
         * returning Z_STREAM_END instead of Z_BUF_ERROR.
         */
      } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) &&
        flush !== Z_FINISH$2) {
        return err(strm, Z_BUF_ERROR$1);
      }

      /* User must not provide more input after the first FINISH: */
      if (s.status === FINISH_STATE && strm.avail_in !== 0) {
        return err(strm, Z_BUF_ERROR$1);
      }

      /* Start a new block or continue the current one.
       */
      if (strm.avail_in !== 0 || s.lookahead !== 0 ||
        (flush !== Z_NO_FLUSH$1 && s.status !== FINISH_STATE)) {
        var bstate = (s.strategy === Z_HUFFMAN_ONLY) ? deflate_huff(s, flush) :
          (s.strategy === Z_RLE ? deflate_rle(s, flush) :
            configuration_table[s.level].func(s, flush));

        if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
          s.status = FINISH_STATE;
        }
        if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
          if (strm.avail_out === 0) {
            s.last_flush = -1;
            /* avoid BUF_ERROR next call, see above */
          }
          return Z_OK$2;
          /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
           * of deflate should use the same flush parameter to make sure
           * that the flush is complete. So we don't have to output an
           * empty block here, this will be done at next call. This also
           * ensures that for a very small output buffer, we emit at most
           * one empty block.
           */
        }
        if (bstate === BS_BLOCK_DONE) {
          if (flush === Z_PARTIAL_FLUSH) {
            trees._tr_align(s);
          }
          else if (flush !== Z_BLOCK$1) { /* FULL_FLUSH or SYNC_FLUSH */

            trees._tr_stored_block(s, 0, 0, false);
            /* For a full flush, this empty block will be recognized
             * as a special marker by inflate_sync().
             */
            if (flush === Z_FULL_FLUSH) {
              /*** CLEAR_HASH(s); ***/             /* forget history */
              zero(s.head); // Fill with NIL (= 0);

              if (s.lookahead === 0) {
                s.strstart = 0;
                s.block_start = 0;
                s.insert = 0;
              }
            }
          }
          flush_pending(strm);
          if (strm.avail_out === 0) {
            s.last_flush = -1; /* avoid BUF_ERROR at next call, see above */
            return Z_OK$2;
          }
        }
      }
      //Assert(strm->avail_out > 0, "bug2");
      //if (strm.avail_out <= 0) { throw new Error("bug2");}

      if (flush !== Z_FINISH$2) { return Z_OK$2; }
      if (s.wrap <= 0) { return Z_STREAM_END$2; }

      /* Write the trailer */
      if (s.wrap === 2) {
        put_byte(s, strm.adler & 0xff);
        put_byte(s, (strm.adler >> 8) & 0xff);
        put_byte(s, (strm.adler >> 16) & 0xff);
        put_byte(s, (strm.adler >> 24) & 0xff);
        put_byte(s, strm.total_in & 0xff);
        put_byte(s, (strm.total_in >> 8) & 0xff);
        put_byte(s, (strm.total_in >> 16) & 0xff);
        put_byte(s, (strm.total_in >> 24) & 0xff);
      }
      else
      {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 0xffff);
      }

      flush_pending(strm);
      /* If avail_out is zero, the application will call deflate again
       * to flush the rest.
       */
      if (s.wrap > 0) { s.wrap = -s.wrap; }
      /* write the trailer only once! */
      return s.pending !== 0 ? Z_OK$2 : Z_STREAM_END$2;
    }

    function deflateEnd(strm) {
      var status;

      if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
        return Z_STREAM_ERROR$1;
      }

      status = strm.state.status;
      if (status !== INIT_STATE &&
        status !== EXTRA_STATE &&
        status !== NAME_STATE &&
        status !== COMMENT_STATE &&
        status !== HCRC_STATE &&
        status !== BUSY_STATE &&
        status !== FINISH_STATE
      ) {
        return err(strm, Z_STREAM_ERROR$1);
      }

      strm.state = null;

      return status === BUSY_STATE ? err(strm, Z_DATA_ERROR$1) : Z_OK$2;
    }


    /* =========================================================================
     * Initializes the compression dictionary from the given byte
     * sequence without producing any compressed output.
     */
    function deflateSetDictionary(strm, dictionary) {
      var dictLength = dictionary.length;

      var s;
      var str, n;
      var wrap;
      var avail;
      var next;
      var input;
      var tmpDict;

      if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
        return Z_STREAM_ERROR$1;
      }

      s = strm.state;
      wrap = s.wrap;

      if (wrap === 2 || (wrap === 1 && s.status !== INIT_STATE) || s.lookahead) {
        return Z_STREAM_ERROR$1;
      }

      /* when using zlib wrappers, compute Adler-32 for provided dictionary */
      if (wrap === 1) {
        /* adler32(strm->adler, dictionary, dictLength); */
        strm.adler = adler32$1(strm.adler, dictionary, dictLength, 0);
      }

      s.wrap = 0;   /* avoid computing Adler-32 in read_buf */

      /* if dictionary would fill window, just replace the history */
      if (dictLength >= s.w_size) {
        if (wrap === 0) {            /* already empty otherwise */
          /*** CLEAR_HASH(s); ***/
          zero(s.head); // Fill with NIL (= 0);
          s.strstart = 0;
          s.block_start = 0;
          s.insert = 0;
        }
        /* use the tail */
        // dictionary = dictionary.slice(dictLength - s.w_size);
        tmpDict = new utils$i.Buf8(s.w_size);
        utils$i.arraySet(tmpDict, dictionary, dictLength - s.w_size, s.w_size, 0);
        dictionary = tmpDict;
        dictLength = s.w_size;
      }
      /* insert dictionary into window and hash */
      avail = strm.avail_in;
      next = strm.next_in;
      input = strm.input;
      strm.avail_in = dictLength;
      strm.next_in = 0;
      strm.input = dictionary;
      fill_window(s);
      while (s.lookahead >= MIN_MATCH) {
        str = s.strstart;
        n = s.lookahead - (MIN_MATCH - 1);
        do {
          /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;

          s.prev[str & s.w_mask] = s.head[s.ins_h];

          s.head[s.ins_h] = str;
          str++;
        } while (--n);
        s.strstart = str;
        s.lookahead = MIN_MATCH - 1;
        fill_window(s);
      }
      s.strstart += s.lookahead;
      s.block_start = s.strstart;
      s.insert = s.lookahead;
      s.lookahead = 0;
      s.match_length = s.prev_length = MIN_MATCH - 1;
      s.match_available = 0;
      strm.next_in = next;
      strm.input = input;
      strm.avail_in = avail;
      s.wrap = wrap;
      return Z_OK$2;
    }


    deflate$3.deflateInit = deflateInit;
    deflate$3.deflateInit2 = deflateInit2;
    deflate$3.deflateReset = deflateReset;
    deflate$3.deflateResetKeep = deflateResetKeep;
    deflate$3.deflateSetHeader = deflateSetHeader;
    deflate$3.deflate = deflate$2;
    deflate$3.deflateEnd = deflateEnd;
    deflate$3.deflateSetDictionary = deflateSetDictionary;
    deflate$3.deflateInfo = 'pako deflate (from Nodeca project)';

    var strings$2 = {};

    var utils$h = common;


    // Quick check if we can use fast array to bin string conversion
    //
    // - apply(Array) can fail on Android 2.2
    // - apply(Uint8Array) can fail on iOS 5.1 Safari
    //
    var STR_APPLY_OK = true;
    var STR_APPLY_UIA_OK = true;

    try { String.fromCharCode.apply(null, [ 0 ]); } catch (__) { STR_APPLY_OK = false; }
    try { String.fromCharCode.apply(null, new Uint8Array(1)); } catch (__) { STR_APPLY_UIA_OK = false; }


    // Table with utf8 lengths (calculated by first byte of sequence)
    // Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
    // because max possible codepoint is 0x10ffff
    var _utf8len = new utils$h.Buf8(256);
    for (var q = 0; q < 256; q++) {
      _utf8len[q] = (q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1);
    }
    _utf8len[254] = _utf8len[254] = 1; // Invalid sequence start


    // convert string to array (typed, when possible)
    strings$2.string2buf = function (str) {
      var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

      // count binary size
      for (m_pos = 0; m_pos < str_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 0xfc00) === 0xdc00) {
            c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
            m_pos++;
          }
        }
        buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
      }

      // allocate buffer
      buf = new utils$h.Buf8(buf_len);

      // convert
      for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 0xfc00) === 0xdc00) {
            c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
            m_pos++;
          }
        }
        if (c < 0x80) {
          /* one byte */
          buf[i++] = c;
        } else if (c < 0x800) {
          /* two bytes */
          buf[i++] = 0xC0 | (c >>> 6);
          buf[i++] = 0x80 | (c & 0x3f);
        } else if (c < 0x10000) {
          /* three bytes */
          buf[i++] = 0xE0 | (c >>> 12);
          buf[i++] = 0x80 | (c >>> 6 & 0x3f);
          buf[i++] = 0x80 | (c & 0x3f);
        } else {
          /* four bytes */
          buf[i++] = 0xf0 | (c >>> 18);
          buf[i++] = 0x80 | (c >>> 12 & 0x3f);
          buf[i++] = 0x80 | (c >>> 6 & 0x3f);
          buf[i++] = 0x80 | (c & 0x3f);
        }
      }

      return buf;
    };

    // Helper (used in 2 places)
    function buf2binstring(buf, len) {
      // On Chrome, the arguments in a function call that are allowed is `65534`.
      // If the length of the buffer is smaller than that, we can use this optimization,
      // otherwise we will take a slower path.
      if (len < 65534) {
        if ((buf.subarray && STR_APPLY_UIA_OK) || (!buf.subarray && STR_APPLY_OK)) {
          return String.fromCharCode.apply(null, utils$h.shrinkBuf(buf, len));
        }
      }

      var result = '';
      for (var i = 0; i < len; i++) {
        result += String.fromCharCode(buf[i]);
      }
      return result;
    }


    // Convert byte array to binary string
    strings$2.buf2binstring = function (buf) {
      return buf2binstring(buf, buf.length);
    };


    // Convert binary string (typed, when possible)
    strings$2.binstring2buf = function (str) {
      var buf = new utils$h.Buf8(str.length);
      for (var i = 0, len = buf.length; i < len; i++) {
        buf[i] = str.charCodeAt(i);
      }
      return buf;
    };


    // convert array to string
    strings$2.buf2string = function (buf, max) {
      var i, out, c, c_len;
      var len = max || buf.length;

      // Reserve max possible length (2 words per char)
      // NB: by unknown reasons, Array is significantly faster for
      //     String.fromCharCode.apply than Uint16Array.
      var utf16buf = new Array(len * 2);

      for (out = 0, i = 0; i < len;) {
        c = buf[i++];
        // quick process ascii
        if (c < 0x80) { utf16buf[out++] = c; continue; }

        c_len = _utf8len[c];
        // skip 5 & 6 byte codes
        if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len - 1; continue; }

        // apply mask on first byte
        c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
        // join the rest
        while (c_len > 1 && i < len) {
          c = (c << 6) | (buf[i++] & 0x3f);
          c_len--;
        }

        // terminated by end of string?
        if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

        if (c < 0x10000) {
          utf16buf[out++] = c;
        } else {
          c -= 0x10000;
          utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
          utf16buf[out++] = 0xdc00 | (c & 0x3ff);
        }
      }

      return buf2binstring(utf16buf, out);
    };


    // Calculate max possible position in utf8 buffer,
    // that will not break sequence. If that's not possible
    // - (very small limits) return max size as is.
    //
    // buf[] - utf8 bytes array
    // max   - length limit (mandatory);
    strings$2.utf8border = function (buf, max) {
      var pos;

      max = max || buf.length;
      if (max > buf.length) { max = buf.length; }

      // go back from last position, until start of sequence found
      pos = max - 1;
      while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

      // Very small and broken sequence,
      // return max, because we should return something anyway.
      if (pos < 0) { return max; }

      // If we came to start of buffer - that means buffer is too small,
      // return max too.
      if (pos === 0) { return max; }

      return (pos + _utf8len[buf[pos]] > max) ? pos : max;
    };

    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    function ZStream$2() {
      /* next input byte */
      this.input = null; // JS specific, because we have no pointers
      this.next_in = 0;
      /* number of bytes available at input */
      this.avail_in = 0;
      /* total number of input bytes read so far */
      this.total_in = 0;
      /* next output byte should be put there */
      this.output = null; // JS specific, because we have no pointers
      this.next_out = 0;
      /* remaining free space at output */
      this.avail_out = 0;
      /* total number of bytes output so far */
      this.total_out = 0;
      /* last error message, NULL if no error */
      this.msg = ''/*Z_NULL*/;
      /* not visible by applications */
      this.state = null;
      /* best guess about the data type: binary or text */
      this.data_type = 2/*Z_UNKNOWN*/;
      /* adler32 value of the uncompressed data */
      this.adler = 0;
    }

    var zstream = ZStream$2;

    var zlib_deflate = deflate$3;
    var utils$g        = common;
    var strings$1      = strings$2;
    var msg$1          = messages;
    var ZStream$1      = zstream;

    var toString$2 = Object.prototype.toString;

    /* Public constants ==========================================================*/
    /* ===========================================================================*/

    var Z_NO_FLUSH      = 0;
    var Z_FINISH$1        = 4;

    var Z_OK$1            = 0;
    var Z_STREAM_END$1    = 1;
    var Z_SYNC_FLUSH    = 2;

    var Z_DEFAULT_COMPRESSION = -1;

    var Z_DEFAULT_STRATEGY    = 0;

    var Z_DEFLATED$1  = 8;

    /* ===========================================================================*/


    /**
     * class Deflate
     *
     * Generic JS-style wrapper for zlib calls. If you don't need
     * streaming behaviour - use more simple functions: [[deflate]],
     * [[deflateRaw]] and [[gzip]].
     **/

    /* internal
     * Deflate.chunks -> Array
     *
     * Chunks of output data, if [[Deflate#onData]] not overridden.
     **/

    /**
     * Deflate.result -> Uint8Array|Array
     *
     * Compressed result, generated by default [[Deflate#onData]]
     * and [[Deflate#onEnd]] handlers. Filled after you push last chunk
     * (call [[Deflate#push]] with `Z_FINISH` / `true` param)  or if you
     * push a chunk with explicit flush (call [[Deflate#push]] with
     * `Z_SYNC_FLUSH` param).
     **/

    /**
     * Deflate.err -> Number
     *
     * Error code after deflate finished. 0 (Z_OK) on success.
     * You will not need it in real life, because deflate errors
     * are possible only on wrong options or bad `onData` / `onEnd`
     * custom handlers.
     **/

    /**
     * Deflate.msg -> String
     *
     * Error message, if [[Deflate.err]] != 0
     **/


    /**
     * new Deflate(options)
     * - options (Object): zlib deflate options.
     *
     * Creates new deflator instance with specified params. Throws exception
     * on bad params. Supported options:
     *
     * - `level`
     * - `windowBits`
     * - `memLevel`
     * - `strategy`
     * - `dictionary`
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information on these.
     *
     * Additional options, for internal needs:
     *
     * - `chunkSize` - size of generated data chunks (16K by default)
     * - `raw` (Boolean) - do raw deflate
     * - `gzip` (Boolean) - create gzip wrapper
     * - `to` (String) - if equal to 'string', then result will be "binary string"
     *    (each char code [0..255])
     * - `header` (Object) - custom header for gzip
     *   - `text` (Boolean) - true if compressed data believed to be text
     *   - `time` (Number) - modification time, unix timestamp
     *   - `os` (Number) - operation system code
     *   - `extra` (Array) - array of bytes with extra data (max 65536)
     *   - `name` (String) - file name (binary string)
     *   - `comment` (String) - comment (binary string)
     *   - `hcrc` (Boolean) - true if header crc should be added
     *
     * ##### Example:
     *
     * ```javascript
     * var pako = require('pako')
     *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
     *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
     *
     * var deflate = new pako.Deflate({ level: 3});
     *
     * deflate.push(chunk1, false);
     * deflate.push(chunk2, true);  // true -> last chunk
     *
     * if (deflate.err) { throw new Error(deflate.err); }
     *
     * console.log(deflate.result);
     * ```
     **/
    function Deflate(options) {
      if (!(this instanceof Deflate)) return new Deflate(options);

      this.options = utils$g.assign({
        level: Z_DEFAULT_COMPRESSION,
        method: Z_DEFLATED$1,
        chunkSize: 16384,
        windowBits: 15,
        memLevel: 8,
        strategy: Z_DEFAULT_STRATEGY,
        to: ''
      }, options || {});

      var opt = this.options;

      if (opt.raw && (opt.windowBits > 0)) {
        opt.windowBits = -opt.windowBits;
      }

      else if (opt.gzip && (opt.windowBits > 0) && (opt.windowBits < 16)) {
        opt.windowBits += 16;
      }

      this.err    = 0;      // error code, if happens (0 = Z_OK)
      this.msg    = '';     // error message
      this.ended  = false;  // used to avoid multiple onEnd() calls
      this.chunks = [];     // chunks of compressed data

      this.strm = new ZStream$1();
      this.strm.avail_out = 0;

      var status = zlib_deflate.deflateInit2(
        this.strm,
        opt.level,
        opt.method,
        opt.windowBits,
        opt.memLevel,
        opt.strategy
      );

      if (status !== Z_OK$1) {
        throw new Error(msg$1[status]);
      }

      if (opt.header) {
        zlib_deflate.deflateSetHeader(this.strm, opt.header);
      }

      if (opt.dictionary) {
        var dict;
        // Convert data if needed
        if (typeof opt.dictionary === 'string') {
          // If we need to compress text, change encoding to utf8.
          dict = strings$1.string2buf(opt.dictionary);
        } else if (toString$2.call(opt.dictionary) === '[object ArrayBuffer]') {
          dict = new Uint8Array(opt.dictionary);
        } else {
          dict = opt.dictionary;
        }

        status = zlib_deflate.deflateSetDictionary(this.strm, dict);

        if (status !== Z_OK$1) {
          throw new Error(msg$1[status]);
        }

        this._dict_set = true;
      }
    }

    /**
     * Deflate#push(data[, mode]) -> Boolean
     * - data (Uint8Array|Array|ArrayBuffer|String): input data. Strings will be
     *   converted to utf8 byte sequence.
     * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
     *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` means Z_FINISH.
     *
     * Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
     * new compressed chunks. Returns `true` on success. The last data block must have
     * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
     * [[Deflate#onEnd]]. For interim explicit flushes (without ending the stream) you
     * can use mode Z_SYNC_FLUSH, keeping the compression context.
     *
     * On fail call [[Deflate#onEnd]] with error code and return false.
     *
     * We strongly recommend to use `Uint8Array` on input for best speed (output
     * array format is detected automatically). Also, don't skip last param and always
     * use the same type in your code (boolean or number). That will improve JS speed.
     *
     * For regular `Array`-s make sure all elements are [0..255].
     *
     * ##### Example
     *
     * ```javascript
     * push(chunk, false); // push one of data chunks
     * ...
     * push(chunk, true);  // push last chunk
     * ```
     **/
    Deflate.prototype.push = function (data, mode) {
      var strm = this.strm;
      var chunkSize = this.options.chunkSize;
      var status, _mode;

      if (this.ended) { return false; }

      _mode = (mode === ~~mode) ? mode : ((mode === true) ? Z_FINISH$1 : Z_NO_FLUSH);

      // Convert data if needed
      if (typeof data === 'string') {
        // If we need to compress text, change encoding to utf8.
        strm.input = strings$1.string2buf(data);
      } else if (toString$2.call(data) === '[object ArrayBuffer]') {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }

      strm.next_in = 0;
      strm.avail_in = strm.input.length;

      do {
        if (strm.avail_out === 0) {
          strm.output = new utils$g.Buf8(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }
        status = zlib_deflate.deflate(strm, _mode);    /* no bad return value */

        if (status !== Z_STREAM_END$1 && status !== Z_OK$1) {
          this.onEnd(status);
          this.ended = true;
          return false;
        }
        if (strm.avail_out === 0 || (strm.avail_in === 0 && (_mode === Z_FINISH$1 || _mode === Z_SYNC_FLUSH))) {
          if (this.options.to === 'string') {
            this.onData(strings$1.buf2binstring(utils$g.shrinkBuf(strm.output, strm.next_out)));
          } else {
            this.onData(utils$g.shrinkBuf(strm.output, strm.next_out));
          }
        }
      } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END$1);

      // Finalize on the last chunk.
      if (_mode === Z_FINISH$1) {
        status = zlib_deflate.deflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return status === Z_OK$1;
      }

      // callback interim results if Z_SYNC_FLUSH.
      if (_mode === Z_SYNC_FLUSH) {
        this.onEnd(Z_OK$1);
        strm.avail_out = 0;
        return true;
      }

      return true;
    };


    /**
     * Deflate#onData(chunk) -> Void
     * - chunk (Uint8Array|Array|String): output data. Type of array depends
     *   on js engine support. When string output requested, each chunk
     *   will be string.
     *
     * By default, stores data blocks in `chunks[]` property and glue
     * those in `onEnd`. Override this handler, if you need another behaviour.
     **/
    Deflate.prototype.onData = function (chunk) {
      this.chunks.push(chunk);
    };


    /**
     * Deflate#onEnd(status) -> Void
     * - status (Number): deflate status. 0 (Z_OK) on success,
     *   other if not.
     *
     * Called once after you tell deflate that the input stream is
     * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
     * or if an error happened. By default - join collected chunks,
     * free memory and fill `results` / `err` properties.
     **/
    Deflate.prototype.onEnd = function (status) {
      // On success - join
      if (status === Z_OK$1) {
        if (this.options.to === 'string') {
          this.result = this.chunks.join('');
        } else {
          this.result = utils$g.flattenChunks(this.chunks);
        }
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };


    /**
     * deflate(data[, options]) -> Uint8Array|Array|String
     * - data (Uint8Array|Array|String): input data to compress.
     * - options (Object): zlib deflate options.
     *
     * Compress `data` with deflate algorithm and `options`.
     *
     * Supported options are:
     *
     * - level
     * - windowBits
     * - memLevel
     * - strategy
     * - dictionary
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information on these.
     *
     * Sugar (options):
     *
     * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
     *   negative windowBits implicitly.
     * - `to` (String) - if equal to 'string', then result will be "binary string"
     *    (each char code [0..255])
     *
     * ##### Example:
     *
     * ```javascript
     * var pako = require('pako')
     *   , data = Uint8Array([1,2,3,4,5,6,7,8,9]);
     *
     * console.log(pako.deflate(data));
     * ```
     **/
    function deflate$1(input, options) {
      var deflator = new Deflate(options);

      deflator.push(input, true);

      // That will never happens, if you don't cheat with options :)
      if (deflator.err) { throw deflator.msg || msg$1[deflator.err]; }

      return deflator.result;
    }


    /**
     * deflateRaw(data[, options]) -> Uint8Array|Array|String
     * - data (Uint8Array|Array|String): input data to compress.
     * - options (Object): zlib deflate options.
     *
     * The same as [[deflate]], but creates raw data, without wrapper
     * (header and adler32 crc).
     **/
    function deflateRaw(input, options) {
      options = options || {};
      options.raw = true;
      return deflate$1(input, options);
    }


    /**
     * gzip(data[, options]) -> Uint8Array|Array|String
     * - data (Uint8Array|Array|String): input data to compress.
     * - options (Object): zlib deflate options.
     *
     * The same as [[deflate]], but create gzip wrapper instead of
     * deflate one.
     **/
    function gzip(input, options) {
      options = options || {};
      options.gzip = true;
      return deflate$1(input, options);
    }


    deflate$4.Deflate = Deflate;
    deflate$4.deflate = deflate$1;
    deflate$4.deflateRaw = deflateRaw;
    deflate$4.gzip = gzip;

    var inflate$4 = {};

    var inflate$3 = {};

    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    // See state defs from inflate.js
    var BAD$1 = 30;       /* got a data error -- remain here until reset */
    var TYPE$1 = 12;      /* i: waiting for type bits, including last-flag bit */

    /*
       Decode literal, length, and distance codes and write out the resulting
       literal and match bytes until either not enough input or output is
       available, an end-of-block is encountered, or a data error is encountered.
       When large enough input and output buffers are supplied to inflate(), for
       example, a 16K input buffer and a 64K output buffer, more than 95% of the
       inflate execution time is spent in this routine.

       Entry assumptions:

            state.mode === LEN
            strm.avail_in >= 6
            strm.avail_out >= 258
            start >= strm.avail_out
            state.bits < 8

       On return, state.mode is one of:

            LEN -- ran out of enough output space or enough available input
            TYPE -- reached end of block code, inflate() to interpret next block
            BAD -- error in block data

       Notes:

        - The maximum input bits used by a length/distance pair is 15 bits for the
          length code, 5 bits for the length extra, 15 bits for the distance code,
          and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
          Therefore if strm.avail_in >= 6, then there is enough input to avoid
          checking for available input while decoding.

        - The maximum bytes that a single length/distance pair can output is 258
          bytes, which is the maximum length that can be coded.  inflate_fast()
          requires strm.avail_out >= 258 for each loop to avoid checking for
          output space.
     */
    var inffast = function inflate_fast(strm, start) {
      var state;
      var _in;                    /* local strm.input */
      var last;                   /* have enough input while in < last */
      var _out;                   /* local strm.output */
      var beg;                    /* inflate()'s initial strm.output */
      var end;                    /* while out < end, enough space available */
    //#ifdef INFLATE_STRICT
      var dmax;                   /* maximum distance from zlib header */
    //#endif
      var wsize;                  /* window size or zero if not using window */
      var whave;                  /* valid bytes in the window */
      var wnext;                  /* window write index */
      // Use `s_window` instead `window`, avoid conflict with instrumentation tools
      var s_window;               /* allocated sliding window, if wsize != 0 */
      var hold;                   /* local strm.hold */
      var bits;                   /* local strm.bits */
      var lcode;                  /* local strm.lencode */
      var dcode;                  /* local strm.distcode */
      var lmask;                  /* mask for first level of length codes */
      var dmask;                  /* mask for first level of distance codes */
      var here;                   /* retrieved table entry */
      var op;                     /* code bits, operation, extra bits, or */
                                  /*  window position, window bytes to copy */
      var len;                    /* match length, unused bytes */
      var dist;                   /* match distance */
      var from;                   /* where to copy match from */
      var from_source;


      var input, output; // JS specific, because we have no pointers

      /* copy state to local variables */
      state = strm.state;
      //here = state.here;
      _in = strm.next_in;
      input = strm.input;
      last = _in + (strm.avail_in - 5);
      _out = strm.next_out;
      output = strm.output;
      beg = _out - (start - strm.avail_out);
      end = _out + (strm.avail_out - 257);
    //#ifdef INFLATE_STRICT
      dmax = state.dmax;
    //#endif
      wsize = state.wsize;
      whave = state.whave;
      wnext = state.wnext;
      s_window = state.window;
      hold = state.hold;
      bits = state.bits;
      lcode = state.lencode;
      dcode = state.distcode;
      lmask = (1 << state.lenbits) - 1;
      dmask = (1 << state.distbits) - 1;


      /* decode literals and length/distances until end-of-block or not enough
         input data or output space */

      top:
      do {
        if (bits < 15) {
          hold += input[_in++] << bits;
          bits += 8;
          hold += input[_in++] << bits;
          bits += 8;
        }

        here = lcode[hold & lmask];

        dolen:
        for (;;) { // Goto emulation
          op = here >>> 24/*here.bits*/;
          hold >>>= op;
          bits -= op;
          op = (here >>> 16) & 0xff/*here.op*/;
          if (op === 0) {                          /* literal */
            //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
            //        "inflate:         literal '%c'\n" :
            //        "inflate:         literal 0x%02x\n", here.val));
            output[_out++] = here & 0xffff/*here.val*/;
          }
          else if (op & 16) {                     /* length base */
            len = here & 0xffff/*here.val*/;
            op &= 15;                           /* number of extra bits */
            if (op) {
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
              }
              len += hold & ((1 << op) - 1);
              hold >>>= op;
              bits -= op;
            }
            //Tracevv((stderr, "inflate:         length %u\n", len));
            if (bits < 15) {
              hold += input[_in++] << bits;
              bits += 8;
              hold += input[_in++] << bits;
              bits += 8;
            }
            here = dcode[hold & dmask];

            dodist:
            for (;;) { // goto emulation
              op = here >>> 24/*here.bits*/;
              hold >>>= op;
              bits -= op;
              op = (here >>> 16) & 0xff/*here.op*/;

              if (op & 16) {                      /* distance base */
                dist = here & 0xffff/*here.val*/;
                op &= 15;                       /* number of extra bits */
                if (bits < op) {
                  hold += input[_in++] << bits;
                  bits += 8;
                  if (bits < op) {
                    hold += input[_in++] << bits;
                    bits += 8;
                  }
                }
                dist += hold & ((1 << op) - 1);
    //#ifdef INFLATE_STRICT
                if (dist > dmax) {
                  strm.msg = 'invalid distance too far back';
                  state.mode = BAD$1;
                  break top;
                }
    //#endif
                hold >>>= op;
                bits -= op;
                //Tracevv((stderr, "inflate:         distance %u\n", dist));
                op = _out - beg;                /* max distance in output */
                if (dist > op) {                /* see if copy from window */
                  op = dist - op;               /* distance back in window */
                  if (op > whave) {
                    if (state.sane) {
                      strm.msg = 'invalid distance too far back';
                      state.mode = BAD$1;
                      break top;
                    }

    // (!) This block is disabled in zlib defaults,
    // don't enable it for binary compatibility
    //#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
    //                if (len <= op - whave) {
    //                  do {
    //                    output[_out++] = 0;
    //                  } while (--len);
    //                  continue top;
    //                }
    //                len -= op - whave;
    //                do {
    //                  output[_out++] = 0;
    //                } while (--op > whave);
    //                if (op === 0) {
    //                  from = _out - dist;
    //                  do {
    //                    output[_out++] = output[from++];
    //                  } while (--len);
    //                  continue top;
    //                }
    //#endif
                  }
                  from = 0; // window index
                  from_source = s_window;
                  if (wnext === 0) {           /* very common case */
                    from += wsize - op;
                    if (op < len) {         /* some from window */
                      len -= op;
                      do {
                        output[_out++] = s_window[from++];
                      } while (--op);
                      from = _out - dist;  /* rest from output */
                      from_source = output;
                    }
                  }
                  else if (wnext < op) {      /* wrap around window */
                    from += wsize + wnext - op;
                    op -= wnext;
                    if (op < len) {         /* some from end of window */
                      len -= op;
                      do {
                        output[_out++] = s_window[from++];
                      } while (--op);
                      from = 0;
                      if (wnext < len) {  /* some from start of window */
                        op = wnext;
                        len -= op;
                        do {
                          output[_out++] = s_window[from++];
                        } while (--op);
                        from = _out - dist;      /* rest from output */
                        from_source = output;
                      }
                    }
                  }
                  else {                      /* contiguous in window */
                    from += wnext - op;
                    if (op < len) {         /* some from window */
                      len -= op;
                      do {
                        output[_out++] = s_window[from++];
                      } while (--op);
                      from = _out - dist;  /* rest from output */
                      from_source = output;
                    }
                  }
                  while (len > 2) {
                    output[_out++] = from_source[from++];
                    output[_out++] = from_source[from++];
                    output[_out++] = from_source[from++];
                    len -= 3;
                  }
                  if (len) {
                    output[_out++] = from_source[from++];
                    if (len > 1) {
                      output[_out++] = from_source[from++];
                    }
                  }
                }
                else {
                  from = _out - dist;          /* copy direct from output */
                  do {                        /* minimum length is three */
                    output[_out++] = output[from++];
                    output[_out++] = output[from++];
                    output[_out++] = output[from++];
                    len -= 3;
                  } while (len > 2);
                  if (len) {
                    output[_out++] = output[from++];
                    if (len > 1) {
                      output[_out++] = output[from++];
                    }
                  }
                }
              }
              else if ((op & 64) === 0) {          /* 2nd level distance code */
                here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
                continue dodist;
              }
              else {
                strm.msg = 'invalid distance code';
                state.mode = BAD$1;
                break top;
              }

              break; // need to emulate goto via "continue"
            }
          }
          else if ((op & 64) === 0) {              /* 2nd level length code */
            here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
            continue dolen;
          }
          else if (op & 32) {                     /* end-of-block */
            //Tracevv((stderr, "inflate:         end of block\n"));
            state.mode = TYPE$1;
            break top;
          }
          else {
            strm.msg = 'invalid literal/length code';
            state.mode = BAD$1;
            break top;
          }

          break; // need to emulate goto via "continue"
        }
      } while (_in < last && _out < end);

      /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
      len = bits >> 3;
      _in -= len;
      bits -= len << 3;
      hold &= (1 << bits) - 1;

      /* update state and return */
      strm.next_in = _in;
      strm.next_out = _out;
      strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
      strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
      state.hold = hold;
      state.bits = bits;
      return;
    };

    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    var utils$f = common;

    var MAXBITS = 15;
    var ENOUGH_LENS$1 = 852;
    var ENOUGH_DISTS$1 = 592;
    //var ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

    var CODES$1 = 0;
    var LENS$1 = 1;
    var DISTS$1 = 2;

    var lbase = [ /* Length codes 257..285 base */
      3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
      35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
    ];

    var lext = [ /* Length codes 257..285 extra */
      16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
      19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
    ];

    var dbase = [ /* Distance codes 0..29 base */
      1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
      257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
      8193, 12289, 16385, 24577, 0, 0
    ];

    var dext = [ /* Distance codes 0..29 extra */
      16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
      23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
      28, 28, 29, 29, 64, 64
    ];

    var inftrees = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts)
    {
      var bits = opts.bits;
          //here = opts.here; /* table entry for duplication */

      var len = 0;               /* a code's length in bits */
      var sym = 0;               /* index of code symbols */
      var min = 0, max = 0;          /* minimum and maximum code lengths */
      var root = 0;              /* number of index bits for root table */
      var curr = 0;              /* number of index bits for current table */
      var drop = 0;              /* code bits to drop for sub-table */
      var left = 0;                   /* number of prefix codes available */
      var used = 0;              /* code entries in table used */
      var huff = 0;              /* Huffman code */
      var incr;              /* for incrementing code, index */
      var fill;              /* index for replicating entries */
      var low;               /* low bits for current root entry */
      var mask;              /* mask for low root bits */
      var next;             /* next available space in table */
      var base = null;     /* base value table to use */
      var base_index = 0;
    //  var shoextra;    /* extra bits table to use */
      var end;                    /* use base and extra for symbol > end */
      var count = new utils$f.Buf16(MAXBITS + 1); //[MAXBITS+1];    /* number of codes of each length */
      var offs = new utils$f.Buf16(MAXBITS + 1); //[MAXBITS+1];     /* offsets in table for each length */
      var extra = null;
      var extra_index = 0;

      var here_bits, here_op, here_val;

      /*
       Process a set of code lengths to create a canonical Huffman code.  The
       code lengths are lens[0..codes-1].  Each length corresponds to the
       symbols 0..codes-1.  The Huffman code is generated by first sorting the
       symbols by length from short to long, and retaining the symbol order
       for codes with equal lengths.  Then the code starts with all zero bits
       for the first code of the shortest length, and the codes are integer
       increments for the same length, and zeros are appended as the length
       increases.  For the deflate format, these bits are stored backwards
       from their more natural integer increment ordering, and so when the
       decoding tables are built in the large loop below, the integer codes
       are incremented backwards.

       This routine assumes, but does not check, that all of the entries in
       lens[] are in the range 0..MAXBITS.  The caller must assure this.
       1..MAXBITS is interpreted as that code length.  zero means that that
       symbol does not occur in this code.

       The codes are sorted by computing a count of codes for each length,
       creating from that a table of starting indices for each length in the
       sorted table, and then entering the symbols in order in the sorted
       table.  The sorted table is work[], with that space being provided by
       the caller.

       The length counts are used for other purposes as well, i.e. finding
       the minimum and maximum length codes, determining if there are any
       codes at all, checking for a valid set of lengths, and looking ahead
       at length counts to determine sub-table sizes when building the
       decoding tables.
       */

      /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
      for (len = 0; len <= MAXBITS; len++) {
        count[len] = 0;
      }
      for (sym = 0; sym < codes; sym++) {
        count[lens[lens_index + sym]]++;
      }

      /* bound code lengths, force root to be within code lengths */
      root = bits;
      for (max = MAXBITS; max >= 1; max--) {
        if (count[max] !== 0) { break; }
      }
      if (root > max) {
        root = max;
      }
      if (max === 0) {                     /* no symbols to code at all */
        //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
        //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
        //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
        table[table_index++] = (1 << 24) | (64 << 16) | 0;


        //table.op[opts.table_index] = 64;
        //table.bits[opts.table_index] = 1;
        //table.val[opts.table_index++] = 0;
        table[table_index++] = (1 << 24) | (64 << 16) | 0;

        opts.bits = 1;
        return 0;     /* no symbols, but wait for decoding to report error */
      }
      for (min = 1; min < max; min++) {
        if (count[min] !== 0) { break; }
      }
      if (root < min) {
        root = min;
      }

      /* check for an over-subscribed or incomplete set of lengths */
      left = 1;
      for (len = 1; len <= MAXBITS; len++) {
        left <<= 1;
        left -= count[len];
        if (left < 0) {
          return -1;
        }        /* over-subscribed */
      }
      if (left > 0 && (type === CODES$1 || max !== 1)) {
        return -1;                      /* incomplete set */
      }

      /* generate offsets into symbol table for each length for sorting */
      offs[1] = 0;
      for (len = 1; len < MAXBITS; len++) {
        offs[len + 1] = offs[len] + count[len];
      }

      /* sort symbols by length, by symbol order within each length */
      for (sym = 0; sym < codes; sym++) {
        if (lens[lens_index + sym] !== 0) {
          work[offs[lens[lens_index + sym]]++] = sym;
        }
      }

      /*
       Create and fill in decoding tables.  In this loop, the table being
       filled is at next and has curr index bits.  The code being used is huff
       with length len.  That code is converted to an index by dropping drop
       bits off of the bottom.  For codes where len is less than drop + curr,
       those top drop + curr - len bits are incremented through all values to
       fill the table with replicated entries.

       root is the number of index bits for the root table.  When len exceeds
       root, sub-tables are created pointed to by the root entry with an index
       of the low root bits of huff.  This is saved in low to check for when a
       new sub-table should be started.  drop is zero when the root table is
       being filled, and drop is root when sub-tables are being filled.

       When a new sub-table is needed, it is necessary to look ahead in the
       code lengths to determine what size sub-table is needed.  The length
       counts are used for this, and so count[] is decremented as codes are
       entered in the tables.

       used keeps track of how many table entries have been allocated from the
       provided *table space.  It is checked for LENS and DIST tables against
       the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
       the initial root table size constants.  See the comments in inftrees.h
       for more information.

       sym increments through all symbols, and the loop terminates when
       all codes of length max, i.e. all codes, have been processed.  This
       routine permits incomplete codes, so another loop after this one fills
       in the rest of the decoding tables with invalid code markers.
       */

      /* set up for code type */
      // poor man optimization - use if-else instead of switch,
      // to avoid deopts in old v8
      if (type === CODES$1) {
        base = extra = work;    /* dummy value--not used */
        end = 19;

      } else if (type === LENS$1) {
        base = lbase;
        base_index -= 257;
        extra = lext;
        extra_index -= 257;
        end = 256;

      } else {                    /* DISTS */
        base = dbase;
        extra = dext;
        end = -1;
      }

      /* initialize opts for loop */
      huff = 0;                   /* starting code */
      sym = 0;                    /* starting code symbol */
      len = min;                  /* starting code length */
      next = table_index;              /* current table to fill in */
      curr = root;                /* current table index bits */
      drop = 0;                   /* current bits to drop from code for index */
      low = -1;                   /* trigger new sub-table when len > root */
      used = 1 << root;          /* use root table entries */
      mask = used - 1;            /* mask for comparing low */

      /* check available table space */
      if ((type === LENS$1 && used > ENOUGH_LENS$1) ||
        (type === DISTS$1 && used > ENOUGH_DISTS$1)) {
        return 1;
      }

      /* process all codes and make table entries */
      for (;;) {
        /* create table entry */
        here_bits = len - drop;
        if (work[sym] < end) {
          here_op = 0;
          here_val = work[sym];
        }
        else if (work[sym] > end) {
          here_op = extra[extra_index + work[sym]];
          here_val = base[base_index + work[sym]];
        }
        else {
          here_op = 32 + 64;         /* end of block */
          here_val = 0;
        }

        /* replicate for those indices with low len bits equal to huff */
        incr = 1 << (len - drop);
        fill = 1 << curr;
        min = fill;                 /* save offset to next table */
        do {
          fill -= incr;
          table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val |0;
        } while (fill !== 0);

        /* backwards increment the len-bit code huff */
        incr = 1 << (len - 1);
        while (huff & incr) {
          incr >>= 1;
        }
        if (incr !== 0) {
          huff &= incr - 1;
          huff += incr;
        } else {
          huff = 0;
        }

        /* go to next symbol, update count, len */
        sym++;
        if (--count[len] === 0) {
          if (len === max) { break; }
          len = lens[lens_index + work[sym]];
        }

        /* create new sub-table if needed */
        if (len > root && (huff & mask) !== low) {
          /* if first time, transition to sub-tables */
          if (drop === 0) {
            drop = root;
          }

          /* increment past last table */
          next += min;            /* here min is 1 << curr */

          /* determine length of next table */
          curr = len - drop;
          left = 1 << curr;
          while (curr + drop < max) {
            left -= count[curr + drop];
            if (left <= 0) { break; }
            curr++;
            left <<= 1;
          }

          /* check for enough space */
          used += 1 << curr;
          if ((type === LENS$1 && used > ENOUGH_LENS$1) ||
            (type === DISTS$1 && used > ENOUGH_DISTS$1)) {
            return 1;
          }

          /* point entry in root table to sub-table */
          low = huff & mask;
          /*table.op[low] = curr;
          table.bits[low] = root;
          table.val[low] = next - opts.table_index;*/
          table[low] = (root << 24) | (curr << 16) | (next - table_index) |0;
        }
      }

      /* fill in remaining table entry if code is incomplete (guaranteed to have
       at most one remaining entry, since if the code is incomplete, the
       maximum code length that was allowed to get this far is one bit) */
      if (huff !== 0) {
        //table.op[next + huff] = 64;            /* invalid code marker */
        //table.bits[next + huff] = len - drop;
        //table.val[next + huff] = 0;
        table[next + huff] = ((len - drop) << 24) | (64 << 16) |0;
      }

      /* set return parameters */
      //opts.table_index += used;
      opts.bits = root;
      return 0;
    };

    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    var utils$e         = common;
    var adler32       = adler32_1;
    var crc32$1         = crc32_1;
    var inflate_fast  = inffast;
    var inflate_table = inftrees;

    var CODES = 0;
    var LENS = 1;
    var DISTS = 2;

    /* Public constants ==========================================================*/
    /* ===========================================================================*/


    /* Allowed flush values; see deflate() and inflate() below for details */
    //var Z_NO_FLUSH      = 0;
    //var Z_PARTIAL_FLUSH = 1;
    //var Z_SYNC_FLUSH    = 2;
    //var Z_FULL_FLUSH    = 3;
    var Z_FINISH        = 4;
    var Z_BLOCK         = 5;
    var Z_TREES         = 6;


    /* Return codes for the compression/decompression functions. Negative values
     * are errors, positive values are used for special but normal events.
     */
    var Z_OK            = 0;
    var Z_STREAM_END    = 1;
    var Z_NEED_DICT     = 2;
    //var Z_ERRNO         = -1;
    var Z_STREAM_ERROR  = -2;
    var Z_DATA_ERROR    = -3;
    var Z_MEM_ERROR     = -4;
    var Z_BUF_ERROR     = -5;
    //var Z_VERSION_ERROR = -6;

    /* The deflate compression method */
    var Z_DEFLATED  = 8;


    /* STATES ====================================================================*/
    /* ===========================================================================*/


    var    HEAD = 1;       /* i: waiting for magic header */
    var    FLAGS = 2;      /* i: waiting for method and flags (gzip) */
    var    TIME = 3;       /* i: waiting for modification time (gzip) */
    var    OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
    var    EXLEN = 5;      /* i: waiting for extra length (gzip) */
    var    EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
    var    NAME = 7;       /* i: waiting for end of file name (gzip) */
    var    COMMENT = 8;    /* i: waiting for end of comment (gzip) */
    var    HCRC = 9;       /* i: waiting for header crc (gzip) */
    var    DICTID = 10;    /* i: waiting for dictionary check value */
    var    DICT = 11;      /* waiting for inflateSetDictionary() call */
    var        TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
    var        TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
    var        STORED = 14;    /* i: waiting for stored size (length and complement) */
    var        COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
    var        COPY = 16;      /* i/o: waiting for input or output to copy stored block */
    var        TABLE = 17;     /* i: waiting for dynamic block table lengths */
    var        LENLENS = 18;   /* i: waiting for code length code lengths */
    var        CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
    var            LEN_ = 20;      /* i: same as LEN below, but only first time in */
    var            LEN = 21;       /* i: waiting for length/lit/eob code */
    var            LENEXT = 22;    /* i: waiting for length extra bits */
    var            DIST = 23;      /* i: waiting for distance code */
    var            DISTEXT = 24;   /* i: waiting for distance extra bits */
    var            MATCH = 25;     /* o: waiting for output space to copy string */
    var            LIT = 26;       /* o: waiting for output space to write literal */
    var    CHECK = 27;     /* i: waiting for 32-bit check value */
    var    LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
    var    DONE = 29;      /* finished check, done -- remain here until reset */
    var    BAD = 30;       /* got a data error -- remain here until reset */
    var    MEM = 31;       /* got an inflate() memory error -- remain here until reset */
    var    SYNC = 32;      /* looking for synchronization bytes to restart inflate() */

    /* ===========================================================================*/



    var ENOUGH_LENS = 852;
    var ENOUGH_DISTS = 592;
    //var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

    var MAX_WBITS = 15;
    /* 32K LZ77 window */
    var DEF_WBITS = MAX_WBITS;


    function zswap32(q) {
      return  (((q >>> 24) & 0xff) +
              ((q >>> 8) & 0xff00) +
              ((q & 0xff00) << 8) +
              ((q & 0xff) << 24));
    }


    function InflateState() {
      this.mode = 0;             /* current inflate mode */
      this.last = false;          /* true if processing last block */
      this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
      this.havedict = false;      /* true if dictionary provided */
      this.flags = 0;             /* gzip header method and flags (0 if zlib) */
      this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
      this.check = 0;             /* protected copy of check value */
      this.total = 0;             /* protected copy of output count */
      // TODO: may be {}
      this.head = null;           /* where to save gzip header information */

      /* sliding window */
      this.wbits = 0;             /* log base 2 of requested window size */
      this.wsize = 0;             /* window size or zero if not using window */
      this.whave = 0;             /* valid bytes in the window */
      this.wnext = 0;             /* window write index */
      this.window = null;         /* allocated sliding window, if needed */

      /* bit accumulator */
      this.hold = 0;              /* input bit accumulator */
      this.bits = 0;              /* number of bits in "in" */

      /* for string and stored block copying */
      this.length = 0;            /* literal or length of data to copy */
      this.offset = 0;            /* distance back to copy string from */

      /* for table and code decoding */
      this.extra = 0;             /* extra bits needed */

      /* fixed and dynamic code tables */
      this.lencode = null;          /* starting table for length/literal codes */
      this.distcode = null;         /* starting table for distance codes */
      this.lenbits = 0;           /* index bits for lencode */
      this.distbits = 0;          /* index bits for distcode */

      /* dynamic table building */
      this.ncode = 0;             /* number of code length code lengths */
      this.nlen = 0;              /* number of length code lengths */
      this.ndist = 0;             /* number of distance code lengths */
      this.have = 0;              /* number of code lengths in lens[] */
      this.next = null;              /* next available space in codes[] */

      this.lens = new utils$e.Buf16(320); /* temporary storage for code lengths */
      this.work = new utils$e.Buf16(288); /* work area for code table building */

      /*
       because we don't have pointers in js, we use lencode and distcode directly
       as buffers so we don't need codes
      */
      //this.codes = new utils.Buf32(ENOUGH);       /* space for code tables */
      this.lendyn = null;              /* dynamic table for length/literal codes (JS specific) */
      this.distdyn = null;             /* dynamic table for distance codes (JS specific) */
      this.sane = 0;                   /* if false, allow invalid distance too far */
      this.back = 0;                   /* bits back of last unprocessed length/lit */
      this.was = 0;                    /* initial length of match */
    }

    function inflateResetKeep(strm) {
      var state;

      if (!strm || !strm.state) { return Z_STREAM_ERROR; }
      state = strm.state;
      strm.total_in = strm.total_out = state.total = 0;
      strm.msg = ''; /*Z_NULL*/
      if (state.wrap) {       /* to support ill-conceived Java test suite */
        strm.adler = state.wrap & 1;
      }
      state.mode = HEAD;
      state.last = 0;
      state.havedict = 0;
      state.dmax = 32768;
      state.head = null/*Z_NULL*/;
      state.hold = 0;
      state.bits = 0;
      //state.lencode = state.distcode = state.next = state.codes;
      state.lencode = state.lendyn = new utils$e.Buf32(ENOUGH_LENS);
      state.distcode = state.distdyn = new utils$e.Buf32(ENOUGH_DISTS);

      state.sane = 1;
      state.back = -1;
      //Tracev((stderr, "inflate: reset\n"));
      return Z_OK;
    }

    function inflateReset(strm) {
      var state;

      if (!strm || !strm.state) { return Z_STREAM_ERROR; }
      state = strm.state;
      state.wsize = 0;
      state.whave = 0;
      state.wnext = 0;
      return inflateResetKeep(strm);

    }

    function inflateReset2(strm, windowBits) {
      var wrap;
      var state;

      /* get the state */
      if (!strm || !strm.state) { return Z_STREAM_ERROR; }
      state = strm.state;

      /* extract wrap request from windowBits parameter */
      if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
      }
      else {
        wrap = (windowBits >> 4) + 1;
        if (windowBits < 48) {
          windowBits &= 15;
        }
      }

      /* set number of window bits, free window if different */
      if (windowBits && (windowBits < 8 || windowBits > 15)) {
        return Z_STREAM_ERROR;
      }
      if (state.window !== null && state.wbits !== windowBits) {
        state.window = null;
      }

      /* update state and reset the rest of it */
      state.wrap = wrap;
      state.wbits = windowBits;
      return inflateReset(strm);
    }

    function inflateInit2(strm, windowBits) {
      var ret;
      var state;

      if (!strm) { return Z_STREAM_ERROR; }
      //strm.msg = Z_NULL;                 /* in case we return an error */

      state = new InflateState();

      //if (state === Z_NULL) return Z_MEM_ERROR;
      //Tracev((stderr, "inflate: allocated\n"));
      strm.state = state;
      state.window = null/*Z_NULL*/;
      ret = inflateReset2(strm, windowBits);
      if (ret !== Z_OK) {
        strm.state = null/*Z_NULL*/;
      }
      return ret;
    }

    function inflateInit(strm) {
      return inflateInit2(strm, DEF_WBITS);
    }


    /*
     Return state with length and distance decoding tables and index sizes set to
     fixed code decoding.  Normally this returns fixed tables from inffixed.h.
     If BUILDFIXED is defined, then instead this routine builds the tables the
     first time it's called, and returns those tables the first time and
     thereafter.  This reduces the size of the code by about 2K bytes, in
     exchange for a little execution time.  However, BUILDFIXED should not be
     used for threaded applications, since the rewriting of the tables and virgin
     may not be thread-safe.
     */
    var virgin = true;

    var lenfix, distfix; // We have no pointers in JS, so keep tables separate

    function fixedtables(state) {
      /* build fixed huffman tables if first call (may not be thread safe) */
      if (virgin) {
        var sym;

        lenfix = new utils$e.Buf32(512);
        distfix = new utils$e.Buf32(32);

        /* literal/length table */
        sym = 0;
        while (sym < 144) { state.lens[sym++] = 8; }
        while (sym < 256) { state.lens[sym++] = 9; }
        while (sym < 280) { state.lens[sym++] = 7; }
        while (sym < 288) { state.lens[sym++] = 8; }

        inflate_table(LENS,  state.lens, 0, 288, lenfix,   0, state.work, { bits: 9 });

        /* distance table */
        sym = 0;
        while (sym < 32) { state.lens[sym++] = 5; }

        inflate_table(DISTS, state.lens, 0, 32,   distfix, 0, state.work, { bits: 5 });

        /* do this just once */
        virgin = false;
      }

      state.lencode = lenfix;
      state.lenbits = 9;
      state.distcode = distfix;
      state.distbits = 5;
    }


    /*
     Update the window with the last wsize (normally 32K) bytes written before
     returning.  If window does not exist yet, create it.  This is only called
     when a window is already in use, or when output has been written during this
     inflate call, but the end of the deflate stream has not been reached yet.
     It is also called to create a window for dictionary data when a dictionary
     is loaded.

     Providing output buffers larger than 32K to inflate() should provide a speed
     advantage, since only the last 32K of output is copied to the sliding window
     upon return from inflate(), and since all distances after the first 32K of
     output will fall in the output data, making match copies simpler and faster.
     The advantage may be dependent on the size of the processor's data caches.
     */
    function updatewindow(strm, src, end, copy) {
      var dist;
      var state = strm.state;

      /* if it hasn't been done already, allocate space for the window */
      if (state.window === null) {
        state.wsize = 1 << state.wbits;
        state.wnext = 0;
        state.whave = 0;

        state.window = new utils$e.Buf8(state.wsize);
      }

      /* copy state->wsize or less output bytes into the circular window */
      if (copy >= state.wsize) {
        utils$e.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
        state.wnext = 0;
        state.whave = state.wsize;
      }
      else {
        dist = state.wsize - state.wnext;
        if (dist > copy) {
          dist = copy;
        }
        //zmemcpy(state->window + state->wnext, end - copy, dist);
        utils$e.arraySet(state.window, src, end - copy, dist, state.wnext);
        copy -= dist;
        if (copy) {
          //zmemcpy(state->window, end - copy, copy);
          utils$e.arraySet(state.window, src, end - copy, copy, 0);
          state.wnext = copy;
          state.whave = state.wsize;
        }
        else {
          state.wnext += dist;
          if (state.wnext === state.wsize) { state.wnext = 0; }
          if (state.whave < state.wsize) { state.whave += dist; }
        }
      }
      return 0;
    }

    function inflate$2(strm, flush) {
      var state;
      var input, output;          // input/output buffers
      var next;                   /* next input INDEX */
      var put;                    /* next output INDEX */
      var have, left;             /* available input and output */
      var hold;                   /* bit buffer */
      var bits;                   /* bits in bit buffer */
      var _in, _out;              /* save starting available input and output */
      var copy;                   /* number of stored or match bytes to copy */
      var from;                   /* where to copy match bytes from */
      var from_source;
      var here = 0;               /* current decoding table entry */
      var here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
      //var last;                   /* parent table entry */
      var last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
      var len;                    /* length to copy for repeats, bits to drop */
      var ret;                    /* return code */
      var hbuf = new utils$e.Buf8(4);    /* buffer for gzip header crc calculation */
      var opts;

      var n; // temporary var for NEED_BITS

      var order = /* permutation of code lengths */
        [ 16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 ];


      if (!strm || !strm.state || !strm.output ||
          (!strm.input && strm.avail_in !== 0)) {
        return Z_STREAM_ERROR;
      }

      state = strm.state;
      if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */


      //--- LOAD() ---
      put = strm.next_out;
      output = strm.output;
      left = strm.avail_out;
      next = strm.next_in;
      input = strm.input;
      have = strm.avail_in;
      hold = state.hold;
      bits = state.bits;
      //---

      _in = have;
      _out = left;
      ret = Z_OK;

      inf_leave: // goto emulation
      for (;;) {
        switch (state.mode) {
          case HEAD:
            if (state.wrap === 0) {
              state.mode = TYPEDO;
              break;
            }
            //=== NEEDBITS(16);
            while (bits < 16) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
              state.check = 0/*crc32(0L, Z_NULL, 0)*/;
              //=== CRC2(state.check, hold);
              hbuf[0] = hold & 0xff;
              hbuf[1] = (hold >>> 8) & 0xff;
              state.check = crc32$1(state.check, hbuf, 2, 0);
              //===//

              //=== INITBITS();
              hold = 0;
              bits = 0;
              //===//
              state.mode = FLAGS;
              break;
            }
            state.flags = 0;           /* expect zlib header */
            if (state.head) {
              state.head.done = false;
            }
            if (!(state.wrap & 1) ||   /* check if zlib header allowed */
              (((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
              strm.msg = 'incorrect header check';
              state.mode = BAD;
              break;
            }
            if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED) {
              strm.msg = 'unknown compression method';
              state.mode = BAD;
              break;
            }
            //--- DROPBITS(4) ---//
            hold >>>= 4;
            bits -= 4;
            //---//
            len = (hold & 0x0f)/*BITS(4)*/ + 8;
            if (state.wbits === 0) {
              state.wbits = len;
            }
            else if (len > state.wbits) {
              strm.msg = 'invalid window size';
              state.mode = BAD;
              break;
            }
            state.dmax = 1 << len;
            //Tracev((stderr, "inflate:   zlib header ok\n"));
            strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
            state.mode = hold & 0x200 ? DICTID : TYPE;
            //=== INITBITS();
            hold = 0;
            bits = 0;
            //===//
            break;
          case FLAGS:
            //=== NEEDBITS(16); */
            while (bits < 16) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            state.flags = hold;
            if ((state.flags & 0xff) !== Z_DEFLATED) {
              strm.msg = 'unknown compression method';
              state.mode = BAD;
              break;
            }
            if (state.flags & 0xe000) {
              strm.msg = 'unknown header flags set';
              state.mode = BAD;
              break;
            }
            if (state.head) {
              state.head.text = ((hold >> 8) & 1);
            }
            if (state.flags & 0x0200) {
              //=== CRC2(state.check, hold);
              hbuf[0] = hold & 0xff;
              hbuf[1] = (hold >>> 8) & 0xff;
              state.check = crc32$1(state.check, hbuf, 2, 0);
              //===//
            }
            //=== INITBITS();
            hold = 0;
            bits = 0;
            //===//
            state.mode = TIME;
            /* falls through */
          case TIME:
            //=== NEEDBITS(32); */
            while (bits < 32) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            if (state.head) {
              state.head.time = hold;
            }
            if (state.flags & 0x0200) {
              //=== CRC4(state.check, hold)
              hbuf[0] = hold & 0xff;
              hbuf[1] = (hold >>> 8) & 0xff;
              hbuf[2] = (hold >>> 16) & 0xff;
              hbuf[3] = (hold >>> 24) & 0xff;
              state.check = crc32$1(state.check, hbuf, 4, 0);
              //===
            }
            //=== INITBITS();
            hold = 0;
            bits = 0;
            //===//
            state.mode = OS;
            /* falls through */
          case OS:
            //=== NEEDBITS(16); */
            while (bits < 16) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            if (state.head) {
              state.head.xflags = (hold & 0xff);
              state.head.os = (hold >> 8);
            }
            if (state.flags & 0x0200) {
              //=== CRC2(state.check, hold);
              hbuf[0] = hold & 0xff;
              hbuf[1] = (hold >>> 8) & 0xff;
              state.check = crc32$1(state.check, hbuf, 2, 0);
              //===//
            }
            //=== INITBITS();
            hold = 0;
            bits = 0;
            //===//
            state.mode = EXLEN;
            /* falls through */
          case EXLEN:
            if (state.flags & 0x0400) {
              //=== NEEDBITS(16); */
              while (bits < 16) {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              //===//
              state.length = hold;
              if (state.head) {
                state.head.extra_len = hold;
              }
              if (state.flags & 0x0200) {
                //=== CRC2(state.check, hold);
                hbuf[0] = hold & 0xff;
                hbuf[1] = (hold >>> 8) & 0xff;
                state.check = crc32$1(state.check, hbuf, 2, 0);
                //===//
              }
              //=== INITBITS();
              hold = 0;
              bits = 0;
              //===//
            }
            else if (state.head) {
              state.head.extra = null/*Z_NULL*/;
            }
            state.mode = EXTRA;
            /* falls through */
          case EXTRA:
            if (state.flags & 0x0400) {
              copy = state.length;
              if (copy > have) { copy = have; }
              if (copy) {
                if (state.head) {
                  len = state.head.extra_len - state.length;
                  if (!state.head.extra) {
                    // Use untyped array for more convenient processing later
                    state.head.extra = new Array(state.head.extra_len);
                  }
                  utils$e.arraySet(
                    state.head.extra,
                    input,
                    next,
                    // extra field is limited to 65536 bytes
                    // - no need for additional size check
                    copy,
                    /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                    len
                  );
                  //zmemcpy(state.head.extra + len, next,
                  //        len + copy > state.head.extra_max ?
                  //        state.head.extra_max - len : copy);
                }
                if (state.flags & 0x0200) {
                  state.check = crc32$1(state.check, input, copy, next);
                }
                have -= copy;
                next += copy;
                state.length -= copy;
              }
              if (state.length) { break inf_leave; }
            }
            state.length = 0;
            state.mode = NAME;
            /* falls through */
          case NAME:
            if (state.flags & 0x0800) {
              if (have === 0) { break inf_leave; }
              copy = 0;
              do {
                // TODO: 2 or 1 bytes?
                len = input[next + copy++];
                /* use constant limit because in js we should not preallocate memory */
                if (state.head && len &&
                    (state.length < 65536 /*state.head.name_max*/)) {
                  state.head.name += String.fromCharCode(len);
                }
              } while (len && copy < have);

              if (state.flags & 0x0200) {
                state.check = crc32$1(state.check, input, copy, next);
              }
              have -= copy;
              next += copy;
              if (len) { break inf_leave; }
            }
            else if (state.head) {
              state.head.name = null;
            }
            state.length = 0;
            state.mode = COMMENT;
            /* falls through */
          case COMMENT:
            if (state.flags & 0x1000) {
              if (have === 0) { break inf_leave; }
              copy = 0;
              do {
                len = input[next + copy++];
                /* use constant limit because in js we should not preallocate memory */
                if (state.head && len &&
                    (state.length < 65536 /*state.head.comm_max*/)) {
                  state.head.comment += String.fromCharCode(len);
                }
              } while (len && copy < have);
              if (state.flags & 0x0200) {
                state.check = crc32$1(state.check, input, copy, next);
              }
              have -= copy;
              next += copy;
              if (len) { break inf_leave; }
            }
            else if (state.head) {
              state.head.comment = null;
            }
            state.mode = HCRC;
            /* falls through */
          case HCRC:
            if (state.flags & 0x0200) {
              //=== NEEDBITS(16); */
              while (bits < 16) {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              //===//
              if (hold !== (state.check & 0xffff)) {
                strm.msg = 'header crc mismatch';
                state.mode = BAD;
                break;
              }
              //=== INITBITS();
              hold = 0;
              bits = 0;
              //===//
            }
            if (state.head) {
              state.head.hcrc = ((state.flags >> 9) & 1);
              state.head.done = true;
            }
            strm.adler = state.check = 0;
            state.mode = TYPE;
            break;
          case DICTID:
            //=== NEEDBITS(32); */
            while (bits < 32) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            strm.adler = state.check = zswap32(hold);
            //=== INITBITS();
            hold = 0;
            bits = 0;
            //===//
            state.mode = DICT;
            /* falls through */
          case DICT:
            if (state.havedict === 0) {
              //--- RESTORE() ---
              strm.next_out = put;
              strm.avail_out = left;
              strm.next_in = next;
              strm.avail_in = have;
              state.hold = hold;
              state.bits = bits;
              //---
              return Z_NEED_DICT;
            }
            strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
            state.mode = TYPE;
            /* falls through */
          case TYPE:
            if (flush === Z_BLOCK || flush === Z_TREES) { break inf_leave; }
            /* falls through */
          case TYPEDO:
            if (state.last) {
              //--- BYTEBITS() ---//
              hold >>>= bits & 7;
              bits -= bits & 7;
              //---//
              state.mode = CHECK;
              break;
            }
            //=== NEEDBITS(3); */
            while (bits < 3) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            state.last = (hold & 0x01)/*BITS(1)*/;
            //--- DROPBITS(1) ---//
            hold >>>= 1;
            bits -= 1;
            //---//

            switch ((hold & 0x03)/*BITS(2)*/) {
              case 0:                             /* stored block */
                //Tracev((stderr, "inflate:     stored block%s\n",
                //        state.last ? " (last)" : ""));
                state.mode = STORED;
                break;
              case 1:                             /* fixed block */
                fixedtables(state);
                //Tracev((stderr, "inflate:     fixed codes block%s\n",
                //        state.last ? " (last)" : ""));
                state.mode = LEN_;             /* decode codes */
                if (flush === Z_TREES) {
                  //--- DROPBITS(2) ---//
                  hold >>>= 2;
                  bits -= 2;
                  //---//
                  break inf_leave;
                }
                break;
              case 2:                             /* dynamic block */
                //Tracev((stderr, "inflate:     dynamic codes block%s\n",
                //        state.last ? " (last)" : ""));
                state.mode = TABLE;
                break;
              case 3:
                strm.msg = 'invalid block type';
                state.mode = BAD;
            }
            //--- DROPBITS(2) ---//
            hold >>>= 2;
            bits -= 2;
            //---//
            break;
          case STORED:
            //--- BYTEBITS() ---// /* go to byte boundary */
            hold >>>= bits & 7;
            bits -= bits & 7;
            //---//
            //=== NEEDBITS(32); */
            while (bits < 32) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
              strm.msg = 'invalid stored block lengths';
              state.mode = BAD;
              break;
            }
            state.length = hold & 0xffff;
            //Tracev((stderr, "inflate:       stored length %u\n",
            //        state.length));
            //=== INITBITS();
            hold = 0;
            bits = 0;
            //===//
            state.mode = COPY_;
            if (flush === Z_TREES) { break inf_leave; }
            /* falls through */
          case COPY_:
            state.mode = COPY;
            /* falls through */
          case COPY:
            copy = state.length;
            if (copy) {
              if (copy > have) { copy = have; }
              if (copy > left) { copy = left; }
              if (copy === 0) { break inf_leave; }
              //--- zmemcpy(put, next, copy); ---
              utils$e.arraySet(output, input, next, copy, put);
              //---//
              have -= copy;
              next += copy;
              left -= copy;
              put += copy;
              state.length -= copy;
              break;
            }
            //Tracev((stderr, "inflate:       stored end\n"));
            state.mode = TYPE;
            break;
          case TABLE:
            //=== NEEDBITS(14); */
            while (bits < 14) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
            //--- DROPBITS(5) ---//
            hold >>>= 5;
            bits -= 5;
            //---//
            state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
            //--- DROPBITS(5) ---//
            hold >>>= 5;
            bits -= 5;
            //---//
            state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
            //--- DROPBITS(4) ---//
            hold >>>= 4;
            bits -= 4;
            //---//
    //#ifndef PKZIP_BUG_WORKAROUND
            if (state.nlen > 286 || state.ndist > 30) {
              strm.msg = 'too many length or distance symbols';
              state.mode = BAD;
              break;
            }
    //#endif
            //Tracev((stderr, "inflate:       table sizes ok\n"));
            state.have = 0;
            state.mode = LENLENS;
            /* falls through */
          case LENLENS:
            while (state.have < state.ncode) {
              //=== NEEDBITS(3);
              while (bits < 3) {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              //===//
              state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
              //--- DROPBITS(3) ---//
              hold >>>= 3;
              bits -= 3;
              //---//
            }
            while (state.have < 19) {
              state.lens[order[state.have++]] = 0;
            }
            // We have separate tables & no pointers. 2 commented lines below not needed.
            //state.next = state.codes;
            //state.lencode = state.next;
            // Switch to use dynamic table
            state.lencode = state.lendyn;
            state.lenbits = 7;

            opts = { bits: state.lenbits };
            ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
            state.lenbits = opts.bits;

            if (ret) {
              strm.msg = 'invalid code lengths set';
              state.mode = BAD;
              break;
            }
            //Tracev((stderr, "inflate:       code lengths ok\n"));
            state.have = 0;
            state.mode = CODELENS;
            /* falls through */
          case CODELENS:
            while (state.have < state.nlen + state.ndist) {
              for (;;) {
                here = state.lencode[hold & ((1 << state.lenbits) - 1)];/*BITS(state.lenbits)*/
                here_bits = here >>> 24;
                here_op = (here >>> 16) & 0xff;
                here_val = here & 0xffff;

                if ((here_bits) <= bits) { break; }
                //--- PULLBYTE() ---//
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
                //---//
              }
              if (here_val < 16) {
                //--- DROPBITS(here.bits) ---//
                hold >>>= here_bits;
                bits -= here_bits;
                //---//
                state.lens[state.have++] = here_val;
              }
              else {
                if (here_val === 16) {
                  //=== NEEDBITS(here.bits + 2);
                  n = here_bits + 2;
                  while (bits < n) {
                    if (have === 0) { break inf_leave; }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  //===//
                  //--- DROPBITS(here.bits) ---//
                  hold >>>= here_bits;
                  bits -= here_bits;
                  //---//
                  if (state.have === 0) {
                    strm.msg = 'invalid bit length repeat';
                    state.mode = BAD;
                    break;
                  }
                  len = state.lens[state.have - 1];
                  copy = 3 + (hold & 0x03);//BITS(2);
                  //--- DROPBITS(2) ---//
                  hold >>>= 2;
                  bits -= 2;
                  //---//
                }
                else if (here_val === 17) {
                  //=== NEEDBITS(here.bits + 3);
                  n = here_bits + 3;
                  while (bits < n) {
                    if (have === 0) { break inf_leave; }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  //===//
                  //--- DROPBITS(here.bits) ---//
                  hold >>>= here_bits;
                  bits -= here_bits;
                  //---//
                  len = 0;
                  copy = 3 + (hold & 0x07);//BITS(3);
                  //--- DROPBITS(3) ---//
                  hold >>>= 3;
                  bits -= 3;
                  //---//
                }
                else {
                  //=== NEEDBITS(here.bits + 7);
                  n = here_bits + 7;
                  while (bits < n) {
                    if (have === 0) { break inf_leave; }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  //===//
                  //--- DROPBITS(here.bits) ---//
                  hold >>>= here_bits;
                  bits -= here_bits;
                  //---//
                  len = 0;
                  copy = 11 + (hold & 0x7f);//BITS(7);
                  //--- DROPBITS(7) ---//
                  hold >>>= 7;
                  bits -= 7;
                  //---//
                }
                if (state.have + copy > state.nlen + state.ndist) {
                  strm.msg = 'invalid bit length repeat';
                  state.mode = BAD;
                  break;
                }
                while (copy--) {
                  state.lens[state.have++] = len;
                }
              }
            }

            /* handle error breaks in while */
            if (state.mode === BAD) { break; }

            /* check for end-of-block code (better have one) */
            if (state.lens[256] === 0) {
              strm.msg = 'invalid code -- missing end-of-block';
              state.mode = BAD;
              break;
            }

            /* build code tables -- note: do not change the lenbits or distbits
               values here (9 and 6) without reading the comments in inftrees.h
               concerning the ENOUGH constants, which depend on those values */
            state.lenbits = 9;

            opts = { bits: state.lenbits };
            ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
            // We have separate tables & no pointers. 2 commented lines below not needed.
            // state.next_index = opts.table_index;
            state.lenbits = opts.bits;
            // state.lencode = state.next;

            if (ret) {
              strm.msg = 'invalid literal/lengths set';
              state.mode = BAD;
              break;
            }

            state.distbits = 6;
            //state.distcode.copy(state.codes);
            // Switch to use dynamic table
            state.distcode = state.distdyn;
            opts = { bits: state.distbits };
            ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
            // We have separate tables & no pointers. 2 commented lines below not needed.
            // state.next_index = opts.table_index;
            state.distbits = opts.bits;
            // state.distcode = state.next;

            if (ret) {
              strm.msg = 'invalid distances set';
              state.mode = BAD;
              break;
            }
            //Tracev((stderr, 'inflate:       codes ok\n'));
            state.mode = LEN_;
            if (flush === Z_TREES) { break inf_leave; }
            /* falls through */
          case LEN_:
            state.mode = LEN;
            /* falls through */
          case LEN:
            if (have >= 6 && left >= 258) {
              //--- RESTORE() ---
              strm.next_out = put;
              strm.avail_out = left;
              strm.next_in = next;
              strm.avail_in = have;
              state.hold = hold;
              state.bits = bits;
              //---
              inflate_fast(strm, _out);
              //--- LOAD() ---
              put = strm.next_out;
              output = strm.output;
              left = strm.avail_out;
              next = strm.next_in;
              input = strm.input;
              have = strm.avail_in;
              hold = state.hold;
              bits = state.bits;
              //---

              if (state.mode === TYPE) {
                state.back = -1;
              }
              break;
            }
            state.back = 0;
            for (;;) {
              here = state.lencode[hold & ((1 << state.lenbits) - 1)];  /*BITS(state.lenbits)*/
              here_bits = here >>> 24;
              here_op = (here >>> 16) & 0xff;
              here_val = here & 0xffff;

              if (here_bits <= bits) { break; }
              //--- PULLBYTE() ---//
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
              //---//
            }
            if (here_op && (here_op & 0xf0) === 0) {
              last_bits = here_bits;
              last_op = here_op;
              last_val = here_val;
              for (;;) {
                here = state.lencode[last_val +
                        ((hold & ((1 << (last_bits + last_op)) - 1))/*BITS(last.bits + last.op)*/ >> last_bits)];
                here_bits = here >>> 24;
                here_op = (here >>> 16) & 0xff;
                here_val = here & 0xffff;

                if ((last_bits + here_bits) <= bits) { break; }
                //--- PULLBYTE() ---//
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
                //---//
              }
              //--- DROPBITS(last.bits) ---//
              hold >>>= last_bits;
              bits -= last_bits;
              //---//
              state.back += last_bits;
            }
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            state.back += here_bits;
            state.length = here_val;
            if (here_op === 0) {
              //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
              //        "inflate:         literal '%c'\n" :
              //        "inflate:         literal 0x%02x\n", here.val));
              state.mode = LIT;
              break;
            }
            if (here_op & 32) {
              //Tracevv((stderr, "inflate:         end of block\n"));
              state.back = -1;
              state.mode = TYPE;
              break;
            }
            if (here_op & 64) {
              strm.msg = 'invalid literal/length code';
              state.mode = BAD;
              break;
            }
            state.extra = here_op & 15;
            state.mode = LENEXT;
            /* falls through */
          case LENEXT:
            if (state.extra) {
              //=== NEEDBITS(state.extra);
              n = state.extra;
              while (bits < n) {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              //===//
              state.length += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
              //--- DROPBITS(state.extra) ---//
              hold >>>= state.extra;
              bits -= state.extra;
              //---//
              state.back += state.extra;
            }
            //Tracevv((stderr, "inflate:         length %u\n", state.length));
            state.was = state.length;
            state.mode = DIST;
            /* falls through */
          case DIST:
            for (;;) {
              here = state.distcode[hold & ((1 << state.distbits) - 1)];/*BITS(state.distbits)*/
              here_bits = here >>> 24;
              here_op = (here >>> 16) & 0xff;
              here_val = here & 0xffff;

              if ((here_bits) <= bits) { break; }
              //--- PULLBYTE() ---//
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
              //---//
            }
            if ((here_op & 0xf0) === 0) {
              last_bits = here_bits;
              last_op = here_op;
              last_val = here_val;
              for (;;) {
                here = state.distcode[last_val +
                        ((hold & ((1 << (last_bits + last_op)) - 1))/*BITS(last.bits + last.op)*/ >> last_bits)];
                here_bits = here >>> 24;
                here_op = (here >>> 16) & 0xff;
                here_val = here & 0xffff;

                if ((last_bits + here_bits) <= bits) { break; }
                //--- PULLBYTE() ---//
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
                //---//
              }
              //--- DROPBITS(last.bits) ---//
              hold >>>= last_bits;
              bits -= last_bits;
              //---//
              state.back += last_bits;
            }
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            state.back += here_bits;
            if (here_op & 64) {
              strm.msg = 'invalid distance code';
              state.mode = BAD;
              break;
            }
            state.offset = here_val;
            state.extra = (here_op) & 15;
            state.mode = DISTEXT;
            /* falls through */
          case DISTEXT:
            if (state.extra) {
              //=== NEEDBITS(state.extra);
              n = state.extra;
              while (bits < n) {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              //===//
              state.offset += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
              //--- DROPBITS(state.extra) ---//
              hold >>>= state.extra;
              bits -= state.extra;
              //---//
              state.back += state.extra;
            }
    //#ifdef INFLATE_STRICT
            if (state.offset > state.dmax) {
              strm.msg = 'invalid distance too far back';
              state.mode = BAD;
              break;
            }
    //#endif
            //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
            state.mode = MATCH;
            /* falls through */
          case MATCH:
            if (left === 0) { break inf_leave; }
            copy = _out - left;
            if (state.offset > copy) {         /* copy from window */
              copy = state.offset - copy;
              if (copy > state.whave) {
                if (state.sane) {
                  strm.msg = 'invalid distance too far back';
                  state.mode = BAD;
                  break;
                }
    // (!) This block is disabled in zlib defaults,
    // don't enable it for binary compatibility
    //#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
    //          Trace((stderr, "inflate.c too far\n"));
    //          copy -= state.whave;
    //          if (copy > state.length) { copy = state.length; }
    //          if (copy > left) { copy = left; }
    //          left -= copy;
    //          state.length -= copy;
    //          do {
    //            output[put++] = 0;
    //          } while (--copy);
    //          if (state.length === 0) { state.mode = LEN; }
    //          break;
    //#endif
              }
              if (copy > state.wnext) {
                copy -= state.wnext;
                from = state.wsize - copy;
              }
              else {
                from = state.wnext - copy;
              }
              if (copy > state.length) { copy = state.length; }
              from_source = state.window;
            }
            else {                              /* copy from output */
              from_source = output;
              from = put - state.offset;
              copy = state.length;
            }
            if (copy > left) { copy = left; }
            left -= copy;
            state.length -= copy;
            do {
              output[put++] = from_source[from++];
            } while (--copy);
            if (state.length === 0) { state.mode = LEN; }
            break;
          case LIT:
            if (left === 0) { break inf_leave; }
            output[put++] = state.length;
            left--;
            state.mode = LEN;
            break;
          case CHECK:
            if (state.wrap) {
              //=== NEEDBITS(32);
              while (bits < 32) {
                if (have === 0) { break inf_leave; }
                have--;
                // Use '|' instead of '+' to make sure that result is signed
                hold |= input[next++] << bits;
                bits += 8;
              }
              //===//
              _out -= left;
              strm.total_out += _out;
              state.total += _out;
              if (_out) {
                strm.adler = state.check =
                    /*UPDATE(state.check, put - _out, _out);*/
                    (state.flags ? crc32$1(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));

              }
              _out = left;
              // NB: crc32 stored as signed 32-bit int, zswap32 returns signed too
              if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                strm.msg = 'incorrect data check';
                state.mode = BAD;
                break;
              }
              //=== INITBITS();
              hold = 0;
              bits = 0;
              //===//
              //Tracev((stderr, "inflate:   check matches trailer\n"));
            }
            state.mode = LENGTH;
            /* falls through */
          case LENGTH:
            if (state.wrap && state.flags) {
              //=== NEEDBITS(32);
              while (bits < 32) {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              //===//
              if (hold !== (state.total & 0xffffffff)) {
                strm.msg = 'incorrect length check';
                state.mode = BAD;
                break;
              }
              //=== INITBITS();
              hold = 0;
              bits = 0;
              //===//
              //Tracev((stderr, "inflate:   length matches trailer\n"));
            }
            state.mode = DONE;
            /* falls through */
          case DONE:
            ret = Z_STREAM_END;
            break inf_leave;
          case BAD:
            ret = Z_DATA_ERROR;
            break inf_leave;
          case MEM:
            return Z_MEM_ERROR;
          case SYNC:
            /* falls through */
          default:
            return Z_STREAM_ERROR;
        }
      }

      // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

      /*
         Return from inflate(), updating the total counts and the check value.
         If there was no progress during the inflate() call, return a buffer
         error.  Call updatewindow() to create and/or update the window state.
         Note: a memory error from inflate() is non-recoverable.
       */

      //--- RESTORE() ---
      strm.next_out = put;
      strm.avail_out = left;
      strm.next_in = next;
      strm.avail_in = have;
      state.hold = hold;
      state.bits = bits;
      //---

      if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
                          (state.mode < CHECK || flush !== Z_FINISH))) {
        if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) ;
      }
      _in -= strm.avail_in;
      _out -= strm.avail_out;
      strm.total_in += _in;
      strm.total_out += _out;
      state.total += _out;
      if (state.wrap && _out) {
        strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
          (state.flags ? crc32$1(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out));
      }
      strm.data_type = state.bits + (state.last ? 64 : 0) +
                        (state.mode === TYPE ? 128 : 0) +
                        (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
      if (((_in === 0 && _out === 0) || flush === Z_FINISH) && ret === Z_OK) {
        ret = Z_BUF_ERROR;
      }
      return ret;
    }

    function inflateEnd(strm) {

      if (!strm || !strm.state /*|| strm->zfree == (free_func)0*/) {
        return Z_STREAM_ERROR;
      }

      var state = strm.state;
      if (state.window) {
        state.window = null;
      }
      strm.state = null;
      return Z_OK;
    }

    function inflateGetHeader(strm, head) {
      var state;

      /* check state */
      if (!strm || !strm.state) { return Z_STREAM_ERROR; }
      state = strm.state;
      if ((state.wrap & 2) === 0) { return Z_STREAM_ERROR; }

      /* save header structure */
      state.head = head;
      head.done = false;
      return Z_OK;
    }

    function inflateSetDictionary(strm, dictionary) {
      var dictLength = dictionary.length;

      var state;
      var dictid;
      var ret;

      /* check state */
      if (!strm /* == Z_NULL */ || !strm.state /* == Z_NULL */) { return Z_STREAM_ERROR; }
      state = strm.state;

      if (state.wrap !== 0 && state.mode !== DICT) {
        return Z_STREAM_ERROR;
      }

      /* check for correct dictionary identifier */
      if (state.mode === DICT) {
        dictid = 1; /* adler32(0, null, 0)*/
        /* dictid = adler32(dictid, dictionary, dictLength); */
        dictid = adler32(dictid, dictionary, dictLength, 0);
        if (dictid !== state.check) {
          return Z_DATA_ERROR;
        }
      }
      /* copy dictionary to window using updatewindow(), which will amend the
       existing dictionary if appropriate */
      ret = updatewindow(strm, dictionary, dictLength, dictLength);
      if (ret) {
        state.mode = MEM;
        return Z_MEM_ERROR;
      }
      state.havedict = 1;
      // Tracev((stderr, "inflate:   dictionary set\n"));
      return Z_OK;
    }

    inflate$3.inflateReset = inflateReset;
    inflate$3.inflateReset2 = inflateReset2;
    inflate$3.inflateResetKeep = inflateResetKeep;
    inflate$3.inflateInit = inflateInit;
    inflate$3.inflateInit2 = inflateInit2;
    inflate$3.inflate = inflate$2;
    inflate$3.inflateEnd = inflateEnd;
    inflate$3.inflateGetHeader = inflateGetHeader;
    inflate$3.inflateSetDictionary = inflateSetDictionary;
    inflate$3.inflateInfo = 'pako inflate (from Nodeca project)';

    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    var constants$1 = {

      /* Allowed flush values; see deflate() and inflate() below for details */
      Z_NO_FLUSH:         0,
      Z_PARTIAL_FLUSH:    1,
      Z_SYNC_FLUSH:       2,
      Z_FULL_FLUSH:       3,
      Z_FINISH:           4,
      Z_BLOCK:            5,
      Z_TREES:            6,

      /* Return codes for the compression/decompression functions. Negative values
      * are errors, positive values are used for special but normal events.
      */
      Z_OK:               0,
      Z_STREAM_END:       1,
      Z_NEED_DICT:        2,
      Z_ERRNO:           -1,
      Z_STREAM_ERROR:    -2,
      Z_DATA_ERROR:      -3,
      //Z_MEM_ERROR:     -4,
      Z_BUF_ERROR:       -5,
      //Z_VERSION_ERROR: -6,

      /* compression levels */
      Z_NO_COMPRESSION:         0,
      Z_BEST_SPEED:             1,
      Z_BEST_COMPRESSION:       9,
      Z_DEFAULT_COMPRESSION:   -1,


      Z_FILTERED:               1,
      Z_HUFFMAN_ONLY:           2,
      Z_RLE:                    3,
      Z_FIXED:                  4,
      Z_DEFAULT_STRATEGY:       0,

      /* Possible values of the data_type field (though see inflate()) */
      Z_BINARY:                 0,
      Z_TEXT:                   1,
      //Z_ASCII:                1, // = Z_TEXT (deprecated)
      Z_UNKNOWN:                2,

      /* The deflate compression method */
      Z_DEFLATED:               8
      //Z_NULL:                 null // Use -1 or null inline, depending on var type
    };

    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    function GZheader$1() {
      /* true if compressed data believed to be text */
      this.text       = 0;
      /* modification time */
      this.time       = 0;
      /* extra flags (not used when writing a gzip file) */
      this.xflags     = 0;
      /* operating system */
      this.os         = 0;
      /* pointer to extra field or Z_NULL if none */
      this.extra      = null;
      /* extra field length (valid if extra != Z_NULL) */
      this.extra_len  = 0; // Actually, we don't need it in JS,
                           // but leave for few code modifications

      //
      // Setup limits is not necessary because in js we should not preallocate memory
      // for inflate use constant limit in 65536 bytes
      //

      /* space at extra (only when reading header) */
      // this.extra_max  = 0;
      /* pointer to zero-terminated file name or Z_NULL */
      this.name       = '';
      /* space at name (only when reading header) */
      // this.name_max   = 0;
      /* pointer to zero-terminated comment or Z_NULL */
      this.comment    = '';
      /* space at comment (only when reading header) */
      // this.comm_max   = 0;
      /* true if there was or will be a header crc */
      this.hcrc       = 0;
      /* true when done reading gzip header (not used when writing a gzip file) */
      this.done       = false;
    }

    var gzheader = GZheader$1;

    var zlib_inflate = inflate$3;
    var utils$d        = common;
    var strings      = strings$2;
    var c            = constants$1;
    var msg          = messages;
    var ZStream      = zstream;
    var GZheader     = gzheader;

    var toString$1 = Object.prototype.toString;

    /**
     * class Inflate
     *
     * Generic JS-style wrapper for zlib calls. If you don't need
     * streaming behaviour - use more simple functions: [[inflate]]
     * and [[inflateRaw]].
     **/

    /* internal
     * inflate.chunks -> Array
     *
     * Chunks of output data, if [[Inflate#onData]] not overridden.
     **/

    /**
     * Inflate.result -> Uint8Array|Array|String
     *
     * Uncompressed result, generated by default [[Inflate#onData]]
     * and [[Inflate#onEnd]] handlers. Filled after you push last chunk
     * (call [[Inflate#push]] with `Z_FINISH` / `true` param) or if you
     * push a chunk with explicit flush (call [[Inflate#push]] with
     * `Z_SYNC_FLUSH` param).
     **/

    /**
     * Inflate.err -> Number
     *
     * Error code after inflate finished. 0 (Z_OK) on success.
     * Should be checked if broken data possible.
     **/

    /**
     * Inflate.msg -> String
     *
     * Error message, if [[Inflate.err]] != 0
     **/


    /**
     * new Inflate(options)
     * - options (Object): zlib inflate options.
     *
     * Creates new inflator instance with specified params. Throws exception
     * on bad params. Supported options:
     *
     * - `windowBits`
     * - `dictionary`
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information on these.
     *
     * Additional options, for internal needs:
     *
     * - `chunkSize` - size of generated data chunks (16K by default)
     * - `raw` (Boolean) - do raw inflate
     * - `to` (String) - if equal to 'string', then result will be converted
     *   from utf8 to utf16 (javascript) string. When string output requested,
     *   chunk length can differ from `chunkSize`, depending on content.
     *
     * By default, when no options set, autodetect deflate/gzip data format via
     * wrapper header.
     *
     * ##### Example:
     *
     * ```javascript
     * var pako = require('pako')
     *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
     *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
     *
     * var inflate = new pako.Inflate({ level: 3});
     *
     * inflate.push(chunk1, false);
     * inflate.push(chunk2, true);  // true -> last chunk
     *
     * if (inflate.err) { throw new Error(inflate.err); }
     *
     * console.log(inflate.result);
     * ```
     **/
    function Inflate(options) {
      if (!(this instanceof Inflate)) return new Inflate(options);

      this.options = utils$d.assign({
        chunkSize: 16384,
        windowBits: 0,
        to: ''
      }, options || {});

      var opt = this.options;

      // Force window size for `raw` data, if not set directly,
      // because we have no header for autodetect.
      if (opt.raw && (opt.windowBits >= 0) && (opt.windowBits < 16)) {
        opt.windowBits = -opt.windowBits;
        if (opt.windowBits === 0) { opt.windowBits = -15; }
      }

      // If `windowBits` not defined (and mode not raw) - set autodetect flag for gzip/deflate
      if ((opt.windowBits >= 0) && (opt.windowBits < 16) &&
          !(options && options.windowBits)) {
        opt.windowBits += 32;
      }

      // Gzip header has no info about windows size, we can do autodetect only
      // for deflate. So, if window size not set, force it to max when gzip possible
      if ((opt.windowBits > 15) && (opt.windowBits < 48)) {
        // bit 3 (16) -> gzipped data
        // bit 4 (32) -> autodetect gzip/deflate
        if ((opt.windowBits & 15) === 0) {
          opt.windowBits |= 15;
        }
      }

      this.err    = 0;      // error code, if happens (0 = Z_OK)
      this.msg    = '';     // error message
      this.ended  = false;  // used to avoid multiple onEnd() calls
      this.chunks = [];     // chunks of compressed data

      this.strm   = new ZStream();
      this.strm.avail_out = 0;

      var status  = zlib_inflate.inflateInit2(
        this.strm,
        opt.windowBits
      );

      if (status !== c.Z_OK) {
        throw new Error(msg[status]);
      }

      this.header = new GZheader();

      zlib_inflate.inflateGetHeader(this.strm, this.header);

      // Setup dictionary
      if (opt.dictionary) {
        // Convert data if needed
        if (typeof opt.dictionary === 'string') {
          opt.dictionary = strings.string2buf(opt.dictionary);
        } else if (toString$1.call(opt.dictionary) === '[object ArrayBuffer]') {
          opt.dictionary = new Uint8Array(opt.dictionary);
        }
        if (opt.raw) { //In raw mode we need to set the dictionary early
          status = zlib_inflate.inflateSetDictionary(this.strm, opt.dictionary);
          if (status !== c.Z_OK) {
            throw new Error(msg[status]);
          }
        }
      }
    }

    /**
     * Inflate#push(data[, mode]) -> Boolean
     * - data (Uint8Array|Array|ArrayBuffer|String): input data
     * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
     *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` means Z_FINISH.
     *
     * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
     * new output chunks. Returns `true` on success. The last data block must have
     * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
     * [[Inflate#onEnd]]. For interim explicit flushes (without ending the stream) you
     * can use mode Z_SYNC_FLUSH, keeping the decompression context.
     *
     * On fail call [[Inflate#onEnd]] with error code and return false.
     *
     * We strongly recommend to use `Uint8Array` on input for best speed (output
     * format is detected automatically). Also, don't skip last param and always
     * use the same type in your code (boolean or number). That will improve JS speed.
     *
     * For regular `Array`-s make sure all elements are [0..255].
     *
     * ##### Example
     *
     * ```javascript
     * push(chunk, false); // push one of data chunks
     * ...
     * push(chunk, true);  // push last chunk
     * ```
     **/
    Inflate.prototype.push = function (data, mode) {
      var strm = this.strm;
      var chunkSize = this.options.chunkSize;
      var dictionary = this.options.dictionary;
      var status, _mode;
      var next_out_utf8, tail, utf8str;

      // Flag to properly process Z_BUF_ERROR on testing inflate call
      // when we check that all output data was flushed.
      var allowBufError = false;

      if (this.ended) { return false; }
      _mode = (mode === ~~mode) ? mode : ((mode === true) ? c.Z_FINISH : c.Z_NO_FLUSH);

      // Convert data if needed
      if (typeof data === 'string') {
        // Only binary strings can be decompressed on practice
        strm.input = strings.binstring2buf(data);
      } else if (toString$1.call(data) === '[object ArrayBuffer]') {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }

      strm.next_in = 0;
      strm.avail_in = strm.input.length;

      do {
        if (strm.avail_out === 0) {
          strm.output = new utils$d.Buf8(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }

        status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);    /* no bad return value */

        if (status === c.Z_NEED_DICT && dictionary) {
          status = zlib_inflate.inflateSetDictionary(this.strm, dictionary);
        }

        if (status === c.Z_BUF_ERROR && allowBufError === true) {
          status = c.Z_OK;
          allowBufError = false;
        }

        if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
          this.onEnd(status);
          this.ended = true;
          return false;
        }

        if (strm.next_out) {
          if (strm.avail_out === 0 || status === c.Z_STREAM_END || (strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH))) {

            if (this.options.to === 'string') {

              next_out_utf8 = strings.utf8border(strm.output, strm.next_out);

              tail = strm.next_out - next_out_utf8;
              utf8str = strings.buf2string(strm.output, next_out_utf8);

              // move tail
              strm.next_out = tail;
              strm.avail_out = chunkSize - tail;
              if (tail) { utils$d.arraySet(strm.output, strm.output, next_out_utf8, tail, 0); }

              this.onData(utf8str);

            } else {
              this.onData(utils$d.shrinkBuf(strm.output, strm.next_out));
            }
          }
        }

        // When no more input data, we should check that internal inflate buffers
        // are flushed. The only way to do it when avail_out = 0 - run one more
        // inflate pass. But if output data not exists, inflate return Z_BUF_ERROR.
        // Here we set flag to process this error properly.
        //
        // NOTE. Deflate does not return error in this case and does not needs such
        // logic.
        if (strm.avail_in === 0 && strm.avail_out === 0) {
          allowBufError = true;
        }

      } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);

      if (status === c.Z_STREAM_END) {
        _mode = c.Z_FINISH;
      }

      // Finalize on the last chunk.
      if (_mode === c.Z_FINISH) {
        status = zlib_inflate.inflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return status === c.Z_OK;
      }

      // callback interim results if Z_SYNC_FLUSH.
      if (_mode === c.Z_SYNC_FLUSH) {
        this.onEnd(c.Z_OK);
        strm.avail_out = 0;
        return true;
      }

      return true;
    };


    /**
     * Inflate#onData(chunk) -> Void
     * - chunk (Uint8Array|Array|String): output data. Type of array depends
     *   on js engine support. When string output requested, each chunk
     *   will be string.
     *
     * By default, stores data blocks in `chunks[]` property and glue
     * those in `onEnd`. Override this handler, if you need another behaviour.
     **/
    Inflate.prototype.onData = function (chunk) {
      this.chunks.push(chunk);
    };


    /**
     * Inflate#onEnd(status) -> Void
     * - status (Number): inflate status. 0 (Z_OK) on success,
     *   other if not.
     *
     * Called either after you tell inflate that the input stream is
     * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
     * or if an error happened. By default - join collected chunks,
     * free memory and fill `results` / `err` properties.
     **/
    Inflate.prototype.onEnd = function (status) {
      // On success - join
      if (status === c.Z_OK) {
        if (this.options.to === 'string') {
          // Glue & convert here, until we teach pako to send
          // utf8 aligned strings to onData
          this.result = this.chunks.join('');
        } else {
          this.result = utils$d.flattenChunks(this.chunks);
        }
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };


    /**
     * inflate(data[, options]) -> Uint8Array|Array|String
     * - data (Uint8Array|Array|String): input data to decompress.
     * - options (Object): zlib inflate options.
     *
     * Decompress `data` with inflate/ungzip and `options`. Autodetect
     * format via wrapper header by default. That's why we don't provide
     * separate `ungzip` method.
     *
     * Supported options are:
     *
     * - windowBits
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information.
     *
     * Sugar (options):
     *
     * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
     *   negative windowBits implicitly.
     * - `to` (String) - if equal to 'string', then result will be converted
     *   from utf8 to utf16 (javascript) string. When string output requested,
     *   chunk length can differ from `chunkSize`, depending on content.
     *
     *
     * ##### Example:
     *
     * ```javascript
     * var pako = require('pako')
     *   , input = pako.deflate([1,2,3,4,5,6,7,8,9])
     *   , output;
     *
     * try {
     *   output = pako.inflate(input);
     * } catch (err)
     *   console.log(err);
     * }
     * ```
     **/
    function inflate$1(input, options) {
      var inflator = new Inflate(options);

      inflator.push(input, true);

      // That will never happens, if you don't cheat with options :)
      if (inflator.err) { throw inflator.msg || msg[inflator.err]; }

      return inflator.result;
    }


    /**
     * inflateRaw(data[, options]) -> Uint8Array|Array|String
     * - data (Uint8Array|Array|String): input data to decompress.
     * - options (Object): zlib inflate options.
     *
     * The same as [[inflate]], but creates raw data, without wrapper
     * (header and adler32 crc).
     **/
    function inflateRaw(input, options) {
      options = options || {};
      options.raw = true;
      return inflate$1(input, options);
    }


    /**
     * ungzip(data[, options]) -> Uint8Array|Array|String
     * - data (Uint8Array|Array|String): input data to decompress.
     * - options (Object): zlib inflate options.
     *
     * Just shortcut to [[inflate]], because it autodetects format
     * by header.content. Done for convenience.
     **/


    inflate$4.Inflate = Inflate;
    inflate$4.inflate = inflate$1;
    inflate$4.inflateRaw = inflateRaw;
    inflate$4.ungzip  = inflate$1;

    var assign    = common.assign;

    var deflate   = deflate$4;
    var inflate   = inflate$4;
    var constants = constants$1;

    var pako$1 = {};

    assign(pako$1, deflate, inflate, constants);

    var _pako_1_0_11_pako = pako$1;

    var USE_TYPEDARRAY = (typeof Uint8Array !== "undefined") && (typeof Uint16Array !== "undefined") && (typeof Uint32Array !== "undefined");

    var pako = _pako_1_0_11_pako;
    var utils$c = requireUtils();
    var GenericWorker$4 = GenericWorker_1;

    var ARRAY_TYPE = USE_TYPEDARRAY ? "uint8array" : "array";

    flate.magic = "\x08\x00";

    /**
     * Create a worker that uses pako to inflate/deflate.
     * @constructor
     * @param {String} action the name of the pako function to call : either "Deflate" or "Inflate".
     * @param {Object} options the options to use when (de)compressing.
     */
    function FlateWorker(action, options) {
        GenericWorker$4.call(this, "FlateWorker/" + action);

        this._pako = null;
        this._pakoAction = action;
        this._pakoOptions = options;
        // the `meta` object from the last chunk received
        // this allow this worker to pass around metadata
        this.meta = {};
    }

    utils$c.inherits(FlateWorker, GenericWorker$4);

    /**
     * @see GenericWorker.processChunk
     */
    FlateWorker.prototype.processChunk = function (chunk) {
        this.meta = chunk.meta;
        if (this._pako === null) {
            this._createPako();
        }
        this._pako.push(utils$c.transformTo(ARRAY_TYPE, chunk.data), false);
    };

    /**
     * @see GenericWorker.flush
     */
    FlateWorker.prototype.flush = function () {
        GenericWorker$4.prototype.flush.call(this);
        if (this._pako === null) {
            this._createPako();
        }
        this._pako.push([], true);
    };
    /**
     * @see GenericWorker.cleanUp
     */
    FlateWorker.prototype.cleanUp = function () {
        GenericWorker$4.prototype.cleanUp.call(this);
        this._pako = null;
    };

    /**
     * Create the _pako object.
     * TODO: lazy-loading this object isn't the best solution but it's the
     * quickest. The best solution is to lazy-load the worker list. See also the
     * issue #446.
     */
    FlateWorker.prototype._createPako = function () {
        this._pako = new pako[this._pakoAction]({
            raw: true,
            level: this._pakoOptions.level || -1 // default compression
        });
        var self = this;
        this._pako.onData = function(data) {
            self.push({
                data : data,
                meta : self.meta
            });
        };
    };

    flate.compressWorker = function (compressionOptions) {
        return new FlateWorker("Deflate", compressionOptions);
    };
    flate.uncompressWorker = function () {
        return new FlateWorker("Inflate", {});
    };

    var GenericWorker$3 = GenericWorker_1;

    compressions$2.STORE = {
        magic: "\x00\x00",
        compressWorker : function () {
            return new GenericWorker$3("STORE compression");
        },
        uncompressWorker : function () {
            return new GenericWorker$3("STORE decompression");
        }
    };
    compressions$2.DEFLATE = flate;

    var signature$1 = {};

    signature$1.LOCAL_FILE_HEADER = "PK\x03\x04";
    signature$1.CENTRAL_FILE_HEADER = "PK\x01\x02";
    signature$1.CENTRAL_DIRECTORY_END = "PK\x05\x06";
    signature$1.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x06\x07";
    signature$1.ZIP64_CENTRAL_DIRECTORY_END = "PK\x06\x06";
    signature$1.DATA_DESCRIPTOR = "PK\x07\x08";

    var utils$b = requireUtils();
    var GenericWorker$2 = GenericWorker_1;
    var utf8$3 = utf8$5;
    var crc32 = crc32_1$1;
    var signature = signature$1;

    /**
     * Transform an integer into a string in hexadecimal.
     * @private
     * @param {number} dec the number to convert.
     * @param {number} bytes the number of bytes to generate.
     * @returns {string} the result.
     */
    var decToHex = function(dec, bytes) {
        var hex = "", i;
        for (i = 0; i < bytes; i++) {
            hex += String.fromCharCode(dec & 0xff);
            dec = dec >>> 8;
        }
        return hex;
    };

    /**
     * Generate the UNIX part of the external file attributes.
     * @param {Object} unixPermissions the unix permissions or null.
     * @param {Boolean} isDir true if the entry is a directory, false otherwise.
     * @return {Number} a 32 bit integer.
     *
     * adapted from http://unix.stackexchange.com/questions/14705/the-zip-formats-external-file-attribute :
     *
     * TTTTsstrwxrwxrwx0000000000ADVSHR
     * ^^^^____________________________ file type, see zipinfo.c (UNX_*)
     *     ^^^_________________________ setuid, setgid, sticky
     *        ^^^^^^^^^________________ permissions
     *                 ^^^^^^^^^^______ not used ?
     *                           ^^^^^^ DOS attribute bits : Archive, Directory, Volume label, System file, Hidden, Read only
     */
    var generateUnixExternalFileAttr = function (unixPermissions, isDir) {

        var result = unixPermissions;
        if (!unixPermissions) {
            // I can't use octal values in strict mode, hence the hexa.
            //  040775 => 0x41fd
            // 0100664 => 0x81b4
            result = isDir ? 0x41fd : 0x81b4;
        }
        return (result & 0xFFFF) << 16;
    };

    /**
     * Generate the DOS part of the external file attributes.
     * @param {Object} dosPermissions the dos permissions or null.
     * @param {Boolean} isDir true if the entry is a directory, false otherwise.
     * @return {Number} a 32 bit integer.
     *
     * Bit 0     Read-Only
     * Bit 1     Hidden
     * Bit 2     System
     * Bit 3     Volume Label
     * Bit 4     Directory
     * Bit 5     Archive
     */
    var generateDosExternalFileAttr = function (dosPermissions) {
        // the dir flag is already set for compatibility
        return (dosPermissions || 0)  & 0x3F;
    };

    /**
     * Generate the various parts used in the construction of the final zip file.
     * @param {Object} streamInfo the hash with information about the compressed file.
     * @param {Boolean} streamedContent is the content streamed ?
     * @param {Boolean} streamingEnded is the stream finished ?
     * @param {number} offset the current offset from the start of the zip file.
     * @param {String} platform let's pretend we are this platform (change platform dependents fields)
     * @param {Function} encodeFileName the function to encode the file name / comment.
     * @return {Object} the zip parts.
     */
    var generateZipParts = function(streamInfo, streamedContent, streamingEnded, offset, platform, encodeFileName) {
        var file = streamInfo["file"],
            compression = streamInfo["compression"],
            useCustomEncoding = encodeFileName !== utf8$3.utf8encode,
            encodedFileName = utils$b.transformTo("string", encodeFileName(file.name)),
            utfEncodedFileName = utils$b.transformTo("string", utf8$3.utf8encode(file.name)),
            comment = file.comment,
            encodedComment = utils$b.transformTo("string", encodeFileName(comment)),
            utfEncodedComment = utils$b.transformTo("string", utf8$3.utf8encode(comment)),
            useUTF8ForFileName = utfEncodedFileName.length !== file.name.length,
            useUTF8ForComment = utfEncodedComment.length !== comment.length,
            dosTime,
            dosDate,
            extraFields = "",
            unicodePathExtraField = "",
            unicodeCommentExtraField = "",
            dir = file.dir,
            date = file.date;


        var dataInfo = {
            crc32 : 0,
            compressedSize : 0,
            uncompressedSize : 0
        };

        // if the content is streamed, the sizes/crc32 are only available AFTER
        // the end of the stream.
        if (!streamedContent || streamingEnded) {
            dataInfo.crc32 = streamInfo["crc32"];
            dataInfo.compressedSize = streamInfo["compressedSize"];
            dataInfo.uncompressedSize = streamInfo["uncompressedSize"];
        }

        var bitflag = 0;
        if (streamedContent) {
            // Bit 3: the sizes/crc32 are set to zero in the local header.
            // The correct values are put in the data descriptor immediately
            // following the compressed data.
            bitflag |= 0x0008;
        }
        if (!useCustomEncoding && (useUTF8ForFileName || useUTF8ForComment)) {
            // Bit 11: Language encoding flag (EFS).
            bitflag |= 0x0800;
        }


        var extFileAttr = 0;
        var versionMadeBy = 0;
        if (dir) {
            // dos or unix, we set the dos dir flag
            extFileAttr |= 0x00010;
        }
        if(platform === "UNIX") {
            versionMadeBy = 0x031E; // UNIX, version 3.0
            extFileAttr |= generateUnixExternalFileAttr(file.unixPermissions, dir);
        } else { // DOS or other, fallback to DOS
            versionMadeBy = 0x0014; // DOS, version 2.0
            extFileAttr |= generateDosExternalFileAttr(file.dosPermissions);
        }

        // date
        // @see http://www.delorie.com/djgpp/doc/rbinter/it/52/13.html
        // @see http://www.delorie.com/djgpp/doc/rbinter/it/65/16.html
        // @see http://www.delorie.com/djgpp/doc/rbinter/it/66/16.html

        dosTime = date.getUTCHours();
        dosTime = dosTime << 6;
        dosTime = dosTime | date.getUTCMinutes();
        dosTime = dosTime << 5;
        dosTime = dosTime | date.getUTCSeconds() / 2;

        dosDate = date.getUTCFullYear() - 1980;
        dosDate = dosDate << 4;
        dosDate = dosDate | (date.getUTCMonth() + 1);
        dosDate = dosDate << 5;
        dosDate = dosDate | date.getUTCDate();

        if (useUTF8ForFileName) {
            // set the unicode path extra field. unzip needs at least one extra
            // field to correctly handle unicode path, so using the path is as good
            // as any other information. This could improve the situation with
            // other archive managers too.
            // This field is usually used without the utf8 flag, with a non
            // unicode path in the header (winrar, winzip). This helps (a bit)
            // with the messy Windows' default compressed folders feature but
            // breaks on p7zip which doesn't seek the unicode path extra field.
            // So for now, UTF-8 everywhere !
            unicodePathExtraField =
                // Version
                decToHex(1, 1) +
                // NameCRC32
                decToHex(crc32(encodedFileName), 4) +
                // UnicodeName
                utfEncodedFileName;

            extraFields +=
                // Info-ZIP Unicode Path Extra Field
                "\x75\x70" +
                // size
                decToHex(unicodePathExtraField.length, 2) +
                // content
                unicodePathExtraField;
        }

        if(useUTF8ForComment) {

            unicodeCommentExtraField =
                // Version
                decToHex(1, 1) +
                // CommentCRC32
                decToHex(crc32(encodedComment), 4) +
                // UnicodeName
                utfEncodedComment;

            extraFields +=
                // Info-ZIP Unicode Path Extra Field
                "\x75\x63" +
                // size
                decToHex(unicodeCommentExtraField.length, 2) +
                // content
                unicodeCommentExtraField;
        }

        var header = "";

        // version needed to extract
        header += "\x0A\x00";
        // general purpose bit flag
        header += decToHex(bitflag, 2);
        // compression method
        header += compression.magic;
        // last mod file time
        header += decToHex(dosTime, 2);
        // last mod file date
        header += decToHex(dosDate, 2);
        // crc-32
        header += decToHex(dataInfo.crc32, 4);
        // compressed size
        header += decToHex(dataInfo.compressedSize, 4);
        // uncompressed size
        header += decToHex(dataInfo.uncompressedSize, 4);
        // file name length
        header += decToHex(encodedFileName.length, 2);
        // extra field length
        header += decToHex(extraFields.length, 2);


        var fileRecord = signature.LOCAL_FILE_HEADER + header + encodedFileName + extraFields;

        var dirRecord = signature.CENTRAL_FILE_HEADER +
            // version made by (00: DOS)
            decToHex(versionMadeBy, 2) +
            // file header (common to file and central directory)
            header +
            // file comment length
            decToHex(encodedComment.length, 2) +
            // disk number start
            "\x00\x00" +
            // internal file attributes TODO
            "\x00\x00" +
            // external file attributes
            decToHex(extFileAttr, 4) +
            // relative offset of local header
            decToHex(offset, 4) +
            // file name
            encodedFileName +
            // extra field
            extraFields +
            // file comment
            encodedComment;

        return {
            fileRecord: fileRecord,
            dirRecord: dirRecord
        };
    };

    /**
     * Generate the EOCD record.
     * @param {Number} entriesCount the number of entries in the zip file.
     * @param {Number} centralDirLength the length (in bytes) of the central dir.
     * @param {Number} localDirLength the length (in bytes) of the local dir.
     * @param {String} comment the zip file comment as a binary string.
     * @param {Function} encodeFileName the function to encode the comment.
     * @return {String} the EOCD record.
     */
    var generateCentralDirectoryEnd = function (entriesCount, centralDirLength, localDirLength, comment, encodeFileName) {
        var dirEnd = "";
        var encodedComment = utils$b.transformTo("string", encodeFileName(comment));

        // end of central dir signature
        dirEnd = signature.CENTRAL_DIRECTORY_END +
            // number of this disk
            "\x00\x00" +
            // number of the disk with the start of the central directory
            "\x00\x00" +
            // total number of entries in the central directory on this disk
            decToHex(entriesCount, 2) +
            // total number of entries in the central directory
            decToHex(entriesCount, 2) +
            // size of the central directory   4 bytes
            decToHex(centralDirLength, 4) +
            // offset of start of central directory with respect to the starting disk number
            decToHex(localDirLength, 4) +
            // .ZIP file comment length
            decToHex(encodedComment.length, 2) +
            // .ZIP file comment
            encodedComment;

        return dirEnd;
    };

    /**
     * Generate data descriptors for a file entry.
     * @param {Object} streamInfo the hash generated by a worker, containing information
     * on the file entry.
     * @return {String} the data descriptors.
     */
    var generateDataDescriptors = function (streamInfo) {
        var descriptor = "";
        descriptor = signature.DATA_DESCRIPTOR +
            // crc-32                          4 bytes
            decToHex(streamInfo["crc32"], 4) +
            // compressed size                 4 bytes
            decToHex(streamInfo["compressedSize"], 4) +
            // uncompressed size               4 bytes
            decToHex(streamInfo["uncompressedSize"], 4);

        return descriptor;
    };


    /**
     * A worker to concatenate other workers to create a zip file.
     * @param {Boolean} streamFiles `true` to stream the content of the files,
     * `false` to accumulate it.
     * @param {String} comment the comment to use.
     * @param {String} platform the platform to use, "UNIX" or "DOS".
     * @param {Function} encodeFileName the function to encode file names and comments.
     */
    function ZipFileWorker$1(streamFiles, comment, platform, encodeFileName) {
        GenericWorker$2.call(this, "ZipFileWorker");
        // The number of bytes written so far. This doesn't count accumulated chunks.
        this.bytesWritten = 0;
        // The comment of the zip file
        this.zipComment = comment;
        // The platform "generating" the zip file.
        this.zipPlatform = platform;
        // the function to encode file names and comments.
        this.encodeFileName = encodeFileName;
        // Should we stream the content of the files ?
        this.streamFiles = streamFiles;
        // If `streamFiles` is false, we will need to accumulate the content of the
        // files to calculate sizes / crc32 (and write them *before* the content).
        // This boolean indicates if we are accumulating chunks (it will change a lot
        // during the lifetime of this worker).
        this.accumulate = false;
        // The buffer receiving chunks when accumulating content.
        this.contentBuffer = [];
        // The list of generated directory records.
        this.dirRecords = [];
        // The offset (in bytes) from the beginning of the zip file for the current source.
        this.currentSourceOffset = 0;
        // The total number of entries in this zip file.
        this.entriesCount = 0;
        // the name of the file currently being added, null when handling the end of the zip file.
        // Used for the emitted metadata.
        this.currentFile = null;



        this._sources = [];
    }
    utils$b.inherits(ZipFileWorker$1, GenericWorker$2);

    /**
     * @see GenericWorker.push
     */
    ZipFileWorker$1.prototype.push = function (chunk) {

        var currentFilePercent = chunk.meta.percent || 0;
        var entriesCount = this.entriesCount;
        var remainingFiles = this._sources.length;

        if(this.accumulate) {
            this.contentBuffer.push(chunk);
        } else {
            this.bytesWritten += chunk.data.length;

            GenericWorker$2.prototype.push.call(this, {
                data : chunk.data,
                meta : {
                    currentFile : this.currentFile,
                    percent : entriesCount ? (currentFilePercent + 100 * (entriesCount - remainingFiles - 1)) / entriesCount : 100
                }
            });
        }
    };

    /**
     * The worker started a new source (an other worker).
     * @param {Object} streamInfo the streamInfo object from the new source.
     */
    ZipFileWorker$1.prototype.openedSource = function (streamInfo) {
        this.currentSourceOffset = this.bytesWritten;
        this.currentFile = streamInfo["file"].name;

        var streamedContent = this.streamFiles && !streamInfo["file"].dir;

        // don't stream folders (because they don't have any content)
        if(streamedContent) {
            var record = generateZipParts(streamInfo, streamedContent, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            this.push({
                data : record.fileRecord,
                meta : {percent:0}
            });
        } else {
            // we need to wait for the whole file before pushing anything
            this.accumulate = true;
        }
    };

    /**
     * The worker finished a source (an other worker).
     * @param {Object} streamInfo the streamInfo object from the finished source.
     */
    ZipFileWorker$1.prototype.closedSource = function (streamInfo) {
        this.accumulate = false;
        var streamedContent = this.streamFiles && !streamInfo["file"].dir;
        var record = generateZipParts(streamInfo, streamedContent, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);

        this.dirRecords.push(record.dirRecord);
        if(streamedContent) {
            // after the streamed file, we put data descriptors
            this.push({
                data : generateDataDescriptors(streamInfo),
                meta : {percent:100}
            });
        } else {
            // the content wasn't streamed, we need to push everything now
            // first the file record, then the content
            this.push({
                data : record.fileRecord,
                meta : {percent:0}
            });
            while(this.contentBuffer.length) {
                this.push(this.contentBuffer.shift());
            }
        }
        this.currentFile = null;
    };

    /**
     * @see GenericWorker.flush
     */
    ZipFileWorker$1.prototype.flush = function () {

        var localDirLength = this.bytesWritten;
        for(var i = 0; i < this.dirRecords.length; i++) {
            this.push({
                data : this.dirRecords[i],
                meta : {percent:100}
            });
        }
        var centralDirLength = this.bytesWritten - localDirLength;

        var dirEnd = generateCentralDirectoryEnd(this.dirRecords.length, centralDirLength, localDirLength, this.zipComment, this.encodeFileName);

        this.push({
            data : dirEnd,
            meta : {percent:100}
        });
    };

    /**
     * Prepare the next source to be read.
     */
    ZipFileWorker$1.prototype.prepareNextSource = function () {
        this.previous = this._sources.shift();
        this.openedSource(this.previous.streamInfo);
        if (this.isPaused) {
            this.previous.pause();
        } else {
            this.previous.resume();
        }
    };

    /**
     * @see GenericWorker.registerPrevious
     */
    ZipFileWorker$1.prototype.registerPrevious = function (previous) {
        this._sources.push(previous);
        var self = this;

        previous.on("data", function (chunk) {
            self.processChunk(chunk);
        });
        previous.on("end", function () {
            self.closedSource(self.previous.streamInfo);
            if(self._sources.length) {
                self.prepareNextSource();
            } else {
                self.end();
            }
        });
        previous.on("error", function (e) {
            self.error(e);
        });
        return this;
    };

    /**
     * @see GenericWorker.resume
     */
    ZipFileWorker$1.prototype.resume = function () {
        if(!GenericWorker$2.prototype.resume.call(this)) {
            return false;
        }

        if (!this.previous && this._sources.length) {
            this.prepareNextSource();
            return true;
        }
        if (!this.previous && !this._sources.length && !this.generatedError) {
            this.end();
            return true;
        }
    };

    /**
     * @see GenericWorker.error
     */
    ZipFileWorker$1.prototype.error = function (e) {
        var sources = this._sources;
        if(!GenericWorker$2.prototype.error.call(this, e)) {
            return false;
        }
        for(var i = 0; i < sources.length; i++) {
            try {
                sources[i].error(e);
            } catch(e) {
                // the `error` exploded, nothing to do
            }
        }
        return true;
    };

    /**
     * @see GenericWorker.lock
     */
    ZipFileWorker$1.prototype.lock = function () {
        GenericWorker$2.prototype.lock.call(this);
        var sources = this._sources;
        for(var i = 0; i < sources.length; i++) {
            sources[i].lock();
        }
    };

    var ZipFileWorker_1 = ZipFileWorker$1;

    var compressions$1 = compressions$2;
    var ZipFileWorker = ZipFileWorker_1;

    /**
     * Find the compression to use.
     * @param {String} fileCompression the compression defined at the file level, if any.
     * @param {String} zipCompression the compression defined at the load() level.
     * @return {Object} the compression object to use.
     */
    var getCompression = function (fileCompression, zipCompression) {

        var compressionName = fileCompression || zipCompression;
        var compression = compressions$1[compressionName];
        if (!compression) {
            throw new Error(compressionName + " is not a valid compression method !");
        }
        return compression;
    };

    /**
     * Create a worker to generate a zip file.
     * @param {JSZip} zip the JSZip instance at the right root level.
     * @param {Object} options to generate the zip file.
     * @param {String} comment the comment to use.
     */
    generate$1.generateWorker = function (zip, options, comment) {

        var zipFileWorker = new ZipFileWorker(options.streamFiles, comment, options.platform, options.encodeFileName);
        var entriesCount = 0;
        try {

            zip.forEach(function (relativePath, file) {
                entriesCount++;
                var compression = getCompression(file.options.compression, options.compression);
                var compressionOptions = file.options.compressionOptions || options.compressionOptions || {};
                var dir = file.dir, date = file.date;

                file._compressWorker(compression, compressionOptions)
                    .withStreamInfo("file", {
                        name : relativePath,
                        dir : dir,
                        date : date,
                        comment : file.comment || "",
                        unixPermissions : file.unixPermissions,
                        dosPermissions : file.dosPermissions
                    })
                    .pipe(zipFileWorker);
            });
            zipFileWorker.entriesCount = entriesCount;
        } catch (e) {
            zipFileWorker.error(e);
        }

        return zipFileWorker;
    };

    var utils$a = requireUtils();
    var GenericWorker$1 = GenericWorker_1;

    /**
     * A worker that use a nodejs stream as source.
     * @constructor
     * @param {String} filename the name of the file entry for this stream.
     * @param {Readable} stream the nodejs stream.
     */
    function NodejsStreamInputAdapter$1(filename, stream) {
        GenericWorker$1.call(this, "Nodejs stream input adapter for " + filename);
        this._upstreamEnded = false;
        this._bindStream(stream);
    }

    utils$a.inherits(NodejsStreamInputAdapter$1, GenericWorker$1);

    /**
     * Prepare the stream and bind the callbacks on it.
     * Do this ASAP on node 0.10 ! A lazy binding doesn't always work.
     * @param {Stream} stream the nodejs stream to use.
     */
    NodejsStreamInputAdapter$1.prototype._bindStream = function (stream) {
        var self = this;
        this._stream = stream;
        stream.pause();
        stream
            .on("data", function (chunk) {
                self.push({
                    data: chunk,
                    meta : {
                        percent : 0
                    }
                });
            })
            .on("error", function (e) {
                if(self.isPaused) {
                    this.generatedError = e;
                } else {
                    self.error(e);
                }
            })
            .on("end", function () {
                if(self.isPaused) {
                    self._upstreamEnded = true;
                } else {
                    self.end();
                }
            });
    };
    NodejsStreamInputAdapter$1.prototype.pause = function () {
        if(!GenericWorker$1.prototype.pause.call(this)) {
            return false;
        }
        this._stream.pause();
        return true;
    };
    NodejsStreamInputAdapter$1.prototype.resume = function () {
        if(!GenericWorker$1.prototype.resume.call(this)) {
            return false;
        }

        if(this._upstreamEnded) {
            this.end();
        } else {
            this._stream.resume();
        }

        return true;
    };

    var NodejsStreamInputAdapter_1 = NodejsStreamInputAdapter$1;

    var utf8$2 = utf8$5;
    var utils$9 = requireUtils();
    var GenericWorker = GenericWorker_1;
    var StreamHelper = StreamHelper_1;
    var defaults = defaults$1;
    var CompressedObject$1 = compressedObject;
    var ZipObject = zipObject;
    var generate = generate$1;
    var nodejsUtils$1 = nodejsUtils$2;
    var NodejsStreamInputAdapter = NodejsStreamInputAdapter_1;


    /**
     * Add a file in the current folder.
     * @private
     * @param {string} name the name of the file
     * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data of the file
     * @param {Object} originalOptions the options of the file
     * @return {Object} the new file.
     */
    var fileAdd = function(name, data, originalOptions) {
        // be sure sub folders exist
        var dataType = utils$9.getTypeOf(data),
            parent;


        /*
         * Correct options.
         */

        var o = utils$9.extend(originalOptions || {}, defaults);
        o.date = o.date || new Date();
        if (o.compression !== null) {
            o.compression = o.compression.toUpperCase();
        }

        if (typeof o.unixPermissions === "string") {
            o.unixPermissions = parseInt(o.unixPermissions, 8);
        }

        // UNX_IFDIR  0040000 see zipinfo.c
        if (o.unixPermissions && (o.unixPermissions & 0x4000)) {
            o.dir = true;
        }
        // Bit 4    Directory
        if (o.dosPermissions && (o.dosPermissions & 0x0010)) {
            o.dir = true;
        }

        if (o.dir) {
            name = forceTrailingSlash(name);
        }
        if (o.createFolders && (parent = parentFolder(name))) {
            folderAdd.call(this, parent, true);
        }

        var isUnicodeString = dataType === "string" && o.binary === false && o.base64 === false;
        if (!originalOptions || typeof originalOptions.binary === "undefined") {
            o.binary = !isUnicodeString;
        }


        var isCompressedEmpty = (data instanceof CompressedObject$1) && data.uncompressedSize === 0;

        if (isCompressedEmpty || o.dir || !data || data.length === 0) {
            o.base64 = false;
            o.binary = true;
            data = "";
            o.compression = "STORE";
            dataType = "string";
        }

        /*
         * Convert content to fit.
         */

        var zipObjectContent = null;
        if (data instanceof CompressedObject$1 || data instanceof GenericWorker) {
            zipObjectContent = data;
        } else if (nodejsUtils$1.isNode && nodejsUtils$1.isStream(data)) {
            zipObjectContent = new NodejsStreamInputAdapter(name, data);
        } else {
            zipObjectContent = utils$9.prepareContent(name, data, o.binary, o.optimizedBinaryString, o.base64);
        }

        var object = new ZipObject(name, zipObjectContent, o);
        this.files[name] = object;
        /*
        TODO: we can't throw an exception because we have async promises
        (we can have a promise of a Date() for example) but returning a
        promise is useless because file(name, data) returns the JSZip
        object for chaining. Should we break that to allow the user
        to catch the error ?

        return external.Promise.resolve(zipObjectContent)
        .then(function () {
            return object;
        });
        */
    };

    /**
     * Find the parent folder of the path.
     * @private
     * @param {string} path the path to use
     * @return {string} the parent folder, or ""
     */
    var parentFolder = function (path) {
        if (path.slice(-1) === "/") {
            path = path.substring(0, path.length - 1);
        }
        var lastSlash = path.lastIndexOf("/");
        return (lastSlash > 0) ? path.substring(0, lastSlash) : "";
    };

    /**
     * Returns the path with a slash at the end.
     * @private
     * @param {String} path the path to check.
     * @return {String} the path with a trailing slash.
     */
    var forceTrailingSlash = function(path) {
        // Check the name ends with a /
        if (path.slice(-1) !== "/") {
            path += "/"; // IE doesn't like substr(-1)
        }
        return path;
    };

    /**
     * Add a (sub) folder in the current folder.
     * @private
     * @param {string} name the folder's name
     * @param {boolean=} [createFolders] If true, automatically create sub
     *  folders. Defaults to false.
     * @return {Object} the new folder.
     */
    var folderAdd = function(name, createFolders) {
        createFolders = (typeof createFolders !== "undefined") ? createFolders : defaults.createFolders;

        name = forceTrailingSlash(name);

        // Does this folder already exist?
        if (!this.files[name]) {
            fileAdd.call(this, name, null, {
                dir: true,
                createFolders: createFolders
            });
        }
        return this.files[name];
    };

    /**
    * Cross-window, cross-Node-context regular expression detection
    * @param  {Object}  object Anything
    * @return {Boolean}        true if the object is a regular expression,
    * false otherwise
    */
    function isRegExp(object) {
        return Object.prototype.toString.call(object) === "[object RegExp]";
    }

    // return the actual prototype of JSZip
    var out = {
        /**
         * @see loadAsync
         */
        load: function() {
            throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        },


        /**
         * Call a callback function for each entry at this folder level.
         * @param {Function} cb the callback function:
         * function (relativePath, file) {...}
         * It takes 2 arguments : the relative path and the file.
         */
        forEach: function(cb) {
            var filename, relativePath, file;
            // ignore warning about unwanted properties because this.files is a null prototype object
            /* eslint-disable-next-line guard-for-in */
            for (filename in this.files) {
                file = this.files[filename];
                relativePath = filename.slice(this.root.length, filename.length);
                if (relativePath && filename.slice(0, this.root.length) === this.root) { // the file is in the current root
                    cb(relativePath, file); // TODO reverse the parameters ? need to be clean AND consistent with the filter search fn...
                }
            }
        },

        /**
         * Filter nested files/folders with the specified function.
         * @param {Function} search the predicate to use :
         * function (relativePath, file) {...}
         * It takes 2 arguments : the relative path and the file.
         * @return {Array} An array of matching elements.
         */
        filter: function(search) {
            var result = [];
            this.forEach(function (relativePath, entry) {
                if (search(relativePath, entry)) { // the file matches the function
                    result.push(entry);
                }

            });
            return result;
        },

        /**
         * Add a file to the zip file, or search a file.
         * @param   {string|RegExp} name The name of the file to add (if data is defined),
         * the name of the file to find (if no data) or a regex to match files.
         * @param   {String|ArrayBuffer|Uint8Array|Buffer} data  The file data, either raw or base64 encoded
         * @param   {Object} o     File options
         * @return  {JSZip|Object|Array} this JSZip object (when adding a file),
         * a file (when searching by string) or an array of files (when searching by regex).
         */
        file: function(name, data, o) {
            if (arguments.length === 1) {
                if (isRegExp(name)) {
                    var regexp = name;
                    return this.filter(function(relativePath, file) {
                        return !file.dir && regexp.test(relativePath);
                    });
                }
                else { // text
                    var obj = this.files[this.root + name];
                    if (obj && !obj.dir) {
                        return obj;
                    } else {
                        return null;
                    }
                }
            }
            else { // more than one argument : we have data !
                name = this.root + name;
                fileAdd.call(this, name, data, o);
            }
            return this;
        },

        /**
         * Add a directory to the zip file, or search.
         * @param   {String|RegExp} arg The name of the directory to add, or a regex to search folders.
         * @return  {JSZip} an object with the new directory as the root, or an array containing matching folders.
         */
        folder: function(arg) {
            if (!arg) {
                return this;
            }

            if (isRegExp(arg)) {
                return this.filter(function(relativePath, file) {
                    return file.dir && arg.test(relativePath);
                });
            }

            // else, name is a new folder
            var name = this.root + arg;
            var newFolder = folderAdd.call(this, name);

            // Allow chaining by returning a new object with this folder as the root
            var ret = this.clone();
            ret.root = newFolder.name;
            return ret;
        },

        /**
         * Delete a file, or a directory and all sub-files, from the zip
         * @param {string} name the name of the file to delete
         * @return {JSZip} this JSZip object
         */
        remove: function(name) {
            name = this.root + name;
            var file = this.files[name];
            if (!file) {
                // Look for any folders
                if (name.slice(-1) !== "/") {
                    name += "/";
                }
                file = this.files[name];
            }

            if (file && !file.dir) {
                // file
                delete this.files[name];
            } else {
                // maybe a folder, delete recursively
                var kids = this.filter(function(relativePath, file) {
                    return file.name.slice(0, name.length) === name;
                });
                for (var i = 0; i < kids.length; i++) {
                    delete this.files[kids[i].name];
                }
            }

            return this;
        },

        /**
         * @deprecated This method has been removed in JSZip 3.0, please check the upgrade guide.
         */
        generate: function() {
            throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        },

        /**
         * Generate the complete zip file as an internal stream.
         * @param {Object} options the options to generate the zip file :
         * - compression, "STORE" by default.
         * - type, "base64" by default. Values are : string, base64, uint8array, arraybuffer, blob.
         * @return {StreamHelper} the streamed zip file.
         */
        generateInternalStream: function(options) {
            var worker, opts = {};
            try {
                opts = utils$9.extend(options || {}, {
                    streamFiles: false,
                    compression: "STORE",
                    compressionOptions : null,
                    type: "",
                    platform: "DOS",
                    comment: null,
                    mimeType: "application/zip",
                    encodeFileName: utf8$2.utf8encode
                });

                opts.type = opts.type.toLowerCase();
                opts.compression = opts.compression.toUpperCase();

                // "binarystring" is preferred but the internals use "string".
                if(opts.type === "binarystring") {
                    opts.type = "string";
                }

                if (!opts.type) {
                    throw new Error("No output type specified.");
                }

                utils$9.checkSupport(opts.type);

                // accept nodejs `process.platform`
                if(
                    opts.platform === "darwin" ||
                    opts.platform === "freebsd" ||
                    opts.platform === "linux" ||
                    opts.platform === "sunos"
                ) {
                    opts.platform = "UNIX";
                }
                if (opts.platform === "win32") {
                    opts.platform = "DOS";
                }

                var comment = opts.comment || this.comment || "";
                worker = generate.generateWorker(this, opts, comment);
            } catch (e) {
                worker = new GenericWorker("error");
                worker.error(e);
            }
            return new StreamHelper(worker, opts.type || "string", opts.mimeType);
        },
        /**
         * Generate the complete zip file asynchronously.
         * @see generateInternalStream
         */
        generateAsync: function(options, onUpdate) {
            return this.generateInternalStream(options).accumulate(onUpdate);
        },
        /**
         * Generate the complete zip file asynchronously.
         * @see generateInternalStream
         */
        generateNodeStream: function(options, onUpdate) {
            options = options || {};
            if (!options.type) {
                options.type = "nodebuffer";
            }
            return this.generateInternalStream(options).toNodejsStream(onUpdate);
        }
    };
    var object = out;

    var utils$8 = requireUtils();

    function DataReader$2(data) {
        this.data = data; // type : see implementation
        this.length = data.length;
        this.index = 0;
        this.zero = 0;
    }
    DataReader$2.prototype = {
        /**
         * Check that the offset will not go too far.
         * @param {string} offset the additional offset to check.
         * @throws {Error} an Error if the offset is out of bounds.
         */
        checkOffset: function(offset) {
            this.checkIndex(this.index + offset);
        },
        /**
         * Check that the specified index will not be too far.
         * @param {string} newIndex the index to check.
         * @throws {Error} an Error if the index is out of bounds.
         */
        checkIndex: function(newIndex) {
            if (this.length < this.zero + newIndex || newIndex < 0) {
                throw new Error("End of data reached (data length = " + this.length + ", asked index = " + (newIndex) + "). Corrupted zip ?");
            }
        },
        /**
         * Change the index.
         * @param {number} newIndex The new index.
         * @throws {Error} if the new index is out of the data.
         */
        setIndex: function(newIndex) {
            this.checkIndex(newIndex);
            this.index = newIndex;
        },
        /**
         * Skip the next n bytes.
         * @param {number} n the number of bytes to skip.
         * @throws {Error} if the new index is out of the data.
         */
        skip: function(n) {
            this.setIndex(this.index + n);
        },
        /**
         * Get the byte at the specified index.
         * @param {number} i the index to use.
         * @return {number} a byte.
         */
        byteAt: function() {
            // see implementations
        },
        /**
         * Get the next number with a given byte size.
         * @param {number} size the number of bytes to read.
         * @return {number} the corresponding number.
         */
        readInt: function(size) {
            var result = 0,
                i;
            this.checkOffset(size);
            for (i = this.index + size - 1; i >= this.index; i--) {
                result = (result << 8) + this.byteAt(i);
            }
            this.index += size;
            return result;
        },
        /**
         * Get the next string with a given byte size.
         * @param {number} size the number of bytes to read.
         * @return {string} the corresponding string.
         */
        readString: function(size) {
            return utils$8.transformTo("string", this.readData(size));
        },
        /**
         * Get raw data without conversion, <size> bytes.
         * @param {number} size the number of bytes to read.
         * @return {Object} the raw data, implementation specific.
         */
        readData: function() {
            // see implementations
        },
        /**
         * Find the last occurrence of a zip signature (4 bytes).
         * @param {string} sig the signature to find.
         * @return {number} the index of the last occurrence, -1 if not found.
         */
        lastIndexOfSignature: function() {
            // see implementations
        },
        /**
         * Read the signature (4 bytes) at the current position and compare it with sig.
         * @param {string} sig the expected signature
         * @return {boolean} true if the signature matches, false otherwise.
         */
        readAndCheckSignature: function() {
            // see implementations
        },
        /**
         * Get the next date.
         * @return {Date} the date.
         */
        readDate: function() {
            var dostime = this.readInt(4);
            return new Date(Date.UTC(
                ((dostime >> 25) & 0x7f) + 1980, // year
                ((dostime >> 21) & 0x0f) - 1, // month
                (dostime >> 16) & 0x1f, // day
                (dostime >> 11) & 0x1f, // hour
                (dostime >> 5) & 0x3f, // minute
                (dostime & 0x1f) << 1)); // second
        }
    };
    var DataReader_1 = DataReader$2;

    var DataReader$1 = DataReader_1;
    var utils$7 = requireUtils();

    function ArrayReader$2(data) {
        DataReader$1.call(this, data);
        for(var i = 0; i < this.data.length; i++) {
            data[i] = data[i] & 0xFF;
        }
    }
    utils$7.inherits(ArrayReader$2, DataReader$1);
    /**
     * @see DataReader.byteAt
     */
    ArrayReader$2.prototype.byteAt = function(i) {
        return this.data[this.zero + i];
    };
    /**
     * @see DataReader.lastIndexOfSignature
     */
    ArrayReader$2.prototype.lastIndexOfSignature = function(sig) {
        var sig0 = sig.charCodeAt(0),
            sig1 = sig.charCodeAt(1),
            sig2 = sig.charCodeAt(2),
            sig3 = sig.charCodeAt(3);
        for (var i = this.length - 4; i >= 0; --i) {
            if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) {
                return i - this.zero;
            }
        }

        return -1;
    };
    /**
     * @see DataReader.readAndCheckSignature
     */
    ArrayReader$2.prototype.readAndCheckSignature = function (sig) {
        var sig0 = sig.charCodeAt(0),
            sig1 = sig.charCodeAt(1),
            sig2 = sig.charCodeAt(2),
            sig3 = sig.charCodeAt(3),
            data = this.readData(4);
        return sig0 === data[0] && sig1 === data[1] && sig2 === data[2] && sig3 === data[3];
    };
    /**
     * @see DataReader.readData
     */
    ArrayReader$2.prototype.readData = function(size) {
        this.checkOffset(size);
        if(size === 0) {
            return [];
        }
        var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
        this.index += size;
        return result;
    };
    var ArrayReader_1 = ArrayReader$2;

    var DataReader = DataReader_1;
    var utils$6 = requireUtils();

    function StringReader$1(data) {
        DataReader.call(this, data);
    }
    utils$6.inherits(StringReader$1, DataReader);
    /**
     * @see DataReader.byteAt
     */
    StringReader$1.prototype.byteAt = function(i) {
        return this.data.charCodeAt(this.zero + i);
    };
    /**
     * @see DataReader.lastIndexOfSignature
     */
    StringReader$1.prototype.lastIndexOfSignature = function(sig) {
        return this.data.lastIndexOf(sig) - this.zero;
    };
    /**
     * @see DataReader.readAndCheckSignature
     */
    StringReader$1.prototype.readAndCheckSignature = function (sig) {
        var data = this.readData(4);
        return sig === data;
    };
    /**
     * @see DataReader.readData
     */
    StringReader$1.prototype.readData = function(size) {
        this.checkOffset(size);
        // this will work because the constructor applied the "& 0xff" mask.
        var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
        this.index += size;
        return result;
    };
    var StringReader_1 = StringReader$1;

    var ArrayReader$1 = ArrayReader_1;
    var utils$5 = requireUtils();

    function Uint8ArrayReader$2(data) {
        ArrayReader$1.call(this, data);
    }
    utils$5.inherits(Uint8ArrayReader$2, ArrayReader$1);
    /**
     * @see DataReader.readData
     */
    Uint8ArrayReader$2.prototype.readData = function(size) {
        this.checkOffset(size);
        if(size === 0) {
            // in IE10, when using subarray(idx, idx), we get the array [0x00] instead of [].
            return new Uint8Array(0);
        }
        var result = this.data.subarray(this.zero + this.index, this.zero + this.index + size);
        this.index += size;
        return result;
    };
    var Uint8ArrayReader_1 = Uint8ArrayReader$2;

    var Uint8ArrayReader$1 = Uint8ArrayReader_1;
    var utils$4 = requireUtils();

    function NodeBufferReader$1(data) {
        Uint8ArrayReader$1.call(this, data);
    }
    utils$4.inherits(NodeBufferReader$1, Uint8ArrayReader$1);

    /**
     * @see DataReader.readData
     */
    NodeBufferReader$1.prototype.readData = function(size) {
        this.checkOffset(size);
        var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
        this.index += size;
        return result;
    };
    var NodeBufferReader_1 = NodeBufferReader$1;

    var utils$3 = requireUtils();
    var support$2 = support$4;
    var ArrayReader = ArrayReader_1;
    var StringReader = StringReader_1;
    var NodeBufferReader = NodeBufferReader_1;
    var Uint8ArrayReader = Uint8ArrayReader_1;

    /**
     * Create a reader adapted to the data.
     * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data to read.
     * @return {DataReader} the data reader.
     */
    var readerFor$2 = function (data) {
        var type = utils$3.getTypeOf(data);
        utils$3.checkSupport(type);
        if (type === "string" && !support$2.uint8array) {
            return new StringReader(data);
        }
        if (type === "nodebuffer") {
            return new NodeBufferReader(data);
        }
        if (support$2.uint8array) {
            return new Uint8ArrayReader(utils$3.transformTo("uint8array", data));
        }
        return new ArrayReader(utils$3.transformTo("array", data));
    };

    var readerFor$1 = readerFor$2;
    var utils$2 = requireUtils();
    var CompressedObject = compressedObject;
    var crc32fn = crc32_1$1;
    var utf8$1 = utf8$5;
    var compressions = compressions$2;
    var support$1 = support$4;

    var MADE_BY_DOS = 0x00;
    var MADE_BY_UNIX = 0x03;

    /**
     * Find a compression registered in JSZip.
     * @param {string} compressionMethod the method magic to find.
     * @return {Object|null} the JSZip compression object, null if none found.
     */
    var findCompression = function(compressionMethod) {
        for (var method in compressions) {
            if (!Object.prototype.hasOwnProperty.call(compressions, method)) {
                continue;
            }
            if (compressions[method].magic === compressionMethod) {
                return compressions[method];
            }
        }
        return null;
    };

    // class ZipEntry {{{
    /**
     * An entry in the zip file.
     * @constructor
     * @param {Object} options Options of the current file.
     * @param {Object} loadOptions Options for loading the stream.
     */
    function ZipEntry$1(options, loadOptions) {
        this.options = options;
        this.loadOptions = loadOptions;
    }
    ZipEntry$1.prototype = {
        /**
         * say if the file is encrypted.
         * @return {boolean} true if the file is encrypted, false otherwise.
         */
        isEncrypted: function() {
            // bit 1 is set
            return (this.bitFlag & 0x0001) === 0x0001;
        },
        /**
         * say if the file has utf-8 filename/comment.
         * @return {boolean} true if the filename/comment is in utf-8, false otherwise.
         */
        useUTF8: function() {
            // bit 11 is set
            return (this.bitFlag & 0x0800) === 0x0800;
        },
        /**
         * Read the local part of a zip file and add the info in this object.
         * @param {DataReader} reader the reader to use.
         */
        readLocalPart: function(reader) {
            var compression, localExtraFieldsLength;

            // we already know everything from the central dir !
            // If the central dir data are false, we are doomed.
            // On the bright side, the local part is scary  : zip64, data descriptors, both, etc.
            // The less data we get here, the more reliable this should be.
            // Let's skip the whole header and dash to the data !
            reader.skip(22);
            // in some zip created on windows, the filename stored in the central dir contains \ instead of /.
            // Strangely, the filename here is OK.
            // I would love to treat these zip files as corrupted (see http://www.info-zip.org/FAQ.html#backslashes
            // or APPNOTE#4.4.17.1, "All slashes MUST be forward slashes '/'") but there are a lot of bad zip generators...
            // Search "unzip mismatching "local" filename continuing with "central" filename version" on
            // the internet.
            //
            // I think I see the logic here : the central directory is used to display
            // content and the local directory is used to extract the files. Mixing / and \
            // may be used to display \ to windows users and use / when extracting the files.
            // Unfortunately, this lead also to some issues : http://seclists.org/fulldisclosure/2009/Sep/394
            this.fileNameLength = reader.readInt(2);
            localExtraFieldsLength = reader.readInt(2); // can't be sure this will be the same as the central dir
            // the fileName is stored as binary data, the handleUTF8 method will take care of the encoding.
            this.fileName = reader.readData(this.fileNameLength);
            reader.skip(localExtraFieldsLength);

            if (this.compressedSize === -1 || this.uncompressedSize === -1) {
                throw new Error("Bug or corrupted zip : didn't get enough information from the central directory " + "(compressedSize === -1 || uncompressedSize === -1)");
            }

            compression = findCompression(this.compressionMethod);
            if (compression === null) { // no compression found
                throw new Error("Corrupted zip : compression " + utils$2.pretty(this.compressionMethod) + " unknown (inner file : " + utils$2.transformTo("string", this.fileName) + ")");
            }
            this.decompressed = new CompressedObject(this.compressedSize, this.uncompressedSize, this.crc32, compression, reader.readData(this.compressedSize));
        },

        /**
         * Read the central part of a zip file and add the info in this object.
         * @param {DataReader} reader the reader to use.
         */
        readCentralPart: function(reader) {
            this.versionMadeBy = reader.readInt(2);
            reader.skip(2);
            // this.versionNeeded = reader.readInt(2);
            this.bitFlag = reader.readInt(2);
            this.compressionMethod = reader.readString(2);
            this.date = reader.readDate();
            this.crc32 = reader.readInt(4);
            this.compressedSize = reader.readInt(4);
            this.uncompressedSize = reader.readInt(4);
            var fileNameLength = reader.readInt(2);
            this.extraFieldsLength = reader.readInt(2);
            this.fileCommentLength = reader.readInt(2);
            this.diskNumberStart = reader.readInt(2);
            this.internalFileAttributes = reader.readInt(2);
            this.externalFileAttributes = reader.readInt(4);
            this.localHeaderOffset = reader.readInt(4);

            if (this.isEncrypted()) {
                throw new Error("Encrypted zip are not supported");
            }

            // will be read in the local part, see the comments there
            reader.skip(fileNameLength);
            this.readExtraFields(reader);
            this.parseZIP64ExtraField(reader);
            this.fileComment = reader.readData(this.fileCommentLength);
        },

        /**
         * Parse the external file attributes and get the unix/dos permissions.
         */
        processAttributes: function () {
            this.unixPermissions = null;
            this.dosPermissions = null;
            var madeBy = this.versionMadeBy >> 8;

            // Check if we have the DOS directory flag set.
            // We look for it in the DOS and UNIX permissions
            // but some unknown platform could set it as a compatibility flag.
            this.dir = this.externalFileAttributes & 0x0010 ? true : false;

            if(madeBy === MADE_BY_DOS) {
                // first 6 bits (0 to 5)
                this.dosPermissions = this.externalFileAttributes & 0x3F;
            }

            if(madeBy === MADE_BY_UNIX) {
                this.unixPermissions = (this.externalFileAttributes >> 16) & 0xFFFF;
                // the octal permissions are in (this.unixPermissions & 0x01FF).toString(8);
            }

            // fail safe : if the name ends with a / it probably means a folder
            if (!this.dir && this.fileNameStr.slice(-1) === "/") {
                this.dir = true;
            }
        },

        /**
         * Parse the ZIP64 extra field and merge the info in the current ZipEntry.
         * @param {DataReader} reader the reader to use.
         */
        parseZIP64ExtraField: function() {
            if (!this.extraFields[0x0001]) {
                return;
            }

            // should be something, preparing the extra reader
            var extraReader = readerFor$1(this.extraFields[0x0001].value);

            // I really hope that these 64bits integer can fit in 32 bits integer, because js
            // won't let us have more.
            if (this.uncompressedSize === utils$2.MAX_VALUE_32BITS) {
                this.uncompressedSize = extraReader.readInt(8);
            }
            if (this.compressedSize === utils$2.MAX_VALUE_32BITS) {
                this.compressedSize = extraReader.readInt(8);
            }
            if (this.localHeaderOffset === utils$2.MAX_VALUE_32BITS) {
                this.localHeaderOffset = extraReader.readInt(8);
            }
            if (this.diskNumberStart === utils$2.MAX_VALUE_32BITS) {
                this.diskNumberStart = extraReader.readInt(4);
            }
        },
        /**
         * Read the central part of a zip file and add the info in this object.
         * @param {DataReader} reader the reader to use.
         */
        readExtraFields: function(reader) {
            var end = reader.index + this.extraFieldsLength,
                extraFieldId,
                extraFieldLength,
                extraFieldValue;

            if (!this.extraFields) {
                this.extraFields = {};
            }

            while (reader.index + 4 < end) {
                extraFieldId = reader.readInt(2);
                extraFieldLength = reader.readInt(2);
                extraFieldValue = reader.readData(extraFieldLength);

                this.extraFields[extraFieldId] = {
                    id: extraFieldId,
                    length: extraFieldLength,
                    value: extraFieldValue
                };
            }

            reader.setIndex(end);
        },
        /**
         * Apply an UTF8 transformation if needed.
         */
        handleUTF8: function() {
            var decodeParamType = support$1.uint8array ? "uint8array" : "array";
            if (this.useUTF8()) {
                this.fileNameStr = utf8$1.utf8decode(this.fileName);
                this.fileCommentStr = utf8$1.utf8decode(this.fileComment);
            } else {
                var upath = this.findExtraFieldUnicodePath();
                if (upath !== null) {
                    this.fileNameStr = upath;
                } else {
                    // ASCII text or unsupported code page
                    var fileNameByteArray =  utils$2.transformTo(decodeParamType, this.fileName);
                    this.fileNameStr = this.loadOptions.decodeFileName(fileNameByteArray);
                }

                var ucomment = this.findExtraFieldUnicodeComment();
                if (ucomment !== null) {
                    this.fileCommentStr = ucomment;
                } else {
                    // ASCII text or unsupported code page
                    var commentByteArray =  utils$2.transformTo(decodeParamType, this.fileComment);
                    this.fileCommentStr = this.loadOptions.decodeFileName(commentByteArray);
                }
            }
        },

        /**
         * Find the unicode path declared in the extra field, if any.
         * @return {String} the unicode path, null otherwise.
         */
        findExtraFieldUnicodePath: function() {
            var upathField = this.extraFields[0x7075];
            if (upathField) {
                var extraReader = readerFor$1(upathField.value);

                // wrong version
                if (extraReader.readInt(1) !== 1) {
                    return null;
                }

                // the crc of the filename changed, this field is out of date.
                if (crc32fn(this.fileName) !== extraReader.readInt(4)) {
                    return null;
                }

                return utf8$1.utf8decode(extraReader.readData(upathField.length - 5));
            }
            return null;
        },

        /**
         * Find the unicode comment declared in the extra field, if any.
         * @return {String} the unicode comment, null otherwise.
         */
        findExtraFieldUnicodeComment: function() {
            var ucommentField = this.extraFields[0x6375];
            if (ucommentField) {
                var extraReader = readerFor$1(ucommentField.value);

                // wrong version
                if (extraReader.readInt(1) !== 1) {
                    return null;
                }

                // the crc of the comment changed, this field is out of date.
                if (crc32fn(this.fileComment) !== extraReader.readInt(4)) {
                    return null;
                }

                return utf8$1.utf8decode(extraReader.readData(ucommentField.length - 5));
            }
            return null;
        }
    };
    var zipEntry = ZipEntry$1;

    var readerFor = readerFor$2;
    var utils$1 = requireUtils();
    var sig = signature$1;
    var ZipEntry = zipEntry;
    var support = support$4;
    //  class ZipEntries {{{
    /**
     * All the entries in the zip file.
     * @constructor
     * @param {Object} loadOptions Options for loading the stream.
     */
    function ZipEntries$1(loadOptions) {
        this.files = [];
        this.loadOptions = loadOptions;
    }
    ZipEntries$1.prototype = {
        /**
         * Check that the reader is on the specified signature.
         * @param {string} expectedSignature the expected signature.
         * @throws {Error} if it is an other signature.
         */
        checkSignature: function(expectedSignature) {
            if (!this.reader.readAndCheckSignature(expectedSignature)) {
                this.reader.index -= 4;
                var signature = this.reader.readString(4);
                throw new Error("Corrupted zip or bug: unexpected signature " + "(" + utils$1.pretty(signature) + ", expected " + utils$1.pretty(expectedSignature) + ")");
            }
        },
        /**
         * Check if the given signature is at the given index.
         * @param {number} askedIndex the index to check.
         * @param {string} expectedSignature the signature to expect.
         * @return {boolean} true if the signature is here, false otherwise.
         */
        isSignature: function(askedIndex, expectedSignature) {
            var currentIndex = this.reader.index;
            this.reader.setIndex(askedIndex);
            var signature = this.reader.readString(4);
            var result = signature === expectedSignature;
            this.reader.setIndex(currentIndex);
            return result;
        },
        /**
         * Read the end of the central directory.
         */
        readBlockEndOfCentral: function() {
            this.diskNumber = this.reader.readInt(2);
            this.diskWithCentralDirStart = this.reader.readInt(2);
            this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
            this.centralDirRecords = this.reader.readInt(2);
            this.centralDirSize = this.reader.readInt(4);
            this.centralDirOffset = this.reader.readInt(4);

            this.zipCommentLength = this.reader.readInt(2);
            // warning : the encoding depends of the system locale
            // On a linux machine with LANG=en_US.utf8, this field is utf8 encoded.
            // On a windows machine, this field is encoded with the localized windows code page.
            var zipComment = this.reader.readData(this.zipCommentLength);
            var decodeParamType = support.uint8array ? "uint8array" : "array";
            // To get consistent behavior with the generation part, we will assume that
            // this is utf8 encoded unless specified otherwise.
            var decodeContent = utils$1.transformTo(decodeParamType, zipComment);
            this.zipComment = this.loadOptions.decodeFileName(decodeContent);
        },
        /**
         * Read the end of the Zip 64 central directory.
         * Not merged with the method readEndOfCentral :
         * The end of central can coexist with its Zip64 brother,
         * I don't want to read the wrong number of bytes !
         */
        readBlockZip64EndOfCentral: function() {
            this.zip64EndOfCentralSize = this.reader.readInt(8);
            this.reader.skip(4);
            // this.versionMadeBy = this.reader.readString(2);
            // this.versionNeeded = this.reader.readInt(2);
            this.diskNumber = this.reader.readInt(4);
            this.diskWithCentralDirStart = this.reader.readInt(4);
            this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
            this.centralDirRecords = this.reader.readInt(8);
            this.centralDirSize = this.reader.readInt(8);
            this.centralDirOffset = this.reader.readInt(8);

            this.zip64ExtensibleData = {};
            var extraDataSize = this.zip64EndOfCentralSize - 44,
                index = 0,
                extraFieldId,
                extraFieldLength,
                extraFieldValue;
            while (index < extraDataSize) {
                extraFieldId = this.reader.readInt(2);
                extraFieldLength = this.reader.readInt(4);
                extraFieldValue = this.reader.readData(extraFieldLength);
                this.zip64ExtensibleData[extraFieldId] = {
                    id: extraFieldId,
                    length: extraFieldLength,
                    value: extraFieldValue
                };
            }
        },
        /**
         * Read the end of the Zip 64 central directory locator.
         */
        readBlockZip64EndOfCentralLocator: function() {
            this.diskWithZip64CentralDirStart = this.reader.readInt(4);
            this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
            this.disksCount = this.reader.readInt(4);
            if (this.disksCount > 1) {
                throw new Error("Multi-volumes zip are not supported");
            }
        },
        /**
         * Read the local files, based on the offset read in the central part.
         */
        readLocalFiles: function() {
            var i, file;
            for (i = 0; i < this.files.length; i++) {
                file = this.files[i];
                this.reader.setIndex(file.localHeaderOffset);
                this.checkSignature(sig.LOCAL_FILE_HEADER);
                file.readLocalPart(this.reader);
                file.handleUTF8();
                file.processAttributes();
            }
        },
        /**
         * Read the central directory.
         */
        readCentralDir: function() {
            var file;

            this.reader.setIndex(this.centralDirOffset);
            while (this.reader.readAndCheckSignature(sig.CENTRAL_FILE_HEADER)) {
                file = new ZipEntry({
                    zip64: this.zip64
                }, this.loadOptions);
                file.readCentralPart(this.reader);
                this.files.push(file);
            }

            if (this.centralDirRecords !== this.files.length) {
                if (this.centralDirRecords !== 0 && this.files.length === 0) {
                    // We expected some records but couldn't find ANY.
                    // This is really suspicious, as if something went wrong.
                    throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
                }
            }
        },
        /**
         * Read the end of central directory.
         */
        readEndOfCentral: function() {
            var offset = this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);
            if (offset < 0) {
                // Check if the content is a truncated zip or complete garbage.
                // A "LOCAL_FILE_HEADER" is not required at the beginning (auto
                // extractible zip for example) but it can give a good hint.
                // If an ajax request was used without responseType, we will also
                // get unreadable data.
                var isGarbage = !this.isSignature(0, sig.LOCAL_FILE_HEADER);

                if (isGarbage) {
                    throw new Error("Can't find end of central directory : is this a zip file ? " +
                                    "If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
                } else {
                    throw new Error("Corrupted zip: can't find end of central directory");
                }

            }
            this.reader.setIndex(offset);
            var endOfCentralDirOffset = offset;
            this.checkSignature(sig.CENTRAL_DIRECTORY_END);
            this.readBlockEndOfCentral();


            /* extract from the zip spec :
                4)  If one of the fields in the end of central directory
                    record is too small to hold required data, the field
                    should be set to -1 (0xFFFF or 0xFFFFFFFF) and the
                    ZIP64 format record should be created.
                5)  The end of central directory record and the
                    Zip64 end of central directory locator record must
                    reside on the same disk when splitting or spanning
                    an archive.
             */
            if (this.diskNumber === utils$1.MAX_VALUE_16BITS || this.diskWithCentralDirStart === utils$1.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === utils$1.MAX_VALUE_16BITS || this.centralDirRecords === utils$1.MAX_VALUE_16BITS || this.centralDirSize === utils$1.MAX_VALUE_32BITS || this.centralDirOffset === utils$1.MAX_VALUE_32BITS) {
                this.zip64 = true;

                /*
                Warning : the zip64 extension is supported, but ONLY if the 64bits integer read from
                the zip file can fit into a 32bits integer. This cannot be solved : JavaScript represents
                all numbers as 64-bit double precision IEEE 754 floating point numbers.
                So, we have 53bits for integers and bitwise operations treat everything as 32bits.
                see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Bitwise_Operators
                and http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf section 8.5
                */

                // should look for a zip64 EOCD locator
                offset = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
                if (offset < 0) {
                    throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
                }
                this.reader.setIndex(offset);
                this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
                this.readBlockZip64EndOfCentralLocator();

                // now the zip64 EOCD record
                if (!this.isSignature(this.relativeOffsetEndOfZip64CentralDir, sig.ZIP64_CENTRAL_DIRECTORY_END)) {
                    // console.warn("ZIP64 end of central directory not where expected.");
                    this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
                    if (this.relativeOffsetEndOfZip64CentralDir < 0) {
                        throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
                    }
                }
                this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
                this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
                this.readBlockZip64EndOfCentral();
            }

            var expectedEndOfCentralDirOffset = this.centralDirOffset + this.centralDirSize;
            if (this.zip64) {
                expectedEndOfCentralDirOffset += 20; // end of central dir 64 locator
                expectedEndOfCentralDirOffset += 12 /* should not include the leading 12 bytes */ + this.zip64EndOfCentralSize;
            }

            var extraBytes = endOfCentralDirOffset - expectedEndOfCentralDirOffset;

            if (extraBytes > 0) {
                // console.warn(extraBytes, "extra bytes at beginning or within zipfile");
                if (this.isSignature(endOfCentralDirOffset, sig.CENTRAL_FILE_HEADER)) ; else {
                    // the offset is wrong, update the "zero" of the reader
                    // this happens if data has been prepended (crx files for example)
                    this.reader.zero = extraBytes;
                }
            } else if (extraBytes < 0) {
                throw new Error("Corrupted zip: missing " + Math.abs(extraBytes) + " bytes.");
            }
        },
        prepareReader: function(data) {
            this.reader = readerFor(data);
        },
        /**
         * Read a zip file and create ZipEntries.
         * @param {String|ArrayBuffer|Uint8Array|Buffer} data the binary string representing a zip file.
         */
        load: function(data) {
            this.prepareReader(data);
            this.readEndOfCentral();
            this.readCentralDir();
            this.readLocalFiles();
        }
    };
    // }}} end of ZipEntries
    var zipEntries = ZipEntries$1;

    var utils = requireUtils();
    var external = external$3;
    var utf8 = utf8$5;
    var ZipEntries = zipEntries;
    var Crc32Probe = Crc32Probe_1;
    var nodejsUtils = nodejsUtils$2;

    /**
     * Check the CRC32 of an entry.
     * @param {ZipEntry} zipEntry the zip entry to check.
     * @return {Promise} the result.
     */
    function checkEntryCRC32(zipEntry) {
        return new external.Promise(function (resolve, reject) {
            var worker = zipEntry.decompressed.getContentWorker().pipe(new Crc32Probe());
            worker.on("error", function (e) {
                reject(e);
            })
                .on("end", function () {
                    if (worker.streamInfo.crc32 !== zipEntry.decompressed.crc32) {
                        reject(new Error("Corrupted zip : CRC32 mismatch"));
                    } else {
                        resolve();
                    }
                })
                .resume();
        });
    }

    var load = function (data, options) {
        var zip = this;
        options = utils.extend(options || {}, {
            base64: false,
            checkCRC32: false,
            optimizedBinaryString: false,
            createFolders: false,
            decodeFileName: utf8.utf8decode
        });

        if (nodejsUtils.isNode && nodejsUtils.isStream(data)) {
            return external.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file."));
        }

        return utils.prepareContent("the loaded zip file", data, true, options.optimizedBinaryString, options.base64)
            .then(function (data) {
                var zipEntries = new ZipEntries(options);
                zipEntries.load(data);
                return zipEntries;
            }).then(function checkCRC32(zipEntries) {
                var promises = [external.Promise.resolve(zipEntries)];
                var files = zipEntries.files;
                if (options.checkCRC32) {
                    for (var i = 0; i < files.length; i++) {
                        promises.push(checkEntryCRC32(files[i]));
                    }
                }
                return external.Promise.all(promises);
            }).then(function addFiles(results) {
                var zipEntries = results.shift();
                var files = zipEntries.files;
                for (var i = 0; i < files.length; i++) {
                    var input = files[i];

                    var unsafeName = input.fileNameStr;
                    var safeName = utils.resolve(input.fileNameStr);

                    zip.file(safeName, input.decompressed, {
                        binary: true,
                        optimizedBinaryString: true,
                        date: input.date,
                        dir: input.dir,
                        comment: input.fileCommentStr.length ? input.fileCommentStr : null,
                        unixPermissions: input.unixPermissions,
                        dosPermissions: input.dosPermissions,
                        createFolders: options.createFolders
                    });
                    if (!input.dir) {
                        zip.file(safeName).unsafeOriginalName = unsafeName;
                    }
                }
                if (zipEntries.zipComment.length) {
                    zip.comment = zipEntries.zipComment;
                }

                return zip;
            });
    };

    /**
     * Representation a of zip file in js
     * @constructor
     */
    function JSZip() {
        // if this constructor is used without `new`, it adds `new` before itself:
        if(!(this instanceof JSZip)) {
            return new JSZip();
        }

        if(arguments.length) {
            throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
        }

        // object containing the files :
        // {
        //   "folder/" : {...},
        //   "folder/data.txt" : {...}
        // }
        // NOTE: we use a null prototype because we do not
        // want filenames like "toString" coming from a zip file
        // to overwrite methods and attributes in a normal Object.
        this.files = Object.create(null);

        this.comment = null;

        // Where we are in the hierarchy
        this.root = "";
        this.clone = function() {
            var newObj = new JSZip();
            for (var i in this) {
                if (typeof this[i] !== "function") {
                    newObj[i] = this[i];
                }
            }
            return newObj;
        };
    }
    JSZip.prototype = object;
    JSZip.prototype.loadAsync = load;
    JSZip.support = support$4;
    JSZip.defaults = defaults$1;

    // TODO find a better way to handle this version,
    // a require('package.json').version doesn't work with webpack, see #327
    JSZip.version = "3.10.1";

    JSZip.loadAsync = function (content, options) {
        return new JSZip().loadAsync(content, options);
    };

    JSZip.external = external$3;
    var lib = JSZip;

    /**
     * Enumeration of the gradient types
     */
    var GradientType;
    (function (GradientType) {
        GradientType[GradientType["Linear"] = 0] = "Linear";
        GradientType[GradientType["Radial"] = 1] = "Radial";
        GradientType[GradientType["Angular"] = 2] = "Angular";
    })(GradientType || (GradientType = {}));
    /**
     * Enumeration of the color profiles Sketch can use to render a document
     */
    var ColorSpace;
    (function (ColorSpace) {
        ColorSpace[ColorSpace["Unmanaged"] = 0] = "Unmanaged";
        ColorSpace[ColorSpace["SRGB"] = 1] = "SRGB";
        ColorSpace[ColorSpace["P3"] = 2] = "P3";
    })(ColorSpace || (ColorSpace = {}));
    /**
     * Enumeration of the fill types
     */
    var FillType;
    (function (FillType) {
        FillType[FillType["Color"] = 0] = "Color";
        FillType[FillType["Gradient"] = 1] = "Gradient";
        FillType[FillType["Pattern"] = 4] = "Pattern";
    })(FillType || (FillType = {}));
    /**
     * Enumeration of border positions
     */
    var BorderPosition;
    (function (BorderPosition) {
        BorderPosition[BorderPosition["Center"] = 0] = "Center";
        BorderPosition[BorderPosition["Inside"] = 1] = "Inside";
        BorderPosition[BorderPosition["Outside"] = 2] = "Outside";
    })(BorderPosition || (BorderPosition = {}));
    /**
     * Enumeration of the blend modes that can be applied to fills
     */
    var BlendMode;
    (function (BlendMode) {
        BlendMode[BlendMode["Normal"] = 0] = "Normal";
        BlendMode[BlendMode["Darken"] = 1] = "Darken";
        BlendMode[BlendMode["Multiply"] = 2] = "Multiply";
        BlendMode[BlendMode["ColorBurn"] = 3] = "ColorBurn";
        BlendMode[BlendMode["Lighten"] = 4] = "Lighten";
        BlendMode[BlendMode["Screen"] = 5] = "Screen";
        BlendMode[BlendMode["ColorDodge"] = 6] = "ColorDodge";
        BlendMode[BlendMode["Overlay"] = 7] = "Overlay";
        BlendMode[BlendMode["SoftLight"] = 8] = "SoftLight";
        BlendMode[BlendMode["HardLight"] = 9] = "HardLight";
        BlendMode[BlendMode["Difference"] = 10] = "Difference";
        BlendMode[BlendMode["Exclusion"] = 11] = "Exclusion";
        BlendMode[BlendMode["Hue"] = 12] = "Hue";
        BlendMode[BlendMode["Saturation"] = 13] = "Saturation";
        BlendMode[BlendMode["Color"] = 14] = "Color";
        BlendMode[BlendMode["Luminosity"] = 15] = "Luminosity";
        BlendMode[BlendMode["PlusDarker"] = 16] = "PlusDarker";
        BlendMode[BlendMode["PlusLighter"] = 17] = "PlusLighter";
    })(BlendMode || (BlendMode = {}));
    /**
     * Enumeration of the line cap styles
     */
    var LineCapStyle;
    (function (LineCapStyle) {
        LineCapStyle[LineCapStyle["Butt"] = 0] = "Butt";
        LineCapStyle[LineCapStyle["Round"] = 1] = "Round";
        LineCapStyle[LineCapStyle["Projecting"] = 2] = "Projecting";
    })(LineCapStyle || (LineCapStyle = {}));
    /**
     * Enumeration of the line join styles
     */
    var LineJoinStyle;
    (function (LineJoinStyle) {
        LineJoinStyle[LineJoinStyle["Miter"] = 0] = "Miter";
        LineJoinStyle[LineJoinStyle["Round"] = 1] = "Round";
        LineJoinStyle[LineJoinStyle["Bevel"] = 2] = "Bevel";
    })(LineJoinStyle || (LineJoinStyle = {}));
    /**
     * Enumeration of the various blur types
     */
    var BlurType;
    (function (BlurType) {
        BlurType[BlurType["Gaussian"] = 0] = "Gaussian";
        BlurType[BlurType["Motion"] = 1] = "Motion";
        BlurType[BlurType["Zoom"] = 2] = "Zoom";
        BlurType[BlurType["Background"] = 3] = "Background";
    })(BlurType || (BlurType = {}));
    /**
     * Enumeration of pattern fill types
     */
    var PatternFillType;
    (function (PatternFillType) {
        PatternFillType[PatternFillType["Tile"] = 0] = "Tile";
        PatternFillType[PatternFillType["Fill"] = 1] = "Fill";
        PatternFillType[PatternFillType["Stretch"] = 2] = "Stretch";
        PatternFillType[PatternFillType["Fit"] = 3] = "Fit";
    })(PatternFillType || (PatternFillType = {}));
    /**
     * Enumeration of the possible types of vector line endings
     */
    var MarkerType;
    (function (MarkerType) {
        MarkerType[MarkerType["OpenArrow"] = 0] = "OpenArrow";
        MarkerType[MarkerType["FilledArrow"] = 1] = "FilledArrow";
        MarkerType[MarkerType["Line"] = 2] = "Line";
        MarkerType[MarkerType["OpenCircle"] = 3] = "OpenCircle";
        MarkerType[MarkerType["FilledCircle"] = 4] = "FilledCircle";
        MarkerType[MarkerType["OpenSquare"] = 5] = "OpenSquare";
        MarkerType[MarkerType["FilledSquare"] = 6] = "FilledSquare";
    })(MarkerType || (MarkerType = {}));
    /**
     * Enumeration of the winding rule that controls how fills behave in shapes with complex paths
     */
    var WindingRule;
    (function (WindingRule) {
        WindingRule[WindingRule["NonZero"] = 0] = "NonZero";
        WindingRule[WindingRule["EvenOdd"] = 1] = "EvenOdd";
    })(WindingRule || (WindingRule = {}));
    /**
     * Enumeration of the text style vertical alighment options
     */
    var TextVerticalAlignment;
    (function (TextVerticalAlignment) {
        TextVerticalAlignment[TextVerticalAlignment["Top"] = 0] = "Top";
        TextVerticalAlignment[TextVerticalAlignment["Middle"] = 1] = "Middle";
        TextVerticalAlignment[TextVerticalAlignment["Bottom"] = 2] = "Bottom";
    })(TextVerticalAlignment || (TextVerticalAlignment = {}));
    /**
     * Enumeration of the horizontal alignment options for paragraphs
     */
    var TextHorizontalAlignment;
    (function (TextHorizontalAlignment) {
        TextHorizontalAlignment[TextHorizontalAlignment["Left"] = 0] = "Left";
        TextHorizontalAlignment[TextHorizontalAlignment["Right"] = 1] = "Right";
        TextHorizontalAlignment[TextHorizontalAlignment["Centered"] = 2] = "Centered";
        TextHorizontalAlignment[TextHorizontalAlignment["Justified"] = 3] = "Justified";
        TextHorizontalAlignment[TextHorizontalAlignment["Natural"] = 4] = "Natural";
    })(TextHorizontalAlignment || (TextHorizontalAlignment = {}));
    /**
     * Enumeration of the text style transformations options
     */
    var TextTransform;
    (function (TextTransform) {
        TextTransform[TextTransform["None"] = 0] = "None";
        TextTransform[TextTransform["Uppercase"] = 1] = "Uppercase";
        TextTransform[TextTransform["Lowercase"] = 2] = "Lowercase";
    })(TextTransform || (TextTransform = {}));
    /**
     * Enumeration of the text style underline options
     */
    var UnderlineStyle;
    (function (UnderlineStyle) {
        UnderlineStyle[UnderlineStyle["None"] = 0] = "None";
        UnderlineStyle[UnderlineStyle["Underlined"] = 1] = "Underlined";
    })(UnderlineStyle || (UnderlineStyle = {}));
    /**
     * Enumeration of the text style strikethrough options
     */
    var StrikethroughStyle;
    (function (StrikethroughStyle) {
        StrikethroughStyle[StrikethroughStyle["None"] = 0] = "None";
        StrikethroughStyle[StrikethroughStyle["Strikethrough"] = 1] = "Strikethrough";
    })(StrikethroughStyle || (StrikethroughStyle = {}));
    /**
     * Enumeration of the boolean operations that can be applied to combine shapes
     */
    var BooleanOperation;
    (function (BooleanOperation) {
        BooleanOperation[BooleanOperation["None"] = -1] = "None";
        BooleanOperation[BooleanOperation["Union"] = 0] = "Union";
        BooleanOperation[BooleanOperation["Subtract"] = 1] = "Subtract";
        BooleanOperation[BooleanOperation["Intersection"] = 2] = "Intersection";
        BooleanOperation[BooleanOperation["Difference"] = 3] = "Difference";
    })(BooleanOperation || (BooleanOperation = {}));
    /**
     * Enumeration of the file formats that can be selected in the layer export options
     */
    var ExportFileFormat;
    (function (ExportFileFormat) {
        ExportFileFormat["PNG"] = "png";
        ExportFileFormat["JPG"] = "jpg";
        ExportFileFormat["TIFF"] = "tiff";
        ExportFileFormat["EPS"] = "eps";
        ExportFileFormat["PDF"] = "pdf";
        ExportFileFormat["WEBP"] = "webp";
        ExportFileFormat["SVG"] = "svg";
    })(ExportFileFormat || (ExportFileFormat = {}));
    /**
     * Enumeration of the possible types of export format naming schemes
     */
    var ExportFormatNamingScheme;
    (function (ExportFormatNamingScheme) {
        ExportFormatNamingScheme[ExportFormatNamingScheme["Suffix"] = 0] = "Suffix";
        ExportFormatNamingScheme[ExportFormatNamingScheme["SecondaryPrefix"] = 1] = "SecondaryPrefix";
        ExportFormatNamingScheme[ExportFormatNamingScheme["PrimaryPrefix"] = 2] = "PrimaryPrefix";
    })(ExportFormatNamingScheme || (ExportFormatNamingScheme = {}));
    /**
     * Enumeration of the possible values to control how an exported layer will be scaled
     */
    var VisibleScaleType;
    (function (VisibleScaleType) {
        VisibleScaleType[VisibleScaleType["Scale"] = 0] = "Scale";
        VisibleScaleType[VisibleScaleType["Width"] = 1] = "Width";
        VisibleScaleType[VisibleScaleType["Height"] = 2] = "Height";
    })(VisibleScaleType || (VisibleScaleType = {}));
    /**
     * Enumeration of the animation transition types between prototype screens
     */
    var AnimationType;
    (function (AnimationType) {
        AnimationType[AnimationType["None"] = 0] = "None";
        AnimationType[AnimationType["SlideFromLeft"] = 1] = "SlideFromLeft";
        AnimationType[AnimationType["SlideFromRight"] = 2] = "SlideFromRight";
        AnimationType[AnimationType["SlideFromBottom"] = 3] = "SlideFromBottom";
        AnimationType[AnimationType["SlideFromTop"] = 4] = "SlideFromTop";
    })(AnimationType || (AnimationType = {}));
    /**
     * Enumeration of the expansion states in the layer list UI
     */
    var LayerListExpanded;
    (function (LayerListExpanded) {
        LayerListExpanded[LayerListExpanded["Undecided"] = 0] = "Undecided";
        LayerListExpanded[LayerListExpanded["Collapsed"] = 1] = "Collapsed";
        LayerListExpanded[LayerListExpanded["Expanded"] = 2] = "Expanded";
    })(LayerListExpanded || (LayerListExpanded = {}));
    /**
     * Enumeration of the possible resize types
     */
    var ResizeType;
    (function (ResizeType) {
        ResizeType[ResizeType["Stretch"] = 0] = "Stretch";
        ResizeType[ResizeType["PinToEdge"] = 1] = "PinToEdge";
        ResizeType[ResizeType["Resize"] = 2] = "Resize";
        ResizeType[ResizeType["Float"] = 3] = "Float";
    })(ResizeType || (ResizeType = {}));
    /**
     * Enumeration of the axis types for inferred (aka smart) layout
     */
    var InferredLayoutAxis;
    (function (InferredLayoutAxis) {
        InferredLayoutAxis[InferredLayoutAxis["Horizontal"] = 0] = "Horizontal";
        InferredLayoutAxis[InferredLayoutAxis["Vertical"] = 1] = "Vertical";
    })(InferredLayoutAxis || (InferredLayoutAxis = {}));
    /**
     * Enumeration of the anchor types for inferred (aka smart) layout
     */
    var InferredLayoutAnchor;
    (function (InferredLayoutAnchor) {
        InferredLayoutAnchor[InferredLayoutAnchor["Min"] = 0] = "Min";
        InferredLayoutAnchor[InferredLayoutAnchor["Middle"] = 1] = "Middle";
        InferredLayoutAnchor[InferredLayoutAnchor["Max"] = 2] = "Max";
    })(InferredLayoutAnchor || (InferredLayoutAnchor = {}));
    /**
     * Enumeration of the possible values for corner rounding on shape points.
     */
    var PointsRadiusBehaviour;
    (function (PointsRadiusBehaviour) {
        PointsRadiusBehaviour[PointsRadiusBehaviour["Disabled"] = -1] = "Disabled";
        PointsRadiusBehaviour[PointsRadiusBehaviour["Legacy"] = 0] = "Legacy";
        PointsRadiusBehaviour[PointsRadiusBehaviour["Rounded"] = 1] = "Rounded";
        PointsRadiusBehaviour[PointsRadiusBehaviour["Smooth"] = 2] = "Smooth";
    })(PointsRadiusBehaviour || (PointsRadiusBehaviour = {}));
    /**
     * Enumeration of the corner styles that can be applied to vector points
     */
    var CornerStyle;
    (function (CornerStyle) {
        CornerStyle[CornerStyle["Rounded"] = 0] = "Rounded";
        CornerStyle[CornerStyle["RoundedInverted"] = 1] = "RoundedInverted";
        CornerStyle[CornerStyle["Angled"] = 2] = "Angled";
        CornerStyle[CornerStyle["Squared"] = 3] = "Squared";
    })(CornerStyle || (CornerStyle = {}));
    /**
     * Enumeration of the curve modes that can be applied to vector points
     */
    var CurveMode;
    (function (CurveMode) {
        CurveMode[CurveMode["None"] = 0] = "None";
        CurveMode[CurveMode["Straight"] = 1] = "Straight";
        CurveMode[CurveMode["Mirrored"] = 2] = "Mirrored";
        CurveMode[CurveMode["Asymmetric"] = 3] = "Asymmetric";
        CurveMode[CurveMode["Disconnected"] = 4] = "Disconnected";
    })(CurveMode || (CurveMode = {}));
    /**
     * Enumeration of line spacing behaviour for fixed line height text
     */
    var LineSpacingBehaviour;
    (function (LineSpacingBehaviour) {
        LineSpacingBehaviour[LineSpacingBehaviour["None"] = 0] = "None";
        LineSpacingBehaviour[LineSpacingBehaviour["Legacy"] = 1] = "Legacy";
        LineSpacingBehaviour[LineSpacingBehaviour["ConsistentBaseline"] = 2] = "ConsistentBaseline";
    })(LineSpacingBehaviour || (LineSpacingBehaviour = {}));
    /**
     * Enumeration of the behaviours for text layers
     */
    var TextBehaviour;
    (function (TextBehaviour) {
        TextBehaviour[TextBehaviour["Flexible"] = 0] = "Flexible";
        TextBehaviour[TextBehaviour["Fixed"] = 1] = "Fixed";
        TextBehaviour[TextBehaviour["FixedWidthAndHeight"] = 2] = "FixedWidthAndHeight";
    })(TextBehaviour || (TextBehaviour = {}));
    /**
     * Enumeration of the asset library type. Roughly represents all library types from Preferences... > Libraries tab
     */
    var DocumentLibraryType;
    (function (DocumentLibraryType) {
        DocumentLibraryType[DocumentLibraryType["Local"] = 0] = "Local";
        DocumentLibraryType[DocumentLibraryType["Workspace"] = 1] = "Workspace";
        DocumentLibraryType[DocumentLibraryType["ThirdParty"] = 2] = "ThirdParty";
    })(DocumentLibraryType || (DocumentLibraryType = {}));
    /**
     * Enumeration of the Apple bundle ids for the various variants of Sketch
     */
    var BundleId;
    (function (BundleId) {
        BundleId["PublicRelease"] = "com.bohemiancoding.sketch3";
        BundleId["Beta"] = "com.bohemiancoding.sketch3.beta";
        BundleId["Private"] = "com.bohemiancoding.sketch3.private";
        BundleId["FeaturePreview"] = "com.bohemiancoding.sketch3.feature-preview";
        BundleId["Internal"] = "com.bohemiancoding.sketch3.internal";
        BundleId["Experimental"] = "com.bohemiancoding.sketch3.experimental";
        BundleId["Testing"] = "com.bohemiancoding.sketch3.testing";
    })(BundleId || (BundleId = {}));
    /**
     * A numerical boolean where 0 is false, and 1 is true.
     */
    var NumericalBool;
    (function (NumericalBool) {
        NumericalBool[NumericalBool["True"] = 0] = "True";
        NumericalBool[NumericalBool["False"] = 1] = "False";
    })(NumericalBool || (NumericalBool = {}));
    /**
     * Enum of all possible _class property values
     */
    var ClassValue;
    (function (ClassValue) {
        ClassValue["MSImmutableColorAsset"] = "MSImmutableColorAsset";
        ClassValue["MSImmutableDocumentLibraryInfo"] = "MSImmutableDocumentLibraryInfo";
        ClassValue["MSImmutableFlowConnection"] = "MSImmutableFlowConnection";
        ClassValue["MSImmutableForeignLayerStyle"] = "MSImmutableForeignLayerStyle";
        ClassValue["MSImmutableForeignSwatch"] = "MSImmutableForeignSwatch";
        ClassValue["MSImmutableForeignSymbol"] = "MSImmutableForeignSymbol";
        ClassValue["MSImmutableForeignTextStyle"] = "MSImmutableForeignTextStyle";
        ClassValue["MSImmutableFreeformGroupLayout"] = "MSImmutableFreeformGroupLayout";
        ClassValue["MSImmutableGradientAsset"] = "MSImmutableGradientAsset";
        ClassValue["MSImmutableHotspotLayer"] = "MSImmutableHotspotLayer";
        ClassValue["MSImmutableInferredGroupLayout"] = "MSImmutableInferredGroupLayout";
        ClassValue["MSImmutableOverrideProperty"] = "MSImmutableOverrideProperty";
        ClassValue["MSImmutablePatchInfo"] = "MSImmutablePatchInfo";
        ClassValue["MSImmutablePrototypeViewport"] = "MSImmutablePrototypeViewport";
        ClassValue["MSJSONFileReference"] = "MSJSONFileReference";
        ClassValue["MSJSONOriginalDataReference"] = "MSJSONOriginalDataReference";
        ClassValue["Artboard"] = "artboard";
        ClassValue["AssetCollection"] = "assetCollection";
        ClassValue["AttributedString"] = "attributedString";
        ClassValue["Bitmap"] = "bitmap";
        ClassValue["Blur"] = "blur";
        ClassValue["Border"] = "border";
        ClassValue["BorderOptions"] = "borderOptions";
        ClassValue["Color"] = "color";
        ClassValue["ColorControls"] = "colorControls";
        ClassValue["CurvePoint"] = "curvePoint";
        ClassValue["ExportFormat"] = "exportFormat";
        ClassValue["ExportOptions"] = "exportOptions";
        ClassValue["Fill"] = "fill";
        ClassValue["FontDescriptor"] = "fontDescriptor";
        ClassValue["FontReference"] = "fontReference";
        ClassValue["Gradient"] = "gradient";
        ClassValue["GradientStop"] = "gradientStop";
        ClassValue["GraphicsContextSettings"] = "graphicsContextSettings";
        ClassValue["Group"] = "group";
        ClassValue["ImageCollection"] = "imageCollection";
        ClassValue["InnerShadow"] = "innerShadow";
        ClassValue["LayoutGrid"] = "layoutGrid";
        ClassValue["Oval"] = "oval";
        ClassValue["OverrideValue"] = "overrideValue";
        ClassValue["Page"] = "page";
        ClassValue["ParagraphStyle"] = "paragraphStyle";
        ClassValue["Polygon"] = "polygon";
        ClassValue["Rect"] = "rect";
        ClassValue["Rectangle"] = "rectangle";
        ClassValue["RulerData"] = "rulerData";
        ClassValue["Shadow"] = "shadow";
        ClassValue["ShapeGroup"] = "shapeGroup";
        ClassValue["ShapePath"] = "shapePath";
        ClassValue["SharedStyle"] = "sharedStyle";
        ClassValue["SharedStyleContainer"] = "sharedStyleContainer";
        ClassValue["SharedTextStyleContainer"] = "sharedTextStyleContainer";
        ClassValue["SimpleGrid"] = "simpleGrid";
        ClassValue["Slice"] = "slice";
        ClassValue["Star"] = "star";
        ClassValue["StringAttribute"] = "stringAttribute";
        ClassValue["Style"] = "style";
        ClassValue["Swatch"] = "swatch";
        ClassValue["SwatchContainer"] = "swatchContainer";
        ClassValue["SymbolContainer"] = "symbolContainer";
        ClassValue["SymbolInstance"] = "symbolInstance";
        ClassValue["SymbolMaster"] = "symbolMaster";
        ClassValue["Text"] = "text";
        ClassValue["TextStyle"] = "textStyle";
        ClassValue["Triangle"] = "triangle";
    })(ClassValue || (ClassValue = {}));

    var FileFormat = /*#__PURE__*/Object.freeze({
        __proto__: null,
        get GradientType () { return GradientType; },
        get ColorSpace () { return ColorSpace; },
        get FillType () { return FillType; },
        get BorderPosition () { return BorderPosition; },
        get BlendMode () { return BlendMode; },
        get LineCapStyle () { return LineCapStyle; },
        get LineJoinStyle () { return LineJoinStyle; },
        get BlurType () { return BlurType; },
        get PatternFillType () { return PatternFillType; },
        get MarkerType () { return MarkerType; },
        get WindingRule () { return WindingRule; },
        get TextVerticalAlignment () { return TextVerticalAlignment; },
        get TextHorizontalAlignment () { return TextHorizontalAlignment; },
        get TextTransform () { return TextTransform; },
        get UnderlineStyle () { return UnderlineStyle; },
        get StrikethroughStyle () { return StrikethroughStyle; },
        get BooleanOperation () { return BooleanOperation; },
        get ExportFileFormat () { return ExportFileFormat; },
        get ExportFormatNamingScheme () { return ExportFormatNamingScheme; },
        get VisibleScaleType () { return VisibleScaleType; },
        get AnimationType () { return AnimationType; },
        get LayerListExpanded () { return LayerListExpanded; },
        get ResizeType () { return ResizeType; },
        get InferredLayoutAxis () { return InferredLayoutAxis; },
        get InferredLayoutAnchor () { return InferredLayoutAnchor; },
        get PointsRadiusBehaviour () { return PointsRadiusBehaviour; },
        get CornerStyle () { return CornerStyle; },
        get CurveMode () { return CurveMode; },
        get LineSpacingBehaviour () { return LineSpacingBehaviour; },
        get TextBehaviour () { return TextBehaviour; },
        get DocumentLibraryType () { return DocumentLibraryType; },
        get BundleId () { return BundleId; },
        get NumericalBool () { return NumericalBool; },
        get ClassValue () { return ClassValue; }
    });

    function getDefaultStyle(v) {
        return Object.assign({
            left: 0,
            top: 0,
            right: 'auto',
            bottom: 'auto',
            width: 'auto',
            height: 'auto',
            lineHeight: 'normal',
            fontFamily: 'arial',
            fontSize: 16,
            fontWeight: 400,
            fontStyle: 'normal',
            visible: true,
            overflow: 'visible',
            backgroundColor: [0, 0, 0, 0],
            color: [0, 0, 0, 1],
            opacity: 1,
            translateX: 0,
            translateY: 0,
            scaleX: 1,
            scaleY: 1,
            rotateZ: 0,
            transformOrigin: ['center', 'center'],
            mixBlendMode: 'normal',
            pointerEvents: true,
        }, v);
    }
    var classValue;
    (function (classValue) {
        classValue["Page"] = "Page";
        classValue["ArtBoard"] = "ArtBoard";
        classValue["Group"] = "Group";
        classValue["Bitmap"] = "Bitmap";
        classValue["Text"] = "Text";
        classValue["Rect"] = "Rect";
    })(classValue || (classValue = {}));

    var ResizingConstraint;
    (function (ResizingConstraint) {
        ResizingConstraint[ResizingConstraint["UNSET"] = 63] = "UNSET";
        ResizingConstraint[ResizingConstraint["RIGHT"] = 1] = "RIGHT";
        ResizingConstraint[ResizingConstraint["WIDTH"] = 2] = "WIDTH";
        ResizingConstraint[ResizingConstraint["LEFT"] = 4] = "LEFT";
        ResizingConstraint[ResizingConstraint["BOTTOM"] = 8] = "BOTTOM";
        ResizingConstraint[ResizingConstraint["HEIGHT"] = 16] = "HEIGHT";
        ResizingConstraint[ResizingConstraint["TOP"] = 32] = "TOP";
    })(ResizingConstraint || (ResizingConstraint = {}));
    function openAndConvertSketchBuffer(arrayBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            let zipFile;
            try {
                zipFile = yield lib.loadAsync(arrayBuffer);
            }
            catch (err) {
                alert('Sorry!\nThis is not a zip file. It may be created by an old version sketch app.');
                throw err;
            }
            const document = yield readJsonFile(zipFile, 'document.json');
            const pages = [];
            yield Promise.all(document.pages.map((page) => {
                return readJsonFile(zipFile, page._ref + '.json').then((pageJson) => {
                    pages.push(pageJson);
                });
            }));
            const meta = yield readJsonFile(zipFile, 'meta.json');
            const user = yield readJsonFile(zipFile, 'user.json');
            return yield convertSketch({
                document,
                pages,
                meta,
                user,
            }, zipFile);
        });
    }
    function readJsonFile(zipFile, filename) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const docStr = yield ((_a = zipFile.file(filename)) === null || _a === void 0 ? void 0 : _a.async('string'));
            return JSON.parse(docStr);
        });
    }
    function convertSketch(json, zipFile) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('sketch', json);
            const imgs = [], imgHash = {};
            const fonts = [], fontHash = {};
            const pages = yield Promise.all(json.pages.map((page) => {
                return convertPage(page, {
                    imgs,
                    imgHash,
                    fonts,
                    fontHash,
                    zipFile,
                });
            }));
            return {
                pages,
                imgs,
                fonts: [],
            };
        });
    }
    function convertPage(page, opt) {
        return __awaiter(this, void 0, void 0, function* () {
            const children = yield Promise.all(page.layers.map((layer) => {
                return convertItem(layer, opt, page.frame.width, page.frame.height);
            }));
            return {
                type: classValue.Page,
                props: {
                    name: page.name,
                    uuid: page.do_objectID,
                    style: {
                        left: page.frame.x,
                        top: page.frame.y,
                        width: page.frame.width,
                        height: page.frame.height,
                        visible: false,
                        transformOrigin: [0, 0],
                        pointerEvents: false,
                    },
                },
                children,
            };
        });
    }
    function convertItem(layer, opt, w, h) {
        return __awaiter(this, void 0, void 0, function* () {
            // artBoard也是固定尺寸和page一样，但x/y用translate代替
            if (layer._class === FileFormat.ClassValue.Artboard) {
                const children = yield Promise.all(layer.layers.map((child) => {
                    return convertItem(child, opt, layer.frame.width, layer.frame.height);
                }));
                const hasBackgroundColor = layer.hasBackgroundColor;
                const backgroundColor = hasBackgroundColor ? [
                    Math.floor(layer.backgroundColor.r * 255),
                    Math.floor(layer.backgroundColor.g * 255),
                    Math.floor(layer.backgroundColor.b * 255),
                    layer.backgroundColor.a,
                ] : [255, 255, 255, 1];
                return {
                    type: classValue.ArtBoard,
                    props: {
                        name: layer.name,
                        uuid: layer.do_objectID,
                        hasBackgroundColor,
                        style: {
                            width: layer.frame.width,
                            height: layer.frame.height,
                            translateX: layer.frame.x,
                            translateY: layer.frame.y,
                            visible: layer.isVisible,
                            overflow: 'hidden',
                            backgroundColor,
                        },
                    },
                    children,
                };
            }
            // 其它子元素都有布局规则约束，需模拟计算出类似css的absolute定位
            const resizingConstraint = layer.resizingConstraint;
            let left = 0, top = 0, right = 'auto', bottom = 'auto';
            let width = layer.frame.width, height = layer.frame.height;
            let translateX = layer.frame.x, translateY = layer.frame.y;
            // 需根据父容器尺寸计算
            if (resizingConstraint !== ResizingConstraint.UNSET) {
                // left
                if (resizingConstraint & ResizingConstraint.LEFT) {
                    left = translateX;
                    translateX = 0;
                    // left+right忽略width
                    if (resizingConstraint & ResizingConstraint.RIGHT) {
                        right = w - translateX - width;
                        width = 'auto';
                    }
                    // left+width
                    else if (resizingConstraint & ResizingConstraint.WIDTH) ;
                    // 仅left，right是百分比忽略width
                    else {
                        right = (w - translateX - width) * 100 / w + '%';
                        width = 'auto';
                    }
                }
                // right
                else if (resizingConstraint & ResizingConstraint.RIGHT) {
                    right = w - translateX - width;
                    // left+right忽略width
                    if (resizingConstraint & ResizingConstraint.LEFT) {
                        left = translateX;
                        width = 'auto';
                    }
                    // right+width
                    else if (resizingConstraint & ResizingConstraint.WIDTH) {
                        left = 'auto';
                    }
                    // 仅right，left是百分比忽略width
                    else {
                        left = (w - translateX - width) * 100 / w + '%';
                        width = 'auto';
                    }
                    translateX = 0;
                }
                // 左右都不固定
                else {
                    // 仅固定宽度，以中心点占left的百分比
                    if (resizingConstraint & ResizingConstraint.WIDTH) {
                        left = translateX + width * 0.5;
                        translateX = '-50%';
                    }
                    // 左右皆为百分比
                    else {
                        left = translateX * 100 / w + '%';
                        right = (w - translateX - width) * 100 / w + '%';
                        translateX = 0;
                        width = 'auto';
                    }
                }
                // top
                if (resizingConstraint & ResizingConstraint.TOP) {
                    top = translateY;
                    translateY = 0;
                    // top+bottom忽略height
                    if (resizingConstraint & ResizingConstraint.BOTTOM) {
                        bottom = h - translateY - height;
                        height = 'auto';
                    }
                    // top+height
                    else if (resizingConstraint & ResizingConstraint.HEIGHT) ;
                    // 仅top，bottom是百分比忽略height
                    else {
                        bottom = (h - translateY - height) * 100 / h + '%';
                        height = 'auto';
                    }
                }
                // bottom
                else if (resizingConstraint & ResizingConstraint.BOTTOM) {
                    bottom = h - translateY - height;
                    // top+bottom忽略height
                    if (resizingConstraint & ResizingConstraint.TOP) {
                        top = translateY;
                        height = 'auto';
                    }
                    // bottom+height
                    else if (resizingConstraint & ResizingConstraint.HEIGHT) {
                        top = 'auto';
                    }
                    // 仅bottom，top是百分比忽略height
                    else {
                        top = (h - translateY - height) * 100 / h + '%';
                        height = 'auto';
                    }
                    translateY = 0;
                }
                // 上下都不固定
                else {
                    // 仅固定高度，以中心点占top的百分比
                    if (resizingConstraint & ResizingConstraint.HEIGHT) {
                        top = translateY + height * 0.5;
                        translateY = '-50%';
                    }
                    // 上下皆为百分比
                    else {
                        top = translateY * 100 / h + '%';
                        bottom = (h - translateY - height) * 100 / h + '%';
                        translateY = 0;
                        height = 'auto';
                    }
                }
            }
            // 未设置则上下左右都是百分比
            else {
                left = translateX * 100 / w + '%';
                right = (w - translateX - width) * 100 / w + '%';
                translateX = 0;
                width = 'auto';
                top = translateY * 100 / h + '%';
                bottom = (h - translateY - height) * 100 / h + '%';
                translateY = 0;
                height = 'auto';
            }
            if (layer._class === FileFormat.ClassValue.Group) {
                const children = yield Promise.all(layer.layers.map((child) => {
                    return convertItem(child, opt, layer.frame.width, layer.frame.height);
                }));
                return {
                    type: classValue.Group,
                    props: {
                        name: layer.name,
                        uuid: layer.do_objectID,
                        style: {
                            left,
                            top,
                            right,
                            bottom,
                            width,
                            height,
                            visible: layer.isVisible,
                            opacity: layer.style.contextSettings.opacity,
                            translateX,
                            translateY,
                        },
                    },
                    children,
                };
            }
            if (layer._class === FileFormat.ClassValue.Bitmap) {
                const index = yield readImageFile(layer.image._ref, opt);
                return {
                    type: classValue.Bitmap,
                    props: {
                        name: layer.name,
                        uuid: layer.do_objectID,
                        style: {
                            left,
                            top,
                            right,
                            bottom,
                            width,
                            height,
                            visible: layer.isVisible,
                            opacity: layer.style.contextSettings.opacity,
                            translateX,
                            translateY,
                        },
                        src: index,
                    },
                };
            }
            if (layer._class === FileFormat.ClassValue.Text) {
                return {
                    type: classValue.Text,
                    props: {
                        name: layer.name,
                        uuid: layer.do_objectID,
                        style: {
                            left,
                            top,
                            right,
                            bottom,
                            width,
                            height,
                            visible: layer.isVisible,
                            opacity: layer.style.contextSettings.opacity,
                            translateX,
                            translateY,
                            overflow: 'hidden',
                        },
                    },
                };
            }
            if (layer._class === FileFormat.ClassValue.Rectangle) {
                return {
                    type: classValue.Rect,
                    props: {
                        uuid: layer.do_objectID,
                        name: layer.name,
                        style: {},
                    },
                };
            }
            else {
                console.error(layer);
            }
        });
    }
    function readImageFile(filename, opt) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!/\.\w+$/.test(filename)) {
                filename = `${filename}.png`;
            }
            if (opt.imgHash.hasOwnProperty(filename)) {
                return opt.imgHash[filename];
            }
            const file = opt.zipFile.file(filename);
            if (!file) {
                console.error(`image not exist: >>>${filename}<<<`);
                return -1;
            }
            let base64 = yield file.async('base64');
            if (!/^data:image\//.test(base64)) {
                if (filename.endsWith('.png')) {
                    base64 = 'data:image/png;base64,' + base64;
                }
                else if (filename.endsWith('.gif')) {
                    base64 = 'data:image/gif;base64,' + base64;
                }
                else if (filename.endsWith('.jpg')) {
                    base64 = 'data:image/jpg;base64,' + base64;
                }
                else if (filename.endsWith('.jpeg')) {
                    base64 = 'data:image/jpeg;base64,' + base64;
                }
                else if (filename.endsWith('.webp')) {
                    base64 = 'data:image/webp;base64,' + base64;
                }
                else if (filename.endsWith('.bmp')) {
                    base64 = 'data:image/bmp;base64,' + base64;
                }
            }
            const index = opt.imgs.length;
            opt.imgs.push(base64);
            return index;
        });
    }

    var RefreshLevel;
    (function (RefreshLevel) {
        RefreshLevel[RefreshLevel["NONE"] = 0] = "NONE";
        RefreshLevel[RefreshLevel["CACHE"] = 1] = "CACHE";
        RefreshLevel[RefreshLevel["TRANSLATE_X"] = 2] = "TRANSLATE_X";
        RefreshLevel[RefreshLevel["TRANSLATE_Y"] = 4] = "TRANSLATE_Y";
        RefreshLevel[RefreshLevel["TRANSLATE"] = 6] = "TRANSLATE";
        RefreshLevel[RefreshLevel["ROTATE_Z"] = 8] = "ROTATE_Z";
        RefreshLevel[RefreshLevel["SCALE_X"] = 16] = "SCALE_X";
        RefreshLevel[RefreshLevel["SCALE_Y"] = 32] = "SCALE_Y";
        RefreshLevel[RefreshLevel["SCALE"] = 48] = "SCALE";
        RefreshLevel[RefreshLevel["TRANSFORM"] = 64] = "TRANSFORM";
        RefreshLevel[RefreshLevel["TRANSFORM_ALL"] = 126] = "TRANSFORM_ALL";
        RefreshLevel[RefreshLevel["OPACITY"] = 128] = "OPACITY";
        RefreshLevel[RefreshLevel["FILTER"] = 256] = "FILTER";
        RefreshLevel[RefreshLevel["MIX_BLEND_MODE"] = 512] = "MIX_BLEND_MODE";
        RefreshLevel[RefreshLevel["MASK"] = 1024] = "MASK";
        RefreshLevel[RefreshLevel["REPAINT"] = 2048] = "REPAINT";
        RefreshLevel[RefreshLevel["REFLOW"] = 4096] = "REFLOW";
        RefreshLevel[RefreshLevel["REFLOW_TRANSFORM"] = 4222] = "REFLOW_TRANSFORM";
        RefreshLevel[RefreshLevel["REBUILD"] = 8192] = "REBUILD";
    })(RefreshLevel || (RefreshLevel = {}));
    function isReflow(lv) {
        return lv >= RefreshLevel.REFLOW;
    }
    function isRepaint(lv) {
        return lv < RefreshLevel.REFLOW;
    }
    function isRepaintKey(k) {
        return k === 'visible' || k === 'color' || k === 'backgroundColor'
            || k === 'mixBlendMode';
    }
    function getLevel(k) {
        if (k === 'pointerEvents') {
            return RefreshLevel.NONE;
        }
        if (k === 'translateX') {
            return RefreshLevel.TRANSLATE_X;
        }
        if (k === 'translateY') {
            return RefreshLevel.TRANSLATE_Y;
        }
        if (k === 'rotateZ') {
            return RefreshLevel.ROTATE_Z;
        }
        if (k === 'scaleX') {
            return RefreshLevel.SCALE_X;
        }
        if (k === 'scaleY') {
            return RefreshLevel.SCALE_Y;
        }
        if (k === 'transformOrigin') {
            return RefreshLevel.TRANSFORM;
        }
        if (k === 'opacity') {
            return RefreshLevel.OPACITY;
        }
        if (k === 'mixBlendMode') {
            return RefreshLevel.MIX_BLEND_MODE;
        }
        if (isRepaintKey(k)) {
            return RefreshLevel.REPAINT;
        }
        return RefreshLevel.REFLOW;
    }
    var level = {
        RefreshLevel,
        isRepaint,
        isReflow,
        isRepaintKey,
    };

    var refresh = {
        level,
    };

    const o = {
        info: {
            arial: {
                lhr: 1.14990234375,
                // car: 1.1171875, // content-area ratio，(1854+434)/2048
                blr: 0.9052734375,
                // mdr: 0.64599609375, // middle ratio，(1854-1062/2)/2048
                lgr: 0.03271484375, // line-gap ratio，67/2048，默认0
            },
            // Times, Helvetica, Courier，3个特殊字体偏移，逻辑来自webkit历史
            // 查看字体发现非推荐标准，先统一取osx的hhea字段，然后ascent做整体15%放大
            // https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/coretext/FontCoreText.cpp#L173
            helvetica: {
                lhr: 1.14990234375,
                blr: 0.919921875, // (1577 + Round((1577 + 471) * 0.15)) / 2048
            },
            verdana: {
                lhr: 1.21533203125,
                blr: 1.00537109375, // 2059/2048
            },
            tahoma: {
                lhr: 1.20703125,
                blr: 1.00048828125, // 2049/2048
            },
            georgia: {
                lhr: 1.13623046875,
                blr: 0.9169921875, // 1878/2048
            },
            'courier new': {
                lhr: 1.1328125,
                blr: 0.83251953125, // 1705/2048
            },
            'pingfang sc': {
                lhr: 1.4,
                blr: 1.06, // 1060/1000
            },
            simsun: {
                lhr: 1.4,
                blr: 1.06,
            },
        },
        hasRegister(fontFamily) {
            return this.info.hasOwnProperty(fontFamily) && this.info[fontFamily].hasOwnProperty('lhr');
        },
        hasLoaded(fontFamily) {
            return this.info.hasOwnProperty(fontFamily) && this.info[fontFamily].success;
        },
    };
    o.info['宋体'] = o.info.simsun;
    o.info['pingfang'] = o.info['pingfang sc'];

    // 向量叉乘积
    function crossProduct(x1, y1, x2, y2) {
        return x1 * y2 - x2 * y1;
    }
    var vector = {
        crossProduct,
    };

    function identity() {
        return new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    }
    // 16位单位矩阵判断，空也认为是
    function isE(m) {
        if (!m || !m.length) {
            return true;
        }
        return m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 0
            && m[4] === 0 && m[5] === 1 && m[6] === 0 && m[7] === 0
            && m[8] === 0 && m[9] === 0 && m[10] === 1 && m[11] === 0
            && m[12] === 0 && m[13] === 0 && m[14] === 0 && m[15] === 1;
    }
    // 矩阵a*b，固定两个matrix都是长度16
    function multiply(a, b) {
        if (isE(a)) {
            return new Float64Array(b);
        }
        if (isE(b)) {
            return new Float64Array(a);
        }
        let c = identity();
        for (let i = 0; i < 4; i++) {
            let a0 = a[i];
            let a1 = a[i + 4];
            let a2 = a[i + 8];
            let a3 = a[i + 12];
            c[i] = a0 * b[0] + a1 * b[1] + a2 * b[2] + a3 * b[3];
            c[i + 4] = a0 * b[4] + a1 * b[5] + a2 * b[6] + a3 * b[7];
            c[i + 8] = a0 * b[8] + a1 * b[9] + a2 * b[10] + a3 * b[11];
            c[i + 12] = a0 * b[12] + a1 * b[13] + a2 * b[14] + a3 * b[15];
        }
        return c;
    }
    // 同引用更改b数据
    function multiply2(a, b) {
        if (isE(a)) {
            return b;
        }
        if (isE(b)) {
            assignMatrix(b, a);
            return b;
        }
        const b0 = b[0];
        const b1 = b[1];
        const b2 = b[2];
        const b3 = b[3];
        const b4 = b[4];
        const b5 = b[5];
        const b6 = b[6];
        const b7 = b[7];
        const b8 = b[8];
        const b9 = b[9];
        const b10 = b[10];
        const b11 = b[11];
        const b12 = b[12];
        const b13 = b[13];
        const b14 = b[14];
        const b15 = b[15];
        for (let i = 0; i < 4; i++) {
            let a0 = a[i];
            let a1 = a[i + 4];
            let a2 = a[i + 8];
            let a3 = a[i + 12];
            b[i] = a0 * b0 + a1 * b1 + a2 * b2 + a3 * b3;
            b[i + 4] = a0 * b4 + a1 * b5 + a2 * b6 + a3 * b7;
            b[i + 8] = a0 * b8 + a1 * b9 + a2 * b10 + a3 * b11;
            b[i + 12] = a0 * b12 + a1 * b13 + a2 * b14 + a3 * b15;
        }
        return b;
    }
    function toE(m) {
        m[0] = 1;
        m[1] = 0;
        m[2] = 0;
        m[3] = 0;
        m[4] = 0;
        m[5] = 1;
        m[6] = 0;
        m[7] = 0;
        m[8] = 0;
        m[9] = 0;
        m[10] = 1;
        m[11] = 0;
        m[12] = 0;
        m[13] = 0;
        m[14] = 0;
        m[15] = 1;
        return m;
    }
    /**
     * 求任意4*4矩阵的逆矩阵，行列式为 0 则返回单位矩阵兜底
     * 格式：matrix3d(a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3, a4, b4, c4, d4)
     * 参见: https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/matrix3d()
     * 对应：
     * [
     *   a1,a2,a3,a4,
     *   b1,b2,b3,b4,
     *   c1,c2,c3,c4,
     *   d1,d2,d3,d4,
     * ]
     *
     * 根据公式 A* = |A|A^-1 来计算
     * A* 表示矩阵 A 的伴随矩阵，A^-1 表示矩阵 A 的逆矩阵，|A| 表示行列式的值
     *
     * @returns {number[]}
     */
    function inverse4(m) {
        let inv = [];
        inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15]
            + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
        inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15]
            - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
        inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15]
            + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
        inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14]
            - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
        inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15]
            - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
        inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15]
            + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
        inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15]
            - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
        inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14]
            + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
        inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15]
            + m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
        inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15]
            - m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
        inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15]
            + m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
        inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14]
            - m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
        inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11]
            - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
        inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11]
            + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
        inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11]
            - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
        inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10]
            + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];
        let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
        if (det === 0) {
            return identity();
        }
        det = 1 / det;
        let d = [];
        for (let i = 0; i < 16; i++) {
            d[i] = inv[i] * det;
        }
        return d;
    }
    function assignMatrix(t, v) {
        if (t && v) {
            t[0] = v[0];
            t[1] = v[1];
            t[2] = v[2];
            t[3] = v[3];
            t[4] = v[4];
            t[5] = v[5];
            t[6] = v[6];
            t[7] = v[7];
            t[8] = v[8];
            t[9] = v[9];
            t[10] = v[10];
            t[11] = v[11];
            t[12] = v[12];
            t[13] = v[13];
            t[14] = v[14];
            t[15] = v[15];
        }
        return t;
    }
    function multiplyTfo(m, x, y) {
        if (!x && !y) {
            return m;
        }
        m[12] += m[0] * x + m[4] * y;
        m[13] += m[1] * x + m[5] * y;
        m[14] += m[2] * x + m[6] * y;
        m[15] += m[3] * x + m[7] * y;
        return m;
    }
    function tfoMultiply(x, y, m) {
        if (!x && !y) {
            return m;
        }
        let d = m[3], h = m[7], l = m[11], p = m[15];
        m[0] += d * x;
        m[1] += d * y;
        m[4] += h * x;
        m[5] += h * y;
        m[8] += l * x;
        m[9] += l * y;
        m[12] += p * x;
        m[13] += p * y;
        return m;
    }
    function multiplyRotateZ(m, v) {
        if (!v) {
            return m;
        }
        let sin = Math.sin(v);
        let cos = Math.cos(v);
        let a = m[0], b = m[1], c = m[2], d = m[3], e = m[4], f = m[5], g = m[6], h = m[7];
        m[0] = a * cos + e * sin;
        m[1] = b * cos + f * sin;
        m[2] = c * cos + g * sin;
        m[3] = d * cos + h * sin;
        m[4] = a * -sin + e * cos;
        m[5] = b * -sin + f * cos;
        m[6] = c * -sin + g * cos;
        m[7] = d * -sin + h * cos;
        return m;
    }
    function multiplyScaleX(m, v) {
        if (v === 1) {
            return m;
        }
        m[0] *= v;
        m[1] *= v;
        m[2] *= v;
        m[3] *= v;
        return m;
    }
    function multiplyScaleY(m, v) {
        if (v === 1) {
            return m;
        }
        m[4] *= v;
        m[5] *= v;
        m[6] *= v;
        m[7] *= v;
        return m;
    }
    function calPoint(point, m) {
        if (m && !isE(m)) {
            let { x, y } = point;
            let a1 = m[0], b1 = m[1];
            let a2 = m[4], b2 = m[5];
            let a4 = m[12], b4 = m[13];
            let o = {
                x: ((a1 === 1) ? x : (x * a1)) + (a2 ? (y * a2) : 0) + a4,
                y: ((b1 === 1) ? x : (x * b1)) + (b2 ? (y * b2) : 0) + b4,
            };
            return o;
        }
        return point;
    }
    /**
     * 初等行变换求3*3特定css的matrix方阵，一维6长度
     * https://blog.csdn.net/iloveas2014/article/details/82930946
     */
    function inverse(m) {
        if (m.length === 16) {
            return inverse4(m);
        }
        let a = m[0], b = m[1], c = m[2], d = m[3], e = m[4], f = m[5];
        if (a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0) {
            return m;
        }
        let divisor = a * d - b * c;
        if (divisor === 0) {
            return m;
        }
        return [d / divisor, -b / divisor, -c / divisor, a / divisor,
            (c * f - d * e) / divisor, (b * e - a * f) / divisor];
    }
    function calRectPoint(xa, ya, xb, yb, matrix) {
        let { x: x1, y: y1 } = calPoint({ x: xa, y: ya }, matrix);
        let { x: x3, y: y3 } = calPoint({ x: xb, y: yb }, matrix);
        let x2, y2, x4, y4;
        // 无旋转的时候可以少算2个点
        if (!matrix || !matrix.length
            || !matrix[1] && !matrix[2] && !matrix[4] && !matrix[6] && !matrix[7] && !matrix[8]) {
            x2 = x3;
            y2 = y1;
            x4 = x1;
            y4 = y3;
        }
        else {
            let t = calPoint({ x: xb, y: ya }, matrix);
            x2 = t.x;
            y2 = t.y;
            t = calPoint({ x: xa, y: yb }, matrix);
            x4 = t.x;
            y4 = t.y;
        }
        return { x1, y1, x2, y2, x3, y3, x4, y4 };
    }
    var matrix = {
        identity,
        isE,
        toE,
        assignMatrix,
        inverse,
        calPoint,
        calRectPoint,
        tfoMultiply,
        multiplyTfo,
        multiply,
        multiply2,
    };

    function d2r(n) {
        return n * Math.PI / 180;
    }
    function r2d(n) {
        return n * 180 / Math.PI;
    }
    /**
     * 判断点是否在多边形内
     * @param x 点坐标
     * @param y
     * @param vertexes 多边形顶点坐标
     * @returns {boolean}
     */
    function pointInConvexPolygon(x, y, vertexes) {
        // 先取最大最小值得一个外围矩形，在外边可快速判断false
        let { x: xmax, y: ymax } = vertexes[0];
        let { x: xmin, y: ymin } = vertexes[0];
        let len = vertexes.length;
        for (let i = 1; i < len; i++) {
            let { x, y } = vertexes[i];
            xmax = Math.max(xmax, x);
            ymax = Math.max(ymax, y);
            xmin = Math.min(xmin, x);
            ymin = Math.min(ymin, y);
        }
        if (x < xmin || y < ymin || x > xmax || y > ymax) {
            return false;
        }
        let first;
        // 所有向量积均为非负数（逆时针，反过来顺时针是非正）说明在多边形内或边上
        for (let i = 0, len = vertexes.length; i < len; i++) {
            let { x: x1, y: y1 } = vertexes[i];
            let { x: x2, y: y2 } = vertexes[(i + 1) % len];
            let n = crossProduct(x2 - x1, y2 - y1, x - x1, y - y1);
            if (n !== 0) {
                n = n > 0 ? 1 : 0;
                // 第一个赋值，后面检查是否正负一致性，不一致是反例就跳出
                if (first === undefined) {
                    first = n;
                }
                else if (first ^ n) {
                    return false;
                }
            }
        }
        return true;
    }
    // 判断点是否在一个矩形，比如事件发生是否在节点上
    function pointInRect(x, y, x1, y1, x2, y2, matrix) {
        if (matrix && !isE(matrix)) {
            let t1 = calPoint({ x: x1, y: y1 }, matrix);
            let xa = t1.x, ya = t1.y;
            let t2 = calPoint({ x: x2, y: y2 }, matrix);
            let xb = t2.x, yb = t2.y;
            return pointInConvexPolygon(x, y, [
                { x: xa, y: ya },
                { x: xb, y: ya },
                { x: xb, y: yb },
                { x: xa, y: yb },
            ]);
        }
        else {
            return x >= x1 && y >= y1 && x <= x2 && y <= y2;
        }
    }
    var geom = {
        d2r,
        r2d,
        pointInConvexPolygon,
        pointInRect,
    };

    var StyleUnit;
    (function (StyleUnit) {
        StyleUnit[StyleUnit["AUTO"] = 0] = "AUTO";
        StyleUnit[StyleUnit["PX"] = 1] = "PX";
        StyleUnit[StyleUnit["PERCENT"] = 2] = "PERCENT";
        StyleUnit[StyleUnit["NUMBER"] = 3] = "NUMBER";
        StyleUnit[StyleUnit["DEG"] = 4] = "DEG";
        StyleUnit[StyleUnit["RGBA"] = 5] = "RGBA";
        StyleUnit[StyleUnit["BOOLEAN"] = 6] = "BOOLEAN";
        StyleUnit[StyleUnit["STRING"] = 7] = "STRING";
        StyleUnit[StyleUnit["GRADIENT"] = 8] = "GRADIENT";
    })(StyleUnit || (StyleUnit = {}));
    function calUnit(v) {
        if (v === 'auto') {
            return {
                v: 0,
                u: StyleUnit.AUTO,
            };
        }
        let n = parseFloat(v) || 0;
        if (/%$/.test(v)) {
            return {
                v: n,
                u: StyleUnit.PERCENT,
            };
        }
        else if (/px$/i.test(v)) {
            return {
                v: n,
                u: StyleUnit.PX,
            };
        }
        else if (/deg$/i.test(v)) {
            return {
                v: n,
                u: StyleUnit.DEG,
            };
        }
        return {
            v: n,
            u: StyleUnit.NUMBER,
        };
    }
    var MIX_BLEND_MODE;
    (function (MIX_BLEND_MODE) {
        MIX_BLEND_MODE[MIX_BLEND_MODE["NORMAL"] = 0] = "NORMAL";
        MIX_BLEND_MODE[MIX_BLEND_MODE["MULTIPLY"] = 1] = "MULTIPLY";
        MIX_BLEND_MODE[MIX_BLEND_MODE["SCREEN"] = 2] = "SCREEN";
        MIX_BLEND_MODE[MIX_BLEND_MODE["OVERLAY"] = 3] = "OVERLAY";
        MIX_BLEND_MODE[MIX_BLEND_MODE["DARKEN"] = 4] = "DARKEN";
        MIX_BLEND_MODE[MIX_BLEND_MODE["LIGHTEN"] = 5] = "LIGHTEN";
        MIX_BLEND_MODE[MIX_BLEND_MODE["COLOR_DODGE"] = 6] = "COLOR_DODGE";
        MIX_BLEND_MODE[MIX_BLEND_MODE["COLOR_BURN"] = 7] = "COLOR_BURN";
        MIX_BLEND_MODE[MIX_BLEND_MODE["HARD_LIGHT"] = 8] = "HARD_LIGHT";
        MIX_BLEND_MODE[MIX_BLEND_MODE["SOFT_LIGHT"] = 9] = "SOFT_LIGHT";
        MIX_BLEND_MODE[MIX_BLEND_MODE["DIFFERENCE"] = 10] = "DIFFERENCE";
        MIX_BLEND_MODE[MIX_BLEND_MODE["EXCLUSION"] = 11] = "EXCLUSION";
        MIX_BLEND_MODE[MIX_BLEND_MODE["HUE"] = 12] = "HUE";
        MIX_BLEND_MODE[MIX_BLEND_MODE["SATURATION"] = 13] = "SATURATION";
        MIX_BLEND_MODE[MIX_BLEND_MODE["COLOR"] = 14] = "COLOR";
        MIX_BLEND_MODE[MIX_BLEND_MODE["LUMINOSITY"] = 15] = "LUMINOSITY";
    })(MIX_BLEND_MODE || (MIX_BLEND_MODE = {}));
    var OVERFLOW;
    (function (OVERFLOW) {
        OVERFLOW[OVERFLOW["VISIBLE"] = 0] = "VISIBLE";
        OVERFLOW[OVERFLOW["HIDDEN"] = 1] = "HIDDEN";
    })(OVERFLOW || (OVERFLOW = {}));
    var FONT_STYLE;
    (function (FONT_STYLE) {
        FONT_STYLE[FONT_STYLE["NORMAL"] = 0] = "NORMAL";
        FONT_STYLE[FONT_STYLE["ITALIC"] = 1] = "ITALIC";
        FONT_STYLE[FONT_STYLE["OBLIQUE"] = 2] = "OBLIQUE";
    })(FONT_STYLE || (FONT_STYLE = {}));
    var MASK_TYPE;
    (function (MASK_TYPE) {
        MASK_TYPE[MASK_TYPE["NONE"] = 0] = "NONE";
        MASK_TYPE[MASK_TYPE["MASK"] = 1] = "MASK";
        MASK_TYPE[MASK_TYPE["CLIP"] = 2] = "CLIP";
    })(MASK_TYPE || (MASK_TYPE = {}));
    var define = {
        StyleUnit,
        calUnit,
    };

    // @ts-ignore
    const toString = {}.toString;
    function isType(type) {
        return function (obj) {
            return toString.call(obj) === '[object ' + type + ']';
        };
    }
    function isTypes(types) {
        return function (obj) {
            let s = toString.call(obj);
            for (let i = 0, len = types.length; i < len; i++) {
                if (s === '[object ' + types[i] + ']') {
                    return true;
                }
            }
            return false;
        };
    }
    const isObject = isType('Object');
    const isString = isType('String');
    const isFunction = isTypes(['Function', 'AsyncFunction', 'GeneratorFunction']);
    const isNumber = isType('Number');
    const isBoolean = isType('Boolean');
    const isDate = isType('Date');
    const hasOwn = {}.hasOwnProperty;
    const fnToString = hasOwn.toString;
    const ObjectFunctionString = fnToString.call(Object);
    function isNil(v) {
        return v === undefined || v === null;
    }
    function isPlainObject(obj) {
        if (!obj || toString.call(obj) !== '[object Object]') {
            return false;
        }
        let proto = Object.getPrototypeOf(obj);
        if (!proto) {
            return true;
        }
        let Ctor = hasOwn.call(proto, 'constructor') && proto.constructor;
        return typeof Ctor === 'function' && fnToString.call(Ctor) === ObjectFunctionString;
    }
    var type = {
        isNil,
        isString,
        isNumber,
        isObject,
        isBoolean,
        isDate,
        isFunction,
        isPlainObject,
    };

    const SPF = 1000 / 60;
    const CANVAS = {};
    const SUPPORT_OFFSCREEN_CANVAS = typeof OffscreenCanvas === 'function' && OffscreenCanvas.prototype.getContext;
    function offscreenCanvas(width, height, key, contextAttributes) {
        let o;
        if (!key) {
            o = SUPPORT_OFFSCREEN_CANVAS ? new OffscreenCanvas(width, height) : document.createElement('canvas');
        }
        else if (!CANVAS[key]) {
            o = CANVAS[key] = SUPPORT_OFFSCREEN_CANVAS ? new OffscreenCanvas(width, height) : document.createElement('canvas');
        }
        else {
            o = CANVAS[key];
        }
        // 防止小数向上取整
        width = Math.ceil(width);
        height = Math.ceil(height);
        o.width = width;
        o.height = height;
        let ctx = o.getContext('2d', contextAttributes);
        if (!ctx) {
            inject.error('Total canvas memory use exceeds the maximum limit');
        }
        return {
            canvas: o,
            ctx,
            available: true,
            release() {
                if (!this.available) {
                    return;
                }
                this.available = false;
                ctx.globalAlpha = 1;
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.clearRect(0, 0, width, height);
                o.width = o.height = 0;
                o = null;
            },
        };
    }
    const SUPPORT_FONT = {};
    let defaultFontFamilyData;
    const IMG = {};
    const INIT = 0;
    const LOADING = 1;
    const LOADED = 2;
    const FONT = {};
    let MAX_LOAD_NUM = 0;
    let imgCount = 0, imgQueue = [], fontCount = 0, fontQueue = [];
    const inject = {
        requestAnimationFrame(cb) {
            if (!cb) {
                return -1;
            }
            let res;
            if (typeof requestAnimationFrame !== 'undefined') {
                inject.requestAnimationFrame = requestAnimationFrame.bind(null);
                res = requestAnimationFrame(cb);
            }
            else {
                res = setTimeout(cb, SPF);
                inject.requestAnimationFrame = function (cb) {
                    return setTimeout(cb, SPF);
                };
            }
            return res;
        },
        cancelAnimationFrame(id) {
            let res;
            if (typeof cancelAnimationFrame !== 'undefined') {
                inject.cancelAnimationFrame = cancelAnimationFrame.bind(null);
                res = cancelAnimationFrame(id);
            }
            else {
                res = clearTimeout(id);
                inject.cancelAnimationFrame = function (id) {
                    return clearTimeout(id);
                };
            }
            return res;
        },
        now() {
            if (typeof performance !== 'undefined') {
                inject.now = function () {
                    return Math.floor(performance.now());
                };
                return Math.floor(performance.now());
            }
            inject.now = Date.now.bind(Date);
            return Date.now();
        },
        hasOffscreenCanvas(key) {
            return key && CANVAS.hasOwnProperty(key);
        },
        getOffscreenCanvas(width, height, key, contextAttributes) {
            return offscreenCanvas(width, height, key, contextAttributes);
        },
        isWebGLTexture(o) {
            if (o && typeof WebGLTexture !== 'undefined') {
                return o instanceof WebGLTexture;
            }
        },
        defaultFontFamily: 'arial',
        getFontCanvas(contextAttributes) {
            return inject.getOffscreenCanvas(16, 16, '__$$CHECK_SUPPORT_FONT_FAMILY$$__', contextAttributes);
        },
        checkSupportFontFamily(ff) {
            ff = ff.toLowerCase();
            // 强制arial兜底
            if (ff === this.defaultFontFamily) {
                return true;
            }
            if (SUPPORT_FONT.hasOwnProperty(ff)) {
                return SUPPORT_FONT[ff];
            }
            let canvas = inject.getFontCanvas({ willReadFrequently: true });
            let context = canvas.ctx;
            context.textAlign = 'center';
            context.fillStyle = '#000';
            context.textBaseline = 'middle';
            if (!defaultFontFamilyData) {
                context.clearRect(0, 0, 16, 16);
                context.font = '16px ' + this.defaultFontFamily;
                context.fillText('a', 8, 8);
                defaultFontFamilyData = context.getImageData(0, 0, 16, 16).data;
            }
            context.clearRect(0, 0, 16, 16);
            if (/\s/.test(ff)) {
                ff = '"' + ff.replace(/"/g, '\\"') + '"';
            }
            context.font = '16px ' + ff + ',' + this.defaultFontFamily;
            context.fillText('a', 8, 8);
            let data = context.getImageData(0, 0, 16, 16).data;
            for (let i = 0, len = data.length; i < len; i++) {
                if (defaultFontFamilyData[i] !== data[i]) {
                    return SUPPORT_FONT[ff] = true;
                }
            }
            return SUPPORT_FONT[ff] = false;
        },
        FONT,
        loadFont(fontFamily, url, cb) {
            if (isFunction(url)) {
                // @ts-ignore
                cb = url;
                url = fontFamily;
            }
            if (Array.isArray(url)) {
                if (!url.length) {
                    return cb && cb();
                }
                let count = 0;
                let len = url.length;
                let list = [];
                url.forEach((item, i) => {
                    inject.loadFont(item.fontFamily, item.url, function (cache) {
                        list[i] = cache;
                        if (++count === len) {
                            cb && cb(list);
                        }
                    });
                });
                return;
            }
            else if (!url || !isString(url)) {
                inject.error('Load font invalid: ' + url);
                cb && cb({
                    state: LOADED,
                    success: false,
                    url,
                });
                return;
            }
            let cache = FONT[url] = FONT[url] || {
                state: INIT,
                task: [],
            };
            if (cache.state === LOADED) {
                cb && cb(cache);
            }
            else if (cache.state === LOADING) {
                cb && cache.task.push(cb);
            }
            else {
                cache.state = LOADING;
                cb && cache.task.push(cb);
                if (MAX_LOAD_NUM > 0 && fontCount >= MAX_LOAD_NUM) {
                    fontQueue.push({
                        fontFamily,
                        url,
                    });
                    return;
                }
                fontCount++;
                function load(fontFamily, url, cache) {
                    if (url instanceof ArrayBuffer) {
                        success(url);
                    }
                    else {
                        let request = new XMLHttpRequest();
                        request.open('get', url, true);
                        request.responseType = 'arraybuffer';
                        request.onload = function () {
                            if (request.response) {
                                success(request.response);
                            }
                            else {
                                error();
                            }
                        };
                        request.onerror = error;
                        request.send();
                    }
                    function success(ab) {
                        let f = new FontFace(fontFamily, ab);
                        f.load().then(function () {
                            if (typeof document !== 'undefined') {
                                document.fonts.add(f);
                            }
                            cache.state = LOADED;
                            cache.success = true;
                            cache.url = url;
                            let list = cache.task.splice(0);
                            list.forEach((cb) => cb(cache, ab));
                        }).catch(error);
                        fontCount++;
                        if (fontQueue.length) {
                            let o = fontQueue.shift();
                            load(o.fontFamily, o.url, FONT[o.url]);
                        }
                    }
                    function error() {
                        cache.state = LOADED;
                        cache.success = false;
                        cache.url = url;
                        let list = cache.task.splice(0);
                        list.forEach((cb) => cb(cache));
                        fontCount--;
                        if (fontQueue.length) {
                            let o = fontQueue.shift();
                            load(o.fontFamily, o.url, FONT[o.url]);
                        }
                    }
                }
                load(fontFamily, url, cache);
            }
        },
        IMG,
        INIT,
        LOADED,
        LOADING,
        get MAX_LOAD_NUM() {
            return MAX_LOAD_NUM;
        },
        set MAX_LOAD_NUM(v) {
            // @ts-ignore
            MAX_LOAD_NUM = parseInt(v) || 0;
        },
        measureImg(url, cb) {
            if (Array.isArray(url)) {
                if (!url.length) {
                    return cb && cb();
                }
                let count = 0;
                let len = url.length;
                let list = [];
                url.forEach((item, i) => {
                    inject.measureImg(item, function (cache) {
                        list[i] = cache;
                        if (++count === len) {
                            cb && cb(list);
                        }
                    });
                });
                return;
            }
            else if (!url || !isString(url)) {
                inject.error('Measure img invalid: ' + url);
                cb && cb({
                    state: LOADED,
                    success: false,
                    url,
                });
                return;
            }
            let cache = IMG[url] = IMG[url] || {
                state: INIT,
                task: [],
            };
            if (cache.state === LOADED) {
                cb && cb(cache);
            }
            else if (cache.state === LOADING) {
                cb && cache.task.push(cb);
            }
            else {
                cache.state = LOADING;
                cb && cache.task.push(cb);
                if (MAX_LOAD_NUM > 0 && imgCount >= MAX_LOAD_NUM) {
                    imgQueue.push(url);
                    return;
                }
                imgCount++;
                function load(url, cache) {
                    let img = new Image();
                    img.onload = function () {
                        cache.state = LOADED;
                        cache.success = true;
                        cache.width = img.width;
                        cache.height = img.height;
                        cache.source = img;
                        cache.url = url;
                        let list = cache.task.splice(0);
                        list.forEach((cb) => {
                            cb(cache);
                        });
                        imgCount--;
                        if (imgQueue.length) {
                            let o = imgQueue.shift();
                            load(o, IMG[o]);
                        }
                    };
                    img.onerror = function (e) {
                        cache.state = LOADED;
                        cache.success = false;
                        cache.url = url;
                        let list = cache.task.splice(0);
                        list.forEach((cb) => cb(cache));
                        imgCount--;
                        if (imgQueue.length) {
                            let o = imgQueue.shift();
                            load(o, cache);
                        }
                    };
                    if (url.substr(0, 5) !== 'data:') {
                        let host = /^(?:\w+:)?\/\/([^/:]+)/.exec(url);
                        if (host) {
                            if (typeof location === 'undefined' || location.hostname !== host[1]) {
                                img.crossOrigin = 'anonymous';
                            }
                        }
                    }
                    img.src = url;
                }
                load(url, cache);
            }
        },
        log(s) {
            console.log(s);
        },
        warn(s) {
            console.warn(s);
        },
        error(s) {
            console.error(s);
        },
    };

    function compatibleTransform(k, v) {
        if (k === 'scaleX' || k === 'scaleY') {
            v.u = StyleUnit.NUMBER;
        }
        else if (k === 'translateX' || k === 'translateY') {
            if (v.u === StyleUnit.NUMBER) {
                v.u = StyleUnit.PX;
            }
        }
        else {
            if (v.u === StyleUnit.NUMBER) {
                v.u = StyleUnit.DEG;
            }
        }
    }
    function normalize(style) {
        const res = {};
        [
            'left',
            'top',
            'right',
            'bottom',
            'width',
            'height',
        ].forEach(k => {
            let v = style[k];
            if (isNil(v)) {
                return;
            }
            const n = calUnit(v || 0);
            // 无单位视为px
            if ([StyleUnit.NUMBER, StyleUnit.DEG].indexOf(n.u) > -1) {
                n.u = StyleUnit.PX;
            }
            // 限定正数
            if (k === 'width' || k === 'height') {
                if (n.v < 0) {
                    n.v = 0;
                }
            }
            res[k] = n;
        });
        const lineHeight = style.lineHeight;
        if (!isNil(lineHeight)) {
            if (lineHeight === 'normal') {
                res.lineHeight = {
                    v: 0,
                    u: StyleUnit.AUTO,
                };
            }
            else {
                let n = calUnit(lineHeight || 0);
                if (n.v <= 0) {
                    n = {
                        v: 0,
                        u: StyleUnit.AUTO,
                    };
                }
                else if ([StyleUnit.DEG, StyleUnit.NUMBER].indexOf(n.u) > -1) {
                    n.u = StyleUnit.PX;
                }
                res.lineHeight = n;
            }
        }
        const visible = style.visible;
        if (!isNil(visible)) {
            res.visible = {
                v: visible,
                u: StyleUnit.BOOLEAN,
            };
        }
        const fontFamily = style.fontFamily;
        if (!isNil(fontFamily)) {
            res.fontFamily = {
                v: fontFamily.toString().trim().toLowerCase()
                    .replace(/['"]/g, '')
                    .replace(/\s*,\s*/g, ','),
                u: StyleUnit.STRING,
            };
        }
        const fontSize = style.fontSize;
        if (!isNil(fontSize)) {
            let n = calUnit(fontSize || 16);
            if (n.v <= 0) {
                n.v = 16;
            }
            // 防止小数
            n.v = Math.floor(n.v);
            if ([StyleUnit.NUMBER, StyleUnit.DEG].indexOf(n.u) > -1) {
                n.u = StyleUnit.PX;
            }
            res.fontSize = n;
        }
        const fontWeight = style.fontWeight;
        if (!isNil(fontWeight)) {
            if (/normal/i.test(fontWeight)) {
                res.fontWeight = { v: 400, u: StyleUnit.NUMBER };
            }
            else if (/bold/i.test(fontWeight)) {
                res.fontWeight = { v: 700, u: StyleUnit.NUMBER };
            }
            else if (/bolder/i.test(fontWeight)) {
                res.fontWeight = { v: 900, u: StyleUnit.NUMBER };
            }
            else if (/lighter/i.test(fontWeight)) {
                res.fontWeight = { v: 300, u: StyleUnit.NUMBER };
            }
            else {
                res.fontWeight = {
                    v: Math.min(900, Math.max(100, parseInt(fontWeight) || 400)),
                    u: StyleUnit.NUMBER,
                };
            }
        }
        const fontStyle = style.fontStyle;
        if (!isNil(fontStyle)) {
            let v = FONT_STYLE.NORMAL;
            if (/italic/i.test(fontStyle)) {
                v = FONT_STYLE.ITALIC;
            }
            else if (/oblique/i.test(fontStyle)) {
                v = FONT_STYLE.OBLIQUE;
            }
            res.fontStyle = { v, u: StyleUnit.NUMBER };
        }
        const color = style.color;
        if (!isNil(color)) {
            res.color = { v: color2rgbaInt(color), u: StyleUnit.RGBA };
        }
        const backgroundColor = style.backgroundColor;
        if (!isNil(backgroundColor)) {
            res.backgroundColor = { v: color2rgbaInt(backgroundColor), u: StyleUnit.RGBA };
        }
        const overflow = style.overflow;
        if (!isNil(overflow)) {
            res.overflow = { v: overflow, u: StyleUnit.STRING };
        }
        const opacity = style.opacity;
        if (!isNil(opacity)) {
            res.opacity = { v: Math.max(0, Math.min(1, opacity)), u: StyleUnit.NUMBER };
        }
        [
            'translateX',
            'translateY',
            'scaleX',
            'scaleY',
            'rotateZ',
        ].forEach(k => {
            let v = style[k];
            if (isNil(v)) {
                return;
            }
            const n = calUnit(v);
            // 没有单位或默认值处理单位
            compatibleTransform(k, n);
            res[k] = n;
        });
        const transformOrigin = style.transformOrigin;
        if (!isNil(transformOrigin)) {
            let o;
            if (Array.isArray(transformOrigin)) {
                o = transformOrigin;
            }
            else {
                o = transformOrigin.match(/(([-+]?[\d.]+[pxremvwhina%]*)|(left|top|right|bottom|center)){1,2}/ig);
            }
            if (o.length === 1) {
                o[1] = o[0];
            }
            const arr = [];
            for (let i = 0; i < 2; i++) {
                let item = o[i];
                if (/^[-+]?[\d.]/.test(item)) {
                    let n = calUnit(item);
                    if ([StyleUnit.NUMBER, StyleUnit.DEG].indexOf(n.u) > -1) {
                        n.u = StyleUnit.PX;
                    }
                    arr.push(n);
                }
                else {
                    arr.push({
                        v: {
                            top: 0,
                            left: 0,
                            center: 50,
                            right: 100,
                            bottom: 100,
                        }[item],
                        u: StyleUnit.PERCENT,
                    });
                    // 不规范的写法变默认值50%
                    if (isNil(arr[i].v)) {
                        arr[i].v = 50;
                    }
                }
            }
            res.transformOrigin = arr;
        }
        const mixBlendMode = style.mixBlendMode;
        if (!isNil(mixBlendMode)) {
            let v = MIX_BLEND_MODE.NORMAL;
            if (/multiply/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.MULTIPLY;
            }
            else if (/screen/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.SCREEN;
            }
            else if (/overlay/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.OVERLAY;
            }
            else if (/darken/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.DARKEN;
            }
            else if (/lighten/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.LIGHTEN;
            }
            else if (/color-dodge/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.COLOR_DODGE;
            }
            else if (/color-burn/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.COLOR_BURN;
            }
            else if (/hard-light/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.HARD_LIGHT;
            }
            else if (/soft-light/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.SOFT_LIGHT;
            }
            else if (/difference/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.DIFFERENCE;
            }
            else if (/exclusion/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.EXCLUSION;
            }
            else if (/hue/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.HUE;
            }
            else if (/saturation/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.SATURATION;
            }
            else if (/color/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.COLOR;
            }
            else if (/luminosity/i.test(fontStyle)) {
                v = MIX_BLEND_MODE.LUMINOSITY;
            }
            res.mixBlendMode = { v, u: StyleUnit.NUMBER };
        }
        const pointerEvents = style.pointerEvents;
        if (!isNil(pointerEvents)) {
            res.pointerEvents = { v: pointerEvents, u: StyleUnit.BOOLEAN };
        }
        return res;
    }
    function equalStyle(k, a, b) {
        if (k === 'transformOrigin') {
            return a[k][0].v === b[k][0].v && a[k][0].u === b[k][0].u
                && a[k][1].v === b[k][1].v && a[k][1].u === b[k][1].u;
        }
        if (k === 'color' || k === 'backgroundColor') {
            return a[k].v[0] === b[k].v[0]
                && a[k].v[1] === b[k].v[1]
                && a[k].v[2] === b[k].v[2]
                && a[k].v[3] === b[k].v[3];
        }
        // @ts-ignore
        return a[k].v === b[k].v && a[k].u === b[k].u;
    }
    function color2rgbaInt(color) {
        if (Array.isArray(color)) {
            return color;
        }
        let res = [];
        if (!color || color === 'transparent') {
            res = [0, 0, 0, 0];
        }
        else if (color.charAt(0) === '#') {
            color = color.slice(1);
            if (color.length === 3) {
                res.push(parseInt(color.charAt(0) + color.charAt(0), 16));
                res.push(parseInt(color.charAt(1) + color.charAt(1), 16));
                res.push(parseInt(color.charAt(2) + color.charAt(2), 16));
                res[3] = 1;
            }
            else if (color.length === 6) {
                res.push(parseInt(color.slice(0, 2), 16));
                res.push(parseInt(color.slice(2, 4), 16));
                res.push(parseInt(color.slice(4), 16));
                res[3] = 1;
            }
            else if (color.length === 8) {
                res.push(parseInt(color.slice(0, 2), 16));
                res.push(parseInt(color.slice(2, 4), 16));
                res.push(parseInt(color.slice(4, 6), 16));
                res.push(parseInt(color.slice(6), 16) / 255);
            }
            else {
                res[0] = res[1] = res[2] = 0;
                res[3] = 1;
            }
        }
        else {
            let c = color.match(/rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
            if (c) {
                res = [parseInt(c[1]), parseInt(c[2]), parseInt(c[3])];
                if (!isNil(c[4])) {
                    res[3] = parseFloat(c[4]);
                }
                else {
                    res[3] = 1;
                }
            }
            else {
                res = [0, 0, 0, 0];
            }
        }
        return res;
    }
    function color2rgbaStr(color) {
        if (Array.isArray(color)) {
            if (color.length === 3 || color.length === 4) {
                color[0] = Math.floor(Math.max(color[0], 0));
                color[1] = Math.floor(Math.max(color[1], 0));
                color[2] = Math.floor(Math.max(color[2], 0));
                if (color.length === 4) {
                    color[3] = Math.max(color[3], 0);
                    return 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + color[3] + ')';
                }
                return 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',1)';
            }
        }
        return color || 'rgba(0,0,0,0)';
    }
    function color2gl(color) {
        if (!Array.isArray(color)) {
            color = color2rgbaInt(color);
        }
        return [
            color[0] / 255,
            color[1] / 255,
            color[2] / 255,
            color.length === 3 ? 1 : color[3],
        ];
    }
    function setFontStyle(style) {
        let fontSize = style.fontSize || 0;
        let fontFamily = style.fontFamily || inject.defaultFontFamily || 'arial';
        if (/\s/.test(fontFamily)) {
            fontFamily = '"' + fontFamily.replace(/"/g, '\\"') + '"';
        }
        return (style.fontStyle || 'normal') + ' ' + (style.fontWeight || '400') + ' '
            + fontSize + 'px/' + fontSize + 'px ' + fontFamily;
    }
    function calFontFamily(fontFamily) {
        let ff = fontFamily.split(/\s*,\s*/);
        for (let i = 0, len = ff.length; i < len; i++) {
            let item = ff[i].replace(/^['"]/, '').replace(/['"]$/, '');
            if (o.hasLoaded(item) || inject.checkSupportFontFamily(item)) {
                return item;
            }
        }
        return inject.defaultFontFamily;
    }
    function calNormalLineHeight(style, ff) {
        if (!ff) {
            ff = calFontFamily(style.fontFamily);
        }
        return style.fontSize * (o.info[ff] || o.info[inject.defaultFontFamily] || o.info.arial).lhr;
    }
    /**
     * https://zhuanlan.zhihu.com/p/25808995
     * 根据字形信息计算baseline的正确值，差值上下均分
     * @param style computedStyle
     * @returns {number}
     */
    function getBaseline(style) {
        let fontSize = style.fontSize;
        let ff = calFontFamily(style.fontFamily);
        let normal = calNormalLineHeight(style, ff);
        return (style.lineHeight - normal) * 0.5 + fontSize * (o.info[ff] || o.info[inject.defaultFontFamily] || o.info.arial).blr;
    }
    function calSize(v, p) {
        if (v.u === StyleUnit.PX) {
            return v.v;
        }
        if (v.u === StyleUnit.PERCENT) {
            return v.v * p * 0.01;
        }
        return 0;
    }
    var css = {
        normalize,
        equalStyle,
        color2rgbaInt,
        color2rgbaStr,
        color2gl,
        calFontFamily,
        calNormalLineHeight,
        getBaseline,
        calSize,
    };

    function calRotateZ(t, v) {
        v = d2r(v);
        let sin = Math.sin(v);
        let cos = Math.cos(v);
        t[0] = t[5] = cos;
        t[1] = sin;
        t[4] = -sin;
        return t;
    }
    // 已有计算好的变换矩阵，根据tfo原点计算最终的matrix
    function calMatrixByOrigin(m, ox, oy) {
        let res = m.slice(0);
        if (ox === 0 && oy === 0 || isE(m)) {
            return res;
        }
        res = tfoMultiply(ox, oy, res);
        res = multiplyTfo(res, -ox, -oy);
        return res;
    }
    function calStyleMatrix(style, x = 0, y = 0, width = 0, height = 0, computedStyle) {
        const transform = identity();
        transform[12] = style.translateX ? calSize(style.translateX, width) : 0;
        transform[13] = style.translateY ? calSize(style.translateY, height) : 0;
        const rotateZ = style.rotateZ ? style.rotateZ.v : 0;
        const scaleX = style.scaleX ? style.scaleX.v : 1;
        const scaleY = style.scaleY ? style.scaleY.v : 1;
        if (computedStyle) {
            computedStyle.translateX = transform[12];
            computedStyle.translateY = transform[13];
            computedStyle.rotateZ = rotateZ;
            computedStyle.scaleX = scaleX;
            computedStyle.scaleY = scaleY;
        }
        if (isE(transform)) {
            calRotateZ(transform, rotateZ);
        }
        else if (rotateZ) {
            multiplyRotateZ(transform, d2r(rotateZ));
        }
        if (scaleX !== 1) {
            if (isE(transform)) {
                transform[0] = scaleX;
            }
            else {
                multiplyScaleX(transform, scaleX);
            }
        }
        if (scaleY !== 1) {
            if (isE(transform)) {
                transform[5] = scaleY;
            }
            else {
                multiplyScaleY(transform, scaleY);
            }
        }
        if (style.transformOrigin) {
            const tfo = style.transformOrigin.map((item, i) => {
                return calSize(item, i ? height : width);
            });
            if (computedStyle) {
                computedStyle.transformOrigin = tfo;
            }
            return calMatrixByOrigin(transform, tfo[0] + x, tfo[1] + y);
        }
        return transform;
    }
    function calMatrix(style, x = 0, y = 0, width = 0, height = 0, computedStyle) {
        return calStyleMatrix(normalize(style), x, y, width, height, computedStyle);
    }
    var transform = {
        calRotateZ,
        calMatrix,
        calStyleMatrix,
        calMatrixByOrigin,
    };

    var style = {
        font: o,
        transform,
        define,
        css,
    };

    var math = {
        geom,
        matrix,
        vector,
    };

    class Event {
        constructor() {
            this.__eHash = {};
        }
        on(id, handle) {
            if (!isFunction(handle)) {
                return;
            }
            let self = this;
            if (Array.isArray(id)) {
                for (let i = 0, len = id.length; i < len; i++) {
                    self.on(id[i], handle);
                }
            }
            else {
                if (!self.__eHash.hasOwnProperty(id)) {
                    self.__eHash[id] = [];
                }
                // 遍历防止此handle被侦听过了
                for (let i = 0, item = self.__eHash[id], len = item.length; i < len; i++) {
                    if (item[i] === handle) {
                        return self;
                    }
                }
                self.__eHash[id].push(handle);
            }
            return self;
        }
        once(id, handle) {
            if (!isFunction(handle)) {
                return;
            }
            let self = this;
            // 包裹一层会导致添加后删除对比引用删不掉，需保存原有引用进行对比
            function cb() {
                handle.apply(self, arguments);
                self.off(id, cb);
            }
            cb.__eventCb = handle;
            if (Array.isArray(id)) {
                for (let i = 0, len = id.length; i < len; i++) {
                    self.once(id[i], handle);
                }
            }
            else if (handle) {
                self.on(id, cb);
            }
            return this;
        }
        off(id, handle) {
            let self = this;
            if (Array.isArray(id)) {
                for (let i = 0, len = id.length; i < len; i++) {
                    self.off(id[i], handle);
                }
            }
            else if (self.__eHash.hasOwnProperty(id)) {
                if (handle) {
                    for (let i = 0, item = self.__eHash[id], len = item.length; i < len; i++) {
                        // 需考虑once包裹的引用对比
                        if (item[i] === handle || item[i].__eventCb === handle) {
                            item.splice(i, 1);
                            break;
                        }
                    }
                }
                // 未定义为全部清除
                else {
                    delete self.__eHash[id];
                }
            }
            return this;
        }
        emit(id, ...data) {
            let self = this;
            if (Array.isArray(id)) {
                for (let i = 0, len = id.length; i < len; i++) {
                    self.emit(id[i], data);
                }
            }
            else {
                if (self.__eHash.hasOwnProperty(id)) {
                    let list = self.__eHash[id];
                    if (list.length) {
                        list = list.slice();
                        for (let i = 0, len = list.length; i < len; i++) {
                            let cb = list[i];
                            if (isFunction(cb)) {
                                cb.apply(self, data);
                            }
                        }
                    }
                }
            }
            return this;
        }
    }
    Event.REFRESH = 'refresh';
    Event.DID_ADD_DOM = 'didAddDom';
    Event.WILL_REMOVE_DOM = 'willRemoveDom';
    Event.PAGE_CHANGED = 'pageChanged';

    var util = {
        type,
        Event,
        inject,
    };

    let isPause;
    function traversalBefore(list, length, diff) {
        for (let i = 0; i < length; i++) {
            let item = list[i];
            item.before && item.before(diff);
        }
    }
    function traversalAfter(list, length, diff) {
        for (let i = 0; i < length; i++) {
            let item = list[i];
            item.after(diff);
        }
    }
    class Frame {
        constructor() {
            this.rootTask = [];
            this.roots = [];
            this.task = [];
            this.now = inject.now();
            this.id = 0;
        }
        init() {
            let self = this;
            let { task } = self;
            inject.cancelAnimationFrame(self.id);
            let last = self.now = inject.now();
            function cb() {
                // 必须清除，可能会发生重复，当动画finish回调中gotoAndPlay(0)，下方结束判断发现aTask还有值会继续，新的init也会进入再次执行
                inject.cancelAnimationFrame(self.id);
                self.id = inject.requestAnimationFrame(function () {
                    let now = self.now = inject.now();
                    if (isPause || !task.length) {
                        return;
                    }
                    let diff = now - last;
                    diff = Math.max(diff, 0);
                    // let delta = diff * 0.06; // 比例是除以1/60s，等同于*0.06
                    last = now;
                    // 优先动画计算
                    let clone = task.slice(0);
                    let len1 = clone.length;
                    // 普通的before/after，动画计算在before，所有回调在after
                    traversalBefore(clone, len1, diff);
                    // 刷新成功后调用after，确保图像生成
                    traversalAfter(clone, len1, diff);
                    // 还有则继续，没有则停止节省性能
                    if (task.length) {
                        cb();
                    }
                });
            }
            cb();
        }
        onFrame(handle) {
            if (!handle) {
                return;
            }
            let { task } = this;
            if (!task.length) {
                this.init();
            }
            if (isFunction(handle)) {
                handle = {
                    after: handle,
                    ref: handle,
                };
            }
            task.push(handle);
        }
        offFrame(handle) {
            if (!handle) {
                return;
            }
            let { task } = this;
            for (let i = 0, len = task.length; i < len; i++) {
                let item = task[i];
                // 需考虑nextFrame包裹的引用对比
                if (item === handle || item.ref === handle) {
                    task.splice(i, 1);
                    break;
                }
            }
            if (!task.length) {
                inject.cancelAnimationFrame(this.id);
                this.now = 0;
            }
        }
        nextFrame(handle) {
            if (!handle) {
                return;
            }
            // 包裹一层会导致添加后删除对比引用删不掉，需保存原有引用进行对比
            let cb = isFunction(handle) ? {
                after: (diff) => {
                    handle(diff);
                    this.offFrame(cb);
                },
            } : {
                before: handle.before,
                after: (diff) => {
                    handle.after && handle.after(diff);
                    this.offFrame(cb);
                },
            };
            cb.ref = handle;
            this.onFrame(cb);
        }
        pause() {
            isPause = true;
        }
        resume() {
            if (isPause) {
                this.init();
                isPause = false;
            }
        }
        addRoot(root) {
            this.roots.push(root);
        }
        removeRoot(root) {
            let i = this.roots.indexOf(root);
            if (i > -1) {
                this.roots.splice(i, 1);
            }
        }
    }
    const frame = new Frame();

    var animation = {
        frame,
    };

    // Unique ID creation requires a high quality random # generator. In the browser we therefore
    // require the crypto API and do not support built-in fallback to lower quality random number
    // generators (like Math.random()).
    let getRandomValues;
    const rnds8 = new Uint8Array(16);
    function rng() {
      // lazy load so that environments that need to polyfill have a chance to do so
      if (!getRandomValues) {
        // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
        getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);

        if (!getRandomValues) {
          throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
      }

      return getRandomValues(rnds8);
    }

    /**
     * Convert array of 16 byte values to UUID string format of the form:
     * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
     */

    const byteToHex = [];

    for (let i = 0; i < 256; ++i) {
      byteToHex.push((i + 0x100).toString(16).slice(1));
    }

    function unsafeStringify(arr, offset = 0) {
      // Note: Be careful editing this code!  It's been tuned for performance
      // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
      return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
    }

    const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
    var native = {
      randomUUID
    };

    function v4(options, buf, offset) {
      if (native.randomUUID && !buf && !options) {
        return native.randomUUID();
      }

      options = options || {};
      const rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

      rnds[6] = rnds[6] & 0x0f | 0x40;
      rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

      if (buf) {
        offset = offset || 0;

        for (let i = 0; i < 16; ++i) {
          buf[offset + i] = rnds[i];
        }

        return buf;
      }

      return unsafeStringify(rnds);
    }

    function createTexture(gl, n, tex, width, height) {
        let texture = gl.createTexture();
        bindTexture(gl, texture, n);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        // 传入需要绑定的纹理
        if (tex) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
        }
        // 或者尺寸来绑定fbo
        else if (width && height) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
        else {
            throw new Error('Missing texImageSource or w/h');
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        return texture;
    }
    function bindTexture(gl, texture, n) {
        // @ts-ignore
        gl.activeTexture(gl['TEXTURE' + n]);
        gl.bindTexture(gl.TEXTURE_2D, texture);
    }
    function drawTextureCache(gl, cx, cy, program, list, vertCount) {
        if (!list.length || !vertCount) {
            return;
        }
        const vtPoint = new Float32Array(vertCount * 12);
        const vtTex = new Float32Array(vertCount * 12);
        const vtOpacity = new Float32Array(vertCount * 6);
        for (let i = 0, len = list.length; i < len; i++) {
            const { node, opacity, matrix, cache } = list[i];
            const { texture } = cache;
            bindTexture(gl, texture, 0);
            const { x, y, width, height } = node;
            let x1 = x, y1 = y;
            const t = calRectPoint(x1, y1, x1 + width, y1 + height, matrix);
            const t1 = convertCoords2Gl(t.x1, t.y1, cx, cy);
            const t2 = convertCoords2Gl(t.x2, t.y2, cx, cy);
            const t3 = convertCoords2Gl(t.x3, t.y3, cx, cy);
            const t4 = convertCoords2Gl(t.x4, t.y4, cx, cy);
            let k = i * 12;
            vtPoint[k] = t1.x;
            vtPoint[k + 1] = t1.y;
            vtPoint[k + 2] = t4.x;
            vtPoint[k + 3] = t4.y;
            vtPoint[k + 4] = t2.x;
            vtPoint[k + 5] = t2.y;
            vtPoint[k + 6] = t4.x;
            vtPoint[k + 7] = t4.y;
            vtPoint[k + 8] = t2.x;
            vtPoint[k + 9] = t2.y;
            vtPoint[k + 10] = t3.x;
            vtPoint[k + 11] = t3.y;
            vtTex[k] = 0;
            vtTex[k + 1] = 0;
            vtTex[k + 2] = 0;
            vtTex[k + 3] = 1;
            vtTex[k + 4] = 1;
            vtTex[k + 5] = 0;
            vtTex[k + 6] = 0;
            vtTex[k + 7] = 1;
            vtTex[k + 8] = 1;
            vtTex[k + 9] = 0;
            vtTex[k + 10] = 1;
            vtTex[k + 11] = 1;
            k = i * 6;
            vtOpacity[k] = opacity;
            vtOpacity[k + 1] = opacity;
            vtOpacity[k + 2] = opacity;
            vtOpacity[k + 3] = opacity;
            vtOpacity[k + 4] = opacity;
            vtOpacity[k + 5] = opacity;
        }
        // 顶点buffer
        const pointBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vtPoint, gl.STATIC_DRAW);
        const a_position = gl.getAttribLocation(program, 'a_position');
        gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_position);
        // 纹理buffer
        const texBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vtTex, gl.STATIC_DRAW);
        let a_texCoords = gl.getAttribLocation(program, 'a_texCoords');
        gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_texCoords);
        // opacity buffer
        const opacityBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, opacityBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vtOpacity, gl.STATIC_DRAW);
        const a_opacity = gl.getAttribLocation(program, 'a_opacity');
        gl.vertexAttribPointer(a_opacity, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_opacity);
        // 纹理单元
        let u_texture = gl.getUniformLocation(program, 'u_texture');
        gl.uniform1i(u_texture, 0);
        // 渲染并销毁
        gl.drawArrays(gl.TRIANGLES, 0, vertCount * 6);
        gl.deleteBuffer(pointBuffer);
        gl.deleteBuffer(texBuffer);
        gl.deleteBuffer(opacityBuffer);
        gl.disableVertexAttribArray(a_position);
        gl.disableVertexAttribArray(a_texCoords);
        gl.disableVertexAttribArray(a_opacity);
    }
    function convertCoords2Gl(x, y, cx, cy) {
        if (x === cx) {
            x = 0;
        }
        else {
            x = (x - cx) / cx;
        }
        if (y === cy) {
            y = 0;
        }
        else {
            y = (cy - y) / cy;
        }
        return { x, y };
    }

    const HASH$1 = {};
    class TextureCache {
        constructor(texture) {
            this.available = true;
            this.texture = texture;
        }
        release(gl) {
            if (!this.available) {
                return;
            }
            this.available = false;
            gl.deleteTexture(this.texture);
        }
        releaseImg(gl, url) {
            if (!this.available) {
                return;
            }
            this.available = false;
            const o = HASH$1[url];
            o.count--;
            if (!o.count) {
                // 此时无引用计数可清空且释放texture
                delete HASH$1[url];
                gl.deleteTexture(this.texture);
            }
        }
        static getInstance(gl, canvas) {
            const texture = createTexture(gl, 0, canvas);
            return new TextureCache(texture);
        }
        static getImgInstance(gl, canvas, url) {
            if (HASH$1.hasOwnProperty(url)) {
                const o = HASH$1[url];
                o.count++;
                return new TextureCache(HASH$1[url].value);
            }
            const texture = createTexture(gl, 0, canvas);
            HASH$1[url] = {
                value: texture,
                count: 1,
            };
            return new TextureCache(texture);
        }
    }

    class Node extends Event {
        constructor(props) {
            super();
            this.props = props;
            this.props.uuid = this.props.uuid || v4();
            this.style = normalize(getDefaultStyle(props.style));
            // @ts-ignore
            this.computedStyle = {}; // 输出展示的值
            this.cacheStyle = []; // 缓存js直接使用的对象结果
            this.x = 0;
            this.y = 0;
            this.width = 0;
            this.height = 0;
            this.isDestroyed = true;
            this.struct = {
                node: this,
                num: 0,
                total: 0,
                lv: 0,
            };
            this.refreshLevel = RefreshLevel.REFLOW;
            this._opacity = 1;
            this.transform = identity();
            this.matrix = identity();
            this._matrixWorld = identity();
            this.hasContent = false;
        }
        // 添加到dom后标记非销毁状态，和root引用
        didMount() {
            this.isDestroyed = false;
            this.root = this.parent.root;
        }
        layout(data) {
            if (this.isDestroyed) {
                return;
            }
            this.refreshLevel = RefreshLevel.REFLOW;
            // 布局时计算所有样式，更新时根据不同级别调用
            this.calReflowStyle();
            this.calRepaintStyle();
            // 布局数据在更新时会用到
            this.layoutData = {
                x: data.x,
                y: data.y,
                w: data.w,
                h: data.h,
            };
            const { style, computedStyle } = this;
            const { left, top, right, bottom, width, height, } = style;
            let fixedLeft = false;
            let fixedTop = false;
            let fixedRight = false;
            let fixedBottom = false;
            if (left.u === StyleUnit.AUTO) {
                computedStyle.left = 0;
            }
            else {
                fixedLeft = true;
                computedStyle.left = calSize(left, data.w);
            }
            if (right.u === StyleUnit.AUTO) {
                computedStyle.right = 0;
            }
            else {
                fixedRight = true;
                computedStyle.right = calSize(right, data.w);
            }
            if (top.u === StyleUnit.AUTO) {
                computedStyle.top = 0;
            }
            else {
                fixedTop = true;
                computedStyle.top = calSize(top, data.h);
            }
            if (bottom.u === StyleUnit.AUTO) {
                computedStyle.bottom = 0;
            }
            else {
                fixedBottom = true;
                computedStyle.bottom = calSize(bottom, data.h);
            }
            if (width.u === StyleUnit.AUTO) {
                computedStyle.width = 0;
            }
            else {
                computedStyle.width = calSize(width, data.w);
            }
            if (height.u === StyleUnit.AUTO) {
                computedStyle.height = 0;
            }
            else {
                computedStyle.height = calSize(height, data.h);
            }
            // 左右决定x+width
            if (fixedLeft && fixedRight) {
                this.x = data.x + computedStyle.left;
                this.width = data.w - computedStyle.left - computedStyle.right;
            }
            else if (fixedLeft) {
                this.x = data.x + computedStyle.left;
                if (width.u !== StyleUnit.AUTO) {
                    this.width = computedStyle.width;
                }
                else {
                    this.width = 0;
                }
            }
            else if (fixedRight) {
                if (width.u !== StyleUnit.AUTO) {
                    this.width = computedStyle.width;
                }
                else {
                    this.width = 0;
                }
                this.x = data.x + data.w - this.width - computedStyle.right;
            }
            else {
                this.x = data.x;
                if (width.u !== StyleUnit.AUTO) {
                    this.width = computedStyle.width;
                }
                else {
                    this.width = 0;
                }
            }
            // 上下决定y+height
            if (fixedTop && fixedBottom) {
                this.y = data.y + computedStyle.top;
                this.height = data.h - computedStyle.top - computedStyle.bottom;
            }
            else if (fixedTop) {
                this.y = data.y + computedStyle.top;
                if (height.u !== StyleUnit.AUTO) {
                    this.height = computedStyle.height;
                }
                else {
                    this.height = 0;
                }
            }
            else if (fixedBottom) {
                if (height.u !== StyleUnit.AUTO) {
                    this.height = computedStyle.height;
                }
                else {
                    this.height = 0;
                }
                this.y = data.y + data.h - this.height - computedStyle.bottom;
            }
            else {
                this.y = data.y;
                if (height.u !== StyleUnit.AUTO) {
                    this.height = computedStyle.height;
                }
                else {
                    this.height = 0;
                }
            }
            this._rect = undefined;
            this._bbox = undefined;
        }
        // 布局前计算需要在布局阶段知道的样式，且必须是最终像素值之类，不能是百分比等原始值
        calReflowStyle() {
            const { style, computedStyle, parent } = this;
            computedStyle.fontFamily = style.fontFamily.v;
            computedStyle.fontSize = style.fontSize.v;
            computedStyle.fontWeight = style.fontWeight.v;
            computedStyle.fontStyle = style.fontStyle.v;
            const lineHeight = style.lineHeight;
            if (lineHeight.u === StyleUnit.AUTO) {
                computedStyle.lineHeight = calNormalLineHeight(computedStyle);
            }
            else {
                computedStyle.lineHeight = lineHeight.v;
            }
            this.width = this.height = 0;
            const width = style.width;
            const height = style.height;
            if (parent) {
                if (width.u !== StyleUnit.AUTO) {
                    this.width = computedStyle.width = calSize(width, parent.width);
                }
                if (height.u !== StyleUnit.AUTO) {
                    this.height = computedStyle.height = calSize(height, parent.height);
                }
            }
        }
        calRepaintStyle() {
            const { style, computedStyle } = this;
            computedStyle.visible = style.visible.v;
            computedStyle.overflow = style.overflow.v;
            computedStyle.color = style.color.v;
            computedStyle.backgroundColor = style.backgroundColor.v;
            computedStyle.opacity = style.opacity.v;
            computedStyle.mixBlendMode = style.mixBlendMode.v;
            computedStyle.pointerEvents = style.pointerEvents.v;
            this.calMatrix(RefreshLevel.REFLOW);
        }
        calMatrix(lv) {
            const { style, computedStyle, matrix, transform } = this;
            let optimize = true;
            if (lv >= RefreshLevel.REFLOW
                || lv & RefreshLevel.TRANSFORM
                || (lv & RefreshLevel.SCALE_X) && !computedStyle.scaleX
                || (lv & RefreshLevel.SCALE_Y) && !computedStyle.scaleY) {
                optimize = false;
            }
            // 优化计算scale不能为0，无法计算倍数差，rotateZ优化不能包含rotateX/rotateY/skew
            if (optimize) {
                if (lv & RefreshLevel.TRANSLATE_X) {
                    const v = calSize(style.translateX, this.width);
                    const diff = v - computedStyle.translateX;
                    computedStyle.translateX = v;
                    transform[12] += diff;
                    matrix[12] += diff;
                }
                if (lv & RefreshLevel.TRANSLATE_Y) {
                    const v = calSize(style.translateY, this.height);
                    const diff = v - computedStyle.translateY;
                    computedStyle.translateY = v;
                    transform[13] += diff;
                    matrix[13] += diff;
                }
                if (lv & RefreshLevel.ROTATE_Z) {
                    const v = style.rotateZ.v;
                    computedStyle.rotateZ = v;
                    const r = d2r(v);
                    const sin = Math.sin(r), cos = Math.cos(r);
                    const x = computedStyle.scaleX, y = computedStyle.scaleY;
                    const cx = matrix[0] = cos * x;
                    const sx = matrix[1] = sin * x;
                    const sy = matrix[4] = -sin * y;
                    const cy = matrix[5] = cos * y;
                    const t = computedStyle.transformOrigin, ox = t[0] + this.x, oy = t[1] + this.y;
                    matrix[12] = transform[12] + ox - cx * ox - oy * sy;
                    matrix[13] = transform[13] + oy - sx * ox - oy * cy;
                }
                if (lv & RefreshLevel.SCALE) {
                    if (lv & RefreshLevel.SCALE_X) {
                        const v = style.scaleX.v;
                        let x = v / computedStyle.scaleX;
                        computedStyle.scaleX = v;
                        transform[0] *= x;
                        transform[1] *= x;
                        transform[2] *= x;
                        matrix[0] *= x;
                        matrix[1] *= x;
                        matrix[2] *= x;
                    }
                    if (lv & RefreshLevel.SCALE_Y) {
                        const v = style.scaleY.v;
                        let y = v / computedStyle.scaleY;
                        computedStyle.scaleY = v;
                        transform[4] *= y;
                        transform[5] *= y;
                        transform[6] *= y;
                        matrix[4] *= y;
                        matrix[5] *= y;
                        matrix[6] *= y;
                    }
                    const t = computedStyle.transformOrigin, ox = t[0] + this.x, oy = t[1] + this.y;
                    matrix[12] = transform[12] + ox - transform[0] * ox - transform[4] * oy;
                    matrix[13] = transform[13] + oy - transform[1] * ox - transform[5] * oy;
                    matrix[14] = transform[14] - transform[2] * ox - transform[6] * oy;
                }
            }
            // 普通布局或者第一次计算
            else {
                const t = calStyleMatrix(style, this.x, this.y, this.width, this.height, computedStyle);
                assignMatrix(matrix, t);
            }
            return matrix;
        }
        calContent() {
            return this.hasContent = false;
        }
        renderCanvas() {
            // const canvasCache = this.canvasCache;
            // if (canvasCache && canvasCache.available) {
            //   canvasCache.release();
            // }
        }
        genTexture(gl) {
            this.textureCache = TextureCache.getInstance(gl, this.canvasCache.offscreen.canvas);
        }
        releaseCache(gl) {
            var _a, _b;
            (_a = this.canvasCache) === null || _a === void 0 ? void 0 : _a.release();
            (_b = this.textureCache) === null || _b === void 0 ? void 0 : _b.release(gl);
        }
        remove(cb) {
            const { root, parent } = this;
            if (!root) {
                return;
            }
            if (parent) {
                let i = parent.children.indexOf(this);
                if (i === -1) {
                    throw new Error('Invalid index of remove()');
                }
                parent.children.splice(i, 1);
                const { prev, next } = this;
                if (prev) {
                    prev.next = next;
                }
                if (next) {
                    next.prev = prev;
                }
            }
            // 未添加到dom时
            if (this.isDestroyed) {
                cb && cb(true);
                return;
            }
            parent === null || parent === void 0 ? void 0 : parent.deleteStruct(this);
        }
        destroy() {
            if (this.isDestroyed) {
                return;
            }
            this.isDestroyed = true;
            this.prev = this.next = this.parent = this.root = undefined;
        }
        structure(lv) {
            const temp = this.struct;
            temp.lv = lv;
            return [temp];
        }
        updateStyle(style, cb) {
            const visible = this.computedStyle.visible;
            let hasVisible = false;
            const keys = [];
            const style2 = normalize(style);
            for (let k in style2) {
                if (style2.hasOwnProperty(k)) {
                    // @ts-ignore
                    const v = style2[k];
                    if (!equalStyle(k, style2, this.style)) {
                        // @ts-ignore
                        this.style[k] = v;
                        keys.push(k);
                        if (k === 'visible') {
                            hasVisible = true;
                        }
                    }
                }
            }
            // 不可见或销毁无需刷新
            if (!keys.length || this.isDestroyed || !visible && !hasVisible) {
                cb && cb(true);
                return;
            }
            // 父级不可见无需刷新
            let parent = this.parent;
            while (parent) {
                if (!parent.computedStyle.visible) {
                    cb && cb(true);
                    return;
                }
                parent = parent.parent;
            }
            this.root.addUpdate(this, keys, undefined, false, false, false, cb);
        }
        getComputedStyle() {
            const computedStyle = this.computedStyle;
            const res = {};
            for (let k in computedStyle) {
                if (k === 'color' || k === 'backgroundColor') {
                    res[k] = color2rgbaStr(computedStyle[k]);
                }
                else {
                    // @ts-ignore
                    res[k] = computedStyle[k];
                }
            }
            return res;
        }
        getStyle(k) {
            const computedStyle = this.computedStyle;
            if (k === 'color' || k === 'backgroundColor') {
                // @ts-ignore
                return color2rgbaStr(computedStyle[k]);
            }
            // @ts-ignore
            return computedStyle[k];
        }
        getBoundingClientRect() {
            const { bbox, matrixWorld } = this;
            const { x1, y1, x2, y2, x3, y3, x4, y4 } = calRectPoint(bbox[0], bbox[1], bbox[2], bbox[3], matrixWorld);
            return {
                left: Math.min(x1, Math.min(x2, Math.min(x3, x4))),
                top: Math.min(y1, Math.min(y2, Math.min(y3, y4))),
                right: Math.max(x1, Math.max(x2, Math.max(x3, x4))),
                bottom: Math.max(y1, Math.max(y2, Math.max(y3, y4))),
                points: [{
                        x: x1,
                        y: y1,
                    }, {
                        x: x2,
                        y: y2,
                    }, {
                        x: x3,
                        y: y3,
                    }, {
                        x: x4,
                        y: y4,
                    }],
            };
        }
        get opacity() {
            let parent = this.parent;
            // 非Root节点继续向上乘
            if (parent) {
                const po = parent.opacity;
                this._opacity = this.computedStyle.opacity * po;
            }
            // Root的世界透明度就是自己
            else {
                this._opacity = this.computedStyle.opacity;
            }
            return this._opacity;
        }
        // 可能在布局后异步渲染前被访问，此时没有这个数据，刷新后就有缓存，变更transform或者reflow无缓存
        get matrixWorld() {
            const root = this.root;
            if (!root) {
                return this.matrix;
            }
            const m = this._matrixWorld;
            // root总刷新没有包含变更，可以直接取缓存，否则才重新计算
            if (root.rl & RefreshLevel.REFLOW_TRANSFORM) {
                let parent = this.parent;
                let cache = true;
                // 检测树到根路径有无变更，没有也可以直接取缓存
                while (parent) {
                    if (parent.refreshLevel & RefreshLevel.REFLOW_TRANSFORM) {
                        cache = false;
                        break;
                    }
                    parent = parent.parent;
                }
                if (!cache) {
                    assignMatrix(m, this.matrix);
                    parent = this.parent;
                    while (parent) {
                        multiply2(parent.matrix, m);
                        parent = parent.parent;
                    }
                }
            }
            return m;
        }
        get rect() {
            if (!this._rect) {
                this._rect = new Float64Array(4);
                this._rect[0] = this.x;
                this._rect[1] = this.y;
                this._rect[2] = this.x + this.width;
                this._rect[3] = this.y + this.height;
            }
            return this._rect;
        }
        get bbox() {
            if (!this._bbox) {
                let bbox = this._rect || this.rect;
                this._bbox = bbox.slice(0);
            }
            return this._bbox;
        }
    }

    class Container extends Node {
        constructor(props, children = []) {
            super(props);
            this.isGroup = false; // Group对象和Container基本一致，多了自适应尺寸和选择区别
            this.isArtBoard = false;
            this.isPage = false;
            this.children = children;
        }
        // 添加到dom后isDestroyed状态以及设置父子兄弟关系，有点重复设置，目前没JSX这种一口气创建一颗子树
        didMount() {
            super.didMount();
            const { children } = this;
            const len = children.length;
            if (len) {
                const first = children[0];
                first.parent = this;
                first.didMount();
                let last = first;
                for (let i = 1; i < len; i++) {
                    const child = children[i];
                    child.parent = this;
                    child.didMount();
                    last.next = child;
                    child.prev = last;
                    last = child;
                }
            }
        }
        layout(data) {
            if (this.isDestroyed) {
                return;
            }
            super.layout(data);
            const { children } = this;
            for (let i = 0, len = children.length; i < len; i++) {
                const child = children[i];
                child.layout({
                    x: this.x,
                    y: this.y,
                    w: this.width,
                    h: this.height,
                });
            }
        }
        appendChild(node, cb) {
            const { root, children } = this;
            const len = children.length;
            if (len) {
                const last = children[children.length - 1];
                last.next = node;
                node.prev = last;
            }
            node.parent = this;
            node.root = root;
            children.push(node);
            // 离屏情况，尚未添加到dom等
            if (this.isDestroyed) {
                cb && cb(true);
                return;
            }
            node.didMount();
            this.insertStruct(node, len);
            root.addUpdate(node, [], RefreshLevel.REFLOW, true, false, false, cb);
        }
        prependChild(node, cb) {
            const { root, children } = this;
            const len = children.length;
            if (len) {
                const first = children[0];
                first.next = node;
                node.prev = first;
            }
            node.parent = this;
            node.root = root;
            children.push(node);
            // 离屏情况，尚未添加到dom等
            if (this.isDestroyed) {
                cb && cb(true);
                return;
            }
            node.didMount();
            this.insertStruct(node, 0);
            root.addUpdate(node, [], RefreshLevel.REFLOW, true, false, false, cb);
        }
        appendSelf(node, cb) {
            const { root, parent } = this;
            if (!parent) {
                throw new Error('Can not appendSelf without parent');
            }
            node.parent = parent;
            node.prev = this;
            node.next = this.next;
            this.next = node;
            node.root = root;
            const children = parent.children;
            const i = children.indexOf(this);
            children.splice(i + 1, 0, node);
            if (parent.isDestroyed) {
                cb && cb(true);
                return;
            }
            node.didMount();
            parent.insertStruct(node, i + 1);
            root.addUpdate(node, [], RefreshLevel.REFLOW, true, false, false, cb);
        }
        prependSelf(node, cb) {
            const { root, parent } = this;
            if (!parent) {
                throw new Error('Can not prependBefore without parent');
            }
            node.parent = parent;
            node.prev = this.prev;
            node.next = this;
            this.prev = node;
            node.root = root;
            const children = parent.children;
            const i = children.indexOf(this);
            children.splice(i, 0, node);
            if (parent.isDestroyed) {
                cb && cb(true);
                return;
            }
            node.didMount();
            parent.insertStruct(node, i);
            root.addUpdate(node, [], RefreshLevel.REFLOW, true, false, false, cb);
        }
        removeChild(node, cb) {
            if (node.parent === this) {
                node.remove(cb);
            }
            else {
                inject.error('Invalid parameter of removeChild()');
            }
        }
        clearChildren() {
            const children = this.children;
            while (children.length) {
                const child = children.pop();
                child.remove();
            }
        }
        destroy() {
            const { isDestroyed, children } = this;
            if (isDestroyed) {
                return;
            }
            for (let i = 0, len = children.length; i < len; i++) {
                children[i].destroy();
            }
            super.destroy();
        }
        structure(lv) {
            let res = super.structure(lv);
            this.children.forEach(child => {
                res = res.concat(child.structure(lv + 1));
            });
            res[0].num = this.children.length;
            res[0].total = res.length - 1;
            return res;
        }
        insertStruct(child, childIndex) {
            const { struct, root } = this;
            const cs = child.structure(struct.lv + 1);
            const structs = root.structs;
            let i;
            if (childIndex) {
                const s = this.children[childIndex - 1].struct;
                const total = s.total;
                i = structs.indexOf(s) + total + 1;
            }
            else {
                i = structs.indexOf(struct) + 1;
            }
            structs.splice(i, 0, ...cs);
            const total = cs[0].total + 1;
            struct.num++;
            struct.total += total;
            let p = this.parent;
            while (p) {
                p.struct.total += total;
                p = p.parent;
            }
        }
        deleteStruct(child) {
            const cs = child.struct;
            const total = cs.total + 1;
            const root = this.root, structs = root.structs;
            const i = structs.indexOf(cs);
            structs.splice(i, total);
            const struct = this.struct;
            struct.num--;
            struct.total -= total;
            let p = this.parent;
            while (p) {
                p.struct.total -= total;
                p = p.parent;
            }
        }
        // 获取指定位置节点，不包含Page/ArtBoard
        getNodeByPointAndLv(x, y, includeGroup = false, includeArtBoard = false, lv) {
            const children = this.children;
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                const { struct, computedStyle, rect, matrixWorld } = child;
                // 在内部且pointerEvents为true才返回
                if (pointInRect(x, y, rect[0], rect[1], rect[2], rect[3], matrixWorld)) {
                    // 不指定lv则找最深处的child
                    if (lv === undefined) {
                        if (child instanceof Container) {
                            const res = child.getNodeByPointAndLv(x, y, includeGroup, includeArtBoard, lv);
                            if (res) {
                                return res;
                            }
                        }
                        return this.getNodeCheck(child, computedStyle, includeGroup, includeArtBoard);
                    }
                    // 指定lv判断lv是否相等，超过不再递归下去
                    else {
                        if (struct.lv === lv) {
                            return this.getNodeCheck(child, computedStyle, includeGroup, includeArtBoard);
                        }
                        // 父级且是container继续深入寻找
                        else if (struct.lv < lv && child instanceof Container) {
                            const res = child.getNodeByPointAndLv(x, y, includeGroup, includeArtBoard, lv);
                            if (res) {
                                return res;
                            }
                        }
                    }
                }
            }
        }
        // 必须是pointerEvents不被忽略前提，然后看group和artBoard选项
        getNodeCheck(child, computedStyle, includeGroup, includeArtBoard) {
            if (computedStyle.pointerEvents
                && (includeGroup || !(child instanceof Container && child.isGroup))
                && (includeArtBoard || !(child instanceof Container && child.isArtBoard))) {
                return child;
            }
        }
        getStructs() {
            if (!this.root) {
                return;
            }
            const structs = this.root.structs;
            const struct = this.struct;
            const i = structs.indexOf(struct);
            return structs.slice(i, i + struct.total + 1);
        }
    }

    class ArtBoard extends Container {
        constructor(props, children) {
            super(props, children);
            this.hasBackgroundColor = props.hasBackgroundColor;
            this.isArtBoard = true;
        }
        // 画板统一无内容，背景单独优化渲染
        calContent() {
            return false;
        }
        collectBsData(index, bsPoint, bsTex, cx, cy) {
            const { x, y, width, height, matrixWorld } = this;
            // 先boxShadow部分
            const tl = calRectPoint(x - 3, y - 3, x, y, matrixWorld);
            const t1 = convertCoords2Gl(tl.x1, tl.y1, cx, cy);
            const t2 = convertCoords2Gl(tl.x2, tl.y2, cx, cy);
            const t3 = convertCoords2Gl(tl.x3, tl.y3, cx, cy);
            const t4 = convertCoords2Gl(tl.x4, tl.y4, cx, cy);
            const tr = calRectPoint(x + width, y - 3, x + width + 3, y, matrixWorld);
            const t5 = convertCoords2Gl(tr.x1, tr.y1, cx, cy);
            const t6 = convertCoords2Gl(tr.x2, tr.y2, cx, cy);
            const t7 = convertCoords2Gl(tr.x3, tr.y3, cx, cy);
            const t8 = convertCoords2Gl(tr.x4, tr.y4, cx, cy);
            const br = calRectPoint(x + width, y + height, x + width + 3, y + height + 3, matrixWorld);
            const t9 = convertCoords2Gl(br.x1, br.y1, cx, cy);
            const t10 = convertCoords2Gl(br.x2, br.y2, cx, cy);
            const t11 = convertCoords2Gl(br.x3, br.y3, cx, cy);
            const t12 = convertCoords2Gl(br.x4, br.y4, cx, cy);
            const bl = calRectPoint(x - 3, y + height, x, y + height + 3, matrixWorld);
            const t13 = convertCoords2Gl(bl.x1, bl.y1, cx, cy);
            const t14 = convertCoords2Gl(bl.x2, bl.y2, cx, cy);
            const t15 = convertCoords2Gl(bl.x3, bl.y3, cx, cy);
            const t16 = convertCoords2Gl(bl.x4, bl.y4, cx, cy);
            const j = index * 96;
            bsPoint[j] = t1.x;
            bsPoint[j + 1] = t1.y;
            bsPoint[j + 2] = t4.x;
            bsPoint[j + 3] = t4.y;
            bsPoint[j + 4] = t2.x;
            bsPoint[j + 5] = t2.y;
            bsPoint[j + 6] = t4.x;
            bsPoint[j + 7] = t4.y;
            bsPoint[j + 8] = t2.x;
            bsPoint[j + 9] = t2.y;
            bsPoint[j + 10] = t3.x;
            bsPoint[j + 11] = t3.y;
            bsPoint[j + 12] = t2.x;
            bsPoint[j + 13] = t2.y;
            bsPoint[j + 14] = t3.x;
            bsPoint[j + 15] = t3.y;
            bsPoint[j + 16] = t5.x;
            bsPoint[j + 17] = t5.y;
            bsPoint[j + 18] = t3.x;
            bsPoint[j + 19] = t3.y;
            bsPoint[j + 20] = t5.x;
            bsPoint[j + 21] = t5.y;
            bsPoint[j + 22] = t8.x;
            bsPoint[j + 23] = t8.y;
            bsPoint[j + 24] = t5.x;
            bsPoint[j + 25] = t5.y;
            bsPoint[j + 26] = t8.x;
            bsPoint[j + 27] = t8.y;
            bsPoint[j + 28] = t6.x;
            bsPoint[j + 29] = t6.y;
            bsPoint[j + 30] = t8.x;
            bsPoint[j + 31] = t8.y;
            bsPoint[j + 32] = t6.x;
            bsPoint[j + 33] = t6.y;
            bsPoint[j + 34] = t7.x;
            bsPoint[j + 35] = t7.y;
            bsPoint[j + 36] = t8.x;
            bsPoint[j + 37] = t8.y;
            bsPoint[j + 38] = t9.x;
            bsPoint[j + 39] = t9.y;
            bsPoint[j + 40] = t7.x;
            bsPoint[j + 41] = t7.y;
            bsPoint[j + 42] = t9.x;
            bsPoint[j + 43] = t9.y;
            bsPoint[j + 44] = t7.x;
            bsPoint[j + 45] = t7.y;
            bsPoint[j + 46] = t10.x;
            bsPoint[j + 47] = t10.y;
            bsPoint[j + 48] = t9.x;
            bsPoint[j + 49] = t9.y;
            bsPoint[j + 50] = t12.x;
            bsPoint[j + 51] = t12.y;
            bsPoint[j + 52] = t10.x;
            bsPoint[j + 53] = t10.y;
            bsPoint[j + 54] = t12.x;
            bsPoint[j + 55] = t12.y;
            bsPoint[j + 56] = t10.x;
            bsPoint[j + 57] = t10.y;
            bsPoint[j + 58] = t11.x;
            bsPoint[j + 59] = t11.y;
            bsPoint[j + 60] = t14.x;
            bsPoint[j + 61] = t14.y;
            bsPoint[j + 62] = t15.x;
            bsPoint[j + 63] = t15.y;
            bsPoint[j + 64] = t9.x;
            bsPoint[j + 65] = t9.y;
            bsPoint[j + 66] = t15.x;
            bsPoint[j + 67] = t15.y;
            bsPoint[j + 68] = t9.x;
            bsPoint[j + 69] = t9.y;
            bsPoint[j + 70] = t12.x;
            bsPoint[j + 71] = t12.y;
            bsPoint[j + 72] = t13.x;
            bsPoint[j + 73] = t13.y;
            bsPoint[j + 74] = t16.x;
            bsPoint[j + 75] = t16.y;
            bsPoint[j + 76] = t14.x;
            bsPoint[j + 77] = t14.y;
            bsPoint[j + 78] = t16.x;
            bsPoint[j + 79] = t16.y;
            bsPoint[j + 80] = t14.x;
            bsPoint[j + 81] = t14.y;
            bsPoint[j + 82] = t15.x;
            bsPoint[j + 83] = t15.y;
            bsPoint[j + 84] = t4.x;
            bsPoint[j + 85] = t4.y;
            bsPoint[j + 86] = t13.x;
            bsPoint[j + 87] = t13.y;
            bsPoint[j + 88] = t3.x;
            bsPoint[j + 89] = t3.y;
            bsPoint[j + 90] = t13.x;
            bsPoint[j + 91] = t13.y;
            bsPoint[j + 92] = t3.x;
            bsPoint[j + 93] = t3.y;
            bsPoint[j + 94] = t14.x;
            bsPoint[j + 95] = t14.y;
            bsTex[j] = 0;
            bsTex[j + 1] = 0;
            bsTex[j + 2] = 0;
            bsTex[j + 3] = 0.3;
            bsTex[j + 4] = 0.3;
            bsTex[j + 5] = 0;
            bsTex[j + 6] = 0;
            bsTex[j + 7] = 0.3;
            bsTex[j + 8] = 0.3;
            bsTex[j + 9] = 0;
            bsTex[j + 10] = 0.3;
            bsTex[j + 11] = 0.3;
            bsTex[j + 12] = 0.3;
            bsTex[j + 13] = 0;
            bsTex[j + 14] = 0.3;
            bsTex[j + 15] = 0.3;
            bsTex[j + 16] = 0.7;
            bsTex[j + 17] = 0;
            bsTex[j + 18] = 0.3;
            bsTex[j + 19] = 0.3;
            bsTex[j + 20] = 0.7;
            bsTex[j + 21] = 0;
            bsTex[j + 22] = 0.7;
            bsTex[j + 23] = 0.3;
            bsTex[j + 24] = 0.7;
            bsTex[j + 25] = 0;
            bsTex[j + 26] = 0.7;
            bsTex[j + 27] = 0.3;
            bsTex[j + 28] = 1;
            bsTex[j + 29] = 0;
            bsTex[j + 30] = 0.7;
            bsTex[j + 31] = 0.3;
            bsTex[j + 32] = 1;
            bsTex[j + 33] = 0;
            bsTex[j + 34] = 1;
            bsTex[j + 35] = 0.3;
            bsTex[j + 36] = 0.7;
            bsTex[j + 37] = 0.3;
            bsTex[j + 38] = 0.7;
            bsTex[j + 39] = 0.7;
            bsTex[j + 40] = 1;
            bsTex[j + 41] = 0.3;
            bsTex[j + 42] = 0.7;
            bsTex[j + 43] = 0.7;
            bsTex[j + 44] = 1;
            bsTex[j + 45] = 0.3;
            bsTex[j + 46] = 1;
            bsTex[j + 47] = 0.7;
            bsTex[j + 48] = 0.7;
            bsTex[j + 49] = 0.7;
            bsTex[j + 50] = 0.7;
            bsTex[j + 51] = 1;
            bsTex[j + 52] = 1;
            bsTex[j + 53] = 0.7;
            bsTex[j + 54] = 0.7;
            bsTex[j + 55] = 1;
            bsTex[j + 56] = 1;
            bsTex[j + 57] = 0.7;
            bsTex[j + 58] = 1;
            bsTex[j + 59] = 1;
            bsTex[j + 60] = 0.3;
            bsTex[j + 61] = 0.7;
            bsTex[j + 62] = 0.3;
            bsTex[j + 63] = 1;
            bsTex[j + 64] = 0.7;
            bsTex[j + 65] = 0.7;
            bsTex[j + 66] = 0.3;
            bsTex[j + 67] = 1;
            bsTex[j + 68] = 0.7;
            bsTex[j + 69] = 0.7;
            bsTex[j + 70] = 0.7;
            bsTex[j + 71] = 1;
            bsTex[j + 72] = 0;
            bsTex[j + 73] = 0.7;
            bsTex[j + 74] = 0;
            bsTex[j + 75] = 1;
            bsTex[j + 76] = 0.3;
            bsTex[j + 77] = 0.7;
            bsTex[j + 78] = 0;
            bsTex[j + 79] = 1;
            bsTex[j + 80] = 0.3;
            bsTex[j + 81] = 0.7;
            bsTex[j + 82] = 0.3;
            bsTex[j + 83] = 1;
            bsTex[j + 84] = 0;
            bsTex[j + 85] = 0.3;
            bsTex[j + 86] = 0;
            bsTex[j + 87] = 0.7;
            bsTex[j + 88] = 0.3;
            bsTex[j + 89] = 0.3;
            bsTex[j + 90] = 0;
            bsTex[j + 91] = 0.7;
            bsTex[j + 92] = 0.3;
            bsTex[j + 93] = 0.3;
            bsTex[j + 94] = 0.3;
            bsTex[j + 95] = 0.7;
        }
        renderBgc(gl, cx, cy) {
            const programs = this.root.programs;
            const { x, y, width, height, matrixWorld, computedStyle } = this;
            // 白色背景
            const colorProgram = programs.colorProgram;
            gl.useProgram(colorProgram);
            // 矩形固定2个三角形
            const t = calRectPoint(x, y, x + width, y + height, matrixWorld);
            const vtPoint = new Float32Array(12);
            const t1 = convertCoords2Gl(t.x1, t.y1, cx, cy);
            const t2 = convertCoords2Gl(t.x2, t.y2, cx, cy);
            const t3 = convertCoords2Gl(t.x3, t.y3, cx, cy);
            const t4 = convertCoords2Gl(t.x4, t.y4, cx, cy);
            vtPoint[0] = t1.x;
            vtPoint[1] = t1.y;
            vtPoint[2] = t4.x;
            vtPoint[3] = t4.y;
            vtPoint[4] = t2.x;
            vtPoint[5] = t2.y;
            vtPoint[6] = t4.x;
            vtPoint[7] = t4.y;
            vtPoint[8] = t2.x;
            vtPoint[9] = t2.y;
            vtPoint[10] = t3.x;
            vtPoint[11] = t3.y;
            // 顶点buffer
            const pointBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vtPoint, gl.STATIC_DRAW);
            const a_position = gl.getAttribLocation(colorProgram, 'a_position');
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(a_position);
            // color
            let u_color = gl.getUniformLocation(colorProgram, 'u_color');
            const color = color2gl(computedStyle.backgroundColor);
            gl.uniform4f(u_color, color[0], color[1], color[2], color[3]);
            // 渲染并销毁
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.deleteBuffer(pointBuffer);
            gl.disableVertexAttribArray(a_position);
        }
    }
    ArtBoard.BOX_SHADOW = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDkuMC1jMDAwIDc5LjE3MWMyN2ZhYiwgMjAyMi8wOC8xNi0yMjozNTo0MSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6Q0YxOEMzRkFDNTZDMTFFRDhBRDU5QTAxNUFGMjI5QTAiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6Q0YxOEMzRjlDNTZDMTFFRDhBRDU5QTAxNUFGMjI5QTAiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCRDFFMUYwM0M0QTExMUVEOTIxOUREMjgyNjUzODRENSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCRDFFMUYwNEM0QTExMUVEOTIxOUREMjgyNjUzODRENSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PrnWkg0AAACjSURBVHja7JXhCsIwDISTLsr2/i8rbjZueMGjbJhJ/+nBQSj0o224VOUllbe4zsi5VgIUWE9AHa6wGMEMHuCMHvAC1xY4rr4CqInTbbD76luc0uiKA2AT4BnggnoOjlEj4qrb2iUJFNqn/Ibc4XD5AKx7DSzSWX/gLwDtIOwR+Mxg8D2gN0GXE9GLfR5Ab4IuXwyHADrHrMv46j5gtfcX8BRgAOX7OzJVtOaeAAAAAElFTkSuQmCC';
    ArtBoard.BOX_SHADOW_TEXTURE = null;

    const HASH = {};
    class CanvasCache {
        constructor(w, h, dx, dy) {
            this.available = false;
            this.offscreen = inject.getOffscreenCanvas(w, h);
            this.w = w;
            this.h = h;
            this.dx = dx;
            this.dy = dy;
        }
        release() {
            if (!this.available) {
                return;
            }
            this.available = false;
            this.offscreen.release();
        }
        releaseImg(url) {
            if (!this.available) {
                return;
            }
            this.available = false;
            const o = HASH[url];
            o.count--;
            if (!o.count) {
                // 此时无引用计数可清空且释放离屏canvas
                delete HASH[url];
                this.offscreen.release();
            }
        }
        getCount(url) {
            var _a;
            return (_a = HASH[url]) === null || _a === void 0 ? void 0 : _a.count;
        }
        static getInstance(w, h, dx, dy) {
            return new CanvasCache(w, h, dx, dy);
        }
        static getImgInstance(w, h, dx, dy, url) {
            if (HASH.hasOwnProperty(url)) {
                const o = HASH[url];
                o.count++;
                return o.value;
            }
            const o = new CanvasCache(w, h, dx, dy);
            HASH[url] = {
                value: o,
                count: 1,
            };
            return o;
        }
    }

    class Bitmap extends Node {
        constructor(props) {
            super(props);
            const src = this._src = props.src;
            this.loader = {
                error: false,
                loading: false,
                src,
                width: 0,
                height: 0,
                onlyImg: true,
            };
            if (!src) {
                this.loader.error = true;
            }
            else {
                const isBase64 = /^data:image\/(\w+);base64,/.test(src);
                if (isBase64) {
                    fetch('https://karas.alipay.com/api/uploadbase64', {
                        method: 'post',
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            data: src,
                            quality: 1,
                        }),
                    }).then(res => res.json()).then(res => {
                        if (res.success) {
                            // 不触发更新
                            this._src = res.url;
                        }
                    });
                }
                const cache = inject.IMG[src];
                if (!cache) {
                    inject.measureImg(src, (res) => {
                        // 可能会变更，所以加载完后对比下是不是当前最新的
                        if (src === this.loader.src) {
                            if (res.success) {
                                if (isFunction(props.onLoad)) {
                                    props.onLoad();
                                }
                            }
                            else {
                                if (isFunction(props.onError)) {
                                    props.onError();
                                }
                            }
                        }
                    });
                }
                else if (cache.state === inject.LOADED) {
                    if (cache.success) {
                        this.loader.source = cache.source;
                        this.loader.width = cache.source.width;
                        this.loader.height = cache.source.height;
                    }
                    else {
                        this.loader.error = true;
                    }
                }
            }
        }
        layout(data) {
            super.layout(data);
            const src = this.loader.src;
            if (src) {
                const cache = inject.IMG[src];
                if (!cache || cache.state === inject.LOADING) {
                    if (!this.loader.loading) {
                        this.loadAndRefresh();
                    }
                }
                else if (cache && cache.state === inject.LOADED) {
                    this.loader.loading = false;
                    if (cache.success) {
                        this.loader.source = cache.source;
                        this.loader.width = cache.width;
                        this.loader.height = cache.height;
                    }
                    else {
                        this.loader.error = true;
                    }
                }
            }
        }
        loadAndRefresh() {
            // 加载前先清空之前可能遗留的老数据
            const loader = this.loader;
            loader.source = undefined;
            loader.error = false;
            loader.loading = true;
            inject.measureImg(loader.src, (data) => {
                // 还需判断url，防止重复加载时老的替换新的，失败走error绘制
                if (data.url === loader.src) {
                    loader.loading = false;
                    if (data.success) {
                        loader.source = data.source;
                        loader.width = data.width;
                        loader.height = data.height;
                        if (!this.isDestroyed) {
                            this.root.addUpdate(this, [], RefreshLevel.REPAINT, false, false, false, undefined);
                        }
                    }
                    else {
                        loader.error = true;
                    }
                }
            });
        }
        calContent() {
            let res = super.calContent();
            const { computedStyle, loader } = this;
            if (res) {
                loader.onlyImg = false;
            }
            else {
                loader.onlyImg = true;
                const { visible, } = computedStyle;
                if (visible) {
                    if (loader.source) {
                        res = true;
                    }
                }
            }
            return this.hasContent = res;
        }
        renderCanvas() {
            super.renderCanvas();
            const { loader } = this;
            if (loader.onlyImg) {
                const canvasCache = this.canvasCache = CanvasCache.getImgInstance(loader.width, loader.height, -this.x, -this.y, this.src);
                // 第一张图像才绘制，图片解码到canvas上
                if (canvasCache.getCount(this._src) === 1) {
                    canvasCache.offscreen.ctx.drawImage(loader.source, 0, 0);
                }
                canvasCache.available = true;
            }
        }
        genTexture(gl) {
            const { loader } = this;
            if (loader.onlyImg) {
                this.textureCache = TextureCache.getImgInstance(gl, this.canvasCache.offscreen.canvas, this.src);
            }
            else {
                return super.genTexture(gl);
            }
        }
        releaseCache(gl) {
            var _a, _b;
            const { loader } = this;
            if (loader.onlyImg) {
                (_a = this.canvasCache) === null || _a === void 0 ? void 0 : _a.releaseImg(this._src);
                (_b = this.textureCache) === null || _b === void 0 ? void 0 : _b.releaseImg(gl, this._src);
            }
            else {
                super.releaseCache(gl);
            }
        }
        get src() {
            return this._src;
        }
        set src(v) { }
    }

    class Group extends Container {
        constructor(props, children) {
            super(props, children);
            this.isGroup = true;
        }
        // 孩子布局调整后，组需要重新计算x/y/width/height，并且影响子节点的left/width等，还不能触发渲染
        checkFitPS() {
            const { children, style, computedStyle, parent } = this;
            if (!parent) {
                return;
            }
            const { x: gx, y: gy, width: gw, height: gh } = this;
            let rect = {};
            // 先循环一遍收集孩子数据，得到当前所有孩子所占位置尺寸的信息集合，坐标是相对于父元素（本组）修正前的
            for (let i = 0, len = children.length; i < len; i++) {
                const child = children[i];
                const { x, y, width, height, matrix } = child;
                const r = new Float64Array(4);
                r[0] = x - gx;
                r[1] = y - gy;
                r[2] = r[0] + width;
                r[3] = r[1] + height;
                const c = calRectPoint(r[0], r[1], r[2], r[3], matrix);
                const { x1, y1, x2, y2, x3, y3, x4, y4, } = c;
                if (i) {
                    rect.minX = Math.min(rect.minX, x1, x2, x3, x4);
                    rect.minY = Math.min(rect.minY, y1, y2, y3, y4);
                    rect.maxX = Math.max(rect.maxX, x1, x2, x3, x4);
                    rect.maxY = Math.max(rect.maxY, y1, y2, y3, y4);
                }
                else {
                    rect.minX = Math.min(x1, x2, x3, x4);
                    rect.minY = Math.min(y1, y2, y3, y4);
                    rect.maxX = Math.max(x1, x2, x3, x4);
                    rect.maxY = Math.max(y1, y2, y3, y4);
                }
            }
            // 检查真正有变化，位置相对于自己原本位置为原点
            if (rect.minX !== 0 || rect.minY !== 0 || rect.maxX !== gw || rect.maxY !== gh) {
                const { width: pw, height: ph } = parent;
                // 先改自己的尺寸
                const { top, right, bottom, left, width, height, } = style;
                // 宽度自动，则左右必然有值
                if (width.u === StyleUnit.AUTO) {
                    if (rect.minX !== 0) {
                        left.v = left.v + rect.minX * 100 / pw;
                        computedStyle.left = calSize(left, pw);
                    }
                    if (rect.maxX !== gw) {
                        right.v = right.v - (rect.maxX - gw) * 100 / pw;
                        computedStyle.right = calSize(right, pw);
                    }
                    this.x = parent.x + computedStyle.left;
                    this.width = parent.width - computedStyle.left - computedStyle.right;
                }
                // 高度自动，则上下必然有值
                if (height.u === StyleUnit.AUTO) {
                    if (rect.minY !== 0) {
                        top.v = top.v + rect.minY * 100 / ph;
                        computedStyle.top = calSize(top, ph);
                    }
                    if (rect.maxY !== gh) {
                        bottom.v = bottom.v - (rect.maxY - gh) * 100 / ph;
                        computedStyle.bottom = calSize(bottom, ph);
                    }
                    this.y = parent.y + computedStyle.top;
                    this.height = parent.height - computedStyle.top - computedStyle.bottom;
                }
                this._rect = undefined;
                this._bbox = undefined;
                // 后面计算要用新的值
                const { x: gx2, y: gy2, width: gw2, height: gh2 } = this;
                // 再改孩子的，无需递归向下
                for (let i = 0, len = children.length; i < len; i++) {
                    const child = children[i];
                    const { style, computedStyle } = child;
                    const { top, right, bottom, left, width, height, } = style;
                    // 宽度自动，则左右必然有值
                    if (width.u === StyleUnit.AUTO) {
                        // 注意判断条件，组的水平只要有x/width变更，child的水平都得全变
                        if (rect.minX !== 0 || rect.maxX !== gw) {
                            left.v = (child.x - gx2) * 100 / gw2;
                            computedStyle.left = calSize(left, gw2);
                            right.v = (gw2 - child.x + gx2 - child.width) * 100 / gw2;
                            computedStyle.right = calSize(right, gw2);
                        }
                    }
                    // 高度自动，则上下必然有值
                    if (height.u === StyleUnit.AUTO) {
                        if (rect.minY !== 0 || rect.maxY !== gh) {
                            top.v = (child.y - gy2) * 100 / gh2;
                            computedStyle.top = calSize(top, gh2);
                            bottom.v = (gh2 - child.y + gy2 - child.height) * 100 / gh2;
                            computedStyle.bottom = calSize(bottom, gh2);
                        }
                    }
                    child._rect = undefined;
                    child._bbox = undefined;
                }
            }
        }
    }

    class Geom extends Node {
        constructor(props) {
            super(props);
        }
    }

    class Rect extends Geom {
        constructor(props) {
            super(props);
        }
    }

    function parse(json) {
        if (json.type === classValue.ArtBoard) {
            const children = [];
            for (let i = 0, len = json.children.length; i < len; i++) {
                const res = parse(json.children[i]);
                if (res) {
                    children.push(res);
                }
            }
            return new ArtBoard(json.props, children);
        }
        else if (json.type === classValue.Group) {
            const children = [];
            for (let i = 0, len = json.children.length; i < len; i++) {
                const res = parse(json.children[i]);
                if (res) {
                    children.push(res);
                }
            }
            return new Group(json.props, children);
        }
        else if (json.type === classValue.Bitmap) {
            return new Bitmap(json.props);
        }
        else if (json.type === classValue.Text) ;
        else if (json.type === classValue.Rect) {
            return new Rect(json.props);
        }
    }
    class Page extends Container {
        constructor(props, children) {
            super(props, children);
            this.isPage = true;
        }
        initIfNot() {
            if (this.json) {
                for (let i = 0, len = this.json.children.length; i < len; i++) {
                    const res = parse(this.json.children[i]);
                    if (res) {
                        this.appendChild(res);
                    }
                }
                this.json = undefined;
            }
        }
    }

    class Text extends Node {
        constructor(props, content) {
            super(props);
            this.content = content;
        }
        layout(data) {
            super.layout(data);
            if (this.isDestroyed) {
                return;
            }
            const { style, computedStyle, content } = this;
            const autoW = style.width.u === StyleUnit.AUTO;
            const autoH = style.height.u === StyleUnit.AUTO;
            const ctx = inject.getFontCanvas().ctx;
            ctx.font = setFontStyle(computedStyle);
            if (autoW && autoH) {
                this.width = computedStyle.width = ctx.measureText(content).width;
                this.height = computedStyle.height = computedStyle.lineHeight;
            }
            else if (autoW) {
                this.width = computedStyle.width = ctx.measureText(content).width;
            }
            else ;
        }
        calContent() {
            const { computedStyle, content } = this;
            if (!computedStyle.visible) {
                return this.hasContent = false;
            }
            return this.hasContent = !!content;
        }
        renderCanvas() {
            super.renderCanvas();
            const computedStyle = this.computedStyle;
            const canvasCache = this.canvasCache = CanvasCache.getInstance(this.width, this.height, -this.x, -this.y);
            const ctx = canvasCache.offscreen.ctx;
            ctx.font = setFontStyle(computedStyle);
            ctx.fillStyle = color2rgbaStr(computedStyle.color);
            ctx.fillText(this.content, 0, getBaseline(computedStyle));
        }
    }

    class Overlay extends Container {
        constructor(props, children) {
            super(props, children);
            this.artBoard = new Container({
                style: {
                    width: '100%',
                    height: '100%',
                    pointerEvents: false,
                },
            }, []);
            this.appendChild(this.artBoard);
            this.abList = [];
        }
        setArtBoard(list) {
            this.artBoard.clearChildren();
            this.abList.splice(0);
            for (let i = 0, len = list.length; i < len; i++) {
                const ab = list[i];
                const text = new Text({
                    style: {
                        fontSize: 24,
                        color: '#777',
                        visible: false,
                    },
                }, ab.props.name || '画板');
                this.artBoard.appendChild(text);
                this.abList.push({ ab, text });
            }
        }
        update() {
            const abList = this.abList;
            for (let i = 0, len = abList.length; i < len; i++) {
                const { ab, text } = abList[i];
                const rect = ab.getBoundingClientRect();
                text.updateStyle({
                    visible: true,
                    translateX: rect.left,
                    translateY: rect.top - 32,
                });
            }
        }
    }

    function renderWebgl(gl, root, rl) {
        const { structs, width, height } = root;
        const cx = width * 0.5, cy = height * 0.5;
        // 第一次或者每次有重新生产的内容或布局触发内容更新，要先绘制，再寻找合并节点重新合并缓存
        if (rl >= RefreshLevel.REPAINT) {
            for (let i = 0, len = structs.length; i < len; i++) {
                const { node } = structs[i];
                const { refreshLevel } = node;
                node.refreshLevel = RefreshLevel.NONE;
                // 无任何变化即refreshLevel为NONE（0）忽略
                if (refreshLevel) {
                    // filter之类的变更
                    if (refreshLevel < RefreshLevel.REPAINT) ;
                    else {
                        const hasContent = node.calContent();
                        // 有内容先以canvas模式绘制到离屏画布上
                        if (hasContent) {
                            node.renderCanvas();
                            node.genTexture(gl);
                        }
                    }
                }
            }
        }
        const programs = root.programs;
        // 先渲染artBoard的背景色
        const page = root.lastPage;
        if (page) {
            const children = page.children, len = children.length;
            // 背景色分开来
            for (let i = 0; i < len; i++) {
                const artBoard = children[i];
                if (artBoard instanceof ArtBoard) {
                    artBoard.renderBgc(gl, cx, cy);
                }
            }
        }
        const program = programs.program;
        gl.useProgram(programs.program);
        // 循环收集数据，同一个纹理内的一次性给出，只1次DrawCall
        for (let i = 0, len = structs.length; i < len; i++) {
            const { node, total } = structs[i];
            const computedStyle = node.computedStyle;
            if (!computedStyle.visible) {
                i += total;
                continue;
            }
            // 继承父的opacity和matrix TODO 优化路径缓存
            let opacity = computedStyle.opacity;
            let matrix = node.matrix;
            const parent = node.parent;
            if (parent) {
                const op = parent.opacity, mw = parent._matrixWorld;
                if (op !== 1) {
                    opacity *= op;
                }
                matrix = multiply(mw, matrix);
            }
            node._opacity = opacity;
            assignMatrix(node._matrixWorld, matrix);
            // 一般只有一个纹理
            const textureCache = node.textureCache;
            if (textureCache && opacity > 0) {
                drawTextureCache(gl, cx, cy, program, [{
                        node,
                        opacity,
                        matrix,
                        cache: textureCache,
                    }], 1);
            }
        }
        // 再覆盖渲染artBoard的阴影和标题
        if (page) {
            const children = page.children, len = children.length;
            // boxShadow用统一纹理
            if (ArtBoard.BOX_SHADOW_TEXTURE) {
                let count = 0;
                for (let i = 0; i < len; i++) {
                    const artBoard = children[i];
                    if (artBoard instanceof ArtBoard) {
                        count++;
                    }
                }
                const bsPoint = new Float32Array(count * 96);
                const bsTex = new Float32Array(count * 96);
                let count2 = 0;
                for (let i = 0; i < len; i++) {
                    const artBoard = children[i];
                    if (artBoard instanceof ArtBoard) {
                        artBoard.collectBsData(count2++, bsPoint, bsTex, cx, cy);
                    }
                }
                const simpleProgram = programs.simpleProgram;
                gl.useProgram(simpleProgram);
                // 顶点buffer
                const pointBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, bsPoint, gl.STATIC_DRAW);
                const a_position = gl.getAttribLocation(simpleProgram, 'a_position');
                gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(a_position);
                // 纹理buffer
                const texBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, bsTex, gl.STATIC_DRAW);
                let a_texCoords = gl.getAttribLocation(simpleProgram, 'a_texCoords');
                gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(a_texCoords);
                // 纹理单元
                let u_texture = gl.getUniformLocation(simpleProgram, 'u_texture');
                gl.uniform1i(u_texture, 0);
                bindTexture(gl, ArtBoard.BOX_SHADOW_TEXTURE, 0);
                // 渲染并销毁
                gl.drawArrays(gl.TRIANGLES, 0, count * 48);
                gl.deleteBuffer(pointBuffer);
                gl.deleteBuffer(texBuffer);
                gl.disableVertexAttribArray(a_position);
                gl.disableVertexAttribArray(a_texCoords);
            }
            else {
                const img = inject.IMG[ArtBoard.BOX_SHADOW];
                // 一般不可能有缓存，太特殊的base64了
                if (img) {
                    ArtBoard.BOX_SHADOW_TEXTURE = createTexture(gl, 0, img);
                    root.addUpdate(root, [], RefreshLevel.CACHE, false, false, false, undefined);
                }
                else {
                    inject.measureImg(ArtBoard.BOX_SHADOW, (res) => {
                        ArtBoard.BOX_SHADOW_TEXTURE = createTexture(gl, 0, res.source);
                        root.addUpdate(root, [], RefreshLevel.CACHE, false, false, false, undefined);
                    });
                }
            }
            // 一般都存在，除非root改逻辑在只有自己的时候进行渲染，overlay更新实际上是下一帧了
            const overlay = root.overlay;
            if (overlay) {
                overlay.update();
            }
        }
    }

    function checkReflow(root, node, addDom, removeDom) {
        let parent = node.parent;
        if (addDom) {
            node.layout({
                x: parent.x,
                y: parent.y,
                w: parent.width,
                h: parent.height,
            });
        }
        else if (removeDom) {
            node.destroy();
        }
        else {
            node.layout({
                x: parent.x,
                y: parent.y,
                w: parent.width,
                h: parent.height,
            });
        }
        // 向上检查group的影响，group一定是自适应尺寸需要调整的
        while (parent && parent !== root) {
            if (parent instanceof Group) {
                parent.checkFitPS();
                break; // TODO 是否递归
            }
            parent = parent.parent;
        }
    }

    function initShaders(gl, vshader, fshader) {
        let program = createProgram(gl, vshader, fshader);
        if (!program) {
            throw new Error('Failed to create program');
        }
        // 要开启透明度，用以绘制透明的图形
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        return program;
    }
    function createProgram(gl, vshader, fshader) {
        // Create shader object
        let vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
        let fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
        if (!vertexShader || !fragmentShader) {
            return null;
        }
        // Create a program object
        let program = gl.createProgram();
        if (!program) {
            return null;
        }
        // @ts-ignore
        program.vertexShader = vertexShader;
        // @ts-ignore
        program.fragmentShader = fragmentShader;
        // Attach the shader objects
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        // Link the program object
        gl.linkProgram(program);
        // Check the result of linking
        let linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
            let error = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            gl.deleteShader(fragmentShader);
            gl.deleteShader(vertexShader);
            throw new Error('Failed to link program: ' + error);
        }
        return program;
    }
    /**
     * Create a shader object
     * @param gl GL context
     * @param type the type of the shader object to be created
     * @param source shader program (string)
     * @return created shader object, or null if the creation has failed.
     */
    function loadShader(gl, type, source) {
        // Create shader object
        let shader = gl.createShader(type);
        if (shader == null) {
            throw new Error('unable to create shader');
        }
        // Set the shader program
        gl.shaderSource(shader, source);
        // Compile the shader
        gl.compileShader(shader);
        // Check the result of compilation
        let compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            let error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error('Failed to compile shader: ' + error);
        }
        return shader;
    }

    const config = {
        MAX_TEXTURE_SIZE: 2048,
        SMALL_UNIT: 32,
        MAX_NUM: Math.pow(2048 / 32, 2),
        MAX_TEXTURE_UNITS: 8,
        init(maxSize, maxUnits) {
            this.MAX_TEXTURE_SIZE = maxSize;
            this.MAX_NUM = Math.pow(maxSize / this.SMALL_UNIT, 2);
            this.MAX_TEXTURE_UNITS = maxUnits;
        },
    };

    const mainVert = `#version 100

attribute vec2 a_position;
attribute vec2 a_texCoords;
varying vec2 v_texCoords;
attribute float a_opacity;
varying float v_opacity;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_texCoords = a_texCoords;
  v_opacity = a_opacity;
}`;
    const mainFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;
varying float v_opacity;

uniform sampler2D u_texture;

void main() {
  float opacity = v_opacity;
  if(opacity <= 0.0) {
    discard;
  }
  opacity = clamp(opacity, 0.0, 1.0);
  vec4 color = texture2D(u_texture, v_texCoords);
  gl_FragColor = color * opacity;
}`;
    const colorVert = `#version 100

attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0, 1);
}`;
    const colorFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

uniform vec4 u_color;

void main() {
  gl_FragColor = u_color;
}`;
    const simpleVert = `#version 100

attribute vec2 a_position;
attribute vec2 a_texCoords;
varying vec2 v_texCoords;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_texCoords = a_texCoords;
}`;
    const simpleFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture;

void main() {
  vec4 color = texture2D(u_texture, v_texCoords);
  gl_FragColor = color;
}`;

    var ca = {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        depth: true,
        stencil: true,
    };

    let uuid = 0;
    class Root extends Container {
        constructor(canvas, props) {
            super(props, []);
            this.programs = {};
            this.ani = []; // 动画任务，空占位
            this.aniChange = false;
            this.uuid = uuid++;
            this.canvas = canvas;
            // gl的初始化和配置
            let gl = canvas.getContext('webgl2', ca);
            if (gl) {
                this.ctx = gl;
                this.isWebgl2 = true;
            }
            else {
                this.ctx = gl = canvas.getContext('webgl', ca);
                this.isWebgl2 = false;
            }
            if (!gl) {
                alert('Webgl unsupported!');
                throw new Error('Webgl unsupported!');
            }
            config.init(gl.getParameter(gl.MAX_TEXTURE_SIZE), gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS));
            this.initShaders(gl);
            // 初始化的数据
            this.dpi = props.dpi;
            this.root = this;
            this.isDestroyed = false;
            this.structs = this.structure(0);
            this.isAsyncDraw = false;
            this.task = [];
            this.taskClone = [];
            this.rl = RefreshLevel.REBUILD;
            // 刷新动画侦听，目前就一个Root
            frame.addRoot(this);
            this.reLayout();
            // 存所有Page
            this.pageContainer = new Container({
                style: {
                    width: '100%',
                    height: '100%',
                    pointerEvents: false,
                    scaleX: this.dpi,
                    scaleY: this.dpi,
                    transformOrigin: [0, 0],
                },
            }, []);
            this.appendChild(this.pageContainer);
            // 存上层的展示工具标尺等
            this.overlay = new Overlay({
                style: {
                    width: '100%',
                    height: '100%',
                    pointerEvents: false,
                },
            }, []);
            this.appendChild(this.overlay);
        }
        initShaders(gl) {
            const program = this.programs.program = initShaders(gl, mainVert, mainFrag);
            this.programs.colorProgram = initShaders(gl, colorVert, colorFrag);
            this.programs.simpleProgram = initShaders(gl, simpleVert, simpleFrag);
            gl.useProgram(program);
        }
        checkRoot() {
            var _a;
            this.width = this.computedStyle.width = this.style.width.v;
            this.height = this.computedStyle.height = this.style.height.v;
            (_a = this.ctx) === null || _a === void 0 ? void 0 : _a.viewport(0, 0, this.width, this.height);
        }
        setJPages(jPages) {
            jPages.forEach(item => {
                const page = new Page(item.props, []);
                page.json = item;
                this.pageContainer.appendChild(page);
            });
        }
        setPageIndex(index) {
            if (index < 0 || index >= this.pageContainer.children.length) {
                return;
            }
            if (this.lastPage) {
                if (this.lastPage === this.pageContainer.children[index]) {
                    return;
                }
                this.lastPage.updateStyle({
                    visible: false,
                });
            }
            // 延迟初始化，第一次需要显示才从json初始化Page对象
            let newPage = this.pageContainer.children[index];
            newPage.initIfNot();
            newPage.updateStyle({
                visible: true,
            }, () => {
                this.emit(Event.PAGE_CHANGED, newPage);
            });
            this.lastPage = newPage;
            this.overlay.setArtBoard(newPage.children);
        }
        /**
         * 添加更新，分析repaint/reflow和上下影响，异步刷新
         * sync是动画在gotoAndStop的时候，下一帧刷新由于一帧内同步执行计算标识true
         */
        addUpdate(node, keys, focus = RefreshLevel.NONE, addDom = false, removeDom = false, sync = false, cb) {
            if (this.isDestroyed) {
                return;
            }
            let lv = focus;
            if (keys && keys.length) {
                for (let i = 0, len = keys.length; i < len; i++) {
                    const k = keys[i];
                    lv |= getLevel(k);
                }
            }
            if (removeDom) {
                this.emit(Event.WILL_REMOVE_DOM, node);
            }
            const res = this.calUpdate(node, lv, addDom, removeDom);
            // 动画在最后一帧要finish或者cancel时，特殊调用同步计算无需刷新，不会有cb，现在没动画
            if (sync) {
                return;
            }
            // 非动画走这
            if (res) {
                this.asyncDraw(cb);
            }
            else {
                cb && cb(true);
            }
            if (addDom) {
                let isInPage = false;
                let parent = node.parent;
                while (parent && parent !== this) {
                    if (parent instanceof Group || parent instanceof ArtBoard || parent instanceof Page) {
                        isInPage = true;
                        break;
                    }
                    parent = parent.parent;
                }
                this.emit(Event.DID_ADD_DOM, node, isInPage);
            }
        }
        calUpdate(node, lv, addDom, removeDom) {
            // 防御一下
            if (addDom || removeDom) {
                lv |= RefreshLevel.REFLOW;
            }
            if (lv === RefreshLevel.NONE || !this.computedStyle.visible) {
                return false;
            }
            const isRf = isReflow(lv);
            if (isRf) {
                // 除了特殊如窗口缩放变更canvas画布会影响根节点，其它都只会是变更节点自己
                if (node === this) {
                    this.reLayout();
                }
                else {
                    checkReflow(this, node, addDom, removeDom);
                }
                if (removeDom) {
                    node.destroy();
                }
            }
            else {
                const isRp = lv >= RefreshLevel.REPAINT;
                if (isRp) {
                    // console.warn(node.canvasCache?.available);
                    // node.canvasCache?.release(); // 可能之前没有内容
                    // node.textureCache?.release();
                    node.releaseCache(this.ctx);
                    node.calRepaintStyle();
                }
                else {
                    const { style, computedStyle } = node;
                    if (lv & RefreshLevel.TRANSFORM_ALL) {
                        node.calMatrix(lv);
                    }
                    if (lv & RefreshLevel.OPACITY) {
                        computedStyle.opacity = style.opacity.v;
                    }
                    if (lv & RefreshLevel.MIX_BLEND_MODE) {
                        computedStyle.mixBlendMode = style.mixBlendMode.v;
                    }
                }
            }
            // 记录节点的刷新等级，以及本帧最大刷新等级
            node.refreshLevel |= lv;
            this.rl |= lv;
            if (addDom || removeDom) {
                this.rl |= RefreshLevel.REBUILD;
            }
            return true;
        }
        asyncDraw(cb) {
            if (!this.isAsyncDraw) {
                frame.onFrame(this);
                this.isAsyncDraw = true;
            }
            this.task.push(cb);
        }
        cancelAsyncDraw(cb) {
            if (!cb) {
                return;
            }
            const task = this.task;
            const i = task.indexOf(cb);
            if (i > -1) {
                task.splice(i, 1);
                if (!task.length) {
                    frame.offFrame(this);
                    this.isAsyncDraw = false;
                }
            }
        }
        draw() {
            if (this.isDestroyed) {
                return;
            }
            this.clear();
            renderWebgl(this.ctx, this, this.rl);
            this.emit(Event.REFRESH, this.rl);
            this.rl = RefreshLevel.NONE;
        }
        reLayout() {
            this.checkRoot(); // 根节点必须保持和canvas同尺寸
            this.layout({
                x: 0,
                y: 0,
                w: this.width,
                h: this.height,
            });
        }
        clear() {
            const gl = this.ctx;
            if (gl) {
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
        }
        destroy() {
            super.destroy();
            frame.removeRoot(this);
        }
        /**
         * 每帧调用Root的before回调，先将存储的动画before执行，触发数据先变更完，然后若有变化或主动更新则刷新
         */
        before() {
            const ani = this.ani, task = this.taskClone = this.task.splice(0);
            ani.length; let len2 = task.length;
            // 先重置标识，动画没有触发更新，在每个before执行，如果调用了更新则更改标识
            this.aniChange = false;
            if (this.aniChange || len2) {
                this.draw();
            }
        }
        /**
         * 每帧调用的Root的after回调，将所有动画的after执行，以及主动更新的回调执行
         * 当都清空的时候，取消raf对本Root的侦听
         */
        after(diff) {
            const ani = this.ani, task = this.taskClone.splice(0);
            let len = ani.length, len2 = task.length;
            for (let i = 0; i < len2; i++) {
                let item = task[i];
                item && item();
            }
            len = ani.length; // 动画和渲染任务可能会改变自己的任务队列
            len2 = this.task.length;
            if (!len && !len2) {
                frame.offFrame(this);
                this.isAsyncDraw = false;
            }
        }
        getCurPage() {
            return this.lastPage;
        }
        getNodeFromCurPage(x, y, includeGroup = false, includeArtBoard = false, lv) {
            const page = this.lastPage;
            if (page) {
                return page.getNodeByPointAndLv(x, y, includeGroup, includeArtBoard, lv === undefined ? lv : (lv + 3));
            }
        }
        checkNodePosChange(node) {
            if (node.isDestroyed) {
                return;
            }
            const { top, right, bottom, left, width, height, translateX, translateY, } = node.style;
            // 一定有parent，不会改root下的固定容器子节点
            const parent = node.parent;
            const newStyle = {};
            // 非固定宽度，left和right一定是有值非auto的，且拖动前translate一定是0，拖动后如果有水平拖则是x距离
            if (width.u === StyleUnit.AUTO) {
                const x = translateX.v;
                if (x !== 0) {
                    newStyle.translateX = 0;
                    newStyle.left = left.v + x * 100 / parent.width + '%';
                    newStyle.right = right.v - x * 100 / parent.width + '%';
                }
            }
            // 高度和宽度一样
            if (height.u === StyleUnit.AUTO) {
                if (translateY.v !== 0) {
                    newStyle.translateY = 0;
                    newStyle.top = top.v + translateY.v * 100 / parent.height + '%';
                    newStyle.bottom = bottom.v - translateY.v * 100 / parent.height + '%';
                }
            }
            node.updateStyle(newStyle); // TODO 只是改数据不重新计算布局，是否有必要保留left/right而不是仅考虑translate
        }
    }

    var node = {
        ArtBoard,
        Bitmap,
        Container,
        Group,
        Node,
        Page,
        Root,
        Text,
    };

    var version = "0.0.1";

    function apply(json, imgs) {
        if (!json) {
            return;
        }
        if (Array.isArray(json)) {
            return json.map(item => apply(item, imgs));
        }
        const { type, props = {}, children = [] } = json;
        if (type === 'Bitmap') {
            const src = props.src;
            if (util.type.isNumber(src)) {
                props.src = imgs[src];
            }
        }
        if (children.length) {
            json.children = apply(children, imgs);
        }
        return json;
    }
    var index = {
        parse(json, canvas, dpi = 1) {
            // json中的imgs下标替换
            json.pages = apply(json.pages, json.imgs);
            const { width, height } = canvas;
            const root = new node.Root(canvas, {
                dpi,
                style: {
                    width,
                    height,
                },
            });
            root.setJPages(json.pages);
            root.setPageIndex(0);
            return root;
        },
        openAndConvertSketchBuffer,
        node,
        refresh,
        style,
        math,
        util,
        animation,
        version,
    };

    return index;

}));
//# sourceMappingURL=index.js.map
