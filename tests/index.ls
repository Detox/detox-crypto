/**
 * @package   Detox crypto
 * @author    Nazar Mokrynskyi <nazar@mokrynskyi.com>
 * @copyright Copyright (c) 2017, Nazar Mokrynskyi
 * @license   MIT License, see license.txt
 */
lib			= require('..')
randombytes	= require('crypto').randomBytes
test		= require('tape')

<-! lib.ready
test('Keypair generation', (t) !->
	t.plan(6)

	seed			= Buffer.from('9fc9b77445f8b077c29fe27fc581c52beb668ecd25f5bb2ba5777dee2a411e97', 'hex')
	ed25519_public	= Buffer.from('8fbe438aab6c40dc2ebc839ba27530ca1bf23d4efd36958a3365406efe52ccd1', 'hex')
	ed25519_private	= Buffer.from('28e9e1d48cb0e52e437080e4a180058d7a42a07abcd05ea2ec4e6122cded8f6a0d2a6b9fd1878fd76ab20caecab666916ac3cc772fc57f8fa6e8dc3227bb8497', 'hex')
	x25519_public	= Buffer.from('26100e941bdd2103038d8dec9a1884694736f591ee814e66ae6e2e2284757136', 'hex')
	x25519_private	= Buffer.from('803fcdab44e9958d2f8e4d47b5f0d481d6ddb79dd462a18ee65cabe94a9e455c', 'hex')

	keypair			= lib.create_keypair(seed)

	t.equal(keypair.seed.join(','), seed.join(','), 'Seed is kept the same')
	t.equal(keypair.ed25519.public.join(','), ed25519_public.join(','), 'Generated correct ed25519 public key')
	t.equal(keypair.ed25519.private.join(','), ed25519_private.join(','), 'Generated correct ed25519 private key')
	t.equal(keypair.x25519.public.join(','), x25519_public.join(','), 'Generated correct x25519 public key')
	t.equal(keypair.x25519.private.join(','), x25519_private.join(','), 'Generated correct x25519 private key')

	t.equal(lib.convert_public_key(keypair.ed25519.public).join(','), x25519_public.join(','), 'Ed25519 public key converted to X25519 correctly')
)

test('Rewrapping', (t) !->
	t.plan(7)

	debugger
	instance	= lib.Rewrapper()

	t.ok(instance._key instanceof Uint8Array, 'Key was generated automatically')
	t.equal(instance._key.length, 48, 'Key has correct length')

	key					= Buffer.from('4f99a089d76256347358580797cf4242bd3afc1b3e62f39a76ca066b64fae8346a9dbfc9e8e1c59506ee919954324f58', 'hex')
	plaintext			= 'Hello, Detox!'
	known_ciphertext	= Buffer.from('b6a8f817b079a5af10c3434a1d', 'hex')
	wrapper				= lib.Rewrapper(key)
	unwrapper			= lib.Rewrapper(key)

	t.equal(wrapper._nonce.join(','), (new Uint8Array(12)).join(','), 'Nonce defaults to zeroes')

	ciphertext	= wrapper.wrap(Buffer.from(plaintext))
	t.equal(wrapper._nonce[wrapper._nonce.length - 1], 1, 'Nonce was incremented')
	t.equal(ciphertext.join(','), known_ciphertext.join(','), 'Wrapped correctly')

	plaintext_decrypted	= unwrapper.unwrap(ciphertext)
	t.equal(wrapper._nonce[wrapper._nonce.length - 1], 1, 'Nonce was incremented')
	t.equal(Buffer.from(plaintext_decrypted).toString(), plaintext, 'Unwrapped correctly')
)
