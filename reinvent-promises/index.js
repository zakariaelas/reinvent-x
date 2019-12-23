/* https://promisesaplus.com/
 * https://www.promisejs.org/implementing/
 * https://stackoverflow.com/questions/23772801/basic-javascript-promise-implementation-attempt/23785244#23785244
 * 
 * 
 * */

const PENDING = 0;
const FULFILLED = 1;
const REJECTED = 2;

function getThen(value) {
  if (value && (typeof value === 'object' || typeof value === 'function')) {
    let then = value.then;
    if (typeof then === 'function') return then;
  }
  return null;
}

function doResolve(fn, onFulfilled, onRejected) {
  var done = false;
  try {
    fn(
      value => {
        if (done) return;
        done = true;
        onFulfilled(value);
      },
      reason => {
        if (done) return;
        done = true;
        onRejected(reason);
      }
    );
  } catch (err) {
    if (done) return;
    done = true;
    onRejected(err);
  }
}


class MyPromise {
  constructor(func) {
    this.state = PENDING;
    this.value = null;
    this.handlers = [];
    doResolve(func, this.resolve.bind(this), this.reject.bind(this));
  }

  resolve(value) {
    try {
      var then = getThen(value);
      if (then) {
        doResolve(then.bind(value), this.resolve.bind(this), this.reject.bind(this));
        return;
      }
      this.state = FULFILLED;
      this.value = value;
      this.handlers.forEach(this.handle.bind(this));
      this.handlers = null;
    } catch (err) {
      this.reject(err);
    }
  };

  reject(error) {
    this.state = REJECTED;
    this.value = error;
    this.handlers.forEach(this.handle.bind(this));
    this.handlers = null;
  };

  then(onFulfilled, onRejected) {
    return new Promise((resolve, reject) => {
      return this.done(
        value => {
          if (typeof onFulfilled === 'function') {
            try {
              resolve(onFulfilled(value));
            } catch (err) {
              reject(err);
            }
          } else {
            return resolve(value);
          }
        },
        err => {
          if (typeof onRejected === 'function') {
            try {
              resolve(onRejected(err));
            } catch (err) {
              reject(err);
            }
          } else {
            return reject(err);
          }
        }
      );
    });
  };

  handle(handler) {
    switch (this.state) {
      case PENDING:
        this.handlers.push(handler);
        break;
      case FULFILLED:
        handler.onFulfilled(this.value);
        break;
      case REJECTED:
        handler.onRejected(this.value);
        break;
      default:
    }
  }

  done(onFulfilled, onRejected) {
    setTimeout(() => {
      this.handle({
        onFulfilled,
        onRejected
      });
    }, 0);
  };
}

new MyPromise((resolve, reject) => {
  resolve(fetch('https://jsonplaceholder.typicode.com/todos/1').then(res => res.json()));
}).then(console.log);