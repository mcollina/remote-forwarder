remote-forwarder
================

Forward a local port to a remote server, using SSH.
It wraps `ssh -R` so that in can be used in node-land.

Install
-------

```bash
npm install remote-forwarder --save
```

Usage
-----

`remote-forwarder` inherits from [Recovery](http://npm.im/recovery), so
it can keep the forwarding up even if it dies.

```js
var forwarder = require('remote-forwarder')

var forward = forwarder({
    target: target // the target host
  , identityFile: identity // the SSH identity file, optional
  , user: user // the user in the target system
  , port: port // the local port to expose remotely
  , retries: 100 // the number of retries
  // plus all other Recovery options
})

forward.on('connect', function() {
  // this will be called any time a
  // new connection is established

  // do stuff here ...

  forward.stop() // to stop forwarding
})

forward.start()
```

Acknowledgements
----------------

This project was kindly sponsored by [nearForm](http://nearform.com).

License
-------

MIT
