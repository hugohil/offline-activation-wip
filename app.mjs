import activation from './index.mjs'

activation(next);

function next (active) {
  if (active) {
    console.log('activation SUCCESS')
  } else {
    console.log('activation FAILURE')
  }
}
