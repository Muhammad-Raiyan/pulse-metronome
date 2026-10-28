let timerID = null;
let interval = 25; // Check every 25ms

self.onmessage = function (e) {
  const { command, value } = e.data;

  if (command === 'start') {
    if (!timerID) {
      timerID = setInterval(() => {
        self.postMessage('tick');
      }, interval);
    }
  } else if (command === 'stop') {
    if (timerID) {
      clearInterval(timerID);
      timerID = null;
    }
  } else if (command === 'setInterval') {
    interval = value;
    if (timerID) {
      clearInterval(timerID);
      timerID = setInterval(() => {
        self.postMessage('tick');
      }, interval);
    }
  }
};