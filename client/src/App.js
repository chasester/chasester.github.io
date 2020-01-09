import React from 'react';
const scripts = [
  "./assets/js/jquery.min.js",
  "./assets/js/browser.min.js",
  "./assets/js/breakpoints.min.js",
  "./assets/js/util.js",
  "./assets/js/main.js"
]


class App extends React.Component
{
  componentDidMount()
  {
    scripts.forEach(ss => {
      let s = document.createElement("script");

      scripts.src = ss;
      scripts.async = true;
      document.body.appendChild(s);
    })
  }
  render() 
  {
      return (
       <div>
      
      </div>
      );
  }
}


export default App;


