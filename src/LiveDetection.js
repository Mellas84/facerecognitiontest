import React from "react";
import "./App.css";
import * as faceapi from 'face-api.js';
class LiveDetection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name:""
    };
  }
  componentDidMount() {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/weights"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/weights"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/weights"),
      faceapi.nets.ssdMobilenetv1.loadFromUri('/weights')
    ]).then(this.startVideo());
  }

  startVideo() {
    let video = document.querySelector("video")
    navigator.getUserMedia(
      { video: {} },
      (stream) => (video.srcObject = stream),
      (err) => console.error(err)
    );
  }
  async handlePlaying() {
    let video = document.querySelector("video");
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas)
    const displaySize = {width : video.width, height: video.height}
    faceapi.matchDimensions(canvas, displaySize)
    const LabeledFaceDescriptors = await loadLabeledImages()
    const faceMatcher = new faceapi.FaceMatcher(LabeledFaceDescriptors, 0.6)

    setInterval(async () => {    
        const detection = await faceapi.detectAllFaces(video, 
          //SsdMobilenetv1Options <=> TinyFaceDetectorOptions
          new faceapi.TinyFaceDetectorOptions({minConfidence:0.6})).withFaceLandmarks().withFaceDescriptors();
          const resizedDetections = faceapi.resizeResults(detection, displaySize)
  
          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
          resizedDetections.forEach(detect => {
  
            const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
            results.forEach((result, i) => {
              if (detect.detection) {
                const box = { x:detect.detection.box.x, y:detect.detection.box.y, width:detect.detection.box._width, height:detect.detection.box._height}
                const drawOptions = {
                  label:capitalize(result.label),
                  lineWidth:2
                }
                const drawBox = new faceapi.draw.DrawBox(box, drawOptions)
                drawBox.draw(canvas)
              }
            })
            })


  
   
          
          //faceapi.draw.drawDetections(canvas, resizedDetections)
          
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)      
    }, 100)
  }

  render() {
    return (
      <React.Fragment>
      <div className="video-container">
        <video autoPlay={true} id="video" width="620" height="460" onPlaying={this.handlePlaying}></video>
      </div>
      </React.Fragment>
    );
  }
}

export default LiveDetection;

function loadLabeledImages() {
  const labels = ['Arvid', 'max']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 1; i++) {
        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/Mellas84/Face-Recognition/master/${label}.jpg`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        if (detections) {
          console.log("success")
          descriptions.push(detections.descriptor)
        }
        
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}
function capitalize(str) {
return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}