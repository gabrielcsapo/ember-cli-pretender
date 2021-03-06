'use strict';
var path = require('path');
var Funnel = require('broccoli-funnel');
var MergeTrees = require('broccoli-merge-trees');

module.exports = {
  name: 'ember-cli-pretender',

  _findPretenderPaths: function() {
    if (!this._pretenderPath) {
      this._pretenderPath = require.resolve('pretender');
      this._pretenderDir = path.dirname(this._pretenderPath);
      this._routeRecognizerPath = require.resolve('route-recognizer');
      this._fakeRequestPath = require.resolve('fake-xml-http-request');
      this._abortControllerPath = require.resolve('abortcontroller-polyfill/dist/abortcontroller-polyfill-only.js');
      this._whatwgFetchPath = require.resolve('whatwg-fetch/dist/fetch.umd.js');
    }
  },

  _autoimportInfo() {
    let chalk = require("chalk");
    let info = chalk.yellow(`
  INFORMATION (ember-cli-pretender)
  ${chalk.inverse(
    "ember-auto-import"
  )} seems to be in your package dependencies.
  As a result, you don't need pretender to be wrapped anymore.
  You can install ${chalk.bold("pretender")} and remove ${chalk.bold(
      "ember-cli-pretender"
    )}.
        `);
    // eslint-disable-next-line no-console
    console.log(info);
  },

  init() {
    this._super.init && this._super.init.apply(this, arguments);
    if (this.parent.dependencies()["ember-auto-import"]) {
      this._autoimportInfo();
    }
  },

  treeForVendor: function(tree) {
    this._findPretenderPaths();

    var pretenderTree = new Funnel(this._pretenderDir, {
      files: [path.basename(this._pretenderPath)],
      destDir: '/pretender',
    });

    var routeRecognizerFilename = path.basename(this._routeRecognizerPath);
    var routeRecognizerTree = new Funnel(path.dirname(this._routeRecognizerPath), {
      files: [routeRecognizerFilename, routeRecognizerFilename + '.map'],
      destDir: '/route-recognizer',
    });

    var fakeRequestTree = new Funnel(path.dirname(this._fakeRequestPath), {
      files: [path.basename(this._fakeRequestPath)],
      destDir: '/fake-xml-http-request',
    });

    var abortControllerTree = new Funnel(path.dirname(this._abortControllerPath), {
      files: [path.basename(this._abortControllerPath)],
      destDir: '/abortcontroller-polyfill',
    });

    var whatwgFetchTree = new Funnel(path.dirname(this._whatwgFetchPath), {
      files: [path.basename(this._whatwgFetchPath)],
      destDir: '/whatwg-fetch',
    });

    var trees = [
      tree,
      pretenderTree,
      routeRecognizerTree,
      fakeRequestTree,
      abortControllerTree,
      whatwgFetchTree
      // tree is not always defined, so filter out if empty
    ].filter(Boolean);

    return new MergeTrees(trees, {
      annotation: 'ember-cli-pretender: treeForVendor'
    });
  },

  included: function included() {
    var app = this._findApp();
    this.app = app;

    var opts = app.options.pretender || { enabled: app.tests };
    if (opts.enabled) {
      this._findPretenderPaths();

      app.import('vendor/fake-xml-http-request/' + path.basename(this._fakeRequestPath));
      app.import('vendor/route-recognizer/' + path.basename(this._routeRecognizerPath));

      var includeFetchPolyfill = opts.includeFetchPolyfill || typeof opts.includeFetchPolyfill === 'undefined';
      if (includeFetchPolyfill) {
        app.import('vendor/abortcontroller-polyfill/' + path.basename(this._abortControllerPath));
        app.import('vendor/whatwg-fetch/' + path.basename(this._whatwgFetchPath));
      }

      app.import('vendor/pretender/' + path.basename(this._pretenderPath));
    }
  },

  _findApp() {
    if (typeof this._findHost === 'function') {
      return this._findHost();
    } else {
      // Otherwise, we'll use this implementation borrowed from the _findHost()
      // method in ember-cli.
      // Keep iterating upward until we don't have a grandparent.
      // Has to do this grandparent check because at some point we hit the project.
      let app;
      let current = this;
      do {
        app = current.app || this;
      } while (current.parent && current.parent.parent && (current = current.parent));

      return app;
    }
  },
};
