import React from "react";
import "./App.css";
import * as faceapi from "face-api.js";

function loadLabeledImages() {
  const labels = ["Arvid", "Max"];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(
          `https://raw.githubusercontent.com/Mellas84/facerecognitiontest/master/src/images/${label}/${i}.jpg`
        );
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (detections) {
          console.log("success");
          descriptions.push(detections.descriptor);
        }
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

class LiveRecognizer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
    };
  }
  componentDidMount() {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/weights"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/weights"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/weights"),
      faceapi.nets.ssdMobilenetv1.loadFromUri("/weights"),
    ]).then(this.startVideo());
  }

  startVideo() {
    let video = document.querySelector("video");
    navigator.getUserMedia(
      { video: {} },
      (stream) => (video.srcObject = stream),
      (err) => console.error(err)
    );
  }
  async handlePlaying() {
    let video = document.querySelector("video");

    const LabeledFaceDescriptors = await loadLabeledImages();
    const faceMatcher = new faceapi.FaceMatcher(LabeledFaceDescriptors, 0.8);
    document.getElementById("loading").innerHTML = "";
    setInterval(async () => {
      //SsdMobilenetv1Options <=> TinyFaceDetectorOptions
      const detection = await faceapi
        .detectAllFaces(
          video,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.8 })
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      const results = detection.map((d) =>
        faceMatcher.findBestMatch(d.descriptor)
      );
      results.forEach((result) => {
        let label = capitalize(result.label);
        if (label === "Unknown") {
          console.log(label);
        } else {
          if (document.getElementById("name").innerHTML !== "Hej " + label) {
            document.getElementById("name").innerHTML = "Hej " + label;
            console.log(label)
          }
            
        }
      });
    }, 3000);
  }

  render() {
    return (
      <React.Fragment>
        <h1 id="name"> </h1>
        <div className="video-container">
          <video
            style={{ display: "none" }}
            autoPlay={true}
            id="video"
            width="620"
            height="460"
            onPlaying={this.handlePlaying}
          ></video>
        </div>
        <h2 id="loading">Loading...</h2>
      </React.Fragment>
    );
  }
}

export default LiveRecognizer;
