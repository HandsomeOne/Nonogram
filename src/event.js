export function off(type) {
  this.listeners = this.listeners || {}
  this.removeEventListener(type, this.listeners[type])
}
export function on(type, listener) {
  off.call(this, type)
  this.addEventListener(type, listener)
  this.listeners[type] = listener
}
