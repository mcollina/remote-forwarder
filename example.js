#! /usr/bin/env node

var forwarder = require('./')
  , net       = require('net')
  , through   = require('through2')
  , split     = require('split2')
  , spawn     = require('child_process').spawn
  , target    = process.argv[2]
  , user      = process.argv[3]
  , identity  = process.argv[4]
  , server    = net.createServer()
  , port      = 3042

if (!target || !user) {
  console.log('Usage: ./example.js 192.168.x.x user [pathToIdentityFile]')
  process.exit(1)
}

server.listen(port) // pick a random port

server.on('connection', function(connection) {
  var transform = through(delay)
  connection.pipe(transform).pipe(connection)
})

server.on('listening', function() {
  var forward = forwarder({
      target: target
    , identityFile: identity
    , user: user
    , port: port
    , retries: 100
  })

  forward.on('connect', function() {
    // this will be called any time a
    // new connection is established

    console.log('forwarder setted up!')
    var child     = spawn('ssh', [user + '@' + target, 'nc', 'localhost', '' + port])
      , splitted  = child.stdout.pipe(split())
      , text      = 'hello world'

    child.stdin.write(text)
    child.stdin.write('\n')

    splitted.on('data', function(line) {
      if (line === text) {
        console.log('SUCCESS')
        forward.stop()
        server.close()
        child.kill('SIGKILL')
      }
    })

    setTimeout(function() {
      console.log('FAILED: no response')
      process.exit(1)
    }, 5000).unref()
  })

  forward.start()
})

function delay(buf, enc, done) {
  var that = this
  setTimeout(function() {
    that.push(buf)
    done()
  }, 500)
}
