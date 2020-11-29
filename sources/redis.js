
/**
 *
 */

const net = require("net")

/**
 *
 */

const ___log = require("jiu-jitsu-log")

/**
 *
 */

const ___protocol = require("./protocol")

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
		await new Promise(async (resolve) => await this.___connect(resolve))
	}

	/**
	 *
	 */

	async ___connect (resolve) {
		const options = this.___options
		this.___socket = new net.Socket()
		this.___protocol = new ___protocol()
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
		await ___log("jiu-jitsu-redis", "OK", `${options.db} ✔`)
		resolve(error)
	}

	/**
	 *
	 */

	async ___onSocketError (error) {
		const options = this.___options
		await ___log("jiu-jitsu-redis", "FAIL", `${options.db} !`, error, true)
		process.exit(1)
	}

	/**
	 *
	 */

	async ___onSocketData (data) {
		this.___protocol.read(data)
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
		return await new Promise((resolve, reject) => {
			const transaction = ["EVAL", script, 0]
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
