/**
 * Class Creator
 */
(function(g){
  var _excludeProperties = [
    "parentNamespace",
    "namespace",
    "className",
    "public",
    "__static__",
    "__constants__"
  ];
  if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs   = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP    = function() {},
          fBound  = function() {
            return fToBind.apply(this instanceof fNOP && oThis
                   ? this
                   : oThis,
                   aArgs.concat(Array.prototype.slice.call(arguments)));
          };

      fNOP.prototype = this.prototype;
      fBound.prototype = new fNOP();

      return fBound;
    };
  }

  function extend(target, source){
    var prop;
    target = target || {};
    for ( prop in source) {
      if ( source.hasOwnProperty(prop) ){
        if (typeof source[prop] === 'object' && source[prop].constructor !== Array ) {
          target[prop] = extend(target[prop], source[prop]);
        } else {
          target[prop] = source[prop];
        }
      }
    }
    return target;
  }

  function each(obj,callable){
    var i,
        ret;
    if ( obj && typeof obj === "object" && obj.constructor !== Array ){
      for( i in obj ){
        if ( obj.hasOwnProperty(i) ){
          ret = null;
          ret = callable(i,obj[i]);
          if ( ret === false ){
            break;
          }
        }
      }
    }
    else if ( obj && typeof obj === "object" ){
      for( i = 0; i < obj.length; i++ ){
          ret = null;
          ret = callable(i,obj[i]);
          if ( ret === false ){
            break;
          }
      }
    }
  }

  // IE 8 Support
  if ( String && String.prototype && !String.prototype.hasOwnProperty("trim") ){
    String.prototype.trim =   function trim(){
      return this.replace(/^[\s\r\t]+/,'').replace(/[\s\r\t]+$/,'');
    };
  }

  // IE 8 Support
  if ( Array && Array.prototype && !Array.prototype.hasOwnProperty("indexOf") ){
    Array.prototype.indexOf = function indexOf(obj){
      var index = -1,
          i = 0;
      for( i = 0; i < this.length; i++ ){
        if ( obj === this[i] ){
          index = i;
          break;
        }
      }
      return index;
    };
  }

  function buildStaticMethods(func,def){
    var staticMethods = def.__static__ || null;
    if ( staticMethods && func && typeof func === "function" ){
      if ( staticMethods && typeof staticMethods === "object" ){
        each(staticMethods,function(method,methodDef){
          func[method] = methodDef;
        });
      }
    }
  }

  function buildMethods(func,methods,parent){
    if ( !parent ){
      parent = {};
    }
    var hasParent = false;
    if (typeof parent === "function") {
      extend(func.prototype, parent.prototype);
      hasParent = true;
    }
    if ( func && methods && parent ){
      var v;
      each(methods,function(key,item){
        if ( _excludeProperties.indexOf(key) >= 0 ){
          return true;
        }
        if ( 
          hasParent && 
          parent.prototype.hasOwnProperty(key) && 
          typeof item === "function" 
        ){ 
          v = (function(method,methodFunction){
            return function(){
              var $super = parent.prototype[method];
              if ( $super && typeof $super === "function" ){
                [].unshift.call(arguments,$super.bind(this));
              }
              return methodFunction.apply(this,arguments);
            };
          }(key,item));
          func.prototype[key] = v; 
        } else if ( typeof item === "function" ){
          func.prototype[key] = item;
        }
      });
    }
  }

  function buildConstants(func,def){
    var c = def.__constants__ || null;
    if ( c && func && typeof func === "function" ){
      each(c,function(name,value){
        try {
          Object.defineProperty(func,name,{
            "value" : value
          });
        } catch( e ){
          func[name] = value;
        }
      });
    }
  }

  function parseConstructor(def){
    var _construct = def._constructor || null;
    if ( typeof _construct !== "function" ){
      _construct = null;
    }
    return _construct;
  }

  function create(parent, definition){
    var _parent = null, 
        _def = {};
    if (parent && definition){
      if ( typeof parent === "function" ){
        _parent = parent;
      } 
      _def = definition || {};
    }
    else {
      _def = parent || {};
    }
    var _construct = parseConstructor(_def);

    if ( typeof _parent !== "function" ) {
      _parent = null;
    }

    var ClassDef = (function(){
      return function(){
        var callConstruct = true;
        if ( _parent !== null ){
          _parent.apply(this,arguments);
          if ( _parent.prototype && _parent.prototype._constructor ){
            callConstruct = false;
          }
        }
        if ( _construct !== null && callConstruct ){
          this._constructor.apply(this,arguments);
        }
      };
    }());

    buildMethods(ClassDef,_def,_parent);
    buildStaticMethods(ClassDef,_def);
    buildConstants(ClassDef,_def);

    return ClassDef;
  }
  function uniqid(length,number_only){
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      numbers = '0123456789',
      len = length || 10,
      result = "",
      i = 0;
    if ( number_only === true ){
      for (i = len; i > 0; --i){ result += numbers.charAt(Math.round(Math.random() * (numbers.length - 1))); }
    }
    else{
      for (i = len; i > 0; --i){ result += chars.charAt(Math.round(Math.random() * (chars.length - 1))); }
    }
    return result;
  }

  // Define classCreator Namespace
  g.classCreator = {
    "util": {
      "uniqid" : uniqid,
      "extend" : extend,
      "each" : each
    },
    "event" : {},
    "create" : create
  };
}(window));

/**
 * Setup additional classCreator items
 */
(function(t){
  var _listeners = {};
  t.event.Dispatcher = t.create({
    "className" : "Dispatcher",
    "__static__" : {
      "call": function(event,payload){
        if ( event && typeof event === "string" && _listeners.hasOwnProperty(event) ){
          var i = 0,
            set = _listeners[event] || [],
            _pay = payload || {};
          if ( !_pay.event ){
            _pay.event = event;
          }
          for( i = 0; i < set.length; i++ ){
            set[i](_pay);
          }
        }
      },
      "register": function(event,listener){
        if ( event && listener && typeof listener === "function" ){
          if ( !_listeners.hasOwnProperty(event) ){
            _listeners[event] = [];
          }
          if ( _listeners[event].indexOf(listener) < 0 ){
            _listeners[event].push(listener);        
          }
        }
      },
      "dump": function(){
        console.log(_listeners);
      }
    }
  });

  t.event.Action = t.create({
    "className" : "Action",
    "_constructor" : function(){
      this.name = null;
      this.timesPerformed = 0;
      this.type = "SimpleAction";
      this.id = t.util.uniqid(23);
      this.setName("Action-" + this.id );
    },
    "setName": function(name){
      if ( name && typeof name === "string" ){
        this.name = name;
      }
      return this;
    },
    "getName": function(){
      return this.name;
    },
    "perform": function(){
      this.timesPerformed++;
    },
  });
}.call({},classCreator));
