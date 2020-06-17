import React from "react";
import "./App.css";
import * as faceapi from "face-api.js";

function loadLabeledImages() {
  const labels = ["Arvid", "Max", "RandomImages"];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      let nrImages = 
      label === "Arvid" ? 44
      : label === "Max" ? 2 
      : 13;
      for (let i = 1; i <= nrImages; i++) {
        const img = await faceapi.fetchImage(
          `https://raw.githubusercontent.com/Mellas84/facerecognitiontest/master/assets/images/${label}/${i}.jpg`
        );
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (detections) {
          console.log("success");
          console.log(label+i)
          
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
    let maxDistance = 0.6;
    const faceMatcher = new faceapi.FaceMatcher(LabeledFaceDescriptors, maxDistance);
    document.getElementById("loading").innerHTML = "";
    setInterval(async () => {
      //SsdMobilenetv1Options <=> TinyFaceDetectorOptions
      const detection = await faceapi
        .detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptors();
console.log(detection)
      const results = detection.map((d) =>
        faceMatcher.findBestMatch(d.descriptor)
      );
      console.log(results)
      results.forEach((result) => {
        console.log(result.distance)
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
    }, 1000);
  }

  render() {
    return (
      <React.Fragment>
        <h1 id="name"> </h1>
        <div className="video-container">
          <video
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


//Speed: 1000
//11 total images, 9 images of test subject from different angles using ssd. Best result: 0.48381988931818065
//3 total images, 1 image of test subject from the front using ssd. Best result: 0.20902870565343248
//24 total images, 11 image of test subject from the front using ssd. Best result: 0.48838174473824014
//14 total images, 1 image of test subject from the front using ssd. Best result: 0.21503420705702414
//15 total images, 2 image of test subject from the front using ssd. Best result: 0.33134250403810084
//33 total images, 21 images of test subject where 10 are the same image from front view using ssd. Best Result: 0.35490761308480456
//46 total images, 33 images of test subject from different angles and distances using ssd. Best Result: 0.38832424912123453

//15 total images, 2 image of test subject from the front using tiny. Best result: 0.333197248181627
//14 total images, 1 image of test subject from the front using tiny. Best result: 0.22026010587463674 
//46 total images, 33 images of test subject from different angles and distances using tiny. Best Result: 0.3917487289305787
/*
Result: 
More total images doesnt make a difference
More images of a person makes the certainty lower but works from more angles

*/
