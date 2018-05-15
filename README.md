![Logo][]

> A [seneca.js][] entity CRUD plugin.

# seneca-entity-crud

Last update: 05/15/2018

[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Dependency Status][david-badge]][david-url]
[![Coveralls][BadgeCoveralls]][Coveralls]

This module is a plugin for the [Seneca][] framework. It provides basic [CRUD][] persistent actions for entities, and some extras.

The [seneca-entity][] plugin already provides simple persistent functions: `save$`, `load$`, `remove$`, `list$` and `data$`. The **seneca-entity-crud** plugin encapsulate these functions in an efficient way.

## Why this plugin?

When we develop real applications, we often have to manage a lot of entities. For example: customer, product, catalog, address, order, sell, relations between them and so one.
Working with the [seneca-entity][] plugin, the same kind of code can be duplicated a lot of time. For example, here is a code used to simply read an entity:

```js
// Database entity creation
var entityFactory = seneca.make(myZone, myBase, myName)
// Reads the entity in the database
entityFactory.load$(anId, (err, result) => {
  if ( err ) { throw err }
  // ... do some stuff with result ...
})
```

The **seneca-entity-crud** plugin do the same work in a simplest manner. It defines a `read` command and can use the [promises][] power. Let's see it.

Once for all, the application promisify the `act` function:

```js
const promise = require('bluebird')
const seneca = require('seneca')()
var act = promise.promisify(seneca.act, {context: seneca})
```

And here is our new code used to read an entity:

```js
// Reads the entity in the database
act({role: myRole, cmd: 'read', id: anId})
.then(function(result) {
// ... do some stuff with result ...
});
```

Less code. CRUD names. And the code is easier to understand.



One very nice thing: in addition to CRUD, this plugin offers additional commands.

- The `check` command verify that the store works. It performs a create-then-delete operation. This is useful when the microservice using this plugin has a *health* process.
- The `count` command encapsulate the `list$` function, but return only the count for network optimization.
- The `deleterelationships` command extends the deletion of an entity to that of all its relations. See this [readme][] file.
- The `query` command encapsulate the `list$` function with new features.
- The `truncate` command works as traditional SQL `TRUNCATE TABLE my_table`.




And we even lie on the floor:

- This plugin includes an optional input data validation functionality to be used before the create or update action.
- A `last_update` date value can be automatically added to each entity when created or updated.
- The [appends][] feature provides additional actions during read or query.
- The [joins][] feature provides deep readings from IDs contained in entities.
- The [then][] feature provides additional processes on entities being read or queried.
- For security, using the optional `nonamespace: true` argument, the namespace of the resulting entities is automatically removed.
- Defaults can be added to the resulting entities.

Enjoy it!

# How it works

### Prerequisites

Your application must declare the seneca-entity plugin:

```js
const seneca = require('seneca')()
seneca.use('entity')
// For Seneca >= 3.x
seneca.use('basic').use('entity')
```

See the [seneca-entity][] project for installation and more information.

### Plugin declaration

Your application must declare this plugin:

```js
seneca.use('seneca-entity-crud', {
  ... options ...
})
```

The **options** are:

- **zone**: the name of your zone (optional).
- **base**: the name of your base (optional).
- **name**: the primary name of your entities. Default: `entity`. The primary name must not contain hyphen (-).
- **last_update**: an optional boolean value. If true, the current date value is automatically added to each entity (*the field name is* `last_update`) when created or updated. Default: `false`.
- **role**: the name of your role, so this plugin commands are part of your patterns.  Default: `entity`.

For more information on zone, base and name, see the [entity namespace][] tutorial.
For more information on role, see the [seneca patterns][] guide.

### Usage

Proceed each **seneca-entity-crud** command as any seneca command. Here is a full example for the `create` command, using the seneca-mem-store persistence plugin:

```js
'use strict'

/* Prerequisites */
const promise = require('bluebird')
const seneca = require('seneca')()

/* Plugin declaration */
seneca
  .use('basic') // For Seneca >= 3.x
  .use('entity')
  .use('mem-store')
  .use('seneca-entity-crud', {
    name: 'post',
    role: 'my-role'
  })

/* Promisify seneca actions */
var act = promise.promisify(seneca.act, {context: seneca})

/* Starts seneca */
seneca.ready(function (err) {
  if (err) { throw err }

  /* The create example */
  var myPost = {title: 'A great post', content: 'Hello World'}
  act({role: 'my-role', cmd: 'create', entity: myPost})
  .then(function (result) {
    console.log('My great post ID is: ' + result.entity.id)
    return result
  })

  /* Ends seneca */
  seneca.close((err) => {
    if (err) { console.log(err) }
  })
})

```

Try it! The console shows:

	My great post ID is: <an id like 5a4732ef4049cfcb07d992007e003932>

For **the list of the commands** and their arguments, see the chapter below: [API commands specifications](#api-commands-specifications).

> Note: the ID generated for the entity is provided by the store plugin used in your application.

# Input data validation

In most cases, it's a best practice to validate input data before insert it in the database. The **seneca-entity-crud** plugin cannot validate input data by itself: it highly depends on your application data types. However, if you need to proceed input data validation, this plugin can use your favorite function.

For more information and examples, please see the [input data validation][] documentation.

# The returned namespace

By default, the **entity$** field of the resulting entities contains the entity namespace `zone-base-name`. For security reasons, sensitive applications may not need this data. To automatically remove the resulting entity namespace, use the `nonamespace: true` argument in the command.

> Note: for convenience, the `nonamespace` argument value can be the `true` boolean or the `'true'` string.

### Example

```js
var myId = '5a4732ef4049cfcb07d992007e003932'
// Read
act({role: 'my-role', cmd: 'read', id: myId, nonamespace: true})
.then(function (result) {
  // No entity$ namespace zone-base-name in the result entity
  console.log('My entity is: ' + JSON.stringify(result.entity))
  return result
})
```
For more information on zone, base and name, see the [entity namespace][] tutorial.


# Defaults

This plugin can automatically add defaults to the resulting entities of a [read][] or [query][] command.

> Note: this feature is optional.

The defaults argument is an object.
Each object key/value pair is a default field name/value pair:

```js
{'a field name': <a default value>, 'another field name': <another default value>, ...}
```

If the resulting entity does not contain the field `a field name`, it is added with the default value.
If the resulting entity already contains the field `a field name`, nothing is changed.

### How it works

Add the defaults object to the [read][] or [query][] command pattern:

```js
{role: 'my-role', cmd: 'read', id: anId, defaults: { ... }}
{role: 'my-role', cmd: 'query', defaults: { ... }}
```

### Example

```js
var myId = '5a4732ef4049cfcb07d992007e003932'
// Read
act({role: 'my-role', cmd: 'read', id: myId, defaults: {country: 'Belgium', currency: 'Euro'})
.then(function (result) {
  console.log('My entity is: ' + JSON.stringify(result.entity))
  return result
})
```

The console output looks like:

```js
{id: '5a4732ef4049cfcb07d992007e003932', ... , country: 'Belgium', currency: 'Euro'}
```

# API commands specifications

* **[check][]**: verify that the store can create-then-delete an entity.
* **[count][]**: retrieve the count of the entities from your database.
* **[create][]**: insert a new entity into your database.
* **[delete][]**: remove an entity from your database.
* **[deleterelationships][]**: remove all relationships of an entity from your database.
* **[first][]**: retrieve from your database the first entity matching filters.
* **[query][]**: retrieve a list of entities from your database.
* **[read][]**: retrieve an entity from your database.
* **[truncate][]**: remove all the entities from your database.
* **[update][]**: update an entity previously created into your database.
* **[validate][]**: validate your data.


# Install

To install, simply use npm:

```sh
npm install seneca-entity-crud
```

# Test

To run tests, simply use npm:

```sh
npm test
```

# Contributing
The [Senecajs org][] encourages open participation. If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please get in touch.

## License
Copyright (c) 2016-2018, Richard Rodger and other contributors.
Licensed under [MIT][].

[MIT]: ./LICENSE
[Logo]: http://senecajs.org/files/assets/seneca-logo.jpg
[npm-badge]: https://badge.fury.io/js/seneca-entity-crud.svg
[npm-url]: https://npmjs.com/package/seneca-entity-crud
[travis-badge]: https://travis-ci.org/jack-y/seneca-entity-crud.svg
[travis-url]: https://travis-ci.org/jack-y/seneca-entity-crud
[david-badge]: https://david-dm.org/jack-y/seneca-entity-crud.svg
[david-url]: https://david-dm.org/jack-y/seneca-entity-crud
[Coveralls]: https://coveralls.io/github/jack-y/seneca-entity-crud?branch=master
[BadgeCoveralls]: https://coveralls.io/repos/github/jack-y/seneca-entity-crud/badge.svg?branch=master
[Seneca.js]: https://www.npmjs.com/package/seneca
[Seneca]: http://senecajs.org/
[Senecajs org]: https://github.com/senecajs/
[CRUD]: https://en.wikipedia.org/wiki/Create,_read,_update_and_delete
[seneca-entity]: https://github.com/senecajs/seneca-entity
[promises]: http://senecajs.org/docs/tutorials/seneca-with-promises.html
[entity namespace]: http://senecajs.org/docs/tutorials/understanding-data-entities.html#zone-base-and-name-the-entity-namespace
[seneca patterns]: http://senecajs.org/getting-started/#patterns
[shortid]: https://cnpmjs.org/package/shortid

[appends]: https://github.com/jack-y/seneca-entity-crud/tree/master/docs/appends.md
[check]: https://github.com/jack-y/seneca-entity-crud/tree/master/docs/check.md
[count]: https://github.com/jack-y/seneca-entity-crud/tree/master/docs/count.md
[create]: https://github.com/jack-y/seneca-entity-crud/tree/master/docs/crud-create.md
[delete]: https://github.com/jack-y/seneca-entity-crud/tree/master/docs/crud-delete.md
[deleterelationships]: https://github.com/jack-y/seneca-entity-crud/tree/master/docs/deleterelationships.md
[first]: https://github.com/jack-y/seneca-entity-crud/tree/master/docs/first.md
[joins]: https://github.com/jack-y/seneca-entity-crud/tree/master/docs/joins.md
[query]: https://github.com/jack-y/seneca-entity-crud/tree/master/docs/query.md
[read]: https://github.com/jack-y/seneca-entity-crud/tree/master/docs/crud-read.md
[then]: https://github.com/jack-y/seneca-entity-crud/tree/master/docs/then.md
[truncate]: https://github.com/jack-y/seneca-entity-crud/tree/master/docs/truncate.md
[update]: https://github.com/jack-y/seneca-entity-crud/tree/master/docs/crud-update.md
[validate]: https://github.com/jack-y/seneca-entity-crud/tree/master/docs/validate.md

[readme]: https://github.com/jack-y/seneca-entity-crud/tree/master/docs/relational-delete-feature.md
[triggers]: https://github.com/jack-y/seneca-triggers
[input data validation]: https://github.com/jack-y/seneca-entity-crud/tree/master/docs/input-data-validation.md
