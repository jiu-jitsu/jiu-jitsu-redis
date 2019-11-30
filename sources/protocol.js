
/**
 *
 */

const events = require(`events`)

/**
 *
 */

class Protocol extends events {

	/**
	 *
	 */

	constructor () {

		/**
		 *
		 */

		super()

		/**
		 *
		 */

		this.___read = {}
		this.___read.buffer = Buffer.alloc(0)

	}

	/**
	 *
	 */

	flush () {

		/**
		 *
		 */

		this.___read.buffer = Buffer.alloc(0)

	}

	/**
	 *
	 */

	read (chunk) {

		/**
		 *
		 */

		if (chunk) {
			this.___read.buffer = Buffer.concat([this.___read.buffer, chunk])
		}

		/**
		 *
		 */

		if (!this.___read.buffer.length) {
			return
		}

		/**
		 *
		 */

		const index_of_crlf = this.___read.buffer.indexOf(13)

		/**
		 *
		 */

		if (index_of_crlf < 0) {
			return
		}

		/**
		 *
		 */

		const message = {
			id: null,
			ok: null,
			error: null,
			data: null
		}

		/**
		 * 43 = + (is a simple string)
		 * 36 = $ (is a bulk string)
		 * 58 = : (is an integer)
		 * 45 = - (is an error)
		 */

		if (this.___read.buffer[0] === 43) {

			/**
			 *
			 */

			message.ok = true
			message.data = this.___read.buffer.slice(1, index_of_crlf).toString()

			/**
			 *
			 */

			this.___read.buffer = this.___read.buffer.slice(index_of_crlf + 2, this.___read.buffer.length)

			/**
			 *
			 */

		} else if (this.___read.buffer[0] === 36) {

			/**
			 *
			 */

			const size_as_string = this.___read.buffer.slice(1, index_of_crlf).toString()

			/**
			 * -1 there is no data, so null is represented
			 */

			if (size_as_string === `-1`) {

				/**
				 *
				 */

				message.ok = true
				message.data = null

				/**
				 *
				 */

				this.___read.buffer = this.___read.buffer.slice(1 + size_as_string.length + 2, this.___read.buffer.length)

				/**
				 *
				 */

			} else if (this.___read.buffer.length >= (1 + size_as_string.length + 2 + parseInt(size_as_string) + 2)) {

				/**
				 *
				 */

				message.ok = true
				message.data = this.___read.buffer.slice(index_of_crlf + 2, index_of_crlf + 2 + parseInt(size_as_string)).toString()

				/**
				 *
				 */

				this.___read.buffer = this.___read.buffer.slice(1 + size_as_string.length + 2 + parseInt(size_as_string) + 2, this.___read.buffer.length)

			}

			/**
			 *
			 */

		} else if (this.___read.buffer[0] === 58) {

			/**
			 *
			 */

			message.ok = true
			message.data = parseInt(this.___read.buffer.slice(1, index_of_crlf).toString())

			/**
			 *
			 */

			this.___read.buffer = this.___read.buffer.slice(index_of_crlf + 2, this.___read.buffer.length)

			/**
			 *
			 */

		} else if (this.___read.buffer[0] === 45) {

			/**
			 *
			 */

			message.ok = true
			message.error = this.___read.buffer.slice(1, index_of_crlf).toString()

			/**
			 *
			 */

			this.___read.buffer = this.___read.buffer.slice(index_of_crlf + 2, this.___read.buffer.length)

			/**
			 *
			 */

		} else {

			/**
			 *
			 */

			message.ok = true
			message.error = `FAILED`

		}

		/**
		 *
		 */

		if (!message.ok) {
			return
		}

		/**
		 *
		 */

		try {

			/**
			 *
			 */

			message.data = JSON.parse(message.data)

			/**
			 *
			 */

		} catch (error) {

			/**
			 *
			 */

		}

		/**
		 *
		 */

		this.emit(`message`, message)
		this.read()

	}

	/**
	 *
	 */

	write (args) {

		/**
		 *
		 */

		let i
		let message = ``
		let stringify = ``

		/**
		 *
		 */

		message += `*${args.length}\r\n`

		/**
		 *
		 */

		for (i = 0; i < args.length; i++) {

			/**
			 *
			 */

			if (!args[i]) {
				message += `$0\r\n\r\n`
				continue
			}

			/**
			 *
			 */

			if (args[i].constructor === Number) {
				message += `$${Buffer.byteLength((args[i].toString()))}\r\n${args[i]}\r\n`
				continue
			}

			/**
			 *
			 */

			if (args[i].constructor === String) {
				message += `$${Buffer.byteLength((args[i]))}\r\n${args[i]}\r\n`
				continue
			}

			/**
			 *
			 */

			if (args[i].constructor === Object) {
				stringify = JSON.stringify(args[i])
				message += `$${Buffer.byteLength((stringify))}\r\n${stringify}\r\n`
				continue
			}

			/**
			 *
			 */

			throw new Error(`UNKNOWN_ARGUMENT_TYPE`)

		}

		/**
		 *
		 */

		return Buffer.from(message)

	}

}

/**
 *
 */

module.exports = Protocol
