
/**
 *
 */

const net = require('net')
const util = require('util')
const events = require('events')

/**
 *
 */

const ___error = require('./error')
const ___protocol = require('./protocol')

/**
 *
 */

class Redis extends events {

	/**
	 *
	 */

	constructor (endpoint) {

		/**
		 *
		 */

		super()

		/**
		 *
		 */

		this.___callbacks = []
		this.___timeout = 1000
		this.___connected = false
		this.___reconnecting = false
		this.___endpoint = endpoint
		this.___connect()

		/**
		 *
		 */

		this.lua = util.promisify(this.lua)

	}

	___auth () {

		/**
		 *
		 */

		if (!this.___endpoint.password) {

			/**
			 *
			 */

			return

		}

		/**
		 *
		 */

		const cmd = ['AUTH', this.___endpoint.password]
		const buffer = this.___socket.___protocol.write(cmd)
		const callback = (error) => {}

		/**
		 *
		 */

		this.___socket.write(buffer)

		/**
		 *
		 */

		this.___callbacks.push(callback)

	}

	___connect () {

		/**
		 *
		 */

		this.___socket = new net.Socket()
		this.___socket

			.on('connect', (error) => this.___onConnect(error))
			.on('error', (error) => this.___onError(error))
			.on('data', (data) => this.___onData(data))
			.on('end', (error) => this.___onEnd(error))
			.connect(this.___endpoint)

	}

	___reconnect (error) {

		/**
		 *
		 */

		const callbacks = this.___callbacks

		/**
		 *
		 */

		callbacks.forEach((callback) => callback(___error('jiu-jitsu-redis/REDIS_CONNECTION_HAS_BEEN_CLOSED', error)))

		/**
		 *
		 */

		this.___callbacks = []
		this.___reconnecting = true
		this.___socket.___protocol.flush()

		/**
		 *
		 */

		setTimeout(() => this.___connect(), this.___timeout)

	}

	___protocol () {

		/**
		 *
		 */

		this.___socket.___protocol = new ___protocol()
		this.___socket.___protocol.on('message', (message) => this.___onMessage(message))

	}

	___onConnect (error) {

		/**
		 *
		 */

		this.___protocol()
		this.___auth()
		this.___reconnecting = false

		/**
		 *
		 */

		if (!this.___connected) {

			/**
			 *
			 */

			this.___connected = true

			/**
			 *
			 */

			process.nextTick(() => this.emit('ready', error))

		}

	}

	___onData (chunk) {

		/**
		 *
		 */

		this.___socket.___protocol.read(chunk)

	}

	___onError (error) {

		/**
		 *
		 */

		process.nextTick(() => this.emit('error', error))

		/**
		 *
		 */

		this.___reconnect(error)

	}

	___onEnd (error) {

		/**
		 *
		 */

		process.nextTick(() => this.emit('error', error))

		/**
		 *
		 */

		this.___reconnect(error)

	}

	___onMessage (message) {

		/**
		 *
		 */

		const callback = this.___callbacks.shift()

		/**
		 *
		 */

		if (callback) {

			/**
			 *
			 */

			callback(message.error, message.data)

		}

	}

	lua (script, callback) {

		/**
		 *
		 */

		if (!this.___connected || this.___reconnecting) {

			/**
			 *
			 */

			return callback(___error('jiu-jitsu-redis/REDIS_SOCKET_IS_NOT_READY'))

		}

		/**
		 *
		 */

		const cmd = ['EVAL', script, 0]
		const buffer = this.___socket.___protocol.write(cmd)

		/**
		 *
		 */

		this.___socket.write(buffer)

		/**
		 *
		 */

		this.___callbacks.push(callback)

	}

}

/**
 *
 */

module.exports = Redis


