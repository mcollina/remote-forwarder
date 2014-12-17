
var spawn     = require('child_process').spawn
  , Recovery  = require('recovery')
  , inherits  = require('inherits')
  , split     = require('split2')

function Forwarder(opts) {
  if (!(this instanceof Forwarder)) {
    return new Forwarder(opts)
  }

  this.target = opts.target
  this.localPort = opts.localPort || opts.port
  this.remotePort = opts.remotePort || opts.port
  this.identityFile = opts.identityFile || null
  this.bindAddress = opts.bindAddress || 'localhost'
  this.user = opts.user
  this._child = null

  if (!this.target) {
    throw new Error('missing target')
  }

  if (!this.localPort) {
    throw new Error('missing localPort')
  }

  if (!this.remotePort) {
    throw new Error('missing remotePort')
  }

  if (!this.user) {
    throw new Error('missing user')
  }

  Recovery.call(this, opts)

  this.on('reconnect', connect)
  this.on('reconnected', this.emit.bind(this, 'connect'))
}

inherits(Forwarder, Recovery)

Forwarder.prototype.start = Forwarder.prototype.reconnect;

Forwarder.prototype.stop = function stop(cb) {
  this.reset()
  this._kill(cb)
  return this
}

function connect(opts, done) {
  var forwarder = this
    , child     = null
    , args      = []

  if (forwarder.identityFile) {
    args.push('-i')
    args.push(forwarder.identityFile)
  }

  args.push('-q') // suppress warnings
  args.push('-R') // remote forwarding
  args.push(forwarder.bindAddress + ':' + forwarder.remotePort + ':localhost:' + forwarder.remotePort)
  args.push(forwarder.user + '@' + forwarder.target)

  // command to execute, we write ready and expect ready back
  args.push('cat')
  args.push('-')

  child = spawn('ssh', args, { stdio: 'pipe' })
  forwarder._child = child

  child.stdout.pipe(split()).on('data', handler)
  child.stderr.pipe(split()).on('data', handler)

  child.on('error', done)

  // sending the ready string, when we read it we will
  // be setted up
  child.stdin.write('ready\n')

  function handler(line) {
    // the process is ok!
    if (line === 'ready') return done()

    forwarder.emit('ssh error', line)

    // the process has some trouble
    // kill it and restart
    forwarder._kill()
    forwarder.reconnected(new Error('problems with the tunnel'))
  }
}

Forwarder.prototype._kill = function(cb) {
  if (this._child) {
    this._child.removeAllListeners('error')
    this._child.on('error', function nop() {})
    this._child.kill('SIGTERM')
    if (cb) {
    this._child.on('exit', cb)
    }
  }
  else {
    if (cb) {
      cb();
    }
  }
}

module.exports = Forwarder
