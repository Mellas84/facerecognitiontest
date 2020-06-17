import React from "react";
import "./App.css";
import * as faceapi from "face-api.js";

export default class Recognition extends React.Component {
  componentDidMount() {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/weights"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/weights"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/weights"),
    ]).then(this.start());
  }

  start() {
    document.body.append("loaded")
  }

  async recognizer(img) {
    const image = faceapi.bufferToImage(img.file);
    document.body.append(image);
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();
    document.body.append(detections.length);
    
  }

  render() {
    return (
      <div>
        <input type="file" id="imageUpload" onChange={img => this.recognizer(img.target.files)}></input>
      </div>
    );
  }
}
