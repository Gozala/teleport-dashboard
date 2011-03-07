'use strict';var AppController, AppModel, AppView, Collection, Controller, Model, PackageDetailsView, PackageModel, PackageView, Packages, View, When, app, backbone, http, mustache, _ref;
var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor;
  child.__super__ = parent.prototype;
  return child;
}, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
http = require('promised-http');
mustache = require('mustache');
When = require('q').when;
_ref = backbone = require('backbone'), Model = _ref.Model, View = _ref.View, Controller = _ref.Controller, Collection = _ref.Collection;
/*
Overriding backbone `sync` in order to use `promised-http` instead of
`jQuery.ajax`.
*/
backbone.sync = function(method, model, success, error) {
  return When(When(http.request(model.url), success, error, null, function(error) {
    return console.error(error);
  }));
};
backbone.History.prototype.start = function() {
  if ('addEventListener' in window) {
    return window.addEventListener('hashchange', this.checkUrl, false);
  } else {
    return window.attachEvent('onhashchange', this.checkUrl);
  }
};
/*
Backbone's default make uses jQuery function that we don't have so we need
to override it to use standard DOM APIs instead.
*/
View.prototype.make = function(tagName, attributes, content) {
  var element, name, value;
  element = document.createElement(tagName);
  if (attributes) {
    for (name in attributes) {
      value = attributes[name];
      if (name === 'classname') {
        name = 'class';
      }
      element.setAttribute(name, value);
    }
  }
  if (content) {
    element.innerHTML = content;
  }
  return element;
};
exports.PackageModel = PackageModel = (function() {
  function PackageModel() {
    PackageModel.__super__.constructor.apply(this, arguments);
  }
  __extends(PackageModel, Model);
  PackageModel.prototype.initialize = function(_arg) {
    var name;
    name = _arg.name;
    return this.id = name;
  };
  PackageModel.prototype.clear = function() {
    this.destroy();
    return this.view.remove();
  };
  return PackageModel;
})();
exports.AppModel = AppModel = (function() {
  function AppModel() {
    AppModel.__super__.constructor.apply(this, arguments);
  }
  __extends(AppModel, Model);
  AppModel.prototype.selected = null;
  AppModel.prototype.initialize = function() {
    this.packages = new Packages;
    return this.packages.fetch();
  };
  AppModel.prototype.clear = function() {
    this.destroy();
    return this.view.remove();
  };
  return AppModel;
})();
exports.Packages = Packages = (function() {
  function Packages() {
    Packages.__super__.constructor.apply(this, arguments);
  }
  __extends(Packages, Collection);
  Packages.prototype.model = PackageModel;
  Packages.prototype.url = '../registry.json';
  Packages.prototype.parse = function(content) {
    var dependency, id, metadata, module, name, packages, value, version, _results;
    packages = JSON.parse(content);
    _results = [];
    for (name in packages) {
      metadata = packages[name].overlay.teleport;
      metadata.modulesTemplate = (function() {
        var _ref, _results;
        _ref = metadata.modules;
        _results = [];
        for (id in _ref) {
          value = _ref[id];
          _results.push(module = {
            id: id = id ? name + '/' + id : name,
            src: encodeURIComponent(id),
            path: name + value
          });
        }
        return _results;
      })();
      metadata.dependenciesTemplate = (function() {
        var _ref, _results;
        _ref = metadata.dependencies;
        _results = [];
        for (name in _ref) {
          version = _ref[name];
          _results.push(dependency = {
            name: name,
            version: version
          });
        }
        return _results;
      })();
      _results.push(metadata);
    }
    return _results;
  };
  return Packages;
})();
exports.PackageView = PackageView = (function() {
  function PackageView() {
    this.render = __bind(this.render, this);;    PackageView.__super__.constructor.apply(this, arguments);
  }
  __extends(PackageView, View);
  PackageView.prototype.tagName = 'selection';
  PackageView.prototype.className = 'package';
  PackageView.prototype.template = '<a href="#package/{{name}}">\n  <span class="name">{{name}}</span>\n  <span class="version">{{version}}</span>\n</a>';
  PackageView.prototype.initialize = function(options) {
    return this.model.bind('change', this.render);
  };
  PackageView.prototype.render = function() {
    var data;
    data = this.model.toJSON();
    this.el.innerHTML = mustache.to_html(this.template, data);
    this.el.setAttribute('data-active', !!data.active);
    this.el.setAttribute('data-broken', !!data.error);
    return this;
  };
  PackageView.prototype.clear = function() {
    return this.model.clear();
  };
  return PackageView;
})();
exports.PackageDetailsView = PackageDetailsView = (function() {
  function PackageDetailsView() {
    this.render = __bind(this.render, this);;    PackageDetailsView.__super__.constructor.apply(this, arguments);
  }
  __extends(PackageDetailsView, View);
  PackageDetailsView.prototype.el = document.getElementById('package-details');
  PackageDetailsView.prototype.template = '<h2 class="name">\n  <a href="/{{name}}/">{{name}}</a>\n</h2>\n<br/>\n<div class="keywords">\n{{#keywords}}<code class="tag">{{.}}</code>{{/keywords}}\n</div>\n<br/>\n{{#version}}<div class="version">Version: {{version}}</div>{{/version}}\n{{#author}}<div class="author">Author: {{author}}</div>{{/author}}\n{{#homepage}}<div class="homepage">Homepage: <a href="{{homepage}}">{{homepage}}</a></div>{{/homepage}}\n{{dependenciesTemplate.length}}\n<div class="dependencies">Dependencies: {{#dependenciesTemplate}}\n  <a href="#package/{{name}}" class="module fixed">{{name}} {{version}}</a>\n{{/dependenciesTemplate}}</div>\n<div class="modules">Modules: {{#modulesTemplate}}\n  <a href="#package/{{name}}/{{src}}" class="module fixed">{{id}}</a>\n{{/modulesTemplate}}</div>';
  PackageDetailsView.prototype.initialize = function() {
    return this.model.bind('change:selected', this.render);
  };
  PackageDetailsView.prototype.render = function() {
    this.el.innerHTML = mustache.to_html(this.template, this.model.get('selected').toJSON());
    return this;
  };
  PackageDetailsView.prototype.clear = function() {
    return this.el.innerHTML = '';
  };
  return PackageDetailsView;
})();
exports.AppView = AppView = (function() {
  function AppView() {
    this.refresh = __bind(this.refresh, this);;
    this.add = __bind(this.add, this);;    AppView.__super__.constructor.apply(this, arguments);
  }
  __extends(AppView, View);
  AppView.prototype.el = document.getElementById('packages');
  AppView.prototype.infoView = null;
  AppView.prototype.initialize = function(options) {
    this.infoView = new PackageDetailsView({
      model: this.model
    });
    this.model.packages.bind('add', this.add);
    return this.model.packages.bind('refresh', this.refresh);
  };
  AppView.prototype.add = function(model) {
    var view;
    try {
      view = new PackageView({
        model: model
      });
      return this.el.appendChild(view.render().el);
    } catch (exception) {
      return console.error(exception);
    }
  };
  AppView.prototype.refresh = function() {
    var packageModel, _i, _len, _ref;
    _ref = this.model.packages.models;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      packageModel = _ref[_i];
      this.add(packageModel);
    }
    return backbone.history.loadUrl();
  };
  return AppView;
})();
exports.AppController = AppController = (function() {
  function AppController() {
    AppController.__super__.constructor.apply(this, arguments);
  }
  __extends(AppController, Controller);
  AppController.prototype.routes = {
    'package/:name': 'select',
    'package/:name/:id': 'select'
  };
  AppController.prototype.initialize = function() {
    this.view = new AppView({
      model: this.model = new AppModel
    });
    return backbone.history.start();
  };
  AppController.prototype.select = function(name, id) {
    var model;
    if (name && (model = this.model.packages.get(name)) && model !== this.model.selected) {
      this.model.set({
        selected: model
      });
    }
    if (id) {
      id = decodeURIComponent(id);
    }
    if (id) {
      return console.log(id);
    }
  };
  return AppController;
})();
if (require.main === module) {
  exports.app = app = new AppController;
}