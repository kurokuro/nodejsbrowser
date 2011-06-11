var NodeBrowser = NodeBrowser || {};

NodeBrowser.request = require("request");
NodeBrowser.sys = require("sys");
/**
 * ブラウザを作成する
 * @class 1つのブラウザ画面を表すクラス
 * @property {Document} document documentオブジェクト
 * @property {Window} window windowオブジェクト
 * @property {Number} loadState DOMのロード状態。1でロード済み、0でロード中、−1で初期状態
 */
NodeBrowser.Browser = function () {
  this.document = null;
  this.window = null;
  this.loadState = -1;
  this.jsdom = require("jsdom");
  this.jsdom.defaultDocumentFeatures = {
    FetchExternalResources: ["script"],
    ProcessExternalResources: ["script"],
    MutationEvents: "2.0",
    QuerySelector: false
  }
  this.hello = "hello";
}

/**
 * ある関数の実行時のthisバインディングを変更します
 * @memberOf Function#
 * @params {Object} options scope:thisになるオブジェクト args:実行時引数
 */
Function.prototype.bind = function (options) {
  var func = this;
  var binding = function () {
    var scope = options.scope || this;
    var args = options.args || [];
    var fargs = [];
    for (var name in arguments) {
      fargs.push(arguments[name]);
    }
    func.apply(scope, fargs.concat(args));
  }
  return binding;
}

/**
 * 指定されたURLのページをロードします
 * @memberOf NodeBrowser.Browser#
 * @param {String} url ロードしたいページのURL
 * @param {Function} callback ロード終了時にコールバックされる関数。thisにはそのNodeBrowser.Browserオブジェクトがバインドされている
 */
NodeBrowser.Browser.prototype.load = function (url, callback) {
  this.loadState = 0;
  NodeBrowser.request({uri: url}, function (err, response, body) {
    if (err) {
      console.log("not loaded this page");
      return false;
    }
    console.log("html fecth finished");
    this.document = this.jsdom.jsdom(body, null);
    this.window = this.document.createWindow();
    var scripts = this.document.getElementsByTagName("script");
    var js = new Array(scripts.length);
    for (var i = 0; i < scripts.length; i ++) {
      var s = scripts[i];
      var count = 0;
      if (s.src) {
        request({uri: s.src},
          function (err, response, body) {
            js[i] = body;
            console.log(i + " : " + js[i]);
            count ++;
            console.log(count);
            if (count == scripts.length) this.loadState = 1;
          }.bind({scope: this}));
      }
      else {
        js[i] = s.textContent
        console.log(i + " : " + js[i]);
        count ++;
        console.log(count);
        if (count == scripts.length) this.loadState = 1;
      }
    }

    var wait = function (callback) {
      if (this.loadState == 1) {
        console.log("load ended");
        for (var i = 0; i < scripts.length; i ++) {
          this.runJS(scripts[i]);
        }
        callback();
      }
      else {
        setTimeout(wait, "1000");
      }
    }.bind({scope:this, args:[callback]});
    wait();
  }.bind({scope:this}));
}

/**
 * JavaScriptを実行します
 * @memberOf NodeBrowser.Browser#
 * @param [String] script JavaScript Expression
 */
NodeBrowser.Browser.prototype.runJS = function (script) {
  with (this.window) {
    with (this) {
      eval(script);
    }
  }
}
