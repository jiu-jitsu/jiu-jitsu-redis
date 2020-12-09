
/**
 *
 */

const net = require("net")

/**
 *
 */

const LOG = require("jiu-jitsu-log")

/**
 *
 */

const INSTANCES = {}

/**
 *
 */

const Protocol = require("./protocol")

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

	static set (db, instance) {
		INSTANCES[db] = instance
	}

	/**
	 *
	 */

	static get (db) {
		return INSTANCES[db]
	}

	/**
	 *
	 */

	async connect () {
		await new Promise(async (resolve) => await this.___connect(resolve))
	}

	/**
	 *
	 */

	async ___connect (resolve) {
		const options = this.___options
		this.___socket = new net.Socket()
		this.___protocol = new Protocol()
		this.___protocol.on("message", async (message) => await this.___onProtocolMessage(message))
		this.___socket.on("connect", async (error) => await this.___onSocketConnect(error, resolve))
		this.___socket.on("error", async (error) => await this.___onSocketError(error))
		this.___socket.on("data", async (data) => await this.___onSocketData(data))
		this.___socket.connect(options)
	}

	/**
	 *
	 */

	async ___onSocketConnect (error, resolve) {
		const options = this.___options
		new LOG("jiu-jitsu-redis|CONNECT", "OK", [`${options.db} ✔`], true)
		resolve(error)
	}

	/**
	 *
	 */

	async ___onSocketError (error) {
		const options = this.___options
		new LOG("jiu-jitsu-redis|CONNECT", "ERROR", [`${options.db} !`, error], true)
		process.exit(1)
	}

	/**
	 *
	 */

	async ___onSocketData (data) {
		await this.___protocol.read(data)
	}

	/**
	 *
	 */

	async ___onProtocolMessage (message) {
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
		return await new Promise(async (resolve, reject) => {
			const transaction = ["EVAL", script, 0]
			const buffer = await this.___protocol.write(transaction)
			this.___promises.push([resolve, reject])
			this.___socket.write(buffer)
		})
	}

}

/**
 *
 */

module.exports = Redis
