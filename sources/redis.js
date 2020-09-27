
/**
 *
 */

const net = require(`net`)

/**
 *
 */

const ___log = require(`jiu-jitsu-log`)

/**
 *
 */

const ___protocol = require(`./protocol`)

/**
 *
 */

class Redis {

	/**
	 *
	 */

	constructor (options) {
		this.___socket = null
		this.___protocol = null
		this.___options = options
		this.___promises = []
	}

	/**
	 *
	 */

	async connect () {
		await new Promise((resolve) => this.___connect(resolve))
	}

	/**
	 *
	 */

	___connect (resolve) {
		const options = this.___options
		this.___socket = new net.Socket()
		this.___protocol = new ___protocol()
		this.___protocol.on(`message`, (message) => this.___onProtocolMessage(message))
		this.___socket.on(`connect`, (error) => this.___onSocketConnect(error, resolve))
		this.___socket.on(`error`, (error) => this.___onSocketError(error))
		this.___socket.on(`data`, (data) => this.___onSocketData(data))
		this.___socket.connect(options)
	}

	/**
	 *
	 */

	___onSocketConnect (error, resolve) {
		const options = this.___options
		___log(`jiu-jitsu-redis`, `OK`, `${options.db} ✔`)
		resolve(error)
	}

	/**
	 *
	 */

	___onSocketError (error) {
		const options = this.___options
		___log(`jiu-jitsu-redis`, `FAIL`, `${options.db} !`, error, true)
		process.exit(1)
	}

	/**
	 *
	 */

	___onSocketData (data) {
		this.___protocol.read(data)
	}

	/**
	 *
	 */

	___onProtocolMessage (message) {
		const promise = this.___promises.shift()
		const resolve = promise && promise[0]
		const reject = promise && promise[1]
		message.error && reject && reject(message.error)
		!message.error && resolve && resolve(message.data)
	}

	/**
	 *
	 */

	async lua (script) {
		return await new Promise((resolve, reject) => {
			const transaction = [`EVAL`, script, 0]
			const buffer = this.___protocol.write(transaction)
			this.___promises.push([resolve, reject])
			this.___socket.write(buffer)
		})
	}

}

/**
 *
 */

module.exports = Redis
