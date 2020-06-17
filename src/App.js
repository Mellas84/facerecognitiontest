import React from "react";
import "./App.css";
import LiveDetection from "./LiveDetection.js"
import Recognition from "./Recognition.js"
import LiveRecognition from "./LiveRecognizer.js"

class App extends React.Component {

  

  render() {
    const liveDet = <LiveDetection/>
    const liveRec = <LiveRecognition/>
    const img = <Recognition/>
    return (
      <div >
        {liveRec}
      </div>
    );
  }
}

export default App;

