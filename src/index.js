// Generated by LiveScript 1.5.0
/**
 * @package   Detox crypto
 * @author    Nazar Mokrynskyi <nazar@mokrynskyi.com>
 * @copyright Copyright (c) 2017, Nazar Mokrynskyi
 * @license   MIT License, see license.txt
 */
(function(){
  var randombytes, NOISE_PROTOCOL_NAME;
  if (typeof exports === 'object') {
    randombytes = require('crypto').randomBytes;
  } else {
    randombytes = function(size){
      var array;
      array = new Uint8Array(size);
      crypto.getRandomValues(array);
      return array;
    };
  }
  NOISE_PROTOCOL_NAME = 'Noise_NK_25519_ChaChaPoly_BLAKE2b';
  /**
   * Increment nonce from `nonce` argument in place
   *
   * @param {!Uint8Array} nonce
   */
  function increment_nonce(nonce){
    var i$, index, results$ = [];
    for (i$ = nonce.length - 1; i$ >= 0; --i$) {
      index = i$;
      ++nonce[index];
      if (nonce[index] !== 0) {
        break;
      }
    }
    return results$;
  }
  function Crypto(supercop, ed25519ToX25519, aez, noiseC){
    /**
     * @param {Uint8Array} seed Random seed will be generated if `null`
     *
     * @return {!Object}
     */
    function create_keypair(seed){
      var keys;
      seed == null && (seed = null);
      if (!seed) {
        seed = supercop['createSeed']();
      }
      keys = supercop['createKeyPair'](seed);
      return {
        'seed': seed,
        'ed25519': {
          'public': keys['publicKey'],
          'private': keys['secretKey']
        },
        'x25519': {
          'public': ed25519ToX25519['convert_public_key'](keys['publicKey']),
          'private': ed25519ToX25519['convert_private_key'](seed)
        }
      };
    }
    /**
     * @param {!Uint8Array} public_key Ed25519 public key
     *
     * @return {Uint8Array} X25519 public key (or `null` if `public_key` was invalid)
     */
    function convert_public_key(public_key){
      return ed25519ToX25519['convert_public_key'](public_key);
    }
    /**
     * @constructor
     *
     * @param {Uint8Array} key Empty when initialized by initiator and specified on responder side
     *
     * @return {Rewrapper}
     */
    function Rewrapper(key){
      key == null && (key = null);
      if (!(this instanceof Rewrapper)) {
        return new Rewrapper(key);
      }
      if (key === null) {
        key = randombytes(48);
      }
      this._key = key;
      this._nonce = new Uint8Array(12);
    }
    Rewrapper.prototype = {
      /**
       * @return {!Uint8Array}
       */
      'get_key': function(){
        return this._key;
      }
      /**
       * @param {!Uint8Array} plaintext
       *
       * @return {!Uint8Array} Ciphertext
       */,
      'wrap': function(plaintext){
        increment_nonce(this._nonce);
        return aez['encrypt'](plaintext, new Uint8Array(0), this._nonce, this._key, 0);
      }
      /**
       * @param {!Uint8Array} ciphertext
       *
       * @return {!Uint8Array} Plaintext
       */,
      'unwrap': function(ciphertext){
        increment_nonce(this._nonce);
        return aez['decrypt'](ciphertext, new Uint8Array(0), this._nonce, this._key, 0);
      }
    };
    Object.defineProperty(Rewrapper.prototype, 'constructor', {
      enumerable: false,
      value: Rewrapper
    });
    /**
     * @constructor
     *
     * @param {boolean} initiator
     * @param {!Uint8Array} key Responder's public X25519 key if `initiator` is `true` or responder's private X25519 key if `initiator` is `false`
     *
     * @return {Encryptor}
     *
     * @throws {Error}
     */
    function Encryptor(initiator, key){
      if (!(this instanceof Encryptor)) {
        return new Encryptor(initiator, key);
      }
      if (initiator) {
        this._handshake_state = noiseC['HandshakeState'](NOISE_PROTOCOL_NAME, noiseC['constants']['NOISE_ROLE_INITIATOR']);
        this._handshake_state['Initialize'](null, null, key);
      } else {
        this._handshake_state = noiseC['HandshakeState'](NOISE_PROTOCOL_NAME, noiseC['constants']['NOISE_ROLE_RESPONDER']);
        this._handshake_state['Initialize'](null, key);
      }
    }
    Encryptor.prototype = {
      /**
       * @return {boolean}
       */
      'ready': function(){
        return !this._handshake_state;
      }
      /**
       * @return {Uint8Array} Handshake message that should be sent to the other side or `null` otherwise
       *
       * @throws {Error}
       */,
      'get_handshake_message': function(){
        var message;
        message = null;
        if (this._handshake_state) {
          if (this._handshake_state['GetAction']() === noiseC['constants']['NOISE_ACTION_WRITE_MESSAGE']) {
            message = this._handshake_state['WriteMessage']();
          }
          this._handshake_common();
        }
        return message;
      },
      _handshake_common: function(){
        var ref$;
        if (this._handshake_state['GetAction']() === noiseC['constants']['NOISE_ACTION_SPLIT']) {
          ref$ = this._handshake_state['Split'](), this._send_cipher_state = ref$[0], this._receive_cipher_state = ref$[1];
          delete this._handshake_state;
        } else if (this._handshake_state['GetAction']() === noiseC['constants']['NOISE_ACTION_FAILED']) {
          delete this._handshake_state;
          throw new Error('Noise handshake failed');
        }
      }
      /**
       * @param {!Uint8Array} message Handshake message received from the other side
       *
       * @throws {Error}
       */,
      'put_handshake_message': function(message){
        if (this._handshake_state) {
          if (this._handshake_state['GetAction']() === noiseC['constants']['NOISE_ACTION_READ_MESSAGE']) {
            this._handshake_state['ReadMessage'](message);
          }
          this._handshake_common();
        }
      }
      /**
       * @param {!Uint8Array} plaintext
       *
       * @return {!Uint8Array}
       *
       * @throws {Error}
       */,
      'encrypt': function(plaintext){
        return this._send_cipher_state['EncryptWithAd'](new Uint8Array(0), plaintext);
      }
      /**
       * @param {!Uint8Array} ciphertext
       *
       * @return {!Uint8Array}
       *
       * @throws {Error}
       */,
      'decrypt': function(ciphertext){
        return this._receive_cipher_state['DecryptWithAd'](new Uint8Array(0), ciphertext);
      }
    };
    Object.defineProperty(Encryptor.prototype, 'constructor', {
      enumerable: false,
      value: Encryptor
    });
    return {
      'ready': function(callback){
        Promise.all([
          new Promise(function(resolve){
            supercop['ready'](resolve);
          }), new Promise(function(resolve){
            ed25519ToX25519['ready'](resolve);
          }), new Promise(function(resolve){
            aez['ready'](resolve);
          }), new Promise(function(resolve){
            noiseC['ready'](resolve);
          })
        ]).then(function(){
          callback();
        });
      },
      'create_keypair': create_keypair,
      'convert_public_key': convert_public_key,
      'Rewrapper': Rewrapper,
      'Encryptor': Encryptor
    };
  }
  if (typeof define === 'function' && define['amd']) {
    define(['supercop.wasm', 'ed25519-to-x25519.wasm', 'aez.wasm', 'noise-c.wasm'], Crypto);
  } else if (typeof exports === 'object') {
    module.exports = Crypto(require('supercop.wasm'), require('ed25519-to-x25519.wasm'), require('aez.wasm'), require('noise-c.wasm'));
  } else {
    this['detox_crypto'] = Crypto(this['supercop_wasm'], this['ed25519_to_x25519_wasm'], this['aez_wasm'], this['noise_c_wasm']);
  }
}).call(this);
