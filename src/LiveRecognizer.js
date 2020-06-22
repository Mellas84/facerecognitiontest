import React from "react";
import "./App.css";
import * as faceapi from "face-api.js";

function loadLabeledImages() {
  //if have label without reference picture "unknown" -> "label"
  const labels = ["Max", "Stefan", "Gabriella", "Arvid", "Mikaela", "Andreas"];

  return Promise.all(
    labels.map(async (label) => {

      const descriptions = [];
      let nrImages =
      label === "Arvid" ? 17
      : label === "Max" ? 3
      : 1;
      for (let i = 1; i <= nrImages; i++) {
        const img = await faceapi.fetchImage(
          `https://raw.githubusercontent.com/Mellas84/facerecognitiontest/master/assets/images/${label}/${i}.jpg`
        );
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (detections) {
          console.log(label+i)

          descriptions.push(detections.descriptor);
        }
      }
      var result = new faceapi.LabeledFaceDescriptors(label, descriptions);
      return result
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
    const canvas = faceapi.createCanvasFromMedia(video);
    //document.body.append(canvas)
    const displaySize = {width : video.width, height: video.height}
    const LabeledFaceDescriptors = await loadLabeledImages();
    let maxDistance = 0.55;
    const faceMatcher = new faceapi.FaceMatcher(LabeledFaceDescriptors, maxDistance);
    document.getElementById("loading").innerHTML = "";
    setInterval(async () => {
      
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
      //SsdMobilenetv1Options <=> TinyFaceDetectorOptions
      const detection = await faceapi
        .detectAllFaces(
          video,
          new faceapi.SsdMobilenetv1Options()
        )
        .withFaceLandmarks()
        .withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detection, displaySize)
        
      const results = resizedDetections.map((d) =>
        faceMatcher.findBestMatch(d.descriptor)
      );

      results.forEach(async (result) => {
        console.log(result.label +" " +result.distance)
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
      //faceapi.draw.drawDetections(canvas, resizedDetections)
    }, 1000);
  }

  render() {
    return (
      <React.Fragment>
        <h1 id="name"> </h1>
        <div className="video-container">
          <video
          //style={{display:"none"}}
            autoPlay={true}
            id="video"
            width="150"
            height="100"
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
//14 total images, 1 OLD image of test subject from the front (small image 160x160) using ssd. Best Result: 0


//15 total images, 2 image of test subject from the front using tiny. Best result: 0.333197248181627
//14 total images, 1 image of test subject from the front using tiny. Best result: 0.22026010587463674
//46 total images, 33 images of test subject from different angles and distances using tiny. Best Result: 0.3917487289305787
//14 total images, 1 OLD image of test subject from the front (small image) using tiny. Best Result: 0.35043252549315534
/*
Result:
More total images doesnt make a difference
More images of a person makes the certainty lower but works from more angles
Small images makes everyone look the same
Weird lighting make sit unable to detect a face (too light / dark)
*/

//ssd, maxDIstance 0.6
//3 images: 0/1000
//1 image: 1/1000 (0.59)

//margin of error seemingly goes down with more reference images, difficult to know for sure.
//struggeling with:
//fast movement? bad lighting? sortware or hardware issues?