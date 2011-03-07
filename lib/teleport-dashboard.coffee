'use strict'

http = require 'promised-http'
mustache = require 'mustache'
{ when: When } = require 'q'
{ Model, View, Controller, Collection } = backbone = require 'backbone'

###
Overriding backbone `sync` in order to use `promised-http` instead of
`jQuery.ajax`.
###
backbone.sync = (method, model, success, error) ->
  When(When http.request(model.url), success, error, null, (error) ->
    console.error error
  )

backbone.History.prototype.start = () ->
  if 'addEventListener' of window
    window.addEventListener 'hashchange', @checkUrl, false
  else
    window.attachEvent 'onhashchange', @checkUrl


###
Backbone's default make uses jQuery function that we don't have so we need
to override it to use standard DOM APIs instead.
###
View.prototype.make = (tagName, attributes, content) ->
  element = document.createElement(tagName)
  if attributes
    for name, value of attributes
      # jQuery uses `classname` for `class` since it was reserved.
      name = 'class' if name == 'classname'
      element.setAttribute name, value
  if content
    element.innerHTML = content
  element



exports.PackageModel = class PackageModel extends Model
  initialize: ({ name }) ->
    @id = name
  clear: () ->
    @destroy()
    @view.remove()

exports.AppModel = class AppModel extends Model
  selected: null
  initialize: () ->
    @packages = new Packages
    @packages.fetch()
  clear: () ->
    @destroy()
    @view.remove()

exports.Packages = class Packages extends Collection
  model: PackageModel
  url: '../registry.json'
  # Selected package model
  parse: (content) ->
    packages = JSON.parse content
    for name, { overlay: { teleport: metadata } } of packages
      # Mapping modules to a mustache friendly format.
      metadata.modulesTemplate = for id, value of metadata.modules
        module =
          id: id = if id then name + '/' + id else name
          src: encodeURIComponent id
          path: name + value
      # Mapping dependencies to mustache friendly format.
      metadata.dependenciesTemplate = for name, version of metadata.dependencies
        dependency =
          name: name
          version: version
      metadata

exports.PackageView = class PackageView extends View
  tagName: 'selection'
  className: 'package'
  template: '''
            <a href="#package/{{name}}">
              <span class="name">{{name}}</span>
              <span class="version">{{version}}</span>
            </a>
            '''
  initialize: (options) ->
    @model.bind 'change', @render
  render: () =>
    data = @model.toJSON()
    @el.innerHTML = mustache.to_html @template, data
    @el.setAttribute 'data-active', !!data.active
    @el.setAttribute 'data-broken', !!data.error
    @
  clear: () -> @model.clear()

exports.PackageDetailsView = class PackageDetailsView extends View
  el: document.getElementById 'package-details'
  template: '''
            <h2 class="name">
              <a href="/{{name}}/">{{name}}</a>
            </h2>
            <br/>
            <div class="keywords">
            {{#keywords}}<code class="tag">{{.}}</code>{{/keywords}}
            </div>
            <br/>
            {{#version}}<div class="version">Version: {{version}}</div>{{/version}}
            {{#author}}<div class="author">Author: {{author}}</div>{{/author}}
            {{#homepage}}<div class="homepage">Homepage: <a href="{{homepage}}">{{homepage}}</a></div>{{/homepage}}
            {{dependenciesTemplate.length}}
            <div class="dependencies">Dependencies: {{#dependenciesTemplate}}
              <a href="#package/{{name}}" class="module fixed">{{name}} {{version}}</a>
            {{/dependenciesTemplate}}</div>
            <div class="modules">Modules: {{#modulesTemplate}}
              <a href="#package/{{name}}/{{src}}" class="module fixed">{{id}}</a>
            {{/modulesTemplate}}</div>
            '''
  initialize: () ->
    @model.bind 'change:selected', @render
  render: () =>
    @el.innerHTML = mustache.to_html @template, @model.get('selected').toJSON()
    @
  clear: () -> @el.innerHTML = ''

exports.AppView = class AppView extends View
  el: document.getElementById('packages')
  infoView: null
  initialize: (options) ->
    @infoView = new PackageDetailsView model: @model
    @model.packages.bind 'add', @add
    @model.packages.bind 'refresh', @refresh
  add: (model) =>
    try
      view = new PackageView model: model
      @el.appendChild view.render().el
    catch exception
      console.error exception
  refresh: () =>
    @add packageModel for packageModel in @model.packages.models
    backbone.history.loadUrl()

exports.AppController = class AppController extends Controller
  routes:
    'package/:name': 'select'
    'package/:name/:id': 'select'
  initialize: () ->
    @view = new AppView(model: @model = new AppModel)
    backbone.history.start()
  select: (name, id) ->
    if name and (model = @model.packages.get name) and model isnt @model.selected
      @model.set selected: model
    id = decodeURIComponent(id) if id
    if id
      console.log id

exports.app = app = new AppController if require.main == module
