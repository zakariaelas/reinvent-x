
function createStore(reducer) {
  let state;
  let listeners = [];
  const getState = () => state;

  const dispatch = action => {
    state = reducer(state, action);
    listeners.forEach(l => l());
  }

  const subscribe = listener => {
    listeners.push(listener);
    return () => listeners.filter(l => l === listener);
  }

  dispatch({ type: '@@REDUX/INIT' });

  return {
    getState,
    dispatch,
    subscribe
  }
}

function combineReducers(reducers) {
  return (state, action) => {
    return Object.keys(reducers).reduce((nextState, key) => {
      nextState[key] = reducers[key](state[key], action);
      return nextState;
    }, {})
  }
}

function bindActionCreators(actionCreators) {
  return Object.keys(actionCreators).reduce((state, key) => {
    state[key] = function (...args) {
      dispatch(actionCreators[key](...args))
    }
  }, {})
}

/* Composes functions from right to left.
 * compose(f, g, h) should return a function that, when invoked, returns f(g(h(...args)))
 * The reduceRight native method applies a functions against an accumulator and each value of the array
 * from right to left.
 * In this version, we start by calling the last function with potentially multiple arguments
 * then keep forwarding the result to the function that is left to each function.
 * 
 * ex: let functions = [f, g, h]
 * 1. composed = h(...args) --> g(composed)
 * 2. composed = g(h(...args)) --> f(composed)
 * 3. composed = f(g(h(...args))) --> return composed when reduceRight finishes
 */
function compose(...functions) {
  return function (...args) {
    const lastFn = functions.pop();
    return functions
      .slice(0, -1)
      .reduceRight(
        (composed, currentFn) => currentFn(composed),
        lastFn(...args)
      );
  };
}

/* Composes functions from right to left.
 * compose(f, g, h) should return a function that, when invoked, returns f(g(h(...args)))
 * This is the implementation used by the official redux repo.
 * Instead of starting by invoking the last function in the array and keep returning the result of 
 * the function to the left function, we can start from the beginning of the array 
 * and return a function that sorts of allows each subsequent function to "hook" or "plugs" itself
 * in the innermost function call and invoke itself
 * ex: let functions = [f, g, h]
 * 1. composed = f                          and  fn = g  -->  returns (...args) => f(g(...args))
 * 2. composed = (...args) => f(g(...args)) and  fn = h  -->  returns (...args) => composed(h(...args))
 *                  ^                ^                                                      |
 *                  |________________|______________f(g(h(...args))_________________________|
 * 
 * 3. composed = (...args) => f(g(h(...args))) --> return composed when reduce finishes
 */

function reduxCompose(...functions) {
  return functions.reduce((composed, fn) => (...args) => composed(fn(...args)));
}